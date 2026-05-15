import { Activity, Heart, Shield, Mail, Phone, MapPin, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";

export function Footer() {
  const currentYear = new Date().getFullYear();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="relative border-t border-border/50 bg-card/50 backdrop-blur-xl">
      {/* Decorative gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent pointer-events-none" />
      
      <div className="container relative py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="space-y-5">
            <Link to="/" onClick={scrollToTop} className="flex items-center gap-2 group">
              <div className="h-11 w-11 rounded-xl gradient-bg flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-primary/20">
                <Activity className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="text-2xl font-bold gradient-text">S.E.P.S.I.S</span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Smart Early Prediction System for ICU Sepsis. Advanced AI-powered mortality risk prediction saving lives through early detection.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors cursor-pointer">
                <Shield className="h-4 w-4 text-primary" />
              </div>
              <span className="text-xs text-muted-foreground">HIPAA Compliant</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-5 text-lg">Quick Links</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link to="/dashboard" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 group">
                  <span className="h-1 w-1 rounded-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                  Dashboard
                </Link>
              </li>
              <li>
                <Link to="/patient-entry" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 group">
                  <span className="h-1 w-1 rounded-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                  Patient Data Entry
                </Link>
              </li>
              <li>
                <Link to="/predictions" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 group">
                  <span className="h-1 w-1 rounded-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                  Run Predictions
                </Link>
              </li>
              <li>
                <Link to="/shap" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 group">
                  <span className="h-1 w-1 rounded-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                  SHAP Analysis
                </Link>
              </li>
              <li>
                <Link to="/auth" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 group">
                  <span className="h-1 w-1 rounded-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                  Sign In / Register
                </Link>
              </li>
            </ul>
          </div>

          {/* Features */}
          <div>
            <h4 className="font-semibold mb-5 text-lg">Platform Features</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-3 text-muted-foreground">
                <Heart className="h-4 w-4 text-danger shrink-0" />
                <span>Mortality Risk Prediction</span>
              </li>
              <li className="flex items-center gap-3 text-muted-foreground">
                <Activity className="h-4 w-4 text-primary shrink-0" />
                <span>Real-time Patient Monitoring</span>
              </li>
              <li className="flex items-center gap-3 text-muted-foreground">
                <Shield className="h-4 w-4 text-success shrink-0" />
                <span>Secure Data Protection</span>
              </li>
              <li className="flex items-center gap-3 text-muted-foreground">
                <ExternalLink className="h-4 w-4 text-secondary shrink-0" />
                <span>SHAP Explainability</span>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-5 text-lg">Contact Us</h4>
            <ul className="space-y-4 text-sm">
              <li className="flex items-start gap-3 text-muted-foreground">
                <Mail className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <div>
                  <a href="mailto:shyamsundarkola2005@gmail.com" className="hover:text-primary transition-colors">
                    shyamsundarkola2005@gmail.com
                  </a>
                  <p className="text-xs mt-0.5 opacity-70">General inquiries</p>
                </div>
              </li>
              <li className="flex items-start gap-3 text-muted-foreground">
                <Phone className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <div>
                  <a href="tel:+918599050535" className="hover:text-primary transition-colors">
                    +91 8599050535
                  </a>
                  <p className="text-xs mt-0.5 opacity-70">24/7 Support</p>
                </div>
              </li>
              <li className="flex items-start gap-3 text-muted-foreground">
                <MapPin className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <div>
                  <span>Gayatri Vidya Parishad</span>
                  <p className="text-xs mt-0.5 opacity-70">Healthcare Innovation Hub</p>
                </div>
              </li>
            </ul>
            <div className="mt-5 p-3 rounded-lg bg-warning/10 border border-warning/20">
              <p className="text-xs text-warning">
                For medical emergencies, contact your local emergency services immediately.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-border/50 flex flex-col lg:flex-row items-center justify-between gap-6">
          <p className="text-sm text-muted-foreground text-center lg:text-left">
            © {currentYear} S.E.P.S.I.S - Smart Early Prediction System for ICU Sepsis. For clinical research purposes.
          </p>
          <div className="flex items-center flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <Link to="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
            <span className="hidden sm:inline">•</span>
            <Link to="/terms" className="hover:text-primary transition-colors">Terms of Service</Link>
            <span className="hidden sm:inline">•</span>
            <Link to="/hipaa" className="hover:text-primary transition-colors">HIPAA Compliance</Link>
            <span className="hidden sm:inline">•</span>
            <Link to="/auth" className="hover:text-primary transition-colors">Doctor Portal</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
