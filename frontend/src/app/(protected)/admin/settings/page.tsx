"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { LayoutDashboard, Settings, LogOut, MessageSquare, Upload, X } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";

const navItems = [
  { icon: LayoutDashboard, label: "პანელი", path: "/admin/dashboard" },
  { icon: MessageSquare, label: "შეტყობინებები", path: "/admin/messages" },
  { icon: Settings, label: "პარამეტრები", path: "/admin/settings" },

];

interface SiteSettings {
  banner_image_url: string | null;
  banner_title: string | null;
  banner_subtitle: string | null;
  banner_cta_text: string | null;
  logo_url: string | null;
}

const AdminSettingsPage = () => {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [banner, setBanner] = useState({
    banner_title: "",
    banner_subtitle: "",
    banner_cta_text: "",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const { data: settings } = useQuery<SiteSettings>({
    queryKey: ["site-settings"],
    queryFn: () => api.get("/site-settings").then((r) => r.data),
  });

  useEffect(() => {
    if (settings) {
      setBanner({
        banner_title: settings.banner_title ?? "",
        banner_subtitle: settings.banner_subtitle ?? "",
        banner_cta_text: settings.banner_cta_text ?? "",
      });

      if (settings.banner_image_url) {
        setImagePreview(settings.banner_image_url);
      }

      if (settings.logo_url) {
        setLogoPreview(settings.logo_url);
      }
    }
  }, [settings]);

  const deleteImageMutation = useMutation({
    mutationFn: () => api.delete("/admin/site-settings/banner-image"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-settings"] });
      setImageFile(null);
      setImagePreview(null);
      toast.success("სურათი წაიშალა.");
    },
    onError: () => toast.error("შეცდომა. სცადეთ თავიდან."),
  });
  const deleteLogoMutation = useMutation({
    mutationFn: () => api.delete("/admin/site-settings/logo"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-settings"] });
      setLogoFile(null);
      setLogoPreview(null);
      toast.success("ლოგო წაიშალა.");
    },
    onError: () => toast.error("შეცდომა. სცადეთ თავიდან."),
  });
  const bannerMutation = useMutation({
    mutationFn: () => {
      const formData = new FormData();
      formData.append("banner_title", banner.banner_title);
      formData.append("banner_subtitle", banner.banner_subtitle);
      formData.append("banner_cta_text", banner.banner_cta_text);

      if (imageFile) formData.append("banner_image", imageFile);
      if (logoFile) formData.append("logo", logoFile);

      return api.post("/admin/site-settings", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-settings"] });
      toast.success("პარამეტრები განახლდა!");
      setImageFile(null);
      setLogoFile(null);
    },
    onError: () => toast.error("შეცდომა. სცადეთ თავიდან."),
  });
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleLogout = async () => {
    await signOut();
    router.push("/");
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
                  <Link
                    key={item.path}
                    href={item.path}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      }`}
                  >
                    <Icon className="h-4 w-4" /> {item.label}
                  </Link>
                );
              })}
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors w-full"
              >
                <LogOut className="h-4 w-4" /> გასვლა
              </button>
            </nav>
          </aside>

          <main className="flex-1 max-w-2xl space-y-8">
            <div className="bg-card border border-border rounded-xl p-6 space-y-5">
              <h2 className="text-lg font-semibold text-foreground">ლოგო</h2>

              <div className="space-y-2">
                <Label>საიტის ლოგო</Label>
                <div
                  onClick={() => logoInputRef.current?.click()}
                  className="relative cursor-pointer rounded-lg border-2 border-dashed border-border hover:border-primary transition-colors overflow-hidden w-full max-w-sm h-32 flex items-center justify-center bg-muted/20"
                >
                  {logoPreview ? (
                    <>
                      <img
                        src={logoPreview}
                        alt="logo preview"
                        className="max-h-24 max-w-[220px] object-contain"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Upload className="h-8 w-8 text-white" />
                        <span className="text-white ml-2 text-sm">ლოგოს შეცვლა</span>
                      </div>

                      <div className="absolute top-2 right-2 flex gap-1">
                        {logoFile ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setLogoFile(null);
                              setLogoPreview(settings?.logo_url ?? null);
                            }}
                            className="bg-black/60 rounded-full p-1 text-white hover:bg-black/80"
                            title="გაუქმება"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteLogoMutation.mutate();
                            }}
                            className="bg-red-600/80 rounded-full p-1 text-white hover:bg-red-700"
                            title="ლოგოს წაშლა"
                            disabled={deleteLogoMutation.isPending}
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                      <Upload className="h-8 w-8" />
                      <span className="text-sm">ლოგოს ატვირთვა (PNG, JPG, WEBP)</span>
                    </div>
                  )}
                </div>

                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/svg+xml"
                  className="hidden"
                  onChange={handleLogoChange}
                />
              </div>

              <Button 
                onClick={() => bannerMutation.mutate()} 
                disabled={bannerMutation.isPending}
                variant="outline"
                className="w-full"
              >
                {bannerMutation.isPending ? "ინახება..." : "ლოგოს შენახვა"}
              </Button>
            </div>
            <h1 className="font-display text-2xl font-bold text-foreground">ადმინის პარამეტრები</h1>

            {/* Banner Section */}
            <div className="bg-card border border-border rounded-xl p-6 space-y-5">
              <h2 className="text-lg font-semibold text-foreground">მთავარი გვერდის ბანერი</h2>

              {/* Image upload */}
              <div className="space-y-2">
                <Label>ბანერის სურათი</Label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="relative cursor-pointer rounded-lg border-2 border-dashed border-border hover:border-primary transition-colors overflow-hidden"
                  style={{ aspectRatio: "16/5" }}
                >
                  {imagePreview ? (
                    <>
                      <img src={imagePreview} alt="banner" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Upload className="h-8 w-8 text-white" />
                        <span className="text-white ml-2 text-sm">სურათის შეცვლა</span>
                      </div>
                      <div className="absolute top-2 right-2 flex gap-1">
                        {imageFile ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setImageFile(null);
                              setImagePreview(settings?.banner_image_url ?? null);
                            }}
                            className="bg-black/60 rounded-full p-1 text-white hover:bg-black/80"
                            title="გაუქმება"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteImageMutation.mutate();
                            }}
                            className="bg-red-600/80 rounded-full p-1 text-white hover:bg-red-700"
                            title="სურათის წაშლა"
                            disabled={deleteImageMutation.isPending}
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                      <Upload className="h-8 w-8" />
                      <span className="text-sm">სურათის ატვირთვა (JPG, PNG, WEBP, მაქს. 10MB)</span>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleImageChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="banner_title">სათაური</Label>
                <Input
                  id="banner_title"
                  placeholder="იპოვე პროფესიონალი საქართველოში ან უცხოეთში"
                  value={banner.banner_title}
                  onChange={(e) => setBanner((p) => ({ ...p, banner_title: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="banner_subtitle">ქვესათაური</Label>
                <Textarea
                  id="banner_subtitle"
                  placeholder="მოკლე აღწერა..."
                  value={banner.banner_subtitle}
                  onChange={(e) => setBanner((p) => ({ ...p, banner_subtitle: e.target.value }))}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="banner_cta_text">ღილაკის ტექსტი</Label>
                <Input
                  id="banner_cta_text"
                  placeholder="სპეციალისტის ძიება"
                  value={banner.banner_cta_text}
                  onChange={(e) => setBanner((p) => ({ ...p, banner_cta_text: e.target.value }))}
                />
              </div>

              <Button onClick={() => bannerMutation.mutate()} disabled={bannerMutation.isPending}>
                {bannerMutation.isPending ? "ინახება..." : "ბანერის შენახვა"}
              </Button>
            </div>

            {/* Account Section */}
            <div className="bg-card border border-border rounded-xl p-6 space-y-4">
              <h2 className="text-lg font-semibold text-foreground">ანგარიში</h2>
              <div>
                <Label>ელ.ფოსტა</Label>
                <Input value={user?.email ?? ""} disabled className="opacity-60" />
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default AdminSettingsPage;
