import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { GlassCard } from "@/components/ui/GlassCard";
import { Shield } from "lucide-react";

export default function Hipaa() {
  const updated = "April 2026";
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="container max-w-4xl py-12 md:py-20 flex-1">
        <GlassCard className="p-8 md:p-12" variant="elevated">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="h-8 w-8 text-success" />
            <h1 className="text-3xl md:text-4xl font-bold">HIPAA Compliance</h1>
          </div>
          <p className="text-sm text-muted-foreground mb-8">Last updated: {updated}</p>

          <div className="space-y-6 text-muted-foreground leading-relaxed">
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-2">Our Commitment</h2>
              <p>
                S.E.P.S.I.S follows HIPAA-aligned safeguards to protect Protected Health
                Information (PHI). Access is restricted to authorized doctors and the patient
                who owns the record.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-2">Administrative Safeguards</h2>
              <ul className="list-disc pl-6 space-y-1">
                <li>Role-based access (doctor / patient) enforced server-side.</li>
                <li>Audit logs for sensitive operations.</li>
                <li>Periodic review of access policies.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-2">Technical Safeguards</h2>
              <ul className="list-disc pl-6 space-y-1">
                <li>TLS encryption in transit; encryption at rest.</li>
                <li>Row-level security on all PHI tables.</li>
                <li>Strong password policies and short-lived sessions.</li>
                <li>Rate limiting and lockout on authentication endpoints.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-2">Physical Safeguards</h2>
              <p>
                Data is hosted in certified cloud infrastructure with physical access controls,
                redundancy, and disaster recovery.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-2">Breach Notification</h2>
              <p>
                In the unlikely event of a breach affecting PHI, affected users will be notified
                in accordance with applicable regulations.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-2">Contact</h2>
              <p>
                Compliance inquiries: <a className="text-primary hover:underline" href="mailto:shyamsundarkola2005@gmail.com">shyamsundarkola2005@gmail.com</a>.
              </p>
            </section>
          </div>
        </GlassCard>
      </main>
      <Footer />
    </div>
  );
}
