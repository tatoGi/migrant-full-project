import { Scale, Languages, Car, Home, FileText, Users, Briefcase } from "lucide-react";

export const PROFESSIONS = [
  "საბუთების მენეჯერი",
  "დამსაქმებელი",
  "ტაქსისტი",
  "მაკლერი",
  "ადვოკატი",
  "თარჯიმანი",
  "სხვა",
];

export const CATEGORIES = [
  { name: "საბუთების მენეჯერი", icon: FileText },
  { name: "დამსაქმებელი", icon: Users },
  { name: "ტაქსისტი", icon: Car },
  { name: "მაკლერი", icon: Home },
  { name: "ადვოკატი", icon: Scale },
  { name: "თარჯიმანი", icon: Languages },
  { name: "სხვა", icon: Briefcase },
];

export const COUNTRIES = [
  "რუსეთი",
  "საბერძნეთი",
  "თურქეთი",
  "იტალია",
  "გერმანია",
  "აშშ",
  "ესპანეთი",
  "საფრანგეთი",
  "პოლონეთი",
  "ისრაელი",
];

export const CITIES_BY_COUNTRY: Record<string, string[]> = {
  "რუსეთი": ["მოსკოვი", "სანქტ-პეტერბურგი", "კრასნოდარი", "როსტოვი"],
  "საბერძნეთი": ["ათენი", "თესალონიკი"],
  "თურქეთი": ["სტამბოლი", "ტრაპიზონი", "ანკარა", "იზმირი"],
  "იტალია": ["რომი", "მილანი", "ნეაპოლი", "ფლორენცია", "ტარანტო", "ბარი"],
  "გერმანია": ["ბერლინი", "მიუნხენი", "ჰამბურგი", "კიოლნი", "დიუსელდორფი", "ფრანკფურტი", "ჰანოვერი"],
  "აშშ": ["ნიუ-იორქი", "ბრუქლინი", "ნიუ ჯერსი", "ჩიკაგო", "ლოს-ანჯელესი"],
  "ესპანეთი": ["მადრიდი", "ბარსელონა", "ვალენსია"],
  "საფრანგეთი": ["პარიზი", "მარსელი", "ლიონი", "ნიცა", "სტრასბურგი"],
  "პოლონეთი": ["ვარშავა", "კრაკოვი", "გდანსკი", "პოზნანი"],
  "ისრაელი": ["თელ-ავივი", "ჰაიფა"],
};

export const LANGUAGES = [
  "ქართული", "ინგლისური", "რუსული", "გერმანული", "თურქული",
  "ფრანგული", "ესპანური", "იტალიური", "არაბული", "ჩინური",
  "პოლონური", "რუმინული", "პორტუგალიური", "ებრაული", "სპარსული",
];

export interface PhoneCountry {
  name: string;
  flag: string;
  dial: string;
}

export const PHONE_COUNTRIES: PhoneCountry[] = [
  { name: "საქართველო", flag: "🇬🇪", dial: "+995" },
  { name: "გერმანია", flag: "🇩🇪", dial: "+49" },
  { name: "თურქეთი", flag: "🇹🇷", dial: "+90" },
  { name: "რუსეთი", flag: "🇷🇺", dial: "+7" },
  { name: "საბერძნეთი", flag: "🇬🇷", dial: "+30" },
  { name: "იტალია", flag: "🇮🇹", dial: "+39" },
  { name: "ესპანეთი", flag: "🇪🇸", dial: "+34" },
  { name: "საფრანგეთი", flag: "🇫🇷", dial: "+33" },
  { name: "პოლონეთი", flag: "🇵🇱", dial: "+48" },
  { name: "ისრაელი", flag: "🇮🇱", dial: "+972" },
  { name: "აშშ", flag: "🇺🇸", dial: "+1" },
  { name: "გაერთ. სამეფო", flag: "🇬🇧", dial: "+44" },
  { name: "უკრაინა", flag: "🇺🇦", dial: "+380" },
  { name: "ავსტრია", flag: "🇦🇹", dial: "+43" },
  { name: "ნიდერლანდი", flag: "🇳🇱", dial: "+31" },
  { name: "შვედეთი", flag: "🇸🇪", dial: "+46" },
  { name: "ნორვეგია", flag: "🇳🇴", dial: "+47" },
  { name: "სომხეთი", flag: "🇦🇲", dial: "+374" },
  { name: "აზერბაიჯანი", flag: "🇦🇿", dial: "+994" },
  { name: "სხვა", flag: "🌍", dial: "+" },
];

export const NATIONALITIES = [
  "Syrian", "Turkish", "Iraqi", "Afghan", "Iranian",
  "Moroccan", "Egyptian", "Indian", "Pakistani", "Nigerian",
  "Brazilian", "Colombian", "Mexican", "Ukrainian", "Romanian",
  "Polish", "Chinese", "Vietnamese", "Filipino", "Somali",
];

export interface Listing {
  id: string;
  slug?: string;
  providerId: string;
  providerName: string;
  profession: string;
  country: string;
  city: string | string[];
  nationality: string;
  languages: string[];
  priceType: "fixed" | "hourly" | "negotiable";
  priceValue?: number;
  description: string;
  photo: string | null;
  rating?: number;
  reviewCount?: number;
  isVip?: boolean;
  bookingMode: "calendar" | "request";
  createdAt: string;
  phone?: string;
  email?: string;
  workingDays?: string[];
  workingHoursStart?: string;
  workingHoursEnd?: string;
}
