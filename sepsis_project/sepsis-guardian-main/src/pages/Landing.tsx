import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { GlassmorphicCard } from "@/components/ui/GlassmorphicCard";
import { AnimatedBackground } from "@/components/ui/AnimatedBackground";
import { FloatingIcons } from "@/components/ui/FloatingIcons";
import { PageTransition } from "@/components/ui/PageTransition";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { Footer } from "@/components/layout/Footer";
import { 
  Activity, 
  Brain, 
  Shield, 
  ChartLine, 
  Users, 
  Clock,
  ArrowRight,
  Stethoscope,
  HeartPulse,
  CheckCircle2,
  Zap,
  Eye,
  FileText,
} from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import heroImage from "@/assets/hero-medical.jpg";

const features = [
  {
    icon: Brain,
    title: "AI-Powered Predictions",
    description: "Advanced machine learning models trained on thousands of ICU records for accurate mortality risk assessment.",
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    icon: ChartLine,
    title: "SHAP Explainability",
    description: "Transparent AI decisions with feature contribution analysis to support clinical reasoning.",
    color: "text-secondary",
    bg: "bg-secondary/10",
  },
  {
    icon: Clock,
    title: "Early Detection",
    description: "Identify high-risk patients early with real-time predictions and stage classification.",
    color: "text-success",
    bg: "bg-success/10",
  },
  {
    icon: Shield,
    title: "Clinical Safety",
    description: "HIPAA-compliant design with role-based access control and audit logging.",
    color: "text-warning",
    bg: "bg-warning/10",
  },
];

const stats = [
  { value: "91%", label: "Accuracy", icon: CheckCircle2 },
  { value: "0.94", label: "AUC Score", icon: ChartLine },
  { value: "38+", label: "Clinical Features", icon: Activity },
  { value: "24/7", label: "Monitoring", icon: Eye },
];

const benefits = [
  "Real-time sepsis mortality risk predictions",
  "Explainable AI with SHAP analysis",
  "Role-based dashboards for doctors and patients",
  "Automated emergency alerts and notifications",
  "Medical report PDF extraction",
  "Secure doctor-patient messaging",
];

