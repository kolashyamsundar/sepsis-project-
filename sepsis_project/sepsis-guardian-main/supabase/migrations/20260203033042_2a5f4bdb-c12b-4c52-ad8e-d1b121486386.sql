-- Create password reset tokens table
CREATE TABLE public.password_reset_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  token TEXT NOT NULL,
  otp_code TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX idx_password_reset_tokens_email ON public.password_reset_tokens(email);
CREATE INDEX idx_password_reset_tokens_token ON public.password_reset_tokens(token);

-- Enable RLS
ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- Allow insert without authentication (for password reset request)
CREATE POLICY "Anyone can create password reset tokens"
  ON public.password_reset_tokens
  FOR INSERT
  WITH CHECK (true);

-- Allow select for token validation (used by edge function with service role)
CREATE POLICY "Service role can read tokens"
  ON public.password_reset_tokens
  FOR SELECT
  USING (true);

-- Allow update for marking tokens as used
CREATE POLICY "Service role can update tokens"
  ON public.password_reset_tokens
  FOR UPDATE
  USING (true);

-- Auto-delete expired tokens (cleanup function)
CREATE OR REPLACE FUNCTION public.cleanup_expired_tokens()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM public.password_reset_tokens 
  WHERE expires_at < now() OR used = true;
END;
$$;