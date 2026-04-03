"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Globe } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { AuthModal } from "@/components/AuthModal";

interface SiteSettings {
  logo_url: string | null;
}

const DASHBOARD_ROUTES: Record<string, string> = {
  client: "/client/saved",
  provider: "/provider/dashboard",
  admin: "/admin/dashboard",
};

const Header = () => {
  const { user, role, signOut } = useAuth();
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<"login" | "register">("login");

  const { data: settings } = useQuery<SiteSettings>({
    queryKey: ["site-settings"],
    queryFn: () => api.get("/site-settings").then((r) => r.data),
  });

  const openLogin = () => { setModalTab("login"); setModalOpen(true); };
  const openRegister = () => { setModalTab("register"); setModalOpen(true); };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            {settings?.logo_url ? (
              <img src={settings.logo_url} alt="Logo" className="max-h-24 w-auto object-contain" />
            ) : (
              <>
                <Globe className="h-7 w-7 text-primary" />
                <span className="font-display text-xl font-bold text-foreground">Emigrant.GE</span>
              </>
            )}
          </Link>
          <div className="flex items-center gap-3">
            {user && role ? (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link href={DASHBOARD_ROUTES[role]}>პანელი</Link>
                </Button>
                <Button variant="outline" size="sm" onClick={async () => { await signOut(); router.push("/"); }}>
                  გამოსვლა
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={openLogin}>
                  შესვლა
                </Button>
                <Button size="sm" onClick={openRegister}>
                  რეგისტრაცია
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <AuthModal open={modalOpen} defaultTab={modalTab} onClose={() => setModalOpen(false)} />
    </>
  );
};

export default Header;
