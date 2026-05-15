import { useState, useEffect } from "react";
import { Calendar, Clock, Stethoscope } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format, isFuture } from "date-fns";
import { cn } from "@/lib/utils";

interface Appointment {
  id: string;
  scheduled_at: string;
  duration_minutes: number;
  status: string;
  notes: string | null;
}

export function PatientAppointments() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchAppointments = async () => {
      // Get patient records for this user
      const { data: patients } = await supabase
        .from("patients")
        .select("id")
        .eq("user_id", user.id);

      if (!patients?.length) {
        setLoading(false);
        return;
      }

      const patientIds = patients.map(p => p.id);

      const { data, error } = await supabase
        .from("appointments")
        .select("*")
        .in("patient_id", patientIds)
        .eq("status", "scheduled")
        .order("scheduled_at", { ascending: true });

      if (!error) {
        setAppointments(data || []);
      }
      setLoading(false);
    };

    fetchAppointments();

    // Realtime subscription
    const channel = supabase
      .channel("patient-appointments")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "appointments" },
        () => fetchAppointments()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const upcomingAppointments = appointments.filter(a => isFuture(new Date(a.scheduled_at)));
  const hasUpcoming = upcomingAppointments.length > 0;

  if (loading) return null;

  return (
    <GlassCard className={cn(
      "p-6",
      hasUpcoming && "border-warning/40 shadow-lg shadow-warning/10"
    )} variant="elevated">
      <div className="flex items-center gap-2 mb-4">
        <div className={cn(
          "h-8 w-8 rounded-lg flex items-center justify-center",
          hasUpcoming ? "bg-warning/20 animate-pulse" : "bg-muted/50"
        )}>
          <Calendar className={cn("h-4 w-4", hasUpcoming ? "text-warning" : "text-muted-foreground")} />
        </div>
        <h3 className="text-lg font-semibold">
          Appointments
          {hasUpcoming && (
            <span className="ml-2 text-sm font-normal text-warning animate-pulse">
              ({upcomingAppointments.length} upcoming)
            </span>
          )}
        </h3>
      </div>

      {upcomingAppointments.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground">
          <Calendar className="h-10 w-10 mx-auto mb-2 opacity-40" />
          <p className="text-sm">No upcoming appointments</p>
        </div>
      ) : (
        <div className="space-y-3">
          {upcomingAppointments.map((apt) => (
            <div
              key={apt.id}
              className="p-4 rounded-lg bg-warning/10 border border-warning/30 transition-all hover:bg-warning/15"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Stethoscope className="h-4 w-4 text-primary" />
                  <span className="font-medium">Doctor Appointment</span>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-warning/20 text-warning font-medium">
                  {apt.duration_minutes} min
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>{format(new Date(apt.scheduled_at), "MMM d, yyyy 'at' h:mm a")}</span>
              </div>
              {apt.notes && (
                <p className="text-sm text-muted-foreground mt-2 italic">
                  "{apt.notes}"
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </GlassCard>
  );
}
