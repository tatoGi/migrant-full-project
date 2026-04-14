"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Globe, Lock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "@/lib/api";

const ResetPasswordContent = () => {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();

  const mutation = useMutation({
    mutationFn: () => {
      const token = searchParams.get("token");
      const email = searchParams.get("email");
      return api.post("/auth/reset-password", { token, email, password, password_confirmation: confirmation });
    },
    onSuccess: () => {
      toast.success("პაროლი განახლდა", { description: "ახლა შეგიძლიათ ახალი პაროლით შესვლა." });
      router.push("/login");
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? "შეცდომა მოხდა. სცადეთ მოგვიანებით.";
      toast.error("შეცდომა", { description: msg });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmation) {
      toast.error("პაროლები არ ემთხვევა");
      return;
    }
    mutation.mutate();
  };

  return (
    <div className="w-full max-w-md">
      <Link href="/" className="flex items-center gap-2 mb-8 justify-center">
        <Globe className="h-7 w-7 text-primary" />
        <span className="font-display text-xl font-bold text-foreground">ემიგრანტ.GE</span>
      </Link>
      <div className="bg-card border border-border rounded-2xl p-8 shadow-card">
        <h1 className="font-display text-2xl font-bold text-foreground mb-1 text-center">ახალი პაროლის დაყენება</h1>
        <p className="text-muted-foreground text-center mb-6">შეიყვანეთ თქვენი ახალი პაროლი</p>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input type="password" placeholder="ახალი პაროლი" className="pl-10" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input type="password" placeholder="გაიმეორეთ პაროლი" className="pl-10" value={confirmation} onChange={e => setConfirmation(e.target.value)} required minLength={6} />
          </div>
          <Button className="w-full gap-2" size="lg" disabled={mutation.isPending}>
            {mutation.isPending ? "მიმდინარეობს…" : "პაროლის განახლება"} <ArrowRight className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
};

const ResetPasswordPage = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <Suspense fallback={<div>იტვირთება...</div>}>
        <ResetPasswordContent />
      </Suspense>
    </div>
  );
};

export default ResetPasswordPage;
