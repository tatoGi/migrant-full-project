import { Country, City } from "country-state-city";
import isoCountries from "i18n-iso-countries";
import ka from "i18n-iso-countries/langs/ka.json";
import { translateCity } from "./city-translations";

isoCountries.registerLocale(ka);

export interface GeoCountry {
  isoCode: string;
  name: string;      // Georgian
  flag: string;
  dialCode: string;  // e.g. "+995"
}

let _countries: GeoCountry[] | null = null;

export function getAllCountries(): GeoCountry[] {
  if (_countries) return _countries;

  const kaNames = isoCountries.getNames("ka", { select: "official" });

  _countries = Country.getAllCountries()
    .map((c) => ({
      isoCode: c.isoCode,
      name: kaNames[c.isoCode] ?? c.name,
      flag: c.flag ?? "",
      dialCode: "+" + c.phonecode.replace(/\+/g, ""),
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "ka"));

  return _countries;
}

export function getCitiesOfCountry(isoCode: string): string[] {
  const cities = City.getCitiesOfCountry(isoCode) ?? [];
  const translated = cities.map((c) => translateCity(c.name));
  const unique = [...new Set(translated)];
  return unique.sort((a, b) => a.localeCompare(b, "ka"));
}

export function getCountryByIso(isoCode: string): GeoCountry | undefined {
  return getAllCountries().find((c) => c.isoCode === isoCode);
}

export function getCountryByName(name: string): GeoCountry | undefined {
  return getAllCountries().find((c) => c.name === name);
}

/** Main spoken languages per country ISO code (Georgian names) */
const COUNTRY_LANGUAGES: Record<string, string[]> = {
  GE: ["ქართული"],
  DE: ["გერმანული", "ინგლისური"],
  TR: ["თურქული", "ინგლისური"],
  RU: ["რუსული", "ინგლისური"],
  GR: ["ბერძნული", "ინგლისური"],
  IT: ["იტალიური", "ინგლისური"],
  ES: ["ესპანური", "ინგლისური"],
  FR: ["ფრანგული", "ინგლისური"],
  PL: ["პოლონური", "ინგლისური"],
  IL: ["ებრაული", "რუსული", "ინგლისური"],
  US: ["ინგლისური"],
  GB: ["ინგლისური"],
  UA: ["უკრაინული", "რუსული"],
  AT: ["გერმანული", "ინგლისური"],
  NL: ["ნიდერლანდიური", "ინგლისური"],
  SE: ["შვედური", "ინგლისური"],
  NO: ["ნორვეგიული", "ინგლისური"],
  AM: ["სომხური", "რუსული"],
  AZ: ["აზერბაიჯანული", "რუსული"],
  CZ: ["ჩეხური", "ინგლისური"],
  PT: ["პორტუგალიური", "ინგლისური"],
  BE: ["ფრანგული", "ნიდერლანდიური"],
  CH: ["გერმანული", "ფრანგული", "ინგლისური"],
  CA: ["ინგლისური", "ფრანგული"],
  AU: ["ინგლისური"],
};

export function getLanguagesForCountry(isoCode: string): string[] {
  return COUNTRY_LANGUAGES[isoCode] ?? [];
}
