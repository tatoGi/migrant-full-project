"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Upload, X } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PROFESSIONS, COUNTRIES, CITIES_BY_COUNTRY, LANGUAGES } from "@/lib/data";
import api from "@/lib/api";

const steps = ["ძირითადი ინფო", "სერვისის დეტალები", "ფასი და ფოტოები"];

interface TempPhoto {
  token: string;
  url: string;
  name: string;
}

const CreateListingPage = () => {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState(0);

  const [form, setForm] = useState({
    provider_name: "",
    phone: "",
    nationality: "",
    languages: [] as string[],
    profession: "",
    country: "",
    city: "",
    description: "",
    listing_type: "standard",
    price_type: "negotiable",
    price_value: "",
    booking_mode: "request",
  });

  const [photos, setPhotos] = useState<TempPhoto[]>([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const cities = form.country ? CITIES_BY_COUNTRY[form.country] || [] : [];

  const toggleLanguage = (lang: string) => {
    setForm((f) => ({
      ...f,
      languages: f.languages.includes(lang)
        ? f.languages.filter((l) => l !== lang)
        : [...f.languages, lang],
    }));
  };

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    if (photos.length + files.length > 10) {
      toast.error("მაქსიმუმ 10 ფოტო შეიძლება.");
      return;
    }

    setUploadingPhoto(true);
    for (const file of files) {
      try {
        const fd = new FormData();
        fd.append("photo", file);
        const { data } = await api.post("/uploads/temp", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        setPhotos((p) => [...p, { token: data.token, url: data.url, name: file.name }]);
      } catch {
        toast.error(`${file.name} — ატვირთვა ვერ მოხდა.`);
      }
    }
    setUploadingPhoto(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removePhoto = (token: string) => {
    setPhotos((p) => p.filter((ph) => ph.token !== token));
  };

  const publishMutation = useMutation({
    mutationFn: () =>
      api.post("/provider/listings", {
        ...form,
        price_value: form.price_value ? Number(form.price_value) : null,
        photos: photos.map((p) => p.token),
      }),
    onSuccess: () => {
      toast.success("განცხადება გამოქვეყნდა!");
      router.push("/provider/dashboard");
    },
    onError: (err: unknown) => {
      const errors = (err as { response?: { data?: { errors?: Record<string, string[]> } } })
        ?.response?.data?.errors;
      if (errors) {
        const first = Object.values(errors)[0] as string[];
        toast.error(first[0]);
      } else {
        toast.error("შეცდომა. სცადეთ თავიდან.");
      }
    },
  });

  const canNext = () => {
    if (step === 0)
      return form.provider_name && form.phone && form.nationality && form.languages.length > 0;
    if (step === 1)
      return form.profession && form.country && form.city && form.description.length >= 20;
    return true;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pt-20 container mx-auto px-4 py-8 max-w-2xl">
        <Link
          href="/provider/dashboard"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> პანელზე დაბრუნება
        </Link>

        <h1 className="font-display text-2xl font-bold text-foreground mb-2">
          ახალი განცხადების შექმნა
        </h1>
        <p className="text-muted-foreground mb-8">შეავსეთ სერვისის დეტალები კლიენტების მოსაზიდად</p>

        {/* Steps */}
        <div className="flex items-center gap-2 mb-8">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 ${
                  i <= step
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {i + 1}
              </div>
              <span
                className={`text-sm hidden sm:inline ${
                  i <= step ? "text-foreground font-medium" : "text-muted-foreground"
                }`}
              >
                {s}
              </span>
              {i < steps.length - 1 && <div className="flex-1 h-px bg-border" />}
            </div>
          ))}
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          {/* Step 0 — Basic Info */}
          {step === 0 && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">
                  სრული სახელი *
                </label>
                <Input
                  placeholder="თქვენი სრული სახელი"
                  value={form.provider_name}
                  onChange={(e) => setForm((f) => ({ ...f, provider_name: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">
                  ტელეფონის ნომერი *
                </label>
                <Input
                  placeholder="+49 123 456 7890"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">
                  ეროვნება *
                </label>
                <select
                  className="w-full h-10 px-3 border border-input rounded-md text-sm bg-background text-foreground"
                  value={form.nationality}
                  onChange={(e) => setForm((f) => ({ ...f, nationality: e.target.value }))}
                >
                  <option value="">აირჩიეთ ეროვნება</option>
                  {COUNTRIES.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">ენები *</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => toggleLanguage(lang)}
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                        form.languages.includes(lang)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-muted text-muted-foreground border-border hover:border-foreground/30"
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 1 — Service Details */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">
                  პროფესია/სერვისი *
                </label>
                <select
                  className="w-full h-10 px-3 border border-input rounded-md text-sm bg-background text-foreground"
                  value={form.profession}
                  onChange={(e) => setForm((f) => ({ ...f, profession: e.target.value }))}
                >
                  <option value="">აირჩიეთ პროფესია</option>
                  {PROFESSIONS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1.5">
                    ქვეყანა *
                  </label>
                  <select
                    value={form.country}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, country: e.target.value, city: "" }))
                    }
                    className="w-full h-10 px-3 border border-input rounded-md text-sm bg-background text-foreground"
                  >
                    <option value="">აირჩიეთ ქვეყანა</option>
                    {COUNTRIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1.5">
                    ქალაქი *
                  </label>
                  <select
                    disabled={!form.country}
                    value={form.city}
                    onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                    className="w-full h-10 px-3 border border-input rounded-md text-sm bg-background text-foreground disabled:opacity-40"
                  >
                    <option value="">აირჩიეთ ქალაქი</option>
                    {cities.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">
                  აღწერა * (მინ. 20 სიმბოლო)
                </label>
                <Textarea
                  placeholder="აღწერეთ თქვენი სერვისი, გამოცდილება და რა გამოგარჩევთ..."
                  rows={4}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground mt-1 text-right">
                  {form.description.length} სიმბოლო
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">
                  განცხადების ტიპი *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {(["standard", "vip"] as const).map((type) => (
                    <label
                      key={type}
                      className={`flex items-center gap-3 border rounded-xl p-4 cursor-pointer transition-colors ${
                        form.listing_type === type
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="listingType"
                        value={type}
                        checked={form.listing_type === type}
                        onChange={() => setForm((f) => ({ ...f, listing_type: type }))}
                        className="accent-primary"
                      />
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {type === "standard" ? "სტანდარტული" : "VIP ⭐"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {type === "standard" ? "უფასო განცხადება" : "პრიორიტეტული განთავსება"}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2 — Price & Photos */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">
                  ფასის ტიპი *
                </label>
                <select
                  className="w-full h-10 px-3 border border-input rounded-md text-sm bg-background text-foreground"
                  value={form.price_type}
                  onChange={(e) => setForm((f) => ({ ...f, price_type: e.target.value }))}
                >
                  <option value="fixed">ფიქსირებული</option>
                  <option value="hourly">საათობრივი</option>
                  <option value="negotiable">შეთანხმებით</option>
                </select>
              </div>
              {form.price_type !== "negotiable" && (
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1.5">
                    ფასი (€) *
                  </label>
                  <Input
                    type="number"
                    placeholder="მაგ. 50"
                    value={form.price_value}
                    onChange={(e) => setForm((f) => ({ ...f, price_value: e.target.value }))}
                    min={0}
                  />
                </div>
              )}

              {/* Photo upload */}
              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">
                  ფოტოები (მაქს. 10)
                </label>

                {photos.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 mb-3">
                    {photos.map((ph) => (
                      <div key={ph.token} className="relative aspect-square rounded-lg overflow-hidden border border-border group">
                        <img
                          src={`http://localhost:8000${ph.url}`}
                          alt={ph.name}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removePhoto(ph.token)}
                          className="absolute top-1 right-1 bg-black/60 rounded-full p-0.5 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {photos.length < 10 && (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
                  >
                    <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      {uploadingPhoto ? "იტვირთება..." : "დააჭირეთ ასატვირთად"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">JPG, PNG, WEBP — 5MB-მდე</p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  className="hidden"
                  onChange={handlePhotoSelect}
                />
              </div>
            </div>
          )}

          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={() => setStep(Math.max(0, step - 1))}
              disabled={step === 0}
            >
              <ArrowLeft className="h-4 w-4 mr-1" /> უკან
            </Button>
            {step < steps.length - 1 ? (
              <Button onClick={() => setStep(step + 1)} disabled={!canNext()}>
                შემდეგი <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button
                onClick={() => publishMutation.mutate()}
                disabled={publishMutation.isPending || uploadingPhoto}
              >
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
