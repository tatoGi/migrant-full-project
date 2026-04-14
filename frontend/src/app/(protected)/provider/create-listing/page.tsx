"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Upload, X, ChevronDown, Search } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PROFESSIONS, LANGUAGES } from "@/lib/data";
import { getAllCountries, getCitiesOfCountry, getLanguagesForCountry } from "@/lib/geography";
import api from "@/lib/api";

const steps = ["ძირითადი ინფო", "სერვისის დეტალები", "ფასი და ფოტოები"];

interface TempPhoto { token: string; url: string; name: string; }

const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8082/api").replace("/api", "");
const ALL_COUNTRIES = getAllCountries();

const CreateListingPage = () => {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState(0);

  // ── Dropdown open states ──────────────────────────────────────
  const [phoneOpen,       setPhoneOpen]       = useState(false);
  const [natOpen,         setNatOpen]         = useState(false);  // step 0 nationality
  const [countryOpen,     setCountryOpen]     = useState(false);  // step 1 country
  const [cityOpen,        setCityOpen]        = useState(false);

  // ── Dropdown refs (for click-outside) ────────────────────────
  const phoneRef   = useRef<HTMLDivElement>(null);
  const natRef     = useRef<HTMLDivElement>(null);
  const countryRef = useRef<HTMLDivElement>(null);
  const cityRef    = useRef<HTMLDivElement>(null);

  // ── Search strings ────────────────────────────────────────────
  const [phoneSearch,   setPhoneSearch]   = useState("");
  const [natSearch,     setNatSearch]     = useState("");
  const [countrySearch, setCountrySearch] = useState("");
  const [citySearch,    setCitySearch]    = useState("");

  // ── Phone ─────────────────────────────────────────────────────
  const [dialCode,     setDialCode]     = useState("+995");
  const [phoneNumber,  setPhoneNumber]  = useState("");

  // ── Form ──────────────────────────────────────────────────────
  const [form, setForm] = useState({
    provider_name: "",
    nationality: "",
    languages:    [] as string[],
    profession:   "",
    countryIso:   "",
    countryName:  "",
    cities:       [] as string[],
    description:  "",
    listing_type: "standard",
    price_type:   "negotiable",
    price_value:  "",
    booking_mode: "request",
  });

  const [photos,         setPhotos]         = useState<TempPhoto[]>([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // ── Click-outside: close all dropdowns ───────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const t = e.target as Node;
      if (phoneOpen   && !phoneRef.current?.contains(t))   setPhoneOpen(false);
      if (natOpen     && !natRef.current?.contains(t))     setNatOpen(false);
      if (countryOpen && !countryRef.current?.contains(t)) setCountryOpen(false);
      if (cityOpen    && !cityRef.current?.contains(t))    setCityOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [phoneOpen, natOpen, countryOpen, cityOpen]);

  // ── Close all when changing step ─────────────────────────────
  const closeAll = () => {
    setPhoneOpen(false); setNatOpen(false);
    setCountryOpen(false); setCityOpen(false);
  };

  // ── Filtered lists ────────────────────────────────────────────
  const filteredPhoneCountries = useMemo(() => {
    const q = phoneSearch.toLowerCase();
    return q ? ALL_COUNTRIES.filter(c => c.name.toLowerCase().includes(q) || c.dialCode.includes(q)) : ALL_COUNTRIES;
  }, [phoneSearch]);

  const filteredNat = useMemo(() => {
    const q = natSearch.toLowerCase();
    return q ? ALL_COUNTRIES.filter(c => c.name.toLowerCase().includes(q)) : ALL_COUNTRIES;
  }, [natSearch]);

  const filteredCountries = useMemo(() => {
    const q = countrySearch.toLowerCase();
    return q ? ALL_COUNTRIES.filter(c => c.name.toLowerCase().includes(q)) : ALL_COUNTRIES;
  }, [countrySearch]);

  const availableCities = useMemo(
    () => form.countryIso ? getCitiesOfCountry(form.countryIso) : [],
    [form.countryIso]
  );

  const filteredCities = useMemo(() => {
    const q = citySearch.toLowerCase();
    const list = q ? availableCities.filter(c => c.toLowerCase().includes(q)) : availableCities;
    return list.slice(0, 80);
  }, [availableCities, citySearch]);

  const selectedPhoneCountry = ALL_COUNTRIES.find(c => c.dialCode === dialCode);

  // ── Helpers ───────────────────────────────────────────────────
  const toggleLanguage = (lang: string) =>
    setForm(f => ({
      ...f,
      languages: f.languages.includes(lang)
        ? f.languages.filter(l => l !== lang)
        : [...f.languages, lang],
    }));

  const toggleCity = (city: string) =>
    setForm(f => ({
      ...f,
      cities: f.cities.includes(city)
        ? f.cities.filter(c => c !== city)
        : [...f.cities, city],
    }));

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    if (photos.length + files.length > 10) { toast.error("მაქსიმუმ 10 ფოტო."); return; }
    setUploadingPhoto(true);
    for (const file of files) {
      try {
        const fd = new FormData();
        fd.append("photo", file);
        const { data } = await api.post("/uploads/temp", fd, { headers: { "Content-Type": "multipart/form-data" } });
        setPhotos(p => [...p, { token: data.token, url: data.url, name: file.name }]);
      } catch { toast.error(`${file.name} — ატვირთვა ვერ მოხდა.`); }
    }
    setUploadingPhoto(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const publishMutation = useMutation({
    mutationFn: () => api.post("/provider/listings", {
      provider_name: form.provider_name,
      phone:         dialCode + phoneNumber.replace(/\s/g, ""),
      nationality:   form.nationality,
      languages:     form.languages,
      profession:    form.profession,
      country:       form.countryName,
      city:          form.cities,
      description:   form.description,
      listing_type:  form.listing_type,
      price_type:    form.price_type,
      price_value:   form.price_value ? Number(form.price_value) : null,
      booking_mode:  form.booking_mode,
      photos:        photos.map(p => p.token),
    }),
    onSuccess: () => { toast.success("განცხადება გამოქვეყნდა!"); router.push("/provider/dashboard"); },
    onError: (err: unknown) => {
      const errors = (err as { response?: { data?: { errors?: Record<string, string[]> } } })?.response?.data?.errors;
      toast.error(errors ? (Object.values(errors)[0] as string[])[0] : "შეცდომა. სცადეთ თავიდან.");
    },
  });

  const canNext = () => {
    if (step === 0) return form.provider_name && phoneNumber.trim() && form.nationality && form.languages.length > 0;
    if (step === 1) return form.profession && form.countryName && form.cities.length > 0 && form.description.length >= 20;
    return true;
  };

  // ── Reusable dropdown styles ──────────────────────────────────
  const dropdownPanel = "absolute top-11 left-0 z-50 w-full bg-popover border border-border rounded-lg shadow-lg overflow-hidden";
  const dropdownSearch = "w-full pl-7 pr-2 py-1.5 text-sm bg-background border border-input rounded-md outline-none";
  const dropdownList = "max-h-56 overflow-y-auto";

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pt-20 container mx-auto px-4 py-8 max-w-2xl">
        <Link href="/provider/dashboard" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4" /> პანელზე დაბრუნება
        </Link>
        <h1 className="font-display text-2xl font-bold text-foreground mb-2">ახალი განცხადების შექმნა</h1>
        <p className="text-muted-foreground mb-8">შეავსეთ სერვისის დეტალები კლიენტების მოსაზიდად</p>

        {/* Steps */}
        <div className="flex items-center gap-2 mb-8">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 ${i <= step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{i + 1}</div>
              <span className={`text-sm hidden sm:inline ${i <= step ? "text-foreground font-medium" : "text-muted-foreground"}`}>{s}</span>
              {i < steps.length - 1 && <div className="flex-1 h-px bg-border" />}
            </div>
          ))}
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">

          {/* ── Step 0 ── */}
          {step === 0 && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">სრული სახელი *</label>
                <Input placeholder="თქვენი სრული სახელი" value={form.provider_name}
                  onChange={e => setForm(f => ({ ...f, provider_name: e.target.value }))} />
              </div>

              {/* Phone */}
              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">ტელეფონის ნომერი *</label>
                <div className="flex gap-2">
                  <div ref={phoneRef} className="relative shrink-0">
                    <button type="button" onClick={() => setPhoneOpen(o => !o)}
                      className="h-10 px-3 border border-input rounded-md text-sm bg-background text-foreground flex items-center gap-1.5 min-w-[110px]">
                      <span>{selectedPhoneCountry?.flag ?? "🌍"}</span>
                      <span>{dialCode}</span>
                      <ChevronDown className="h-3 w-3 text-muted-foreground ml-auto" />
                    </button>
                    {phoneOpen && (
                      <div className="absolute top-11 left-0 z-50 w-72 bg-popover border border-border rounded-lg shadow-lg overflow-hidden">
                        <div className="p-2 border-b border-border">
                          <div className="relative">
                            <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-muted-foreground" />
                            <input autoFocus placeholder="ქვეყნის ძიება..." value={phoneSearch}
                              onChange={e => setPhoneSearch(e.target.value)} className={dropdownSearch} />
                          </div>
                        </div>
                        <div className={dropdownList}>
                          {filteredPhoneCountries.map(c => (
                            <button key={c.isoCode} type="button"
                              onClick={() => { setDialCode(c.dialCode); setPhoneOpen(false); setPhoneSearch(""); }}
                              className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors text-left ${c.dialCode === dialCode ? "bg-primary/10 text-primary" : ""}`}>
                              <span className="text-base">{c.flag}</span>
                              <span className="flex-1 truncate">{c.name}</span>
                              <span className="text-muted-foreground shrink-0">{c.dialCode}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <Input placeholder="555 123 456" value={phoneNumber}
                    onChange={e => setPhoneNumber(e.target.value)} className="flex-1" />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  სრული ნომერი: <span className="text-foreground">{dialCode}{phoneNumber.replace(/\s/g, "") || "..."}</span>
                </p>
              </div>

              {/* Nationality */}
              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">ეროვნება *</label>
                <div ref={natRef} className="relative">
                  <button type="button" onClick={() => setNatOpen(o => !o)}
                    className="w-full h-10 px-3 border border-input rounded-md text-sm bg-background text-foreground flex items-center justify-between">
                    <span className={form.nationality ? "" : "text-muted-foreground"}>
                      {form.nationality || "აირჩიეთ ეროვნება"}
                    </span>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </button>
                  {natOpen && (
                    <div className={dropdownPanel}>
                      <div className="p-2 border-b border-border">
                        <div className="relative">
                          <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-muted-foreground" />
                          <input autoFocus placeholder="ძიება..." value={natSearch}
                            onChange={e => setNatSearch(e.target.value)} className={dropdownSearch} />
                        </div>
                      </div>
                      <div className={dropdownList}>
                        {filteredNat.map(c => (
                          <button key={c.isoCode} type="button"
                            onClick={() => {
                              const suggested = getLanguagesForCountry(c.isoCode);
                              setForm(f => ({
                                ...f,
                                nationality: c.name,
                                languages: suggested.length > 0 ? suggested : f.languages,
                              }));
                              setNatOpen(false); setNatSearch("");
                            }}
                            className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors text-left ${form.nationality === c.name ? "bg-primary/10 text-primary" : ""}`}>
                            <span>{c.flag}</span><span>{c.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Languages */}
              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">ენები *</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {LANGUAGES.map(lang => (
                    <button key={lang} type="button" onClick={() => toggleLanguage(lang)}
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${form.languages.includes(lang) ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground border-border hover:border-foreground/30"}`}>
                      {lang}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Step 1 ── */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">პროფესია/სერვისი *</label>
                <select className="w-full h-10 px-3 border border-input rounded-md text-sm bg-background text-foreground"
                  value={form.profession} onChange={e => setForm(f => ({ ...f, profession: e.target.value }))}>
                  <option value="">აირჩიეთ პროფესია</option>
                  {PROFESSIONS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              {/* Country */}
              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">ქვეყანა *</label>
                <div ref={countryRef} className="relative">
                  <button type="button" onClick={() => { setCityOpen(false); setCountryOpen(o => !o); }}
                    className="w-full h-10 px-3 border border-input rounded-md text-sm bg-background text-foreground flex items-center justify-between">
                    <span className={form.countryName ? "" : "text-muted-foreground"}>
                      {form.countryName
                        ? `${ALL_COUNTRIES.find(c => c.isoCode === form.countryIso)?.flag ?? ""} ${form.countryName}`
                        : "აირჩიეთ ქვეყანა"}
                    </span>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </button>
                  {countryOpen && (
                    <div className={dropdownPanel}>
                      <div className="p-2 border-b border-border">
                        <div className="relative">
                          <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-muted-foreground" />
                          <input autoFocus placeholder="ქვეყნის ძიება..." value={countrySearch}
                            onChange={e => setCountrySearch(e.target.value)} className={dropdownSearch} />
                        </div>
                      </div>
                      <div className={dropdownList}>
                        {filteredCountries.map(c => (
                          <button key={c.isoCode} type="button"
                            onClick={() => { setForm(f => ({ ...f, countryIso: c.isoCode, countryName: c.name, cities: [] })); setCountryOpen(false); setCountrySearch(""); setCitySearch(""); }}
                            className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors text-left ${form.countryIso === c.isoCode ? "bg-primary/10 text-primary" : ""}`}>
                            <span>{c.flag}</span><span>{c.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Cities multi-select */}
              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">
                  ქალაქი * <span className="text-muted-foreground font-normal">(შეიძლება რამდენიმე)</span>
                </label>
                {form.cities.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {form.cities.map(city => (
                      <span key={city} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-primary text-primary-foreground">
                        {city}
                        <button type="button" onClick={() => toggleCity(city)} className="hover:opacity-70">
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                {!form.countryName ? (
                  <p className="text-sm text-muted-foreground">ჯერ აირჩიეთ ქვეყანა</p>
                ) : (
                  <div ref={cityRef} className="relative">
                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <input placeholder="ქალაქის ძიება..." value={citySearch}
                        onFocus={() => setCityOpen(true)}
                        onBlur={() => setTimeout(() => setCityOpen(false), 150)}
                        onChange={e => { setCitySearch(e.target.value); setCityOpen(true); }}
                        className="w-full pl-9 pr-3 h-10 border border-input rounded-md text-sm bg-background text-foreground outline-none focus:ring-2 focus:ring-primary/20" />
                    </div>
                    {cityOpen && filteredCities.length > 0 && (
                      <div className="absolute top-11 left-0 z-50 w-full bg-popover border border-border rounded-lg shadow-lg overflow-hidden">
                        <div className="max-h-52 overflow-y-auto">
                          {filteredCities.map(city => (
                            <button key={city} type="button"
                              onMouseDown={e => e.preventDefault()}
                              onClick={() => { toggleCity(city); setCitySearch(""); }}
                              className={`w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors flex items-center justify-between ${form.cities.includes(city) ? "bg-primary/10 text-primary" : ""}`}>
                              {city}
                              {form.cities.includes(city) && <span className="text-xs">✓</span>}
                            </button>
                          ))}
                        </div>
                        {availableCities.length > 80 && !citySearch && (
                          <p className="text-xs text-muted-foreground px-3 py-2 border-t border-border">
                            სულ {availableCities.length} ქალაქი — სიზუსტისთვის მოძებნეთ
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">აღწერა * (მინ. 20 სიმბოლო)</label>
                <Textarea placeholder="აღწერეთ თქვენი სერვისი, გამოცდილება და რა გამოგარჩევთ..." rows={4}
                  value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                <p className="text-xs text-muted-foreground mt-1 text-right">{form.description.length} სიმბოლო</p>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">განცხადების ტიპი *</label>
                <div className="grid grid-cols-2 gap-3">
                  {(["standard", "vip"] as const).map(type => (
                    <label key={type} className={`flex items-center gap-3 border rounded-xl p-4 cursor-pointer transition-colors ${form.listing_type === type ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}>
                      <input type="radio" name="listingType" value={type} checked={form.listing_type === type}
                        onChange={() => setForm(f => ({ ...f, listing_type: type }))} className="accent-primary" />
                      <div>
                        <p className="text-sm font-medium text-foreground">{type === "standard" ? "სტანდარტული" : "VIP ⭐"}</p>
                        <p className="text-xs text-muted-foreground">{type === "standard" ? "უფასო განცხადება" : "პრიორიტეტული განთავსება"}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Step 2 ── */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">ფასის ტიპი *</label>
                <select className="w-full h-10 px-3 border border-input rounded-md text-sm bg-background text-foreground"
                  value={form.price_type} onChange={e => setForm(f => ({ ...f, price_type: e.target.value }))}>
                  <option value="fixed">ფიქსირებული</option>
                  <option value="hourly">საათობრივი</option>
                  <option value="negotiable">შეთანხმებით</option>
                </select>
              </div>
              {form.price_type !== "negotiable" && (
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1.5">ფასი (€) *</label>
                  <Input type="number" placeholder="მაგ. 50" min={0} value={form.price_value}
                    onChange={e => setForm(f => ({ ...f, price_value: e.target.value }))} />
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">ფოტოები (მაქს. 10)</label>
                {photos.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 mb-3">
                    {photos.map(ph => (
                      <div key={ph.token} className="relative aspect-square rounded-lg overflow-hidden border border-border group">
                        <img src={`${API_BASE}${ph.url}`} alt={ph.name} className="w-full h-full object-cover" />
                        <button type="button" onClick={() => setPhotos(p => p.filter(x => x.token !== ph.token))}
                          className="absolute top-1 right-1 bg-black/60 rounded-full p-0.5 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {photos.length < 10 && (
                  <div onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
                    <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">{uploadingPhoto ? "იტვირთება..." : "დააჭირეთ ასატვირთად"}</p>
                    <p className="text-xs text-muted-foreground mt-1">JPG, PNG, WEBP — 5MB-მდე</p>
                  </div>
                )}
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={handlePhotoSelect} />
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            <Button variant="outline" onClick={() => { setStep(s => Math.max(0, s - 1)); closeAll(); }} disabled={step === 0}>
              <ArrowLeft className="h-4 w-4 mr-1" /> უკან
            </Button>
            {step < steps.length - 1 ? (
              <Button onClick={() => { setStep(s => s + 1); closeAll(); }} disabled={!canNext()}>
                შემდეგი <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={() => publishMutation.mutate()} disabled={publishMutation.isPending || uploadingPhoto}>
                {publishMutation.isPending ? "იგზავნება..." : "განცხადების გამოქვეყნება"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateListingPage;
