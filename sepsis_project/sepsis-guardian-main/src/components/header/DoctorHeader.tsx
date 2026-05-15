import { useState, useEffect } from "react";
import { Users, Brain, AlertTriangle, Activity, Clock, Stethoscope, FileSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/GlassCard";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface DoctorStats {
  totalPatients: number;
  criticalPatients: number;
  pendingReviews: number;
  todayPredictions: number;
}

export function DoctorHeader() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DoctorStats>({
    totalPatients: 0,
    criticalPatients: 0,
    pendingReviews: 0,
    todayPredictions: 0,
  });

  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    fetchStats();

    // Keep stats live with the same data sources used elsewhere
    const channel = supabase
      .channel("doctor-header-stats")
      .on("postgres_changes", { event: "*", schema: "public", table: "doctor_patient_assignments" }, () => fetchStats())
      .on("postgres_changes", { event: "*", schema: "public", table: "patients" }, () => fetchStats())
      .on("postgres_changes", { event: "*", schema: "public", table: "predictions" }, () => fetchStats())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const fetchStats = async () => {
    if (!user) return;
    try {
      // SINGLE SOURCE OF TRUTH: this doctor's active assignments
      const { data: assignments } = await supabase
        .from("doctor_patient_assignments")
        .select("patient_id")
        .eq("doctor_id", user.id)
        .eq("is_active", true);

      const assignedIds = (assignments || []).map((a) => a.patient_id);
      const totalPatients = assignedIds.length;

      let criticalCount = 0;
      let pending = 0;

      if (assignedIds.length > 0) {
        // Critical patients among assigned
        const { data: criticalData } = await supabase
          .from("patients")
          .select("id")
          .in("id", assignedIds)
          .or("lactate.gt.4,heart_rate.gt.130,heart_rate.lt.45");
        criticalCount = criticalData?.length || 0;

        // Pending reviews: assigned patients without predictions
        const { data: predictedPatients } = await supabase
          .from("predictions")
          .select("patient_id")
          .in("patient_id", assignedIds);
        const predictedIds = new Set(predictedPatients?.map((p) => p.patient_id) || []);
        pending = assignedIds.filter((id) => !predictedIds.has(id)).length;
      }

      // Today's predictions made by this doctor
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { count: todayPredictions } = await supabase
        .from("predictions")
        .select("*", { count: "exact", head: true })
        .eq("predicted_by", user.id)
        .gte("created_at", today.toISOString());

      setStats({
        totalPatients,
        criticalPatients: criticalCount,
        pendingReviews: pending,
        todayPredictions: todayPredictions || 0,
      });
    } catch (error) {
      console.error("Error fetching doctor stats:", error);
    }
  };

  const quickActions = [
    {
      icon: Brain,
      label: "Run Prediction",
      description: "Analyze patient data",
      onClick: () => navigate("/predictions"),
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      icon: FileSearch,
      label: "SHAP Analysis",
      description: "Explainable AI insights",
      onClick: () => navigate("/shap"),
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      icon: Users,
      label: "Patient List",
      description: "View assigned patients",
      onClick: () => {
        window.dispatchEvent(new CustomEvent("scroll-to-patients"));
      },
      color: "text-secondary",
      bgColor: "bg-secondary/10",
    },
    {
      icon: AlertTriangle,
      label: "Critical Alerts",
      description: `${stats.criticalPatients} require attention`,
      onClick: () => {
        window.dispatchEvent(new CustomEvent("scroll-to-patients"));
      },
      color: "text-danger",
      bgColor: "bg-danger/10",
    },
  ];

  const statCards = [
    {
      label: "Total Patients",
      value: stats.totalPatients,
      icon: Users,
      color: "text-primary",
    },
    {
      label: "Critical Cases",
      value: stats.criticalPatients,
      icon: AlertTriangle,
      color: "text-danger",
    },
    {
      label: "Pending Reviews",
      value: stats.pendingReviews,
      icon: Clock,
      color: "text-warning",
    },
    {
      label: "Today's Predictions",
      value: stats.todayPredictions,
      icon: Brain,
      color: "text-success",
    },
  ];

  return (
    <div className="space-y-6 mb-8">
      <GlassCard className="p-6" variant="elevated">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl gradient-bg flex items-center justify-center shadow-lg shadow-primary/30">
              <Stethoscope className="h-8 w-8 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">
                Dr. {profile?.full_name || "Doctor"}
              </h1>
              <p className="text-muted-foreground">
                Sepsis Prediction & Analysis Dashboard
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {quickActions.map((action) => (
              <Button
                key={action.label}
                variant="outline"
                className={`h-auto flex-col gap-2 p-4 ${action.bgColor} border-transparent hover:border-border transition-all`}
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
      </GlassCard>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <GlassCard key={stat.label} className="p-4">
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-lg bg-muted/50 flex items-center justify-center`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
