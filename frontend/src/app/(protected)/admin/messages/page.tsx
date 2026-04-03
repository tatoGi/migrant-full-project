"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Settings, LogOut, MessageSquare, Send } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";

const navItems = [
  { icon: LayoutDashboard, label: "პანელი", path: "/admin/dashboard" },
  { icon: MessageSquare, label: "შეტყობინებები", path: "/admin/messages" },
  { icon: Settings, label: "პარამეტრები", path: "/admin/settings" },
];

interface Conversation {
  conversation_id: string;
  user_id: number | null;
  user_email: string | null;
  last_message: string;
  last_date: string;
  unread_count: number;
}

interface SupportMessage {
  id: number;
  conversation_id: string;
  user_id: number | null;
  user_email: string | null;
  message: string;
  is_admin_reply: boolean;
  is_read: boolean;
  created_at: string;
}

const AdminMessagesPage = () => {
  const { signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();

  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  const { data: convsData, isLoading } = useQuery<{ conversations: Conversation[] }>({
    queryKey: ["admin-conversations"],
    queryFn: () => api.get("/admin/support/messages").then((r) => r.data),
    refetchInterval: 30_000,
  });

  const conversations = convsData?.conversations ?? [];
  const selectedConv = conversations.find((c) => c.conversation_id === selectedConvId) ?? null;

  const { data: messagesData } = useQuery<{ messages: SupportMessage[] }>({
    queryKey: ["admin-messages", selectedConvId],
    queryFn: () => api.get(`/admin/support/messages/${selectedConvId}`).then((r) => r.data),
    enabled: !!selectedConvId,
    refetchInterval: 10_000,
  });

  const messages = messagesData?.messages ?? [];

  const replyMutation = useMutation({
    mutationFn: () =>
      api.post("/admin/support/reply", {
        conversation_id: selectedConvId,
        user_id: selectedConv?.user_id,
        message: replyText,
      }),
    onSuccess: () => {
      setReplyText("");
      queryClient.invalidateQueries({ queryKey: ["admin-messages", selectedConvId] });
      queryClient.invalidateQueries({ queryKey: ["admin-conversations"] });
    },
    onError: () => toast.error("გაგზავნა ვერ მოხდა."),
  });

  const handleReply = () => {
    if (!replyText.trim() || !selectedConvId) return;
    replyMutation.mutate();
  };

  const handleSelectConv = (convId: string) => {
    setSelectedConvId(convId);
    queryClient.invalidateQueries({ queryKey: ["admin-conversations"] });
  };

  const handleLogout = async () => { await signOut(); router.push("/"); };

  const totalUnread = conversations.reduce((sum, c) => sum + c.unread_count, 0);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pt-20 container mx-auto px-4 py-8">
        <div className="flex gap-8">
          <aside className="hidden md:block w-56 shrink-0">
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.path;
                const isMsg = item.path === "/admin/messages";
                return (
                  <Link key={item.path} href={item.path} className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}>
                    <Icon className="h-4 w-4" /> {item.label}
                    {isMsg && totalUnread > 0 && (
                      <span className="ml-auto bg-destructive text-destructive-foreground text-xs rounded-full px-1.5 py-0.5 min-w-[20px] text-center">{totalUnread}</span>
                    )}
                  </Link>
                );
              })}
              <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors w-full">
                <LogOut className="h-4 w-4" /> გასვლა
              </button>
            </nav>
          </aside>

          <main className="flex-1">
            <h1 className="font-display text-2xl font-bold text-foreground mb-6">საპორტის შეტყობინებები</h1>

            {isLoading ? (
              <div className="bg-card border border-border rounded-xl p-8 text-center">
                <p className="text-muted-foreground">იტვირთება...</p>
              </div>
            ) : conversations.length === 0 ? (
              <div className="bg-card border border-border rounded-xl p-8 text-center">
                <p className="text-muted-foreground">შეტყობინებები ჯერ არ არის.</p>
              </div>
            ) : (
              <div className="flex gap-4 h-[calc(100vh-220px)]">
                {/* Conversations list */}
                <div className="w-80 shrink-0 bg-card border border-border rounded-xl overflow-hidden flex flex-col">
                  <div className="p-3 border-b border-border">
                    <p className="text-sm font-medium text-muted-foreground">{conversations.length} საუბარი</p>
                  </div>
                  <ScrollArea className="flex-1">
                    {conversations.map((conv) => (
                      <button
                        key={conv.conversation_id}
                        onClick={() => handleSelectConv(conv.conversation_id)}
                        className={`w-full text-left p-3 border-b border-border hover:bg-accent transition-colors ${selectedConvId === conv.conversation_id ? "bg-accent" : ""}`}
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-foreground truncate">
                            {conv.user_email || "ანონიმური"}
                          </p>
                          {conv.unread_count > 0 && (
                            <span className="bg-destructive text-destructive-foreground text-xs rounded-full px-1.5 py-0.5 min-w-[20px] text-center">{conv.unread_count}</span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{conv.last_message}</p>
                        <p className="text-xs text-muted-foreground/60 mt-0.5">{new Date(conv.last_date).toLocaleString("ka-GE")}</p>
                      </button>
                    ))}
                  </ScrollArea>
                </div>

                {/* Messages panel */}
                <div className="flex-1 bg-card border border-border rounded-xl overflow-hidden flex flex-col">
                  {selectedConv ? (
                    <>
                      <div className="p-4 border-b border-border">
                        <p className="font-medium text-foreground">{selectedConv.user_email || "ანონიმური"}</p>
                        <p className="text-xs text-muted-foreground">საუბარი #{selectedConv.conversation_id.slice(0, 8)}</p>
                      </div>
                      <ScrollArea className="flex-1 p-4">
                        <div className="space-y-3">
                          {messages.map((msg) => (
                            <div key={msg.id} className={`flex ${msg.is_admin_reply ? "justify-end" : "justify-start"}`}>
                              <div className={`max-w-[70%] rounded-xl px-3 py-2 text-sm ${msg.is_admin_reply ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>
                                <p>{msg.message}</p>
                                <p className={`text-xs mt-1 ${msg.is_admin_reply ? "text-primary-foreground/60" : "text-muted-foreground/60"}`}>
                                  {new Date(msg.created_at).toLocaleTimeString("ka-GE", { hour: "2-digit", minute: "2-digit" })}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                      <div className="p-3 border-t border-border flex gap-2">
                        <Input
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleReply()}
                          placeholder="პასუხის გაგზავნა..."
                          className="text-sm"
                        />
                        <Button size="icon" onClick={handleReply} disabled={!replyText.trim() || replyMutation.isPending}>
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 flex items-center justify-center">
                      <p className="text-muted-foreground text-sm">აირჩიეთ საუბარი</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default AdminMessagesPage;
