import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const allowedOrigins = [
  "https://sepsis-guardian-project.lovable.app",
  "https://id-preview--b2231dff-7eda-45cf-a575-3723b1ac7620.lovable.app",
].filter(Boolean);

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("origin") || "";
  return {
    "Access-Control-Allow-Origin": allowedOrigins.includes(origin) ? origin : allowedOrigins[0],
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  };
}

interface VerifyOTPRequest {
  token: string;
  otp: string;
  newPassword: string;
}

// Add consistent delay to prevent timing attacks
async function addConsistentDelay(startTime: number, minDelay: number = 500) {
  const elapsed = Date.now() - startTime;
  const remainingDelay = Math.max(0, minDelay - elapsed);
  if (remainingDelay > 0) {
    await new Promise(resolve => setTimeout(resolve, remainingDelay));
  }
}

const handler = async (req: Request): Promise<Response> => {
  const startTime = Date.now();
  const corsHeaders = getCorsHeaders(req);
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token, otp, newPassword }: VerifyOTPRequest = await req.json();

    if (!token || !otp || !newPassword) {
      await addConsistentDelay(startTime);
      return new Response(
        JSON.stringify({ error: "Token, OTP, and new password are required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (newPassword.length < 8) {
      await addConsistentDelay(startTime);
      return new Response(
        JSON.stringify({ error: "Password must be at least 8 characters" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validate OTP format (6 digits)
    if (!/^\d{6}$/.test(otp)) {
      await addConsistentDelay(startTime);
      return new Response(
        JSON.stringify({ error: "Invalid verification code format" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if token is locked due to too many failed attempts
    const { data: lockoutData, error: lockoutError } = await supabase
      .rpc('check_otp_lockout', { p_token: token });

    if (lockoutError) {
      console.error("Lockout check error:", lockoutError);
      await addConsistentDelay(startTime);
      return new Response(
        JSON.stringify({ error: "Unable to verify code" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check lockout status from the function result
    if (lockoutData && lockoutData.length > 0 && lockoutData[0].is_locked) {
      const lockedUntil = new Date(lockoutData[0].locked_until);
      const minutesRemaining = Math.ceil((lockedUntil.getTime() - Date.now()) / 60000);
      await addConsistentDelay(startTime);
      return new Response(
        JSON.stringify({ 
          error: `Too many failed attempts. Please try again in ${minutesRemaining} minutes.` 
        }),
        { status: 429, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Find the token
    const { data: tokenData, error: tokenError } = await supabase
      .from("password_reset_tokens")
      .select("*")
      .eq("token", token)
      .eq("used", false)
      .single();

    if (tokenError || !tokenData) {
      await addConsistentDelay(startTime);
      return new Response(
        JSON.stringify({ error: "Invalid or expired reset token" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if token is expired
    if (new Date(tokenData.expires_at) < new Date()) {
      await addConsistentDelay(startTime);
      return new Response(
        JSON.stringify({ error: "Reset token has expired" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if token is locked
    if (tokenData.locked_until && new Date(tokenData.locked_until) > new Date()) {
      const minutesRemaining = Math.ceil((new Date(tokenData.locked_until).getTime() - Date.now()) / 60000);
      await addConsistentDelay(startTime);
      return new Response(
        JSON.stringify({ 
          error: `Too many failed attempts. Please try again in ${minutesRemaining} minutes.` 
        }),
        { status: 429, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Verify OTP
    if (tokenData.otp_code !== otp) {
      // Increment failed attempts
      await supabase.rpc('increment_otp_failed_attempt', { p_token: token });
      
      const remainingAttempts = Math.max(0, 4 - (tokenData.failed_attempts || 0));
      
      await addConsistentDelay(startTime);
      return new Response(
        JSON.stringify({ 
          error: remainingAttempts > 0 
            ? `Incorrect verification code. ${remainingAttempts} attempt(s) remaining.`
            : "Too many failed attempts. Please request a new reset code."
        }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Mark token as used
    await supabase
      .from("password_reset_tokens")
      .update({ used: true })
      .eq("id", tokenData.id);

    // Find user by email
    const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
    
    if (userError) {
      await addConsistentDelay(startTime);
      return new Response(
        JSON.stringify({ error: "Unable to find user" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const user = userData.users.find(u => u.email === tokenData.email);
    
    if (!user) {
      await addConsistentDelay(startTime);
      return new Response(
        JSON.stringify({ error: "User not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Update password
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      { password: newPassword }
    );

    if (updateError) {
      console.error("Error updating password:", updateError);
      await addConsistentDelay(startTime);
      return new Response(
        JSON.stringify({ error: "Failed to update password" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Password reset successful for:", tokenData.email);

    await addConsistentDelay(startTime);
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Password has been reset successfully" 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in verify-otp-reset-password:", errorMessage);
    
    await addConsistentDelay(startTime);
    return new Response(
      JSON.stringify({ error: "Unable to reset password" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
