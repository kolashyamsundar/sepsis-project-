import { useState, useEffect, useCallback } from "react";
import { MessageSquare, Clock, Check, User, Send } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useNotificationSound } from "@/hooks/useNotificationSound";

interface Message {
  id: string;
  from_user_id: string;
  to_user_id: string;
  message: string;
  request_type: string | null;
  is_read: boolean;
  created_at: string;
  from_profile?: { full_name: string | null; role: string } | null;
}

export function MessagesInbox() {
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const { playMessage } = useNotificationSound();

  const fetchMessages = useCallback(async () => {
    if (!user) return;
    
    // Fetch messages sent to this user
    const { data, error } = await supabase
      .from("doctor_messages")
      .select("*")
      .eq("to_user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      // Fetch sender profiles for each message
      const messagesWithProfiles = await Promise.all(
        data.map(async (msg) => {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("full_name, role")
            .eq("user_id", msg.from_user_id)
            .maybeSingle();
          
          return { ...msg, from_profile: profileData };
        })
      );
      setMessages(messagesWithProfiles);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!user) return;

    fetchMessages();

    // Subscribe to real-time messages
    const channel = supabase
      .channel("messages-inbox")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "doctor_messages",
          filter: `to_user_id=eq.${user.id}`,
        },
        async (payload) => {
          const newMessage = payload.new as Message;
          
          // Fetch sender profile
          const { data: profileData } = await supabase
            .from("profiles")
            .select("full_name, role")
            .eq("user_id", newMessage.from_user_id)
            .maybeSingle();
          
          setMessages((prev) => [{ ...newMessage, from_profile: profileData }, ...prev]);
          playMessage();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, playMessage, fetchMessages]);

  const markAsRead = async (messageId: string) => {
    await supabase
      .from("doctor_messages")
      .update({ is_read: true })
      .eq("id", messageId);

    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, is_read: true } : m))
    );
  };

  const getRequestTypeLabel = (type: string | null) => {
    switch (type) {
      case "document":
        return "📄 Document Request";
      case "information":
        return "ℹ️ Information Request";
      case "patient_update":
        return "📋 Patient Update";
      default:
        return "💬 Message";
    }
  };

  const getSenderLabel = (msg: Message) => {
    const name = msg.from_profile?.full_name || "Unknown";
    const role = msg.from_profile?.role;
    
    if (role === "doctor") {
      return `Dr. ${name}`;
    } else if (role === "patient") {
      return `Patient: ${name}`;
    }
    return name;
  };

  if (loading) {
    return (
      <GlassCard className="p-6">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      </GlassCard>
    );
  }

  const isDoctor = profile?.role === "doctor";

  return (
    <GlassCard className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">
          {isDoctor ? "Messages from Patients" : "Messages from Doctor"}
        </h3>
      </div>
      
      {messages.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>No messages yet</p>
        </div>
      ) : (
        <ScrollArea className="h-64">
          <div className="space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "p-4 rounded-lg border transition-colors",
                  msg.is_read
                    ? "bg-muted/20 border-border/50"
                    : "bg-primary/5 border-primary/30"
                )}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-primary">
                      {getRequestTypeLabel(msg.request_type)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      from {getSenderLabel(msg)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {format(new Date(msg.created_at), "MMM d, h:mm a")}
                  </div>
                </div>
                <p className="text-sm">{msg.message}</p>
                {!msg.is_read && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 text-xs"
                    onClick={() => markAsRead(msg.id)}
                  >
                    <Check className="h-3 w-3 mr-1" />
                    Mark as read
                  </Button>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </GlassCard>
  );
}
