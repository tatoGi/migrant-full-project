"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { useAuth, AppRole } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function RegisterPage() {
  const router = useRouter();
  const { signUp } = useAuth();

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    passwordConfirm: "",
    role: "client" as AppRole,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: { preventDefault(): void }) => {
    e.preventDefault();

    if (form.password !== form.passwordConfirm) {
      toast.error("პაროლები არ ემთხვევა.");
      return;
    }
    if (form.password.length < 8) {
      toast.error("პაროლი მინიმუმ 8 სიმბოლო უნდა იყოს.");
      return;
    }

    setLoading(true);
    const { error } = await signUp(form.email, form.password, form.fullName, form.role);
    setLoading(false);

    if (error) {
      toast.error(error);
      return;
    }

    toast.success("წარმატებით დარეგისტრირდით!");
    router.push(form.role === "provider" ? "/provider/dashboard" : "/");
  };

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">რეგისტრაცია</CardTitle>
          <CardDescription className="text-center">შექმენით ანგარიში Emigrant.GE-ზე</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">

            <div className="grid grid-cols-2 gap-2">
              {(["client", "provider"] as AppRole[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, role: r }))}
                  className={`py-2 px-4 rounded-lg border text-sm font-medium transition-colors ${form.role === r
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                    }`}
                >
                  {r === "client" ? "კლიენტი" : "პროვაიდერი"}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName">სახელი და გვარი</Label>
              <Input
                id="fullName"
                placeholder="გიორგი კვარაცხელია"
                value={form.fullName}
                onChange={set("fullName")}
                required
                autoComplete="name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">ელ-ფოსტა</Label>
              <Input
                id="email"
                type="email"
                placeholder="giorgi@example.com"
                value={form.email}
                onChange={set("email")}
                required
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">პაროლი</Label>
              <Input
                id="password"
                type="password"
                placeholder="მინიმუმ 8 სიმბოლო"
                value={form.password}
                onChange={set("password")}
                required
                autoComplete="new-password"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="passwordConfirm">გაიმეორეთ პაროლი</Label>
              <Input
                id="passwordConfirm"
                type="password"
                placeholder="გაიმეორეთ პაროლი"
                value={form.passwordConfirm}
                onChange={set("passwordConfirm")}
                required
                autoComplete="new-password"
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "იტვირთება..." : "რეგისტრაცია"}
            </Button>

            <p className="text-sm text-center text-gray-500">
              უკვე გაქვთ ანგარიში?{" "}
              <Link href="/login" className="text-primary hover:underline font-medium">
                შესვლა
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
