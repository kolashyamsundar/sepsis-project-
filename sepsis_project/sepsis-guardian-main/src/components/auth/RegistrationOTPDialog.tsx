import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Mail, CheckCircle2, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface RegistrationOTPDialogProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  onVerified: () => void;
}

export function RegistrationOTPDialog({
  isOpen,
  onClose,
  email,
  onVerified,
}: RegistrationOTPDialogProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<"sending" | "verify">("sending");
  const [otp, setOtp] = useState("");
  const [token, setToken] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(true);

  // Send OTP when dialog opens
  useEffect(() => {
    if (isOpen && email) {
      sendOTP();
    }
  }, [isOpen, email]);

  const sendOTP = async () => {
    setIsSending(true);
    try {
      const response = await supabase.functions.invoke("send-registration-otp", {
        body: { email },
      });

      if (response.error) throw response.error;

      const data = response.data as { success: boolean; token?: string; error?: string };
      
      if (data.success && data.token) {
        setToken(data.token);
        setStep("verify");
        toast({
          title: "Verification Code Sent",
          description: `We've sent a 6-digit code to ${email}`,
        });
      } else {
        throw new Error(data.error || "Failed to send verification code");
      }
    } catch (error) {
      console.error("Error sending OTP:", error);
      toast({
        title: "Error",
        description: "Failed to send verification code. Please try again.",
        variant: "destructive",
      });
      onClose();
    } finally {
      setIsSending(false);
    }
  };

  const handleVerify = async () => {
    if (otp.length !== 6) {
      toast({
        title: "Invalid Code",
        description: "Please enter the 6-digit verification code",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await supabase.functions.invoke("verify-registration-otp", {
        body: { email, otp, token },
      });

      if (response.error) throw response.error;

      const data = response.data as { success: boolean; error?: string };
      
      if (data.success) {
        toast({
          title: "Email Verified!",
          description: "Your email has been verified. Completing registration...",
        });
        onVerified();
      } else {
        throw new Error(data.error || "Invalid verification code");
      }
    } catch (error: any) {
      console.error("Verification error:", error);
      toast({
        title: "Verification Failed",
        description: error.message || "Invalid code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setOtp("");
    await sendOTP();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Verify Your Email
          </DialogTitle>
          <DialogDescription>
            We need to verify your email address before creating your account.
          </DialogDescription>
        </DialogHeader>

        {isSending ? (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="relative">
              <div className="h-16 w-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
              <Mail className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-primary" />
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Sending verification code to {email}...
            </p>
          </div>
        ) : (
          <div className="space-y-6 py-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/10 border border-primary/20">
              <Mail className="h-5 w-5 text-primary shrink-0" />
              <div className="text-sm">
                <p className="font-medium">Check your inbox</p>
                <p className="text-muted-foreground">{email}</p>
              </div>
            </div>

            <div className="space-y-3">
              <Label>Enter verification code</Label>
              <InputOTP
                value={otp}
                onChange={setOtp}
                maxLength={6}
                className="gap-2"
              >
                <InputOTPGroup className="gap-2">
                  <InputOTPSlot index={0} className="rounded-lg border-2" />
                  <InputOTPSlot index={1} className="rounded-lg border-2" />
                  <InputOTPSlot index={2} className="rounded-lg border-2" />
                  <InputOTPSlot index={3} className="rounded-lg border-2" />
                  <InputOTPSlot index={4} className="rounded-lg border-2" />
                  <InputOTPSlot index={5} className="rounded-lg border-2" />
                </InputOTPGroup>
              </InputOTP>
            </div>

            <Button
              onClick={handleVerify}
              disabled={isLoading || otp.length !== 6}
              className="w-full gradient-bg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Verify & Create Account
                </>
              )}
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={handleResend}
                className="text-sm text-primary hover:underline"
                disabled={isLoading}
              >
                Didn't receive the code? Resend
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
