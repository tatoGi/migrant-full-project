"use client";

import { useQuery } from "@tanstack/react-query";
import type { Listing } from "@/lib/data";
import ListingCard from "./ListingCard";
import api from "@/lib/api";

type ApiListing = {
  id: number;
  provider_id: number;
  provider_name: string;
  profession: string;
  country: string;
  city: string;
  nationality: string;
  languages: string[];
  price_type: "fixed" | "hourly" | "negotiable";
  price_value: number | null;
  description: string;
  photo: string | null;
  is_vip: boolean;
  booking_mode: "calendar" | "request";
  created_at: string | null;
  slug: string;
  phone?: string | null;
  email?: string | null;
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
    createdAt: l.created_at ?? new Date().toISOString().slice(0, 10),
    phone: l.phone ?? undefined,
    email: l.email ?? undefined,
  };
}

const VipOffers = () => {
  const { data, isLoading } = useQuery<{ listings: ApiListing[] }>({
    queryKey: ["vip-listings"],
    queryFn: () => api.get("/listings/vip").then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });

  const listings: Listing[] = (data?.listings ?? []).map(mapListing);

  return (
    <section className="py-16 bg-muted/50">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-3 mb-2">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">VIP შეთავაზებები</h2>
          <span className="text-xs font-semibold bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
            რჩეული
          </span>
        </div>
        <p className="text-muted-foreground mb-8">
          საზოგადოების მიერ სანდო მაღალი რეიტინგის მქონე პროფესიონალები
        </p>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">იტვირთება...</p>
        ) : listings.length === 0 ? (
          <p className="text-sm text-muted-foreground">VIP შეთავაზებები ჯერ არ არის.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default VipOffers;
