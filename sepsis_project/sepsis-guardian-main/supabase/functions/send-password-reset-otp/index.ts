import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

async function sendEmail(to: string, subject: string, html: string) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: "S.E.P.S.I.S <onboarding@resend.dev>",
      to: [to],
      subject,
      html,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to send email");
  }

  return response.json();
}

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

interface PasswordResetRequest {
  email: string;
}

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function generateToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
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
    const { email }: PasswordResetRequest = await req.json();

    if (!email) {
      throw new Error("Email is required");
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error("Invalid email format");
    }

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check rate limit using the database function
    const { data: rateCheckData, error: rateCheckError } = await supabase
      .rpc('check_password_reset_rate_limit', { p_email: email });

    if (rateCheckError) {
      console.error("Rate limit check error:", rateCheckError);
      throw new Error("Unable to process request");
    }

    if (rateCheckData === false) {
      // Rate limit exceeded - return consistent response to prevent enumeration
      await addConsistentDelay(startTime);
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "If an account exists with this email, you will receive a password reset code." 
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Check if user exists
    const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
    
    if (userError) {
      console.error("Error listing users:", userError);
      throw new Error("Unable to verify email");
    }

    const userExists = userData.users.some(user => user.email === email);
    
    if (!userExists) {
      // Don't reveal if user exists or not for security - use consistent delay
      await addConsistentDelay(startTime);
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "If an account exists with this email, you will receive a password reset code." 
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Generate OTP and token
    const otpCode = generateOTP();
    const token = generateToken();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Invalidate any existing tokens for this email
    await supabase
      .from("password_reset_tokens")
      .update({ used: true })
      .eq("email", email)
      .eq("used", false);

    // Store the token with rate limiting fields
    const { error: insertError } = await supabase
      .from("password_reset_tokens")
      .insert({
        email,
        token,
        otp_code: otpCode,
        expires_at: expiresAt.toISOString(),
        failed_attempts: 0,
        last_attempt_at: null,
        locked_until: null,
      });

    if (insertError) {
      console.error("Error storing token:", insertError);
      throw new Error("Failed to create reset token");
    }

    // Send email with OTP
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0a1628; color: #e1e7ef; margin: 0; padding: 40px 20px;">
        <div style="max-width: 480px; margin: 0 auto; background: linear-gradient(180deg, #141e33 0%, #0f1829 100%); border-radius: 16px; padding: 40px; border: 1px solid #1e2d47;">
          <div style="text-align: center; margin-bottom: 32px;">
            <div style="display: inline-flex; align-items: center; gap: 8px; padding: 8px 16px; background: linear-gradient(135deg, #3b9eff 0%, #8b5cf6 100%); border-radius: 8px;">
              <span style="font-size: 24px; font-weight: bold; color: #0a1628;">S.E.P.S.I.S</span>
            </div>
          </div>
          
          <h1 style="font-size: 24px; font-weight: 700; text-align: center; margin: 0 0 16px;">Password Reset Request</h1>
          
          <p style="font-size: 16px; color: #94a3b8; text-align: center; margin: 0 0 32px; line-height: 1.6;">
            Use the verification code below to reset your password. This code expires in 10 minutes.
          </p>
          
          <div style="background: linear-gradient(135deg, rgba(59, 158, 255, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%); border: 1px solid rgba(59, 158, 255, 0.3); border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 32px;">
            <span style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #3b9eff; font-family: monospace;">${otpCode}</span>
          </div>
          
          <p style="font-size: 14px; color: #64748b; text-align: center; margin: 0; line-height: 1.6;">
            If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.
          </p>
          
          <div style="border-top: 1px solid #1e2d47; margin-top: 32px; padding-top: 24px; text-align: center;">
            <p style="font-size: 12px; color: #475569; margin: 0;">
              © 2024 S.E.P.S.I.S - Smart Early Prediction System for ICU Sepsis
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const emailResponse = await sendEmail(email, "Your Password Reset Code - S.E.P.S.I.S", emailHtml);
    console.log("Password reset email sent:", emailResponse);

    // Add consistent delay before responding
    await addConsistentDelay(startTime);

    return new Response(
      JSON.stringify({ 
        success: true, 
        token,
        message: "Password reset code sent to your email" 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in send-password-reset-otp:", errorMessage);
    
    // Add consistent delay for error responses too
    await addConsistentDelay(startTime);
    
    return new Response(
      JSON.stringify({ error: "Unable to process password reset request" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
