"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PROFESSIONS } from "@/lib/data";
import { getAllCountries, getCitiesOfCountry, getCountryByName } from "@/lib/geography";
import SearchableSelect from "@/components/SearchableSelect";

const ALL_COUNTRIES = getAllCountries();
const COUNTRY_NAMES = ALL_COUNTRIES.map((c) => `${c.flag} ${c.name}`);

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
  // country stored as "🇩🇪 გერმანია" display value; bare name sent to API
  const [countryDisplay, setCountryDisplay] = useState(
    initialCountry
      ? `${ALL_COUNTRIES.find((c) => c.name === initialCountry)?.flag ?? ""} ${initialCountry}`.trim()
      : ""
  );
  const [city, setCity] = useState(initialCity);
  const [profession, setProfession] = useState(initialProfession);
  const router = useRouter();

  // Derive ISO and bare name from display value
  const countryName = countryDisplay.replace(/^\S+\s/, "").trim(); // strip leading flag emoji
  const countryIso = useMemo(
    () => getCountryByName(countryName)?.isoCode ?? "",
    [countryName]
  );

  const cities = useMemo(
    () => (countryIso ? getCitiesOfCountry(countryIso) : []),
    [countryIso]
  );

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (countryName) params.set("country", countryName);
    if (city) params.set("city", city);
    if (profession) params.set("profession", profession);
    router.push(`/search?${params.toString()}`);
  };

  const handleCountryChange = (val: string) => {
    setCountryDisplay(val);
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
            value={countryDisplay}
            onChange={handleCountryChange}
            options={COUNTRY_NAMES}
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
            disabled={!countryDisplay}
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