export default function Landing() {
  return (
    <PageTransition>
      <div className="relative min-h-screen flex flex-col overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 z-0">
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-20"
            style={{ backgroundImage: `url(${heroImage})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/90 via-background/85 to-background" />
        </div>
        
        <AnimatedBackground variant="particles" intensity="low" />
        <FloatingIcons variant="subtle" />

      {/* Header */}
      <header className="relative z-10 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="h-9 w-9 rounded-lg gradient-bg flex items-center justify-center group-hover:scale-110 transition-transform">
              <Activity className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold gradient-text">S.E.P.S.I.S</span>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link to="/auth">
              <Button variant="outline" className="gap-2">
                Sign In
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

        {/* Hero Section */}
        <section className="relative z-10 container pt-20 md:pt-32 lg:pt-40 pb-24 md:pb-40 lg:pb-48 flex-1">
          <div className="max-w-6xl mx-auto text-center space-y-10 md:space-y-12">
            <ScrollReveal direction="fade" delay={100}>
              <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-primary/10 border border-primary/20 text-primary text-base md:text-lg">
                <Zap className="h-5 w-5" />
                <span>Smart Early Prediction System for ICU Sepsis</span>
              </div>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={200}>
              <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold leading-tight tracking-tight">
                <span className="gradient-text">S.E.P.S.I.S</span>
                <br />
                <span className="text-foreground/90">Saving Lives Through</span>
                <br />
                <span className="text-foreground/90">Early Detection</span>
              </h1>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={300}>
              <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Advanced AI-powered sepsis mortality prediction system designed for ICU clinicians. 
                Combining machine learning with clinical expertise for better patient outcomes.
              </p>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={400}>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-8">
                <Link to="/auth?mode=signup&role=patient">
                  <Button size="lg" className="gradient-bg gap-3 text-xl px-10 h-16 shadow-xl shadow-primary/25 hover:shadow-primary/40 hover:scale-105 transition-all">
                    <Users className="h-6 w-6" />
                    Patient Portal
                    <ArrowRight className="h-6 w-6" />
                  </Button>
                </Link>
                <Link to="/auth?mode=signin&role=doctor">
                  <Button size="lg" variant="outline" className="gap-3 text-xl px-10 h-16 border-primary/30 hover:bg-primary/10 hover:scale-105 transition-all">
                    <Stethoscope className="h-6 w-6" />
                    Doctor Login
                  </Button>
                </Link>
              </div>
            </ScrollReveal>
          </div>

          {/* Stats */}
          <div className="mt-20 md:mt-32 grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 max-w-5xl mx-auto">
            {stats.map((stat, i) => (
              <ScrollReveal key={i} direction="up" delay={500 + i * 100}>
                <GlassmorphicCard 
                  className="p-6 md:p-8 text-center" 
                  variant="glow"
                >
                  <stat.icon className="h-6 w-6 mx-auto mb-3 text-primary opacity-60 group-hover:opacity-100 transition-opacity" />
                  <div className="text-3xl md:text-5xl font-bold gradient-text">{stat.value}</div>
                  <div className="text-base text-muted-foreground mt-2">{stat.label}</div>
                </GlassmorphicCard>
              </ScrollReveal>
            ))}
          </div>
        </section>

        {/* Features Section */}
        <section className="relative z-10 container py-24 md:py-36 border-t border-border/50">
          <ScrollReveal direction="up">
            <div className="text-center mb-16 md:mb-24">
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                Powered by <span className="gradient-text">Advanced AI</span>
              </h2>
              <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Our system leverages state-of-the-art machine learning algorithms to provide 
                accurate, explainable predictions for sepsis mortality risk.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, i) => (
              <ScrollReveal key={i} direction="up" delay={i * 100}>
                <GlassmorphicCard 
                  className="p-8 md:p-10 cursor-pointer h-full" 
                  variant="border-glow"
                >
                  <div className={`h-16 w-16 rounded-2xl ${feature.bg} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                    <feature.icon className={`h-8 w-8 ${feature.color}`} />
                  </div>
                  <h3 className="text-xl font-semibold mb-4">{feature.title}</h3>
                  <p className="text-base text-muted-foreground leading-relaxed">{feature.description}</p>
                </GlassmorphicCard>
              </ScrollReveal>
            ))}
          </div>
        </section>

        {/* Benefits Section */}
        <section className="relative z-10 container py-24 md:py-36">
          <div className="grid md:grid-cols-2 gap-16 lg:gap-24 items-center max-w-7xl mx-auto">
            <ScrollReveal direction="left">
              <div>
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-8">
                  Why Choose <span className="gradient-text">S.E.P.S.I.S</span>?
                </h2>
                <p className="text-lg md:text-xl text-muted-foreground mb-10 leading-relaxed">
                  Our platform combines cutting-edge AI technology with clinical expertise to provide 
                  healthcare professionals with the tools they need to make informed decisions quickly.
                </p>
                <ul className="space-y-5">
                  {benefits.map((benefit, i) => (
                    <li key={i} className="flex items-center gap-4 group">
                      <div className="h-8 w-8 rounded-full bg-success/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <CheckCircle2 className="h-5 w-5 text-success" />
                      </div>
                      <span className="text-lg text-foreground/90">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </ScrollReveal>
            
            <ScrollReveal direction="right">
              <GlassmorphicCard className="p-10 md:p-14" variant="premium">
                <div className="text-center space-y-8">
                  <HeartPulse className="h-20 w-20 mx-auto text-primary animate-pulse" />
                  <h3 className="text-3xl md:text-4xl font-bold">Ready to Get Started?</h3>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    Join healthcare professionals worldwide using S.E.P.S.I.S to save lives.
                  </p>
                  <Link to="/auth">
                    <Button size="lg" className="gradient-bg gap-3 px-10 h-14 text-lg shadow-lg shadow-primary/25 hover:scale-105 transition-transform">
                      Get Started Free
                      <ArrowRight className="h-6 w-6" />
                    </Button>
                  </Link>
                </div>
              </GlassmorphicCard>
            </ScrollReveal>
          </div>
        </section>

        <Footer />
      </div>
    </PageTransition>
  );
}
