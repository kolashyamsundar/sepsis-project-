import { useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MessageSquare, Send, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface DoctorMessageDialogProps {
  patientUserId: string;
  patientId: string;
  patientName: string;
}

export function DoctorMessageDialog({
  patientUserId,
  patientId,
  patientName,
}: DoctorMessageDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState("");
  const [requestType, setRequestType] = useState("general");

  const handleSend = async () => {
    if (!user || !message.trim()) return;

    setIsSending(true);
    try {
      // Create message
      const { error: messageError } = await supabase
        .from("doctor_messages")
        .insert({
          from_user_id: user.id,
          to_user_id: patientUserId,
          patient_id: patientId,
          message: message.trim(),
          request_type: requestType,
        });

      if (messageError) throw messageError;

      // Create notification for patient
      const notificationTitle = requestType === "document" 
        ? "Document Request from Doctor"
        : requestType === "information"
        ? "Information Request from Doctor"
        : "New Message from Doctor";

      const { error: notificationError } = await supabase
        .from("notifications")
        .insert({
          user_id: patientUserId,
          title: notificationTitle,
          message: message.trim(),
          type: "message",
          patient_id: patientId,
        });

      if (notificationError) throw notificationError;

      toast({
        title: "Message Sent",
        description: `Your message has been sent to ${patientName}.`,
      });

      setMessage("");
      setRequestType("general");
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
        <Button variant="outline" size="sm" className="gap-2">
          <MessageSquare className="h-4 w-4" />
          Send Note
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Send Note to Patient
          </DialogTitle>
          <DialogDescription>
            Send a message or request additional information from {patientName}.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="request-type">Request Type</Label>
            <Select value={requestType} onValueChange={setRequestType}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General Message</SelectItem>
                <SelectItem value="document">Request Document Upload</SelectItem>
                <SelectItem value="information">Request More Information</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              placeholder="Enter your message to the patient..."
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
      </DialogContent>
    </Dialog>
  );
}
