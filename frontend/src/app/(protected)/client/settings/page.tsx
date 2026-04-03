"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Heart, Settings, LogOut, User, MapPin, Globe2, Shield, Bell } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";
import { COUNTRIES, CITIES_BY_COUNTRY, LANGUAGES } from "@/lib/data";
import api from "@/lib/api";

const navItems = [
  { icon: Heart, label: "შენახული", path: "/client/saved" },
  { icon: Settings, label: "პარამეტრები", path: "/client/settings" },
];

const settingsSections = [
  { id: "personal", label: "პირადი ინფო", icon: User },
  { id: "location", label: "მდებარეობა", icon: MapPin },
  { id: "language", label: "ენა და ეროვნება", icon: Globe2 },
  { id: "security", label: "უსაფრთხოება", icon: Shield },
  { id: "notifications", label: "შეტყობინებები", icon: Bell },
];

interface Profile {
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  country: string | null;
  city: string | null;
  nationality: string | null;
  languages: string[] | null;
  email: string;
  notifications: {
    listing_updates: boolean;
    new_messages: boolean;
    promotions: boolean;
  };
}

const defaultProfile: Profile = {
  first_name: "", last_name: "", phone: "", country: "",
  city: "", nationality: "", languages: [], email: "",
  notifications: { listing_updates: true, new_messages: true, promotions: false },
};

