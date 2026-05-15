import { useState, useEffect } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
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
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  User,
  Trash2,
  Undo2,
  Heart,
  Thermometer,
  Activity,
  Droplets,
  AlertTriangle,
} from "lucide-react";

interface Patient {
  id: string;
  patient_name: string;
  age: number;
  gender: string;
  status: string | null;
  created_at: string;
  heart_rate: number | null;
  systolic_bp: number | null;
  diastolic_bp: number | null;
  respiratory_rate: number | null;
  temperature: number | null;
  spo2: number | null;
  wbc_count: number | null;
  lactate: number | null;
  creatinine: number | null;
  bilirubin: number | null;
  platelet_count: number | null;
  glucose: number | null;
  diabetes: boolean | null;
  hypertension: boolean | null;
  heart_disease: boolean | null;
  kidney_disease: boolean | null;
  liver_disease: boolean | null;
  copd: boolean | null;
  immunocompromised: boolean | null;
  user_id: string;
}

interface PatientDetailsCardProps {
  patient: Patient;
  onPatientDeleted?: () => void;
  showDeleteButton?: boolean;
}

export function PatientDetailsCard({
  patient,
  onPatientDeleted,
  showDeleteButton = true,
}: PatientDetailsCardProps) {
  const { toast } = useToast();
  const [isDeleted, setIsDeleted] = useState(false);
  const [deletedPatient, setDeletedPatient] = useState<Patient | null>(null);
  const [undoCountdown, setUndoCountdown] = useState(5);
  const [undoTimerId, setUndoTimerId] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isDeleted && undoCountdown > 0) {
      const timer = setTimeout(() => {
        setUndoCountdown((prev) => prev - 1);
      }, 1000);
      setUndoTimerId(timer);
      return () => clearTimeout(timer);
    } else if (isDeleted && undoCountdown === 0) {
      // Permanently delete
      permanentlyDelete();
    }
  }, [isDeleted, undoCountdown]);

  const handleDelete = async () => {
    // Store patient data for potential undo
    setDeletedPatient(patient);
    setIsDeleted(true);
    setUndoCountdown(5);

    toast({
      title: "Patient Deleted",
      description: `${patient.patient_name} has been removed. Click undo within 5 seconds to restore.`,
    });
  };

  const permanentlyDelete = async () => {
    if (!deletedPatient) return;

    try {
      // Delete related predictions first
      await supabase
        .from("predictions")
        .delete()
        .eq("patient_id", deletedPatient.id);

      // Delete related messages
      await supabase
        .from("doctor_messages")
        .delete()
        .eq("patient_id", deletedPatient.id);

      // Delete related notifications
      await supabase
        .from("notifications")
        .delete()
        .eq("patient_id", deletedPatient.id);

      // Delete the patient
      const { error } = await supabase
        .from("patients")
        .delete()
        .eq("id", deletedPatient.id);

      if (error) throw error;

      onPatientDeleted?.();
    } catch (error) {
      console.error("Error deleting patient:", error);
      // Restore the patient display if delete failed
      setIsDeleted(false);
      setDeletedPatient(null);
      toast({
        title: "Error",
        description: "Failed to delete patient. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleUndo = () => {
    if (undoTimerId) {
      clearTimeout(undoTimerId);
    }
    setIsDeleted(false);
    setDeletedPatient(null);
    setUndoCountdown(5);

    toast({
      title: "Restored",
      description: `${patient.patient_name} has been restored.`,
    });
  };

  if (isDeleted) {
    return (
      <GlassCard className="p-6 bg-warning/10 border-warning/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <AlertTriangle className="h-6 w-6 text-warning" />
            <div>
              <p className="font-medium">{patient.patient_name} deleted</p>
              <p className="text-sm text-muted-foreground">
                Auto-deleting in {undoCountdown} seconds...
              </p>
            </div>
          </div>
          <Button onClick={handleUndo} variant="outline" className="gap-2">
            <Undo2 className="h-4 w-4" />
            Undo ({undoCountdown}s)
          </Button>
        </div>
      </GlassCard>
    );
  }

  const comorbidities = [
    patient.diabetes && "Diabetes",
    patient.hypertension && "Hypertension",
    patient.heart_disease && "Heart Disease",
    patient.kidney_disease && "Kidney Disease",
    patient.liver_disease && "Liver Disease",
    patient.copd && "COPD",
    patient.immunocompromised && "Immunocompromised",
  ].filter(Boolean);

  return (
    <GlassCard className="p-6">
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-primary/20 flex items-center justify-center">
            <User className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-semibold">{patient.patient_name}</h3>
            <p className="text-muted-foreground">
              {patient.age} years • {patient.gender}
            </p>
          </div>
        </div>

        {showDeleteButton && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" className="gap-2">
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Patient Record?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will delete {patient.patient_name}'s record and all
                  associated predictions. You'll have 5 seconds to undo this
                  action.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      {/* Vitals Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {patient.heart_rate && (
          <div className="p-3 rounded-lg bg-muted/30">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Heart className="h-4 w-4" />
              Heart Rate
            </div>
            <p className="font-semibold">{patient.heart_rate} bpm</p>
          </div>
        )}
        {patient.temperature && (
          <div className="p-3 rounded-lg bg-muted/30">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Thermometer className="h-4 w-4" />
              Temperature
            </div>
            <p className="font-semibold">{patient.temperature}°C</p>
          </div>
        )}
        {patient.spo2 && (
          <div className="p-3 rounded-lg bg-muted/30">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Activity className="h-4 w-4" />
              SpO2
            </div>
            <p className="font-semibold">{patient.spo2}%</p>
          </div>
        )}
        {patient.lactate && (
          <div className="p-3 rounded-lg bg-muted/30">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Droplets className="h-4 w-4" />
              Lactate
            </div>
            <p className="font-semibold">{patient.lactate} mmol/L</p>
          </div>
        )}
      </div>

      {/* Additional Vitals */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6 text-sm">
        {patient.systolic_bp && patient.diastolic_bp && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Blood Pressure</span>
            <span className="font-medium">
              {patient.systolic_bp}/{patient.diastolic_bp} mmHg
            </span>
          </div>
        )}
        {patient.respiratory_rate && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Respiratory Rate</span>
            <span className="font-medium">{patient.respiratory_rate}/min</span>
          </div>
        )}
        {patient.wbc_count && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">WBC Count</span>
            <span className="font-medium">
              {patient.wbc_count.toLocaleString()}/μL
            </span>
          </div>
        )}
        {patient.creatinine && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Creatinine</span>
            <span className="font-medium">{patient.creatinine} mg/dL</span>
          </div>
        )}
        {patient.bilirubin && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Bilirubin</span>
            <span className="font-medium">{patient.bilirubin} mg/dL</span>
          </div>
        )}
        {patient.platelet_count && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Platelets</span>
            <span className="font-medium">
              {patient.platelet_count.toLocaleString()}/μL
            </span>
          </div>
        )}
        {patient.glucose && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Glucose</span>
            <span className="font-medium">{patient.glucose} mg/dL</span>
          </div>
        )}
      </div>

      {/* Comorbidities */}
      {comorbidities.length > 0 && (
        <div>
          <p className="text-sm text-muted-foreground mb-2">Comorbidities</p>
          <div className="flex flex-wrap gap-2">
            {comorbidities.map((condition, i) => (
              <span
                key={i}
                className="px-3 py-1 rounded-full bg-warning/20 text-warning text-xs font-medium"
              >
                {condition}
              </span>
            ))}
          </div>
        </div>
      )}
    </GlassCard>
  );
}
