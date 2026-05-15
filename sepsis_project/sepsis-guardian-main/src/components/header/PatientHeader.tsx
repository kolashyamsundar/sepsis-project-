import { useState, useEffect } from "react";
import { Calendar, HeartPulse, FileText, MessageSquare, Stethoscope, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/GlassCard";
import { PatientMessageDialog } from "@/components/messaging/PatientMessageDialog";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export function PatientHeader() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [hasDoctor, setHasDoctor] = useState(false);
  const [doctorName, setDoctorName] = useState<string | null>(null);
  const [hasAppointments, setHasAppointments] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    const fetchAssignment = async () => {
      try {
        const { data: patients, error: patientsErr } = await supabase
          .from("patients")
          .select("id")
          .eq("user_id", user.id);

        if (patientsErr) console.error("PatientHeader patients error:", patientsErr);

        if (!patients?.length) {
          if (!cancelled) {
            setHasDoctor(false);
            setDoctorName(null);
            setLoading(false);
          }
          return;
        }

        const patientIds = patients.map((p) => p.id);

        // Most recent active assignment
        const { data: assignments, error: assignErr } = await supabase
          .from("doctor_patient_assignments")
          .select("doctor_id, assigned_at")
          .in("patient_id", patientIds)
          .eq("is_active", true)
          .order("assigned_at", { ascending: false })
          .limit(1);

        if (assignErr) console.error("PatientHeader assignments error:", assignErr);

        if (assignments?.length) {
          const { data: doctorProfile } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("user_id", assignments[0].doctor_id)
            .maybeSingle();
          if (!cancelled) {
            setHasDoctor(true);
            setDoctorName(doctorProfile?.full_name || null);
          }
        } else if (!cancelled) {
          setHasDoctor(false);
          setDoctorName(null);
        }

        const { data: appts } = await supabase
          .from("appointments")
          .select("id")
          .in("patient_id", patientIds)
          .eq("status", "scheduled")
          .gte("scheduled_at", new Date().toISOString())
          .limit(1);

        if (!cancelled) setHasAppointments((appts?.length || 0) > 0);
      } catch (e) {
        console.error("PatientHeader fetch failed:", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchAssignment();

    // Realtime: refetch when assignments change for this user's patients
    const channel = supabase
      .channel(`patient-header-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "doctor_patient_assignments" },
        () => fetchAssignment()
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [user]);

  const quickActions = [
    {
      icon: FileText,
      label: "Submit Data",
      description: "Enter your clinical data",
      onClick: () => navigate("/patient-entry"),
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      icon: MessageSquare,
      label: "Messages",
      description: "View doctor messages",
      onClick: () => navigate("/dashboard"),
      color: "text-secondary",
      bgColor: "bg-secondary/10",
    },
    {
      icon: Calendar,
      label: "Appointments",
      description: hasAppointments ? "You have upcoming!" : "Check your schedule",
      onClick: () => {},
      color: hasAppointments ? "text-warning" : "text-muted-foreground",
      bgColor: hasAppointments ? "bg-warning/10" : "bg-muted/30",
      glow: hasAppointments,
    },
    {
      icon: HeartPulse,
      label: "Vitals History",
      description: "View past records",
      onClick: () => navigate("/dashboard"),
      color: "text-success",
      bgColor: "bg-success/10",
    },
  ];

  return (
    <GlassCard className="p-6 mb-8" variant="elevated">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-primary/20 flex items-center justify-center">
            <span className="text-2xl font-bold text-primary">
              {profile?.full_name?.charAt(0)?.toUpperCase() || "P"}
            </span>
          </div>
          <div>
            <h1 className="text-2xl font-bold">
              Welcome back, {profile?.full_name?.split(" ")[0] || "Patient"}
            </h1>
            <p className="text-muted-foreground">
              Manage your health data and communicate with your doctor
            </p>
            {/* Doctor assignment status */}
            {!loading && (
              <div className="mt-1">
                {hasDoctor ? (
                  <span className="text-sm flex items-center gap-1 text-success">
                    <Stethoscope className="h-3 w-3" />
                    Assigned to Dr. {doctorName || "your doctor"}
                  </span>
                ) : (
                  <span className="text-sm flex items-center gap-1 text-warning">
                    <AlertCircle className="h-3 w-3" />
                    No doctor assigned yet — waiting for assignment
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <PatientMessageDialog />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {quickActions.map((action) => (
              <Button
                key={action.label}
                variant="outline"
                className={cn(
                  "h-auto flex-col gap-2 p-4 border-transparent hover:border-border transition-all",
                  action.bgColor,
                  action.glow && "ring-2 ring-warning/40 shadow-lg shadow-warning/20 animate-pulse"
                )}
                onClick={action.onClick}
              >
                <action.icon className={`h-5 w-5 ${action.color}`} />
                <div className="text-center">
                  <p className="text-sm font-medium">{action.label}</p>
                  <p className="text-xs text-muted-foreground hidden sm:block">
                    {action.description}
                  </p>
                </div>
              </Button>
            ))}
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
