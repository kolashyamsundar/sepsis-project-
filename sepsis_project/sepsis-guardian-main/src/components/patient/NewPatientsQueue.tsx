import { useState, useEffect, useCallback, useRef } from "react";
import { UserPlus, Check, Users, Clock, AlertTriangle, HeartPulse, RefreshCw } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface UnassignedPatient {
  id: string;
  patient_name: string;
  age: number;
  gender: string;
  created_at: string;
  heart_rate: number | null;
  lactate: number | null;
  temperature: number | null;
  user_id: string;
}

export function NewPatientsQueue() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [patients, setPatients] = useState<UnassignedPatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const fetchUnassignedPatients = useCallback(async (isRefresh = false) => {
    if (!user) return;
    if (isRefresh) setRefreshing(true);

    try {
      // Fetch all patients visible to this doctor
      const { data: allPatients, error } = await supabase
        .from("patients")
        .select("id, patient_name, age, gender, created_at, heart_rate, lactate, temperature, user_id")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching patients:", error);
        return;
      }

      // Fetch ALL active assignments (not just this doctor's)
      const { data: allAssignments } = await supabase
        .from("doctor_patient_assignments")
        .select("patient_id")
        .eq("is_active", true);

      const assignedIds = new Set(allAssignments?.map(a => a.patient_id) || []);
      
      // Filter to only unassigned patients (exclude doctor's own user_id records and already assigned)
      const unassigned = (allPatients || []).filter(p => 
        !assignedIds.has(p.id) && p.user_id !== user.id
      );
      
      setPatients(unassigned);
    } catch (err) {
      console.error("Error in fetchUnassignedPatients:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    fetchUnassignedPatients();

    // Realtime subscriptions
    const channel = supabase
      .channel("new-patients-queue")
      .on("postgres_changes", { event: "*", schema: "public", table: "patients" }, () => fetchUnassignedPatients())
      .on("postgres_changes", { event: "*", schema: "public", table: "doctor_patient_assignments" }, () => fetchUnassignedPatients())
      .subscribe();

    // Polling fallback every 10 seconds
    pollRef.current = setInterval(() => fetchUnassignedPatients(), 10000);

    return () => {
      supabase.removeChannel(channel);
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchUnassignedPatients]);

  const claimPatient = async (patient: UnassignedPatient) => {
    if (!user) return;
    setClaimingId(patient.id);

    try {
      // Check if already claimed by another doctor
      const { data: existingAssignment } = await supabase
        .from("doctor_patient_assignments")
        .select("id")
        .eq("patient_id", patient.id)
        .eq("is_active", true)
        .maybeSingle();

      if (existingAssignment) {
        toast({
          title: "Already Claimed",
          description: "This patient has already been claimed by another doctor.",
          variant: "destructive",
        });
        setPatients(prev => prev.filter(p => p.id !== patient.id));
        setClaimingId(null);
        return;
      }

      // Create assignment
      const { error } = await supabase
        .from("doctor_patient_assignments")
        .insert({
          doctor_id: user.id,
          patient_id: patient.id,
          assigned_by: user.id,
          notes: "Self-assigned from new patients queue",
        });

      if (error) throw error;

      // Notify the patient
      await supabase.from("notifications").insert({
        user_id: patient.user_id,
        title: "Doctor Assigned",
        message: "A doctor has been assigned to your case. You can now communicate directly.",
        type: "info",
        patient_id: patient.id,
      });

      toast({
        title: "Patient Claimed",
        description: `${patient.patient_name} has been assigned to you.`,
      });

      // Remove from queue immediately
      setPatients(prev => prev.filter(p => p.id !== patient.id));
    } catch (error) {
      console.error("Error claiming patient:", error);
      toast({
        title: "Error",
        description: "Failed to claim patient. They may have been claimed by another doctor.",
        variant: "destructive",
      });
    } finally {
      setClaimingId(null);
    }
  };

  if (loading) {
    return (
      <GlassCard className="p-6">
        <div className="flex items-center justify-center h-24">
          <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="p-6 border-warning/30 bg-warning/5" variant="elevated">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-warning/20 flex items-center justify-center animate-pulse">
            <UserPlus className="h-4 w-4 text-warning" />
          </div>
          <h3 className="text-lg font-semibold">
            New Patients
            <span className="ml-2 text-sm font-normal text-warning">
              ({patients.length} unassigned)
            </span>
          </h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2"
          onClick={() => fetchUnassignedPatients(true)}
          disabled={refreshing}
        >
          <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {patients.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Users className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">No unassigned patients at this time.</p>
          <p className="text-xs mt-1">New patient submissions will appear here automatically.</p>
        </div>
      ) : (
        <ScrollArea className="max-h-64">
          <div className="space-y-3">
            {patients.map((patient) => {
              const isEmergency = (patient.lactate && patient.lactate > 4) ||
                (patient.heart_rate && (patient.heart_rate > 130 || patient.heart_rate < 45));

              return (
                <div
                  key={patient.id}
                  className={cn(
                    "flex items-center justify-between gap-4 p-4 rounded-lg border transition-all",
                    isEmergency
                      ? "bg-danger/10 border-danger/30"
                      : "bg-muted/30 border-border/50"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "h-10 w-10 rounded-full flex items-center justify-center font-medium",
                      isEmergency ? "bg-danger/20 text-danger" : "bg-primary/20 text-primary"
                    )}>
                      {patient.patient_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{patient.patient_name}</p>
                        {isEmergency && <AlertTriangle className="h-4 w-4 text-danger animate-pulse" />}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Age: {patient.age}</span>
                        <span>•</span>
                        <span className="capitalize">{patient.gender}</span>
                        {patient.heart_rate && (
                          <>
                            <span>•</span>
                            <HeartPulse className="h-3 w-3" />
                            <span>{patient.heart_rate} bpm</span>
                          </>
                        )}
                        <span>•</span>
                        <Clock className="h-3 w-3" />
                        <span>{formatDistanceToNow(new Date(patient.created_at), { addSuffix: true })}</span>
                      </div>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    className="gap-2"
                    onClick={() => claimPatient(patient)}
                    disabled={claimingId === patient.id}
                  >
                    {claimingId === patient.id ? (
                      <div className="animate-spin h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                    Claim
                  </Button>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      )}
    </GlassCard>
  );
}
