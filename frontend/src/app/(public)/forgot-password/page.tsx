"use client";

import { useState } from "react";
import Link from "next/link";
import { Globe, Mail, ArrowRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "@/lib/api";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");

  const mutation = useMutation({
    mutationFn: (email: string) => api.post("/auth/forgot-password", { email }),
    onSuccess: () => {
      toast.success("წერილი გაიგზავნა", { description: "შეამოწმეთ თქვენი ელ.ფოსტა პაროლის აღდგენის ბმულისთვის." });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? "შეცდომა მოხდა. სცადეთ მოგვიანებით.";
      toast.error("შეცდომა", { description: msg });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(email);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        <Link href="/" className="flex items-center gap-2 mb-8 justify-center">
          <Globe className="h-7 w-7 text-primary" />
          <span className="font-display text-xl font-bold text-foreground">ემიგრანტ.GE</span>
        </Link>
        <div className="bg-card border border-border rounded-2xl p-8 shadow-card">
          <h1 className="font-display text-2xl font-bold text-foreground mb-1 text-center">პაროლის აღდგენა</h1>
          <p className="text-muted-foreground text-center mb-6">შეიყვანეთ ელ.ფოსტა აღდგენის ბმულის მისაღებად</p>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input type="email" placeholder="ელ.ფოსტა" className="pl-10" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <Button className="w-full gap-2" size="lg" disabled={mutation.isPending}>
              {mutation.isPending ? "იგზავნება…" : "ბმულის გაგზავნა"} <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          <Link href="/login" className="flex items-center justify-center gap-1 text-sm text-muted-foreground hover:text-foreground mt-6 transition-colors">
            <ArrowLeft className="h-3 w-3" /> შესვლაზე დაბრუნება
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
