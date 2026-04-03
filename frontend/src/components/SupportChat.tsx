"use client";

import { useState, useEffect, useRef } from "react";
import { MessageCircle, X, Send, ChevronDown } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";

const FAQ_ITEMS = [
  { q: "როგორ დავრეგისტრირდე?", a: "დააჭირეთ რეგისტრაცია ღილაკს, აირჩიეთ ანგარიშის ტიპი (კლიენტი ან პროვაიდერი) და შეავსეთ საჭირო ველები." },
  { q: "როგორ ვიპოვო სპეციალისტი?", a: "გამოიყენეთ მთავარ გვერდზე არსებული საძიებო ზოლი — შეიყვანეთ პროფესია, ქალაქი ან ქვეყანა." },
  { q: "როგორ განვათავსო განცხადება?", a: "შედით პროვაიდერის პანელში და აირჩიეთ განცხადების შექმნა. შეავსეთ ფორმა და გამოაქვეყნეთ." },
  { q: "რა არის VIP განცხადება?", a: "VIP განცხადება გამოჩნდება მთავარ გვერდზე პრიორიტეტულად და მეტ ყურადღებას მიიპყრობს." },
  { q: "როგორ შევცვალო პაროლი?", a: "გადადით პარამეტრებში და აირჩიეთ პაროლის შეცვლა, ან გამოიყენეთ დამავიწყდა პაროლი ფუნქცია." },
];

interface ChatMessage {
  id: number;
  message: string;
  is_admin_reply: boolean;
  created_at: string;
}

const SupportChat = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [view, setView] = useState<"main" | "faq" | "chat">("main");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data, refetch } = useQuery<{ conversation_id: string | null; messages: ChatMessage[] }>({
    queryKey: ["support-history"],
    queryFn: () => api.get("/support/history").then((r) => r.data),
    enabled: !!user && isOpen && view === "chat",
  });

  useEffect(() => {
    if (data?.conversation_id) setConversationId(data.conversation_id);
  }, [data]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [data?.messages]);

  const sendMutation = useMutation({
    mutationFn: (text: string) =>
      api.post("/support/send", { message: text, conversation_id: conversationId }),
    onSuccess: (res) => {
      if (res.data?.conversation_id) setConversationId(res.data.conversation_id);
      refetch();
    },
  });

  const handleSend = () => {
    if (!message.trim()) return;
    const text = message.trim();
    setMessage("");
    sendMutation.mutate(text);
  };

  const messages = data?.messages ?? [];

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-all flex items-center justify-center"
        aria-label="დახმარება"
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 rounded-2xl border border-border bg-card shadow-2xl overflow-hidden animate-fade-up">
          <div className="bg-primary p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-primary-foreground text-lg">
                {view === "main" ? "დახმარების ცენტრი" : view === "faq" ? "ხშირი კითხვები" : "მოგვწერეთ"}
              </h3>
              {view !== "main" && (
                <button onClick={() => setView("main")} className="text-primary-foreground/70 hover:text-primary-foreground text-sm">
                  ← უკან
                </button>
              )}
            </div>
            {view === "main" && (
              <p className="text-primary-foreground/70 text-sm mt-1">როგორ შეგვიძლია დაგეხმაროთ?</p>
            )}
          </div>

          {view === "main" && (
            <div className="p-4 space-y-3">
              <button onClick={() => setView("faq")} className="w-full flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary hover:bg-accent transition-colors text-left">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <MessageCircle className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground text-sm">ხშირი კითხვები</p>
                  <p className="text-xs text-muted-foreground">იპოვეთ პასუხი სწრაფად</p>
                </div>
              </button>
              <button onClick={() => setView("chat")} className="w-full flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary hover:bg-accent transition-colors text-left">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Send className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground text-sm">მოგვწერეთ</p>
                  <p className="text-xs text-muted-foreground">გუნდი გიპასუხებთ მალე</p>
                </div>
              </button>
            </div>
          )}

          {view === "faq" && (
            <ScrollArea className="h-80">
              <div className="p-4 space-y-2">
                {FAQ_ITEMS.map((item, i) => (
                  <div key={i} className="border border-border rounded-xl overflow-hidden">
                    <button onClick={() => setActiveFaq(activeFaq === i ? null : i)} className="w-full flex items-center justify-between p-3 text-left hover:bg-accent transition-colors">
                      <span className="text-sm font-medium text-foreground">{item.q}</span>
                      <ChevronDown className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform ${activeFaq === i ? "rotate-180" : ""}`} />
                    </button>
                    {activeFaq === i && (
                      <div className="px-3 pb-3">
                        <p className="text-sm text-muted-foreground">{item.a}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}

          {view === "chat" && (
            <div className="flex flex-col h-80">
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4">
                <div className="space-y-3">
                  {!user ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      შეტყობინების გასაგზავნად გთხოვთ შეხვიდეთ სისტემაში.
                    </p>
                  ) : messages.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      დაწერეთ შეტყობინება და ჩვენი გუნდი დაგეხმარებათ.
                    </p>
                  ) : (
                    messages.map((msg) => (
                      <div key={msg.id} className={`flex ${msg.is_admin_reply ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${msg.is_admin_reply ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>
                          {msg.message}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
              <div className="p-3 border-t border-border flex gap-2">
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder={user ? "შეტყობინება..." : "შესვლა საჭიროა"}
                  className="text-sm"
                  disabled={!user || sendMutation.isPending}
                />
                <Button size="icon" onClick={handleSend} disabled={!message.trim() || !user || sendMutation.isPending}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default SupportChat;
