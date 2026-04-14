import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MapPin, Globe, Languages, Clock, DollarSign, Phone } from "lucide-react";
import axios from "axios";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ListingCard from "@/components/ListingCard";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import SaveButton from "@/components/SaveButton";
import type { Listing } from "@/lib/data";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8082/api";

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

interface Props {
  params: Promise<{ id: string }>;
}

const ListingDetailPage = async ({ params }: Props) => {
  const { id: slug } = await params;

  let listing: Listing;
  let providerListings: Listing[] = [];

  try {
    const { data } = await axios.get<ApiListing>(`${API}/listings/${slug}`);
    listing = mapListing(data);
  } catch {
    notFound();
  }

  try {
    const { data } = await axios.get<{ data: ApiListing[] }>(
      `${API}/listings?filter[user_id]=${listing!.providerId}&per_page=4`
    );
    providerListings = (data.data ?? [])
      .filter((l) => l.slug !== slug)
      .slice(0, 4)
      .map(mapListing);
  } catch {
    // "სხვა განცხადებები" optional — silently ignore
  }

  const priceLabel =
    listing!.priceType === "negotiable"
      ? "შეთანხმებით"
      : `€${listing!.priceValue}${listing!.priceType === "hourly" ? "/სთ" : ""}`;

  const DAYS_SHORT = ["ორშ", "სამ", "ოთხ", "ხუთ", "პარ", "შაბ", "კვი"];
  const DAYS_EN = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pt-20 container mx-auto px-4 pb-8">
        <Link
          href="/search"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> შედეგებზე დაბრუნება
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-8">
            <div className="flex flex-col sm:flex-row gap-6">
              <img
                src={listing!.photo ?? "/default-avatar.svg"}
                alt={listing!.providerName}
                className="w-32 h-32 sm:w-40 sm:h-40 rounded-2xl object-cover shadow-card"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
                    {listing!.providerName}
                  </h1>
                  {listing!.isVip && (
                    <Badge className="bg-primary text-primary-foreground border-0 text-xs">VIP</Badge>
                  )}
                </div>
                <p className="text-lg text-primary font-medium">{listing!.profession}</p>
                <div className="flex flex-wrap gap-3 mt-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" /> {listing!.city}, {listing!.country}
                  </span>
                  {listing!.nationality && (
                    <span className="flex items-center gap-1">
                      <Globe className="h-4 w-4" /> {listing!.nationality}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div>
              <h2 className="font-display text-lg font-semibold text-foreground mb-2">შესახებ</h2>
              <p className="text-muted-foreground leading-relaxed">{listing!.description}</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {listing!.languages.length > 0 && (
                <div className="bg-card border border-border rounded-xl p-4">
                  <Languages className="h-5 w-5 text-primary mb-2" />
                  <p className="text-xs text-muted-foreground">ენები</p>
                  <p className="text-sm font-medium text-foreground">{listing!.languages.join(", ")}</p>
                </div>
              )}
              <div className="bg-card border border-border rounded-xl p-4">
                <DollarSign className="h-5 w-5 text-primary mb-2" />
                <p className="text-xs text-muted-foreground">ფასი</p>
                <p className="text-sm font-medium text-foreground">{priceLabel}</p>
              </div>
              {(listing!.phone || listing!.email) && (
                <div className="bg-card border border-border rounded-xl p-4">
                  <Phone className="h-5 w-5 text-primary mb-2" />
                  <p className="text-xs text-muted-foreground">კონტაქტი</p>
                  <p className="text-sm font-medium text-foreground">{listing!.phone || listing!.email}</p>
                </div>
              )}
              <Popover>
                <PopoverTrigger asChild>
                  <div className="bg-card border border-border rounded-xl p-4 cursor-pointer hover:border-primary transition-colors">
                    <Clock className="h-5 w-5 text-primary mb-2" />
                    <p className="text-xs text-muted-foreground">ხელმისაწვდომობა</p>
                    <p className="text-sm font-medium text-primary underline">განრიგის ნახვა</p>
                  </div>
                </PopoverTrigger>
                <PopoverContent className="w-64" align="start">
                  <div className="space-y-3">
                    <h4 className="font-display font-semibold text-sm text-foreground">სამუშაო განრიგი</h4>
                    {listing!.workingHoursStart && listing!.workingHoursEnd && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>{listing!.workingHoursStart} – {listing!.workingHoursEnd}</span>
                      </div>
                    )}
                    {listing!.workingDays && listing!.workingDays.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {DAYS_SHORT.map((day, idx) => {
                          const isActive = listing!.workingDays?.includes(DAYS_EN[idx]);
                          return (
                            <Badge
                              key={day}
                              variant={isActive ? "default" : "outline"}
                              className={isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground opacity-50"}
                            >
                              {day}
                            </Badge>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">განრიგი არ არის მითითებული</p>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* CTA Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-card border border-border rounded-2xl p-6 shadow-card space-y-4">
              <div className="text-center">
                <p className="font-display text-2xl font-bold text-foreground">{priceLabel}</p>
                <p className="text-sm text-muted-foreground">
                  {listing!.priceType === "hourly"
                    ? "საათში"
                    : listing!.priceType === "fixed"
                    ? "ფიქსირებული ფასი"
                    : "ფასი შეთანხმებით"}
                </p>
              </div>
              <SaveButton listingId={Number(listing!.id)} />
            </div>
          </div>
        </div>

        {providerListings.length > 0 && (
          <div className="mt-16">
            <h2 className="font-display text-xl font-bold text-foreground mb-6">
              სხვა განცხადებები — {listing!.providerName}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {providerListings.map((l) => (
                <ListingCard key={l.id} listing={l} />
              ))}
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default ListingDetailPage;
