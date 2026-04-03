"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { COUNTRIES, CITIES_BY_COUNTRY, PROFESSIONS } from "@/lib/data";
import SearchableSelect from "@/components/SearchableSelect";

interface HeroSearchBarProps {
  initialCountry?: string;
  initialCity?: string;
  initialProfession?: string;
  compact?: boolean;
}

const HeroSearchBar = ({
  initialCountry = "",
  initialCity = "",
  initialProfession = "",
  compact = false,
}: HeroSearchBarProps) => {
  const [country, setCountry] = useState(initialCountry);
  const [city, setCity] = useState(initialCity);
  const [profession, setProfession] = useState(initialProfession);
  const router = useRouter();

  const cities = country ? CITIES_BY_COUNTRY[country] || [] : [];

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (country) params.set("country", country);
    if (city) params.set("city", city);
    if (profession) params.set("profession", profession);
    router.push(`/search?${params.toString()}`);
  };

  const handleCountryChange = (val: string) => {
    setCountry(val);
    setCity("");
  };

  return (
    <div
      className={`bg-card rounded-2xl shadow-card-hover border border-border ${
        compact ? "p-2" : "p-3"
      }`}
    >
      <div className="flex flex-col md:flex-row gap-2">
        {/* Country */}
        <div className="flex-1 min-w-0">
          <SearchableSelect
            label="ქვეყანა"
            value={country}
            onChange={handleCountryChange}
            options={COUNTRIES}
            placeholder="ნებისმიერი ქვეყანა"
            searchPlaceholder="ქვეყნის ძიება..."
          />
        </div>

        <div className="hidden md:block w-px bg-border self-stretch" />

        {/* City */}
        <div className="flex-1 min-w-0">
          <SearchableSelect
            label="ქალაქი"
            value={city}
            onChange={setCity}
            options={cities}
            placeholder="ნებისმიერი ქალაქი"
            searchPlaceholder="ქალაქის ძიება..."
            disabled={!country}
          />
        </div>

        <div className="hidden md:block w-px bg-border self-stretch" />

        {/* Profession */}
        <div className="flex-1 min-w-0">
          <SearchableSelect
            label="პროფესია / სერვისი"
            value={profession}
            onChange={setProfession}
            options={PROFESSIONS}
            placeholder="ნებისმიერი პროფესია"
            searchPlaceholder="პროფესიის ძიება..."
          />
        </div>

        <Button
          onClick={handleSearch}
          size={compact ? "default" : "lg"}
          className="rounded-xl gap-2 px-6 shrink-0"
        >
          <Search className="h-4 w-4" />
          ძიება
        </Button>
      </div>
    </div>
  );
};

export default HeroSearchBar;
