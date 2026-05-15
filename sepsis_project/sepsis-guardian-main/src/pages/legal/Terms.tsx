import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { GlassCard } from "@/components/ui/GlassCard";
import { FileText } from "lucide-react";

export default function Terms() {
  const updated = "April 2026";
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="container max-w-4xl py-12 md:py-20 flex-1">
        <GlassCard className="p-8 md:p-12" variant="elevated">
          <div className="flex items-center gap-3 mb-6">
            <FileText className="h-8 w-8 text-primary" />
            <h1 className="text-3xl md:text-4xl font-bold">Terms of Service</h1>
          </div>
          <p className="text-sm text-muted-foreground mb-8">Last updated: {updated}</p>

          <div className="space-y-6 text-muted-foreground leading-relaxed">
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-2">1. Acceptance</h2>
              <p>
                By accessing S.E.P.S.I.S you agree to these Terms. If you do not agree, do not
                use the service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-2">2. Clinical Use</h2>
              <p>
                S.E.P.S.I.S is a clinical decision support tool intended to assist licensed
                healthcare professionals. It does not replace physician judgment, diagnosis, or
                treatment. Patients should not rely on it for self-diagnosis.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-2">3. Accounts</h2>
              <p>
                You are responsible for safeguarding your account credentials and for all
                activity under your account. Notify us immediately of unauthorized use.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-2">4. Acceptable Use</h2>
              <ul className="list-disc pl-6 space-y-1">
                <li>Do not submit data on behalf of a patient without authorization.</li>
                <li>Do not attempt to bypass authentication or row-level security.</li>
                <li>Do not use the service for any unlawful or harmful purpose.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-2">5. Disclaimer of Warranties</h2>
              <p>
                The service is provided "as is" without warranties of any kind. Predictions are
                statistical estimates and may be inaccurate. Always confirm with clinical
                workup.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-2">6. Limitation of Liability</h2>
              <p>
                To the maximum extent permitted by law, S.E.P.S.I.S and its operators shall not
                be liable for indirect, incidental, or consequential damages arising from use of
                the service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-2">7. Changes</h2>
              <p>
                We may update these Terms from time to time. Continued use after changes
                constitutes acceptance.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-2">8. Contact</h2>
              <p>
                Questions: <a className="text-primary hover:underline" href="mailto:shyamsundarkola2005@gmail.com">shyamsundarkola2005@gmail.com</a>.
              </p>
            </section>
          </div>
        </GlassCard>
      </main>
      <Footer />
    </div>
  );
}