const ClientSettingsPage = () => {
  const { signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();

  const [activeSection, setActiveSection] = useState("personal");
  const [profile, setProfile] = useState<Profile>(defaultProfile);
  const [newPassword, setNewPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");

  const { data: profileData, isLoading } = useQuery<Profile>({
    queryKey: ["profile"],
    queryFn: () => api.get("/profile").then((r) => r.data),
  });

  useEffect(() => {
    if (profileData) setProfile(profileData);
  }, [profileData]);

  const profileMutation = useMutation({
    mutationFn: (data: Partial<Profile>) => api.put("/profile", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("პარამეტრები შენახულია!");
    },
    onError: (err: unknown) => {
      const errors = (err as { response?: { data?: { errors?: Record<string, string[]> } } })?.response?.data?.errors;
      if (errors) toast.error(Object.values(errors)[0][0]);
      else toast.error("შენახვა ვერ მოხდა.");
    },
  });

  const passwordMutation = useMutation({
    mutationFn: () => api.put("/auth/password", { password: newPassword, password_confirmation: passwordConfirm }),
    onSuccess: () => {
      toast.success("პაროლი განახლდა!");
      setNewPassword("");
      setPasswordConfirm("");
    },
    onError: (err: unknown) => {
      const errors = (err as { response?: { data?: { errors?: Record<string, string[]> } } })?.response?.data?.errors;
      if (errors) toast.error(Object.values(errors)[0][0]);
      else toast.error("პაროლის შეცვლა ვერ მოხდა.");
    },
  });

  const handleLogout = async () => { await signOut(); router.push("/"); };

  const cities = profile.country ? CITIES_BY_COUNTRY[profile.country] ?? [] : [];
  const langs = profile.languages ?? [];
  const isSaving = profileMutation.isPending;

  const toggleLanguage = (lang: string) => {
    setProfile((p) => ({
      ...p,
      languages: langs.includes(lang) ? langs.filter((l) => l !== lang) : [...langs, lang],
    }));
  };

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
                return (
                  <Link key={item.path} href={item.path} className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}>
                    <Icon className="h-4 w-4" /> {item.label}
                  </Link>
                );
              })}
              <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors w-full">
                <LogOut className="h-4 w-4" /> გასვლა
              </button>
            </nav>
          </aside>

          <main className="flex-1 max-w-2xl">
            <h1 className="font-display text-2xl font-bold text-foreground mb-6">პარამეტრები</h1>

            <div className="flex gap-2 flex-wrap mb-6">
              {settingsSections.map((s) => (
                <button key={s.id} onClick={() => setActiveSection(s.id)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeSection === s.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}>
                  <s.icon className="h-3.5 w-3.5" /> {s.label}
                </button>
              ))}
            </div>

            {isLoading ? (
              <div className="bg-card border border-border rounded-xl p-8 text-center">
                <p className="text-muted-foreground">იტვირთება...</p>
              </div>
            ) : (
              <>
                {activeSection === "personal" && (
                  <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div><Label>სახელი</Label><Input value={profile.first_name ?? ""} onChange={(e) => setProfile((p) => ({ ...p, first_name: e.target.value }))} /></div>
                      <div><Label>გვარი</Label><Input value={profile.last_name ?? ""} onChange={(e) => setProfile((p) => ({ ...p, last_name: e.target.value }))} /></div>
                    </div>
                    <div><Label>ტელეფონი</Label><Input value={profile.phone ?? ""} onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))} placeholder="+995 555 123 456" /></div>
                    <div><Label>ელ.ფოსტა</Label><Input value={profile.email} disabled className="opacity-60" /></div>
                    <Button onClick={() => profileMutation.mutate({ first_name: profile.first_name, last_name: profile.last_name, phone: profile.phone })} disabled={isSaving}>
                      {isSaving ? "ინახება…" : "ცვლილებების შენახვა"}
                    </Button>
                  </div>
                )}

                {activeSection === "location" && (
                  <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                    <div><Label>ქვეყანა</Label>
                      <Select value={profile.country ?? ""} onValueChange={(v) => setProfile((p) => ({ ...p, country: v, city: "" }))}>
                        <SelectTrigger><SelectValue placeholder="აირჩიეთ ქვეყანა" /></SelectTrigger>
                        <SelectContent>{COUNTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div><Label>ქალაქი</Label>
                      <Select value={profile.city ?? ""} onValueChange={(v) => setProfile((p) => ({ ...p, city: v }))} disabled={!profile.country}>
                        <SelectTrigger><SelectValue placeholder="აირჩიეთ ქალაქი" /></SelectTrigger>
                        <SelectContent>{cities.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <Button onClick={() => profileMutation.mutate({ country: profile.country, city: profile.city })} disabled={isSaving}>
                      {isSaving ? "ინახება…" : "ცვლილებების შენახვა"}
                    </Button>
                  </div>
                )}

                {activeSection === "language" && (
                  <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                    <div><Label>ეროვნება</Label>
                      <Select value={profile.nationality ?? ""} onValueChange={(v) => setProfile((p) => ({ ...p, nationality: v }))}>
                        <SelectTrigger><SelectValue placeholder="აირჩიეთ ეროვნება" /></SelectTrigger>
                        <SelectContent>{COUNTRIES.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>ენები</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {LANGUAGES.map((lang) => (
                          <button key={lang} onClick={() => toggleLanguage(lang)} className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${langs.includes(lang) ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground border-border hover:border-foreground/30"}`}>
                            {lang}
                          </button>
                        ))}
                      </div>
                    </div>
                    <Button onClick={() => profileMutation.mutate({ nationality: profile.nationality, languages: langs })} disabled={isSaving}>
                      {isSaving ? "ინახება…" : "ცვლილებების შენახვა"}
                    </Button>
                  </div>
                )}

                {activeSection === "security" && (
                  <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                    <div><Label>ახალი პაროლი</Label><Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="მინიმუმ 6 სიმბოლო" /></div>
                    <div><Label>გაიმეორეთ პაროლი</Label><Input type="password" value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)} placeholder="მინიმუმ 6 სიმბოლო" /></div>
                    <Button onClick={() => passwordMutation.mutate()} disabled={passwordMutation.isPending || newPassword.length < 6 || newPassword !== passwordConfirm}>
                      {passwordMutation.isPending ? "ინახება…" : "პაროლის განახლება"}
                    </Button>
                  </div>
                )}

                {activeSection === "notifications" && (
                  <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                    {([
                      { key: "listing_updates" as const, label: "განცხადების განახლებები" },
                      { key: "new_messages" as const, label: "ახალი შეტყობინებები" },
                      { key: "promotions" as const, label: "აქციები" },
                    ]).map(({ key, label }) => (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-sm text-foreground">{label}</span>
                        <Switch
                          checked={!!profile.notifications?.[key]}
                          onCheckedChange={(v) =>
                            setProfile((p) => ({ ...p, notifications: { ...p.notifications, [key]: v } }))
                          }
                        />
                      </div>
                    ))}
                    <Button onClick={() => profileMutation.mutate({
                      notification_listing_updates: profile.notifications?.listing_updates,
                      notification_new_messages: profile.notifications?.new_messages,
                      notification_promotions: profile.notifications?.promotions,
                    } as Partial<Profile>)} disabled={isSaving}>
                      {isSaving ? "ინახება…" : "ცვლილებების შენახვა"}
                    </Button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default ClientSettingsPage;
