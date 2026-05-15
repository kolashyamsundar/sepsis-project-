import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock, FileText, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format, formatDistanceToNow } from "date-fns";

interface Submission {
  id: string;
  patient_name: string;
  status: string | null;
  created_at: string;
  updated_at: string;
  heart_rate: number | null;
  temperature: number | null;
  spo2: number | null;
  lactate: number | null;
}

export function SubmissionHistoryDialog({
  trigger,
}: {
  trigger?: React.ReactNode;
}) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submissions, setSubmissions] = useState<Submission[]>([]);

  useEffect(() => {
    if (!open || !user) return;

    const fetchSubmissions = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("patients")
        .select("id, patient_name, status, created_at, updated_at, heart_rate, temperature, spo2, lactate")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!error && data) setSubmissions(data as Submission[]);
      setLoading(false);
    };

    fetchSubmissions();
  }, [open, user]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button className="w-full justify-start gap-3 h-12" variant="outline">
            <Clock className="h-5 w-5" />
            View Submission History
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Submission History
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : submissions.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p>No submissions yet.</p>
          </div>
        ) : (
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-3">
              {submissions.map((s) => (
                <div
                  key={s.id}
                  className="p-4 rounded-lg border border-border/50 bg-muted/30"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium">{s.patient_name}</p>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary capitalize">
                      {s.status || "draft"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                    <Clock className="h-3 w-3" />
                    <span>{format(new Date(s.created_at), "MMM d, yyyy 'at' h:mm a")}</span>
                    <span>•</span>
                    <span>{formatDistanceToNow(new Date(s.created_at), { addSuffix: true })}</span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    {s.heart_rate != null && <span>HR: {s.heart_rate} bpm</span>}
                    {s.temperature != null && <span>Temp: {s.temperature}°C</span>}
                    {s.spo2 != null && <span>SpO₂: {s.spo2}%</span>}
                    {s.lactate != null && <span>Lactate: {s.lactate}</span>}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
