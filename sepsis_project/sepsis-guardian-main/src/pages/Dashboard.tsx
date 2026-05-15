import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { GlassCard } from "@/components/ui/GlassCard";
import { RiskBadge } from "@/components/ui/RiskBadge";
import { PatientList } from "@/components/patient/PatientList";
import { NewPatientsQueue } from "@/components/patient/NewPatientsQueue";
import { MessagesInbox } from "@/components/messaging/MessagesInbox";
import { PatientHeader } from "@/components/header/PatientHeader";
import { DoctorHeader } from "@/components/header/DoctorHeader";
import { PatientAppointments } from "@/components/appointments/PatientAppointments";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { HealthStatusPDF } from "@/components/patient/HealthStatusPDF";
import { SubmissionHistoryDialog } from "@/components/patient/SubmissionHistoryDialog";
import {
  Activity,
  Users,
  AlertTriangle,
  TrendingUp,
  FileText,
  Brain,
  Clock,
  ChevronRight,
  HeartPulse,
  Stethoscope,
  Shield,
} from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-medical.jpg";

// Static demo stats (kept for high risk / accuracy / predictions today)
const mockStats = {
  highRisk: 23,
  avgAccuracy: 91.2,
  predictionsToday: 47,
};

export default function Dashboard() {
  const { user, profile, loading } = useAuth();
  const patientListRef = useRef<HTMLDivElement | null>(null);
  const [totalAssigned, setTotalAssigned] = useState<number>(0);
  const [healthStatus, setHealthStatus] = useState<{
    risk_level: string | null;
    mortality: number | null;
    stage: string | null;
    updated: string | null;
    recommendations: any;
  }>({ risk_level: null, mortality: null, stage: null, updated: null, recommendations: null });

  // Auth is handled by ProtectedRoute — no redirect needed here

  // Fetch total assigned patients count for doctors
  useEffect(() => {
    if (!user || profile?.role !== "doctor") return;

    const fetchAssignedCount = async () => {
      const { count } = await supabase
        .from("doctor_patient_assignments")
        .select("id", { count: "exact", head: true })
        .eq("doctor_id", user.id)
        .eq("is_active", true);
      setTotalAssigned(count || 0);
    };

    fetchAssignedCount();

    const channel = supabase
      .channel("doctor-assigned-count")
      .on("postgres_changes", { event: "*", schema: "public", table: "doctor_patient_assignments" }, () => fetchAssignedCount())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, profile]);

  // Fetch published health status for patients
  useEffect(() => {
    if (!user || profile?.role === "doctor") return;

    const fetchHealthStatus = async () => {
      const { data } = await supabase
        .from("patients")
        .select("published_risk_level, published_mortality_probability, published_sepsis_stage, published_at, published_recommendations")
        .eq("user_id", user.id)
        .not("published_risk_level", "is", null)
        .order("published_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) {
        setHealthStatus({
          risk_level: data.published_risk_level,
          mortality: data.published_mortality_probability,
          stage: data.published_sepsis_stage,
          updated: data.published_at,
          recommendations: data.published_recommendations,
        });
      }
    };

    fetchHealthStatus();

    // Realtime: refresh when patient data changes (e.g., doctor publishes health status)
    const channel = supabase
      .channel("patient-health-status")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "patients", filter: `user_id=eq.${user.id}` }, () => fetchHealthStatus())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, profile]);

  const scrollToPatients = () => {
    patientListRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  useEffect(() => {
    const handler = () => scrollToPatients();
    window.addEventListener("scroll-to-patients", handler);
    return () => window.removeEventListener("scroll-to-patients", handler);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Activity className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const isDoctor = profile?.role === "doctor";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Background - Enhanced visibility */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10" />
        <div className="absolute inset-0 medical-grid opacity-30" />
      </div>

      <Navbar />
      
      <main className="container py-12 md:py-20 flex-1 relative z-10 max-w-7xl">
        {/* Role-specific Header */}
        {isDoctor ? <DoctorHeader /> : <PatientHeader />}

        {/* Doctor Dashboard */}
        {isDoctor ? (
          <>
            {/* Stats Grid - Pro Max */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 mb-12">
              <button type="button" onClick={scrollToPatients} className="text-left">
                <GlassCard className="p-8 md:p-10 group hover:scale-105 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/20 cursor-pointer" variant="elevated">
                  <div className="flex flex-col gap-4">
                    <div className="h-16 w-16 rounded-2xl bg-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                      <Users className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <p className="text-4xl md:text-5xl font-bold">{totalAssigned}</p>
                      <p className="text-base md:text-lg text-muted-foreground mt-1">Total Patients</p>
                    </div>
                  </div>
                </GlassCard>
              </button>

              <GlassCard className="p-8 md:p-10 group hover:scale-105 transition-all duration-300 hover:shadow-2xl hover:shadow-danger/20" variant="elevated">
                <div className="flex flex-col gap-4">
                  <div className="h-16 w-16 rounded-2xl bg-danger/20 flex items-center justify-center group-hover:scale-110 transition-transform animate-pulse shadow-lg shadow-danger/30">
                    <AlertTriangle className="h-8 w-8 text-danger" />
                  </div>
                  <div>
                    <p className="text-4xl md:text-5xl font-bold text-danger">{mockStats.highRisk}</p>
                    <p className="text-base md:text-lg text-muted-foreground mt-1">High Risk</p>
                  </div>
                </div>
              </GlassCard>

              <GlassCard className="p-8 md:p-10 group hover:scale-105 transition-all duration-300 hover:shadow-2xl hover:shadow-success/20" variant="elevated">
                <div className="flex flex-col gap-4">
                  <div className="h-16 w-16 rounded-2xl bg-success/20 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                    <TrendingUp className="h-8 w-8 text-success" />
                  </div>
                  <div>
                    <p className="text-4xl md:text-5xl font-bold text-success">{mockStats.avgAccuracy}%</p>
                    <p className="text-base md:text-lg text-muted-foreground mt-1">Model Accuracy</p>
                  </div>
                </div>
              </GlassCard>

              <GlassCard className="p-8 md:p-10 group hover:scale-105 transition-all duration-300 hover:shadow-2xl hover:shadow-secondary/20" variant="elevated">
                <div className="flex flex-col gap-4">
                  <div className="h-16 w-16 rounded-2xl bg-secondary/20 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                    <Brain className="h-8 w-8 text-secondary" />
                  </div>
                  <div>
                    <p className="text-4xl md:text-5xl font-bold">{mockStats.predictionsToday}</p>
                    <p className="text-base md:text-lg text-muted-foreground mt-1">Predictions Today</p>
                  </div>
                </div>
              </GlassCard>
            </div>

            {/* New Patients Queue */}
            <div className="mb-8">
              <NewPatientsQueue />
            </div>

            {/* Messages from Patients */}
            <div className="mb-8">
              <MessagesInbox />
            </div>

            {/* Patient List */}
            <div className="mb-8 scroll-mt-24" ref={patientListRef}>
              <PatientList />
            </div>

            {/* Quick Actions - Pro Max */}
            <div className="grid md:grid-cols-3 gap-6 md:gap-8">
              <Link to="/patient-entry">
                <GlassCard className="p-10 group cursor-pointer h-full hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/20 transition-all duration-300" variant="elevated">
                  <FileText className="h-14 w-14 text-primary mb-6 group-hover:scale-110 transition-transform" />
                  <h3 className="text-xl md:text-2xl font-semibold mb-3">Add Patient Data</h3>
                  <p className="text-base md:text-lg text-muted-foreground">
                    Enter clinical data for a new patient assessment
                  </p>
                </GlassCard>
              </Link>
              <Link to="/predictions">
                <GlassCard className="p-10 group cursor-pointer h-full hover:border-secondary/50 hover:shadow-2xl hover:shadow-secondary/20 transition-all duration-300" variant="elevated">
                  <Brain className="h-14 w-14 text-secondary mb-6 group-hover:scale-110 transition-transform" />
                  <h3 className="text-xl md:text-2xl font-semibold mb-3">Run Prediction</h3>
                  <p className="text-base md:text-lg text-muted-foreground">
                    Generate mortality risk predictions for patients
                  </p>
                </GlassCard>
              </Link>
              <Link to="/shap">
                <GlassCard className="p-10 group cursor-pointer h-full hover:border-success/50 hover:shadow-2xl hover:shadow-success/20 transition-all duration-300" variant="elevated">
                  <TrendingUp className="h-14 w-14 text-success mb-6 group-hover:scale-110 transition-transform" />
                  <h3 className="text-xl md:text-2xl font-semibold mb-3">SHAP Analysis</h3>
                  <p className="text-base md:text-lg text-muted-foreground">
                    Understand feature contributions to predictions
                  </p>
                </GlassCard>
              </Link>
            </div>
          </>
        ) : (
          /* Patient Dashboard */
          <>
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <GlassCard className="p-6 md:p-8" variant="elevated">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center">
                      <Stethoscope className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold">Your Health Status</h2>
                      <p className="text-muted-foreground">
                        {healthStatus.updated
                          ? `Last updated: ${new Date(healthStatus.updated).toLocaleDateString()}`
                          : "Awaiting doctor review"}
                      </p>
                    </div>
                  </div>
                  {healthStatus.risk_level && (
                    <HealthStatusPDF
                      patientName={profile?.full_name || "Patient"}
                      healthStatus={healthStatus}
                    />
                  )}
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 rounded-lg bg-muted/30 border border-border/50">
                    <span className="text-muted-foreground">Current Risk Level</span>
                    {healthStatus.risk_level ? (
                      <RiskBadge level={healthStatus.risk_level as any} />
                    ) : (
                      <span className="text-sm text-muted-foreground italic">Pending</span>
                    )}
                  </div>
                  {healthStatus.mortality !== null && (
                    <div className="flex justify-between items-center p-4 rounded-lg bg-muted/30 border border-border/50">
                      <span className="text-muted-foreground">Mortality Risk</span>
                      <span className="font-semibold">{healthStatus.mortality.toFixed(1)}%</span>
                    </div>
                  )}
                  {healthStatus.stage && (
                    <div className="flex justify-between items-center p-4 rounded-lg bg-muted/30 border border-border/50">
                      <span className="text-muted-foreground">Sepsis Stage</span>
                      <span className="font-semibold capitalize">{healthStatus.stage}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center p-4 rounded-lg bg-success/10 border border-success/30">
                    <span className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-success" />
                      <span className="text-muted-foreground">Data Protected</span>
                    </span>
                    <span className="text-success text-sm">HIPAA Compliant</span>
                  </div>
                </div>
              </GlassCard>

              {/* Appointments */}
              <PatientAppointments />
            </div>

            <div className="mb-8">
              <GlassCard className="p-6 md:p-8" variant="elevated">
                <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
                <div className="space-y-3">
                  <Link to="/patient-entry">
                    <Button className="w-full justify-start gap-3 h-12" variant="outline">
                      <FileText className="h-5 w-5" />
                      Submit New Health Data
                    </Button>
                  </Link>
                  <SubmissionHistoryDialog />
                </div>
              </GlassCard>
            </div>

            {/* Messages from Doctor */}
            <div className="mb-8">
              <MessagesInbox />
            </div>

            {/* Educational Content */}
            <GlassCard className="p-6 md:p-8">
              <h2 className="text-xl font-semibold mb-4">Understanding Sepsis</h2>
              <div className="max-w-none">
                <p className="text-muted-foreground">
                  Sepsis is a life-threatening condition caused by the body's severe response to infection. 
                  Early detection and treatment are crucial for better outcomes. Our AI-powered system 
                  helps healthcare providers identify high-risk patients quickly.
                </p>
                <div className="grid md:grid-cols-3 gap-4 mt-6">
                  <div className="p-5 rounded-lg bg-danger/10 border border-danger/30 hover:bg-danger/15 transition-colors">
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-danger" />
                      Warning Signs
                    </h4>
                    <ul className="text-sm text-muted-foreground space-y-2">
                      <li>• High fever or low temperature</li>
                      <li>• Rapid heart rate</li>
                      <li>• Difficulty breathing</li>
                    </ul>
                  </div>
                  <div className="p-5 rounded-lg bg-warning/10 border border-warning/30 hover:bg-warning/15 transition-colors">
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Activity className="h-4 w-4 text-warning" />
                      Risk Factors
                    </h4>
                    <ul className="text-sm text-muted-foreground space-y-2">
                      <li>• Age over 65</li>
                      <li>• Weakened immune system</li>
                      <li>• Chronic conditions</li>
                    </ul>
                  </div>
                  <div className="p-5 rounded-lg bg-success/10 border border-success/30 hover:bg-success/15 transition-colors">
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Shield className="h-4 w-4 text-success" />
                      Prevention
                    </h4>
                    <ul className="text-sm text-muted-foreground space-y-2">
                      <li>• Practice good hygiene</li>
                      <li>• Stay up to date on vaccines</li>
                      <li>• Manage chronic conditions</li>
                    </ul>
                  </div>
                </div>
              </div>
            </GlassCard>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
