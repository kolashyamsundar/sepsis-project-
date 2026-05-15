import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { MessageSquare, Send, Loader2, Stethoscope, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface AssignedDoctor {
  doctor_id: string;
  full_name: string | null;
}

interface PatientMessageDialogProps {
  patientId?: string;
}

export function PatientMessageDialog({ patientId }: PatientMessageDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState("");
  const [assignedDoctor, setAssignedDoctor] = useState<AssignedDoctor | null>(null);
  const [loadingDoctor, setLoadingDoctor] = useState(false);
  const [noDoctor, setNoDoctor] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      fetchAssignedDoctor();
    }
  }, [isOpen, user]);

  const fetchAssignedDoctor = async () => {
    if (!user) return;
    setLoadingDoctor(true);
    setNoDoctor(false);

    try {
      // Get patient records for this user
      const { data: patients } = await supabase
        .from("patients")
        .select("id")
        .eq("user_id", user.id);

      if (!patients?.length) {
        setNoDoctor(true);
        setLoadingDoctor(false);
        return;
      }

      const patientIds = patients.map(p => p.id);

      // Find active assignment for any of the patient's records
      const { data: assignments, error } = await supabase
        .from("doctor_patient_assignments")
        .select("doctor_id")
        .in("patient_id", patientIds)
        .eq("is_active", true)
        .limit(1);

      if (error || !assignments?.length) {
        setNoDoctor(true);
        setLoadingDoctor(false);
        return;
      }

      // Get doctor profile
      const { data: doctorProfile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", assignments[0].doctor_id)
        .maybeSingle();

      setAssignedDoctor({
        doctor_id: assignments[0].doctor_id,
        full_name: doctorProfile?.full_name || null,
      });
    } catch (error) {
      console.error("Error fetching assigned doctor:", error);
      setNoDoctor(true);
    } finally {
      setLoadingDoctor(false);
    }
  };

  const handleSend = async () => {
    if (!user || !message.trim() || !assignedDoctor) return;

    setIsSending(true);
    try {
      let patientRecordId = patientId;
      
      if (!patientRecordId) {
        const { data: patientData } = await supabase
          .from("patients")
          .select("id")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        
        patientRecordId = patientData?.id;
      }

      const { error: messageError } = await supabase
        .from("doctor_messages")
        .insert({
          from_user_id: user.id,
          to_user_id: assignedDoctor.doctor_id,
          patient_id: patientRecordId,
          message: message.trim(),
          request_type: "patient_update",
        });

      if (messageError) throw messageError;

      await supabase.from("notifications").insert({
        user_id: assignedDoctor.doctor_id,
        title: "New Message from Patient",
        message: message.trim(),
        type: "message",
        patient_id: patientRecordId,
      });

      toast({
        title: "Message Sent",
        description: `Your message has been sent to Dr. ${assignedDoctor.full_name || "your doctor"}.`,
      });

      setMessage("");
      setIsOpen(false);
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <MessageSquare className="h-4 w-4" />
          Message Doctor
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-primary" />
            Send Message to Doctor
          </DialogTitle>
          <DialogDescription>
            Send a message or update about your condition to your assigned doctor.
          </DialogDescription>
        </DialogHeader>

        {loadingDoctor ? (
          <div className="flex items-center gap-2 py-8 justify-center text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading your doctor...
          </div>
        ) : noDoctor ? (
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 mx-auto mb-3 text-warning opacity-60" />
            <p className="font-medium text-lg">No Doctor Assigned</p>
            <p className="text-sm text-muted-foreground mt-2">
              You haven't been assigned to a doctor yet. Please wait for a doctor to claim your case.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-4 py-4">
              <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                <p className="text-sm text-muted-foreground">Sending to</p>
                <p className="font-medium flex items-center gap-2">
                  <Stethoscope className="h-4 w-4 text-primary" />
                  Dr. {assignedDoctor?.full_name || "Your Doctor"}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  placeholder="Describe your symptoms, updates, or questions..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSend}
                disabled={isSending || !message.trim()}
                className="gap-2"
              >
                {isSending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Send
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
