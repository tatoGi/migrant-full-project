"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Globe } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

interface SiteSettings {
  logo_url: string | null;
}

const PROFILE_ROUTES: Record<string, string> = {
  client: "/client/settings",
  provider: "/provider/settings",
  admin: "/admin/settings",
};

const Footer = () => {
  const router = useRouter();
  const { user, role, loading } = useAuth();

  const { data: settings } = useQuery<SiteSettings>({
    queryKey: ["site-settings"],
    queryFn: () => api.get("/site-settings").then((r) => r.data),
  });

  const handleAccountClick = () => {
    if (loading) return;

    if (user && role) {
      router.push(PROFILE_ROUTES[role] ?? "/");
      return;
    }

    router.push("/register");
  };

  const handleCreateListingClick = () => {
    if (loading) return;

    if (!user || !role) {
      router.push("/register");
      return;
    }

    if (role !== "provider") {
      toast.error("განცხადების განთავსებისთვის დარეგისტრირდით როგორც პროვაიდერი.");
      return;
    }

    router.push("/provider/create-listing");
  };

  return (
    <footer className="bg-foreground text-primary-foreground py-12 mt-20">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              {settings?.logo_url ? (
                <img src={settings.logo_url} alt="Logo" className="max-h-24 w-auto object-contain brightness-0 invert" />
              ) : (
                <>
                  <Globe className="h-6 w-6" />
                  <span className="font-display text-lg font-bold">ემიგრანტ.GE</span>
                </>
              )}
            </div>
            <p className="text-sm opacity-70">
              დააკავშირეთ ემიგრანტები სანდო პროფესიონალებთან მთელ მსოფლიოში.
            </p>
          </div>
          <div>
            <h4 className="font-display font-semibold mb-3">კლიენტებისთვის</h4>
            <ul className="space-y-2 text-sm opacity-70">
              <li>
                <Link href="/search" className="hover:opacity-100 transition-opacity">
                  პროფესიონალის ძიება
                </Link>
              </li>
              <li>
                <button
                  type="button"
                  onClick={handleAccountClick}
                  className="hover:opacity-100 transition-opacity"
                >
                  ანგარიშის შექმნა
                </button>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-display font-semibold mb-3">პროვაიდერებისთვის</h4>
            <ul className="space-y-2 text-sm opacity-70">
              <li>
                <button
                  type="button"
                  onClick={handleCreateListingClick}
                  className="hover:opacity-100 transition-opacity"
                >
                  სერვისის განთავსება
                </button>
              </li>
              <li>
                <Link href="/login" className="hover:opacity-100 transition-opacity">
                  პროვაიდერის შესვლა
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-display font-semibold mb-3">სხვა</h4>
            <ul className="space-y-2 text-sm opacity-70">
              <li>
                <Link href="/search" className="hover:opacity-100 transition-opacity">
                  ყველა განცხადება
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-primary-foreground/20 mt-8 pt-6 text-sm text-center opacity-50">
          © 2026 ემიგრანტ.GE - ყველა უფლება დაცულია.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
