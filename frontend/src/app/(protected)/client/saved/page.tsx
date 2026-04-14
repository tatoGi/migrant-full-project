"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Heart, Settings, LogOut, Trash2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import Header from "@/components/Header";
import ListingCard from "@/components/ListingCard";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import type { Listing } from "@/lib/data";

const navItems = [
  { icon: Heart, label: "შენახული", path: "/client/saved" },
  { icon: Settings, label: "პარამეტრები", path: "/client/settings" },
];

type ApiListing = {
  id: number;
  slug: string;
  provider_id: number;
  provider_name: string;
  profession: string;
  country: string;
  city: string;
  nationality: string;
  languages: string[] | null;
  price_type: "fixed" | "hourly" | "negotiable";
  price_value: number | null;
  description: string;
  photo: string | null;
  is_vip: boolean;
  booking_mode: "calendar" | "request";
  created_at: string | null;
};

function mapListing(l: ApiListing): Listing {
  return {
    id: String(l.id),
    slug: l.slug,
    providerId: String(l.provider_id),
    providerName: l.provider_name,
    profession: l.profession,
    country: l.country,
    city: l.city,
    nationality: l.nationality,
    languages: l.languages ?? [],
    priceType: l.price_type,
    priceValue: l.price_value ?? undefined,
    description: l.description,
    photo: l.photo ?? null,
    isVip: l.is_vip,
    bookingMode: l.booking_mode,
    createdAt: l.created_at ?? "",
  };
}

const ClientSavedPage = () => {
  const { signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<{ saved_listings: ApiListing[] }>({
    queryKey: ["saved-listings"],
    queryFn: () => api.get("/client/saved-listings").then((r) => r.data),
  });

  const removeMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/client/saved-listings/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-listings"] });
      toast.success("შენახულებიდან წაიშალა.");
    },
    onError: () => toast.error("წაშლა ვერ მოხდა."),
  });

  const handleLogout = async () => {
    await signOut();
    router.push("/");
  };

  const listings = (data?.saved_listings ?? []).map(mapListing);

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

          <main className="flex-1">
            <h1 className="font-display text-2xl font-bold text-foreground mb-6">შენახული</h1>

            {isLoading ? (
              <div className="bg-card border border-border rounded-xl p-8 text-center">
                <p className="text-muted-foreground">იტვირთება...</p>
              </div>
            ) : listings.length === 0 ? (
              <div className="bg-card border border-border rounded-xl p-8 text-center">
                <p className="text-muted-foreground">თქვენი შენახული პროვაიდერები აქ გამოჩნდება.</p>
                <Link href="/search" className="text-primary hover:underline text-sm mt-2 inline-block">
                  პროფესიონალის ძიება
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {listings.map((listing) => (
                  <div key={listing.id} className="relative group">
                    <ListingCard listing={listing} />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm text-destructive hover:text-destructive hover:bg-background opacity-0 group-hover:opacity-100 transition-opacity z-10"
                      onClick={() => removeMutation.mutate(Number(listing.id))}
                      disabled={removeMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default ClientSavedPage;
