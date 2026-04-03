"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, PlusCircle, Settings, LogOut, User, MapPin, Globe2, Shield, Bell, Briefcase, Clock } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";
import { COUNTRIES, CITIES_BY_COUNTRY, LANGUAGES, PROFESSIONS } from "@/lib/data";
import api from "@/lib/api";

const navItems = [
  { icon: LayoutDashboard, label: "პანელი", path: "/provider/dashboard" },
  { icon: PlusCircle, label: "განცხადების შექმნა", path: "/provider/create-listing" },
  { icon: Settings, label: "პარამეტრები", path: "/provider/settings" },
];

const settingsSections = [
  { id: "personal", label: "პირადი ინფო", icon: User },
  { id: "location", label: "მდებარეობა", icon: MapPin },
  { id: "language", label: "ენა და ეროვნება", icon: Globe2 },
  { id: "service", label: "სერვისის პარამეტრები", icon: Briefcase },
  { id: "availability", label: "ხელმისაწვდომობა", icon: Clock },
  { id: "security", label: "უსაფრთხოება", icon: Shield },
  { id: "notifications", label: "შეტყობინებები", icon: Bell },
];

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const DAYS_GE = ["ორშაბათი", "სამშაბათი", "ოთხშაბათი", "ხუთშაბათი", "პარასკევი", "შაბათი", "კვირა"];

interface Profile {
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  country: string | null;
  city: string | null;
  nationality: string | null;
  languages: string[] | null;
  email: string;
}

interface ProviderSettings {
  default_profession: string;
  default_price_type: string;
  default_price_value: number | null;
  service_mode: string;
  booking_mode: string;
  working_days: string[];
  working_hours_start: string;
  working_hours_end: string;
  slot_duration_minutes: number;
  notify_bookings: boolean;
  notify_messages: boolean;
  notify_reviews: boolean;
  notify_promotions: boolean;
}

const defaultProfile: Profile = {
  first_name: "", last_name: "", phone: "", country: "",
  city: "", nationality: "", languages: [], email: "",
};

const defaultSettings: ProviderSettings = {
  default_profession: "", default_price_type: "negotiable", default_price_value: null,
  service_mode: "onsite", booking_mode: "request",
  working_days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
  working_hours_start: "09:00", working_hours_end: "18:00", slot_duration_minutes: 60,
  notify_bookings: true, notify_messages: true, notify_reviews: true, notify_promotions: false,
};

