"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { SlidersHorizontal, Loader2 } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HeroSearchBar from "@/components/HeroSearchBar";
import ListingCard from "@/components/ListingCard";
import { NATIONALITIES, LANGUAGES } from "@/lib/data";
import { fetchListings, type ApiListing } from "@/lib/listingsApi";

const SORT_OPTIONS = [
  { value: "best",      label: "საუკეთესო შესაბამისობა", sort: "-created_at" },
  { value: "price_low", label: "ყველაზე დაბალი ფასი",    sort: "price_value" },
  { value: "recent",    label: "ყველაზე ახალი",           sort: "-created_at" },
  { value: "views",     label: "ყველაზე პოპულარული",      sort: "-views_count" },
];

// Map ApiListing → shape ListingCard expects
function toCardListing(l: ApiListing) {
  return {
    id: String(l.id),
    slug: l.slug,
    providerId: String(l.id),
    providerName: l.provider_name,
    profession: l.profession,
    country: l.country,
    city: l.city,
    nationality: l.nationality,
    languages: l.languages ?? [],
    priceType: l.price_type,
    priceValue: l.price_value ?? undefined,
    description: l.description,
    photo: l.photo ?? l.photos?.[0]?.url ?? null,
    isVip: l.listing_type === "vip",
    bookingMode: l.booking_mode,
    createdAt: l.created_at,
  };
}

const SearchResultsContent = () => {
  const searchParams = useSearchParams();
  const country    = searchParams.get("country")    ?? "";
  const city       = searchParams.get("city")       ?? "";
  const profession = searchParams.get("profession") ?? "";

  const [nationality, setNationality] = useState("");
  const [language, setLanguage]       = useState("");
  const [sortBy, setSortBy]           = useState("best");
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage]               = useState(1);

  const sortParam = SORT_OPTIONS.find((o) => o.value === sortBy)?.sort ?? "-created_at";

  const { data, isLoading, isError } = useQuery({
    queryKey: ["listings", { country, city, profession, nationality, language, sort: sortParam, page }],
    queryFn: () =>
      fetchListings({ country, city, profession, nationality, language, sort: sortParam, page }),
    staleTime: 30_000,
  });

  const listings = data?.data ?? [];
  const meta     = data?.meta;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pt-20 pb-6 bg-card border-b border-border">
        <div className="container mx-auto px-4">
          <HeroSearchBar
            initialCountry={country}
            initialCity={city}
            initialProfession={profession}
            compact
          />
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-xl font-bold text-foreground">
            {isLoading
              ? "იტვირთება..."
              : `ნაპოვნია ${meta?.total ?? 0} პროფესიონალი`}
          </h2>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="md:hidden flex items-center gap-2 text-sm text-muted-foreground border border-border rounded-lg px-3 py-2"
            >
              <SlidersHorizontal className="h-4 w-4" /> ფილტრები
            </button>
            <select
              value={sortBy}
              onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
              className="text-sm bg-card border border-border rounded-lg px-3 py-2 text-foreground font-body"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-8">
          {/* Sidebar filters */}
          <aside className={`${showFilters ? "block" : "hidden"} md:block w-full md:w-60 shrink-0 space-y-5`}>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                პროვაიდერის ეროვნება
              </label>
              <select
                value={nationality}
                onChange={(e) => { setNationality(e.target.value); setPage(1); }}
                className="w-full text-sm bg-card border border-border rounded-lg px-3 py-2 text-foreground font-body"
              >
                <option value="">ნებისმიერი</option>
                {NATIONALITIES.map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">ენა</label>
              <select
                value={language}
                onChange={(e) => { setLanguage(e.target.value); setPage(1); }}
                className="w-full text-sm bg-card border border-border rounded-lg px-3 py-2 text-foreground font-body"
              >
                <option value="">ნებისმიერი</option>
                {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          </aside>

          {/* Results */}
          <div className="flex-1">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : isError ? (
              <div className="text-center py-20">
                <p className="text-muted-foreground text-lg">შეცდომა. სცადეთ ხელახლა.</p>
              </div>
            ) : listings.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-muted-foreground text-lg">
                  თქვენი კრიტერიუმებით პროფესიონალი ვერ მოიძებნა.
                </p>
                <p className="text-sm text-muted-foreground mt-1">სცადეთ ძიების გაფართოება.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {listings.map((listing) => (
                    <ListingCard key={listing.id} listing={toCardListing(listing)} />
                  ))}
                </div>

                {/* Pagination */}
                {meta && meta.last_page > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-10">
                    <button
                      disabled={page === 1}
                      onClick={() => setPage((p) => p - 1)}
                      className="px-4 py-2 text-sm border border-border rounded-lg disabled:opacity-40 hover:bg-muted transition-colors"
                    >
                      ← წინა
                    </button>
                    <span className="text-sm text-muted-foreground">
                      {page} / {meta.last_page}
                    </span>
                    <button
                      disabled={page === meta.last_page}
                      onClick={() => setPage((p) => p + 1)}
                      className="px-4 py-2 text-sm border border-border rounded-lg disabled:opacity-40 hover:bg-muted transition-colors"
                    >
                      შემდეგი →
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

const SearchPage = () => (
  <Suspense
    fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    }
  >
    <SearchResultsContent />
  </Suspense>
);

export default SearchPage;
