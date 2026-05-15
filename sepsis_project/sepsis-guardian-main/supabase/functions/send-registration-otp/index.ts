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

interface RegistrationOTPRequest {
  email: string;
}

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function generateToken(): string {
  return crypto.randomUUID() + "-" + Date.now();
}

const handler = async (req: Request): Promise<Response> => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email }: RegistrationOTPRequest = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ success: false, error: "Email is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if email already exists in auth.users
    const { data: existingUsers, error: checkError } = await supabase.auth.admin.listUsers();
    
    if (checkError) {
      console.error("Error checking existing users:", checkError);
    } else {
      const emailExists = existingUsers?.users?.some(u => u.email === email);
      if (emailExists) {
        return new Response(
          JSON.stringify({ success: false, error: "An account with this email already exists. Please sign in instead." }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
    }

    // Generate OTP and token
    const otpCode = generateOTP();
    const token = generateToken();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store in password_reset_tokens table (reusing for registration OTP)
    const { error: insertError } = await supabase
      .from("password_reset_tokens")
      .insert({
        email,
        otp_code: otpCode,
        token,
        expires_at: expiresAt.toISOString(),
        used: false,
      });

    if (insertError) {
      console.error("Error storing OTP:", insertError);
      throw new Error("Failed to generate verification code");
    }

    // Send email with OTP
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5;">
        <div style="max-width: 480px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <div style="background: linear-gradient(135deg, #22c55e, #16a34a); padding: 32px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">S.E.P.S.I.S</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0;">Email Verification</p>
          </div>
          <div style="padding: 32px;">
            <p style="color: #374151; margin: 0 0 24px;">Welcome! Use this verification code to complete your registration:</p>
            <div style="background: #f9fafb; border: 2px dashed #d1d5db; border-radius: 12px; padding: 24px; text-align: center; margin: 0 0 24px;">
              <span style="font-family: 'SF Mono', Consolas, monospace; font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #16a34a;">${otpCode}</span>
            </div>
            <p style="color: #6b7280; font-size: 14px; margin: 0;">This code expires in <strong>10 minutes</strong>.</p>
            <p style="color: #6b7280; font-size: 14px; margin: 16px 0 0;">If you didn't request this, please ignore this email.</p>
          </div>
          <div style="background: #f9fafb; padding: 16px 32px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">Smart Early Prediction System for ICU Sepsis</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const emailResponse = await sendEmail(email, "Verify your email - S.E.P.S.I.S Registration", emailHtml);
    console.log("Registration OTP email sent:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, token }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-registration-otp:", error);
    return new Response(
      JSON.stringify({ success: false, error: "An unexpected error occurred" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
