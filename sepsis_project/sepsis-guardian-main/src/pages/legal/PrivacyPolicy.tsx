import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { GlassCard } from "@/components/ui/GlassCard";
import { Shield } from "lucide-react";

export default function PrivacyPolicy() {
  const updated = "April 2026";
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="container max-w-4xl py-12 md:py-20 flex-1">
        <GlassCard className="p-8 md:p-12" variant="elevated">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-3xl md:text-4xl font-bold">Privacy Policy</h1>
          </div>
          <p className="text-sm text-muted-foreground mb-8">Last updated: {updated}</p>

          <div className="space-y-6 text-muted-foreground leading-relaxed">
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-2">1. Overview</h2>
              <p>
                S.E.P.S.I.S ("we", "us") is a clinical decision support tool that processes
                patient health data to assist doctors with sepsis risk prediction. This policy
                explains how we collect, use, store, and protect health information.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-2">2. Information We Collect</h2>
              <ul className="list-disc pl-6 space-y-1">
                <li>Account data (name, email, role, phone)</li>
                <li>Clinical parameters submitted by patients or doctors (vitals, labs, history)</li>
                <li>ML predictions, SHAP values, and audit metadata</li>
                <li>Technical data (browser, IP, timestamps) for security and reliability</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-2">3. How We Use Data</h2>
              <p>
                Health data is used solely to deliver clinical decision support, generate risk
                predictions, and enable doctor–patient communication within the platform. We do
                not sell health information.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-2">4. Data Protection</h2>
              <p>
                Data is encrypted in transit (TLS) and at rest. Access is restricted via
                row-level security so only authorized doctors and the originating patient can
                view a record. Authentication uses industry-standard hashing and short-lived
                session tokens.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-2">5. ML Predictions Disclaimer</h2>
              <p>
                Predictions are statistical estimates and support clinical decision-making. They
                do not replace physician judgment, diagnosis, or treatment.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-2">6. Your Rights</h2>
              <p>
                You may request access to, correction of, or deletion of your personal data by
                contacting your treating physician or our support team.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-2">7. Contact</h2>
              <p>
                For privacy questions, email <a className="text-primary hover:underline" href="mailto:shyamsundarkola2005@gmail.com">shyamsundarkola2005@gmail.com</a>.
              </p>
            </section>
          </div>
        </GlassCard>
      </main>
      <Footer />
    </div>
  );
}