const ProviderSettingsPage = () => {
  const { signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();

  const [activeSection, setActiveSection] = useState("personal");
  const [profile, setProfile] = useState<Profile>(defaultProfile);
  const [provSettings, setProvSettings] = useState<ProviderSettings>(defaultSettings);
  const [newPassword, setNewPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");

  const { data: profileData, isLoading: profileLoading } = useQuery<Profile>({
    queryKey: ["profile"],
    queryFn: () => api.get("/profile").then((r) => r.data),
  });

  const { data: settingsData, isLoading: settingsLoading } = useQuery<ProviderSettings>({
    queryKey: ["provider-settings"],
    queryFn: () => api.get("/provider/settings").then((r) => r.data),
  });

  useEffect(() => {
    if (profileData) setProfile(profileData);
  }, [profileData]);

  useEffect(() => {
    if (settingsData) setProvSettings(settingsData);
  }, [settingsData]);

  const profileMutation = useMutation({
    mutationFn: (data: Partial<Profile>) => api.put("/profile", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("პარამეტრები შენახულია!");
    },
    onError: (err: unknown) => {
      const errors = (err as { response?: { data?: { errors?: Record<string, string[]> } } })?.response?.data?.errors;
      if (errors) {
        toast.error(Object.values(errors)[0][0]);
      } else {
        toast.error("შენახვა ვერ მოხდა.");
      }
    },
  });

  const settingsMutation = useMutation({
    mutationFn: (data: Partial<ProviderSettings>) => api.put("/provider/settings", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["provider-settings"] });
      toast.success("პარამეტრები შენახულია!");
    },
    onError: () => toast.error("შენახვა ვერ მოხდა."),
  });

  const passwordMutation = useMutation({
    mutationFn: () =>
      api.put("/auth/password", { password: newPassword, password_confirmation: passwordConfirm }),
    onSuccess: () => {
      toast.success("პაროლი განახლდა!");
      setNewPassword("");
      setPasswordConfirm("");
    },
    onError: (err: unknown) => {
      const errors = (err as { response?: { data?: { errors?: Record<string, string[]> } } })?.response?.data?.errors;
      if (errors) {
        toast.error(Object.values(errors)[0][0]);
      } else {
        toast.error("პაროლის შეცვლა ვერ მოხდა.");
      }
    },
  });

  const handleLogout = async () => { await signOut(); router.push("/"); };

  const cities = profile.country ? CITIES_BY_COUNTRY[profile.country] ?? [] : [];

  const toggleLanguage = (lang: string) => {
    setProfile((p) => ({
      ...p,
      languages: (p.languages ?? []).includes(lang) ? (p.languages ?? []).filter((l) => l !== lang) : [...(p.languages ?? []), lang],
    }));
  };

  const toggleDay = (day: string) => {
    setProvSettings((s) => ({
      ...s,
      working_days: s.working_days.includes(day) ? s.working_days.filter((d) => d !== day) : [...s.working_days, day],
    }));
  };

  const isLoading = profileLoading || settingsLoading;
  const isSaving = profileMutation.isPending || settingsMutation.isPending;

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
                          <button key={lang} onClick={() => toggleLanguage(lang)} className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${(profile.languages ?? []).includes(lang) ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground border-border hover:border-foreground/30"}`}>
                            {lang}
                          </button>
                        ))}
                      </div>
                    </div>
                    <Button onClick={() => profileMutation.mutate({ nationality: profile.nationality, languages: profile.languages ?? [] })} disabled={isSaving}>
                      {isSaving ? "ინახება…" : "ცვლილებების შენახვა"}
                    </Button>
                  </div>
                )}

                {activeSection === "service" && (
                  <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                    <div><Label>ძირითადი პროფესია</Label>
                      <Select value={provSettings.default_profession || ""} onValueChange={(v) => setProvSettings((s) => ({ ...s, default_profession: v }))}>
                        <SelectTrigger><SelectValue placeholder="აირჩიეთ პროფესია" /></SelectTrigger>
                        <SelectContent>{PROFESSIONS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div><Label>ფასის ტიპი</Label>
                      <Select value={provSettings.default_price_type} onValueChange={(v) => setProvSettings((s) => ({ ...s, default_price_type: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fixed">ფიქსირებული</SelectItem>
                          <SelectItem value="hourly">საათობრივი</SelectItem>
                          <SelectItem value="negotiable">შეთანხმებით</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {provSettings.default_price_type !== "negotiable" && (
                      <div><Label>ფასი (€)</Label>
                        <Input type="number" value={provSettings.default_price_value ?? ""} onChange={(e) => setProvSettings((s) => ({ ...s, default_price_value: e.target.value ? Number(e.target.value) : null }))} />
                      </div>
                    )}
                    <div><Label>სერვისის რეჟიმი</Label>
                      <Select value={provSettings.service_mode} onValueChange={(v) => setProvSettings((s) => ({ ...s, service_mode: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="online">ონლაინ</SelectItem>
                          <SelectItem value="onsite">ადგილზე</SelectItem>
                          <SelectItem value="both">ორივე</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div><Label>დაჯავშნის რეჟიმი</Label>
                      <Select value={provSettings.booking_mode} onValueChange={(v) => setProvSettings((s) => ({ ...s, booking_mode: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="calendar">კალენდარით დაჯავშნა</SelectItem>
                          <SelectItem value="request">მხოლოდ მოთხოვნით</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={() => settingsMutation.mutate({ default_profession: provSettings.default_profession, default_price_type: provSettings.default_price_type, default_price_value: provSettings.default_price_value, service_mode: provSettings.service_mode, booking_mode: provSettings.booking_mode })} disabled={isSaving}>
                      {isSaving ? "ინახება…" : "ცვლილებების შენახვა"}
                    </Button>
                  </div>
                )}

                {activeSection === "availability" && (
                  <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                    <div>
                      <Label>სამუშაო დღეები</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {DAYS.map((day, idx) => (
                          <button key={day} onClick={() => toggleDay(day)} className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${provSettings.working_days.includes(day) ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground border-border hover:border-foreground/30"}`}>
                            {DAYS_GE[idx].slice(0, 3)}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div><Label>დაწყების დრო</Label><Input type="time" value={provSettings.working_hours_start} onChange={(e) => setProvSettings((s) => ({ ...s, working_hours_start: e.target.value }))} /></div>
                      <div><Label>დასრულების დრო</Label><Input type="time" value={provSettings.working_hours_end} onChange={(e) => setProvSettings((s) => ({ ...s, working_hours_end: e.target.value }))} /></div>
                    </div>
                    <div><Label>სლოტის ხანგრძლივობა (წუთი)</Label>
                      <Select value={provSettings.slot_duration_minutes.toString()} onValueChange={(v) => setProvSettings((s) => ({ ...s, slot_duration_minutes: Number(v) }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="15">15 წთ</SelectItem>
                          <SelectItem value="30">30 წთ</SelectItem>
                          <SelectItem value="45">45 წთ</SelectItem>
                          <SelectItem value="60">60 წთ</SelectItem>
                          <SelectItem value="90">90 წთ</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={() => settingsMutation.mutate({ working_days: provSettings.working_days, working_hours_start: provSettings.working_hours_start, working_hours_end: provSettings.working_hours_end, slot_duration_minutes: provSettings.slot_duration_minutes })} disabled={isSaving}>
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
                      { key: "notify_bookings", label: "ჯავშნის განახლებები" },
                      { key: "notify_messages", label: "ახალი შეტყობინებები" },
                      { key: "notify_reviews", label: "ახალი შეფასებები" },
                      { key: "notify_promotions", label: "აქციები" },
                    ] as const).map(({ key, label }) => (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-sm text-foreground">{label}</span>
                        <Switch
                          checked={!!provSettings[key]}
                          onCheckedChange={(v) => setProvSettings((s) => ({ ...s, [key]: v }))}
                        />
                      </div>
                    ))}
                    <Button onClick={() => settingsMutation.mutate({ notify_bookings: provSettings.notify_bookings, notify_messages: provSettings.notify_messages, notify_reviews: provSettings.notify_reviews, notify_promotions: provSettings.notify_promotions })} disabled={isSaving}>
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

export default ProviderSettingsPage;
