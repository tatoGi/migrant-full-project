import api from "./api";

export interface ApiListing {
  id: number;
  provider_name: string;
  profession: string;
  country: string;
  city: string;
  nationality: string;
  languages: string[];
  price_type: "fixed" | "hourly" | "negotiable";
  price_value: number | null;
  description: string;
  photos: { uuid: string; url: string }[];
  photo: string | null;
  slug: string;
  listing_type: "standard" | "vip";
  booking_mode: "calendar" | "request";
  status: string;
  views_count: number;
  created_at: string;
}

export interface ListingsMeta {
  current_page: number;
  last_page: number;
  total: number;
}

export interface ListingsResponse {
  data: ApiListing[];
  meta: ListingsMeta;
}

export interface ListingsFilters {
  country?: string;
  city?: string;
  profession?: string;
  nationality?: string;
  language?: string;
  search?: string;
  sort?: string;
  page?: number;
}

export async function fetchListings(filters: ListingsFilters): Promise<ListingsResponse> {
  const params = new URLSearchParams();

  if (filters.country)    params.set("filter[country]", filters.country);
  if (filters.city)       params.set("filter[city]", filters.city);
  if (filters.profession) params.set("filter[profession]", filters.profession);
  if (filters.nationality) params.set("filter[nationality]", filters.nationality);
  if (filters.language)   params.set("filter[language]", filters.language);
  if (filters.search)     params.set("filter[search]", filters.search);
  if (filters.sort)       params.set("sort", filters.sort);
  if (filters.page && filters.page > 1) params.set("page", String(filters.page));

  const { data } = await api.get<ListingsResponse>(`/listings?${params.toString()}`);
  return data;
}
