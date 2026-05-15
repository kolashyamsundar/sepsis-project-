import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Clock,
  AlertTriangle,
  ChevronRight,
  Search,
  Calendar,
  HeartPulse,
  Thermometer,
  Loader2,
  Trash2,
  Undo2,
  RefreshCw,
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RiskBadge } from "@/components/ui/RiskBadge";
import { DoctorMessageDialog } from "@/components/messaging/DoctorMessageDialog";
import { AppointmentScheduler } from "@/components/appointments/AppointmentScheduler";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { format, formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface Patient {
  id: string;
  patient_name: string;
  age: number;
  gender: string;
  status: string | null;
  created_at: string;
  updated_at: string;
  heart_rate: number | null;
  lactate: number | null;
  temperature: number | null;
  user_id: string;
}

export function PatientList() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [deletingPatientId, setDeletingPatientId] = useState<string | null>(null);
  const [deletedPatientData, setDeletedPatientData] = useState<Patient | null>(null);
  const [undoCountdown, setUndoCountdown] = useState(5);
  const deleteTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const fetchPatients = useCallback(async (isRefresh = false) => {
    if (!user) return;
    if (isRefresh) setRefreshing(true);

    try {
      const { data: assignments } = await supabase
        .from("doctor_patient_assignments")
        .select("patient_id")
        .eq("doctor_id", user.id)
        .eq("is_active", true);

      const assignedIds = assignments?.map(a => a.patient_id) || [];

      if (assignedIds.length === 0) {
        setPatients([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const { data, error } = await supabase
        .from("patients")
        .select("id, patient_name, age, gender, status, created_at, updated_at, heart_rate, lactate, temperature, user_id")
        .in("id", assignedIds)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching patients:", error);
        toast({ title: "Error", description: "Failed to load patients.", variant: "destructive" });
      } else {
        setPatients(data || []);
      }
    } catch (err) {
      console.error("Error in fetchPatients:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, toast]);

  useEffect(() => {
    if (!user) return;
    fetchPatients();

    const channel = supabase
      .channel("my-patients-list")
      .on("postgres_changes", { event: "*", schema: "public", table: "patients" }, () => fetchPatients())
      .on("postgres_changes", { event: "*", schema: "public", table: "doctor_patient_assignments" }, () => fetchPatients())
      .subscribe();

    // Polling fallback
    pollRef.current = setInterval(() => fetchPatients(), 15000);

    return () => {
      supabase.removeChannel(channel);
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [user, fetchPatients]);

  useEffect(() => {
    return () => {
      if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, []);

  const permanentlyDeletePatient = useCallback(async (patientData: Patient) => {
    try {
      // Delete all related records first
      await supabase.from("predictions").delete().eq("patient_id", patientData.id);
      await supabase.from("doctor_messages").delete().eq("patient_id", patientData.id);
      await supabase.from("notifications").delete().eq("patient_id", patientData.id);
      await supabase.from("appointments").delete().eq("patient_id", patientData.id);
      await supabase.from("doctor_patient_assignments").delete().eq("patient_id", patientData.id);
      
      const { error } = await supabase.from("patients").delete().eq("id", patientData.id);
      if (error) throw error;
      
      toast({ title: "Deleted", description: `${patientData.patient_name} has been permanently deleted.` });
      // Force refresh the list
      fetchPatients();
    } catch (error) {
      console.error("Error deleting patient:", error);
      setPatients((prev) => [patientData, ...prev]);
      toast({ title: "Error", description: "Failed to delete patient.", variant: "destructive" });
    } finally {
      setDeletingPatientId(null);
      setDeletedPatientData(null);
      setUndoCountdown(5);
    }
  }, [toast, fetchPatients]);

  const handleDeletePatient = useCallback((patient: Patient) => {
    if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    setDeletedPatientData(patient);
    setDeletingPatientId(patient.id);
    setUndoCountdown(5);
    setPatients((prev) => prev.filter((p) => p.id !== patient.id));
    toast({ title: "Patient Deleted", description: `${patient.patient_name} removed. Click undo to restore.` });
    let countdown = 5;
    countdownIntervalRef.current = setInterval(() => {
      countdown -= 1;
      setUndoCountdown(countdown);
      if (countdown <= 0 && countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    }, 1000);
    deleteTimerRef.current = setTimeout(() => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      permanentlyDeletePatient(patient);
    }, 5000);
  }, [toast, permanentlyDeletePatient]);

  const handleUndoDelete = useCallback(() => {
    if (deleteTimerRef.current) { clearTimeout(deleteTimerRef.current); deleteTimerRef.current = null; }
    if (countdownIntervalRef.current) { clearInterval(countdownIntervalRef.current); countdownIntervalRef.current = null; }
    if (deletedPatientData) {
      setPatients((prev) => [deletedPatientData, ...prev]);
      toast({ title: "Restored", description: `${deletedPatientData.patient_name} has been restored.` });
    }
    setDeletingPatientId(null);
    setDeletedPatientData(null);
    setUndoCountdown(5);
  }, [deletedPatientData, toast]);

  const determineRiskLevel = (patient: Patient): "low" | "medium" | "high" | "critical" => {
    const { lactate, heart_rate, temperature } = patient;
    if ((lactate && lactate > 4) || (heart_rate && (heart_rate > 130 || heart_rate < 45)) || (temperature && (temperature > 40 || temperature < 34))) return "critical";
    if ((lactate && lactate > 2) || (heart_rate && (heart_rate > 110 || heart_rate < 55)) || (temperature && (temperature > 38.5 || temperature < 35.5))) return "high";
    if ((lactate && lactate > 1.5) || (heart_rate && (heart_rate > 100 || heart_rate < 60))) return "medium";
    return "low";
  };

  const filteredPatients = patients.filter((p) =>
    p.patient_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const viewedKey = (patientId: string) => `patient_viewed_${user?.id}_${patientId}`;
  const isRecentlyUpdated = (patient: Patient): boolean => {
    if (!patient.updated_at) return false;
    const updated = new Date(patient.updated_at).getTime();
    const created = new Date(patient.created_at).getTime();
    // Only treat as "updated" if modified > 30s after creation (true patient edit)
    if (updated - created < 30_000) return false;
    const lastViewed = parseInt(localStorage.getItem(viewedKey(patient.id)) || "0", 10);
    return updated > lastViewed;
  };
  const markAsViewed = (patientId: string) => {
    localStorage.setItem(viewedKey(patientId), Date.now().toString());
    // Force re-render
    setPatients((prev) => [...prev]);
  };

  if (loading) {
    return (
      <GlassCard className="p-6">
        <div className="flex items-center justify-center h-48">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="p-8 hover:shadow-2xl transition-all duration-300" variant="elevated">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-8">
        <h2 className="text-2xl font-semibold flex items-center gap-3">
          <HeartPulse className="h-7 w-7 text-primary" />
          My Patients
          <span className="text-base font-normal text-muted-foreground ml-2">
            ({patients.length} assigned)
          </span>
        </h2>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
            onClick={() => fetchPatients(true)}
            disabled={refreshing}
          >
            <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
            Refresh
          </Button>
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search patients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 text-base w-full sm:w-72"
            />
          </div>
        </div>
      </div>

      {filteredPatients.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>{patients.length === 0 ? "No patients assigned. Claim patients from the New Patients queue above." : "No patients found"}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredPatients.map((patient) => {
            const riskLevel = determineRiskLevel(patient);
            const isEmergency = riskLevel === "critical" || riskLevel === "high";
            const recentlyUpdated = isRecentlyUpdated(patient);

            return (
              <div
                key={patient.id}
                className={cn(
                  "flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg transition-all",
                  isEmergency ? "bg-danger/10 border border-danger/30 hover:bg-danger/15" : "bg-muted/30 hover:bg-muted/50",
                  recentlyUpdated && "ring-2 ring-warning/60",
                  "cursor-pointer"
                )}
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "h-12 w-12 rounded-full flex items-center justify-center text-lg font-medium",
                    isEmergency ? "bg-danger/20 text-danger" : "bg-primary/20 text-primary"
                  )}>
                    {patient.patient_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium">{patient.patient_name}</p>
                      {isEmergency && <AlertTriangle className="h-4 w-4 text-danger animate-pulse" />}
                      {recentlyUpdated && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-warning/20 text-warning border border-warning/40">
                          <span className="h-1.5 w-1.5 rounded-full bg-warning animate-pulse" />
                          Updated
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span>Age: {patient.age}</span>
                      <span>•</span>
                      <span className="capitalize">{patient.gender}</span>
                      {patient.heart_rate && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1"><HeartPulse className="h-3 w-3" />{patient.heart_rate} bpm</span>
                        </>
                      )}
                      {patient.temperature && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1"><Thermometer className="h-3 w-3" />{patient.temperature}°C</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-16 sm:ml-0 flex-wrap">
                  <div className="flex flex-col items-end gap-1">
                    <RiskBadge level={riskLevel} />
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(patient.created_at), "MMM d, yyyy")}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(patient.created_at), { addSuffix: true })}
                    </div>
                  </div>
                  <AppointmentScheduler
                    patientUserId={patient.user_id}
                    patientId={patient.id}
                    patientName={patient.patient_name}
                  />
                  <DoctorMessageDialog
                    patientUserId={patient.user_id}
                    patientId={patient.id}
                    patientName={patient.patient_name}
                  />
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Patient?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will delete {patient.patient_name}'s record. You'll have 5 seconds to undo.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeletePatient(patient)}>Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  <Button variant="ghost" size="icon" onClick={() => { markAsViewed(patient.id); navigate(`/predictions?patient=${patient.id}`); }}>
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {deletingPatientId && deletedPatientData && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <div className="flex items-center gap-4 px-6 py-4 bg-background border rounded-xl shadow-2xl">
            <AlertTriangle className="h-5 w-5 text-warning" />
            <div>
              <p className="font-medium">Deleting {deletedPatientData.patient_name}</p>
              <p className="text-sm text-muted-foreground">Permanent in {undoCountdown}s</p>
            </div>
            <Button onClick={handleUndoDelete} variant="outline" size="sm" className="gap-2">
              <Undo2 className="h-4 w-4" />
              Undo
            </Button>
          </div>
        </div>
      )}
    </GlassCard>
  );
}
