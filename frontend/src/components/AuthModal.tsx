"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, User, ArrowRight } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const DASHBOARD_ROUTES: Record<string, string> = {
  client: "/client/saved",
  provider: "/provider/dashboard",
  admin: "/admin/dashboard",
};

interface AuthModalProps {
  open: boolean;
  defaultTab?: "login" | "register";
  onClose: () => void;
}

export const AuthModal = ({ open, defaultTab = "login", onClose }: AuthModalProps) => {
  const [tab, setTab] = useState<"login" | "register">(defaultTab);

  useEffect(() => {
    if (open) setTab(defaultTab);
  }, [open, defaultTab]);

  // login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginSubmitting, setLoginSubmitting] = useState(false);

  // register state
  const [role, setRole] = useState<"client" | "provider">("client");
  const [fullName, setFullName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regSubmitting, setRegSubmitting] = useState(false);

  const { signIn, signUp } = useAuth();
  const router = useRouter();

  const handleLogin = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setLoginSubmitting(true);
    const { error, role } = await signIn(loginEmail, loginPassword);
    setLoginSubmitting(false);
    if (error) {
      toast.error(error);
    } else {
      onClose();
      router.push(DASHBOARD_ROUTES[role ?? ""] ?? "/");
    }
  };

  const handleRegister = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setRegSubmitting(true);
    const { error, role: newRole } = await signUp(regEmail, regPassword, fullName, role);
    setRegSubmitting(false);
    if (error) {
      toast.error(error);
    } else {
      toast.success("წარმატებით დარეგისტრირდით!");
      onClose();
      router.push(DASHBOARD_ROUTES[newRole ?? ""] ?? "/");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="sr-only">ავტორიზაცია</DialogTitle>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex gap-2 p-1 bg-muted rounded-lg mb-2">
          <button
            onClick={() => setTab("login")}
            className={`flex-1 text-sm font-medium py-2 rounded-md transition-colors ${tab === "login" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
          >
            შესვლა
          </button>
          <button
            onClick={() => setTab("register")}
            className={`flex-1 text-sm font-medium py-2 rounded-md transition-colors ${tab === "register" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
          >
            რეგისტრაცია
          </button>
        </div>

        {tab === "login" ? (
          <div>
            <h2 className="font-display text-xl font-bold text-foreground mb-1 text-center">კეთილი იყოს თქვენი დაბრუნება</h2>
            <p className="text-muted-foreground text-center text-sm mb-5">შედით თქვენს ანგარიშზე</p>
            <form className="space-y-3" onSubmit={handleLogin}>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input type="email" placeholder="ელ.ფოსტა" className="pl-10" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} required />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input type="password" placeholder="პაროლი" className="pl-10" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} required />
              </div>
              <div className="text-right">
                <button type="button" onClick={onClose} className="text-sm text-primary hover:underline" tabIndex={-1}>
                  {/* will navigate via link after close */}
                </button>
                <a href="/forgot-password" className="text-sm text-primary hover:underline">დაგავიწყდათ პაროლი?</a>
              </div>
              <Button className="w-full gap-2" size="lg" disabled={loginSubmitting}>
                {loginSubmitting ? "შესვლა…" : "შესვლა"} <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
            <p className="text-center text-sm text-muted-foreground mt-4">
              არ გაქვთ ანგარიში?{" "}
              <button onClick={() => setTab("register")} className="text-primary hover:underline font-medium">
                რეგისტრაცია
              </button>
            </p>
          </div>
        ) : (
          <div>
            <h2 className="font-display text-xl font-bold text-foreground mb-1 text-center">შექმენი ანგარიში</h2>
            <p className="text-muted-foreground text-center text-sm mb-5">დაიწყე სერვისების ძიება ან შეთავაზება დღესვე</p>

            <div className="flex gap-2 mb-4 p-1 bg-muted rounded-lg">
              <button onClick={() => setRole("client")} className={`flex-1 text-sm font-medium py-2 rounded-md transition-colors ${role === "client" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}>
                მჭირდება სერვისი
              </button>
              <button onClick={() => setRole("provider")} className={`flex-1 text-sm font-medium py-2 rounded-md transition-colors ${role === "provider" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}>
                ვარ პროვაიდერი
              </button>
            </div>

            <form className="space-y-3" onSubmit={handleRegister}>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="სრული სახელი" className="pl-10" value={fullName} onChange={e => setFullName(e.target.value)} required />
              </div>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input type="email" placeholder="ელ.ფოსტა" className="pl-10" value={regEmail} onChange={e => setRegEmail(e.target.value)} required />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input type="password" placeholder="პაროლი" className="pl-10" value={regPassword} onChange={e => setRegPassword(e.target.value)} required minLength={6} />
              </div>
              <Button className="w-full gap-2" size="lg" disabled={regSubmitting}>
                {regSubmitting ? "იქმნება…" : "ანგარიშის შექმნა"} <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
            <p className="text-center text-sm text-muted-foreground mt-4">
              უკვე გაქვთ ანგარიში?{" "}
              <button onClick={() => setTab("login")} className="text-primary hover:underline font-medium">
                შესვლა
              </button>
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
