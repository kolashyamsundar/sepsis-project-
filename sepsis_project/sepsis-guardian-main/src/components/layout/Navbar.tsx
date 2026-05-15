import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Activity, LogOut, User, LayoutDashboard, FileText, Brain, AlertTriangle, Menu } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Navbar() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/", { replace: true });
  };

  const isDoctor = profile?.role === "doctor";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/90 backdrop-blur-xl">
      <div className="container flex h-18 py-3 items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="relative">
            <div className="h-10 w-10 rounded-xl gradient-bg flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-primary/20">
              <Activity className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-success border-2 border-background animate-pulse" />
          </div>
          <span className="text-xl font-bold hidden sm:block">
            <span className="gradient-text">S.E.P.S.I.S</span>
          </span>
        </Link>

        {user && (
          <nav className="hidden lg:flex items-center gap-1">
            <Link to="/dashboard">
              <Button variant="ghost" size="sm" className="gap-2 h-10 px-4 hover:bg-primary/10 hover:text-primary">
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Button>
            </Link>
            <Link to="/patient-entry">
              <Button variant="ghost" size="sm" className="gap-2 h-10 px-4 hover:bg-primary/10 hover:text-primary">
                <FileText className="h-4 w-4" />
                Patient Data
              </Button>
            </Link>
            {isDoctor && (
              <>
                <Link to="/predictions">
                  <Button variant="ghost" size="sm" className="gap-2 h-10 px-4 hover:bg-secondary/10 hover:text-secondary">
                    <Brain className="h-4 w-4" />
                    Predictions
                  </Button>
                </Link>
                <Link to="/shap">
                  <Button variant="ghost" size="sm" className="gap-2 h-10 px-4 hover:bg-success/10 hover:text-success">
                    <AlertTriangle className="h-4 w-4" />
                    SHAP Analysis
                  </Button>
                </Link>
              </>
            )}
          </nav>
        )}

        <div className="flex items-center gap-3">
          {/* Theme Toggle - Always visible */}
          <ThemeToggle />
          
          {user ? (
            <>
              {/* Notification Bell */}
              <NotificationBell />

              {/* User Info - Desktop */}
              <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-muted/50 border border-border/50">
                <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <div className="hidden lg:block">
                  <p className="text-sm font-medium leading-tight">
                    {profile?.full_name || "User"}
                  </p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {profile?.role || "user"}
                  </p>
                </div>
              </div>

              {/* Mobile Menu */}
              <div className="lg:hidden">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Menu className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => navigate("/dashboard")}>
                      <LayoutDashboard className="h-4 w-4 mr-2" />
                      Dashboard
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/patient-entry")}>
                      <FileText className="h-4 w-4 mr-2" />
                      Patient Data
                    </DropdownMenuItem>
                    {isDoctor && (
                      <>
                        <DropdownMenuItem onClick={() => navigate("/predictions")}>
                          <Brain className="h-4 w-4 mr-2" />
                          Predictions
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate("/shap")}>
                          <AlertTriangle className="h-4 w-4 mr-2" />
                          SHAP Analysis
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Sign Out - Desktop */}
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleSignOut} 
                className="hidden lg:flex hover:bg-destructive/10 hover:text-destructive"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Link to="/auth">
              <Button className="gradient-bg shadow-lg shadow-primary/20 h-10 px-6">
                Sign In
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
