import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  role: "patient" | "doctor";
  phone: string | null;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string, role: "patient" | "doctor", phone?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
        return null;
      }
      return data as Profile;
    } catch (err) {
      console.error("Error in fetchProfile:", err);
      return null;
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setTimeout(() => {
            fetchProfile(session.user.id).then(setProfile);
          }, 0);
        } else {
          setProfile(null);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id).then(setProfile);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const getReadableError = (error: any): string => {
    const msg = error?.message || String(error);
    if (msg === "Failed to fetch" || msg.includes("NetworkError") || msg.includes("fetch")) {
      return "Network error — please check your internet connection and try again.";
    }
    if (msg.includes("Invalid login credentials")) {
      return "Incorrect email or password. Please try again.";
    }
    if (msg.includes("Email not confirmed")) {
      return "Please verify your email before signing in. Check your inbox.";
    }
    if (msg.includes("rate limit") || msg.includes("too many")) {
      return "Too many attempts. Please wait a moment and try again.";
    }
    return msg;
  };

  const signUp = async (email: string, password: string, fullName: string, role: "patient" | "doctor", phone?: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName,
            role: role,
            phone: phone,
          },
        },
      });

      if (error) {
        toast({
          title: "Registration Failed",
          description: getReadableError(error),
          variant: "destructive",
        });
        return { error };
      }

      toast({
        title: "Account Created",
        description: "Welcome to S.E.P.S.I.S! You can now sign in.",
      });

      return { error: null };
    } catch (err) {
      const error = err as Error;
      toast({
        title: "Registration Failed",
        description: getReadableError(error),
        variant: "destructive",
      });
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast({
          title: "Sign In Failed",
          description: getReadableError(error),
          variant: "destructive",
        });
        return { error };
      }

      toast({
        title: "Welcome Back",
        description: "Successfully signed in to S.E.P.S.I.S",
      });

      return { error: null };
    } catch (err) {
      const error = err as Error;
      toast({
        title: "Sign In Failed",
        description: getReadableError(error),
        variant: "destructive",
      });
      return { error };
    }
  };

  const signOut = async () => {
    // Clear local state immediately
    setUser(null);
    setSession(null);
    setProfile(null);

    try {
      // Global sign out invalidates the refresh token across devices
      await supabase.auth.signOut({ scope: "global" });
    } catch (e) {
      // Fallback: at least clear local tokens
      try { await supabase.auth.signOut({ scope: "local" }); } catch {}
    }

    // Aggressively clear any persisted auth tokens
    try {
      Object.keys(localStorage).forEach((k) => {
        if (k.startsWith("sb-") || k.includes("supabase")) localStorage.removeItem(k);
      });
      sessionStorage.clear();
    } catch {}

    toast({
      title: "Signed Out",
      description: "You have been signed out successfully.",
    });

    // Force a clean reload to drop any in-memory cached data
    window.location.replace("/auth");
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
