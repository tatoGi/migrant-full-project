"use client";

import { useQuery } from "@tanstack/react-query";
import HeroSearchBar from "@/components/HeroSearchBar";
import api from "@/lib/api";

interface SiteSettings {
  banner_image_url: string | null;
  banner_title: string | null;
  banner_subtitle: string | null;
  banner_cta_text: string | null;
}

const DEFAULTS = {
  title: "იპოვე პროფესიონალი საქართველოში ან უცხოეთში",
  subtitle: "საბუთების მენეჯერი, ადვოკატი, თარჯიმანი და უამრავი სხვა პროფესიონალი ერთ საიტზე",
  bgImage: "/hero-bg.jpg",
};

export default function HeroSection() {
  const { data } = useQuery<SiteSettings>({
    queryKey: ["site-settings"],
    queryFn: () => api.get("/site-settings").then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });

  const title = data?.banner_title || DEFAULTS.title;
  const subtitle = data?.banner_subtitle || DEFAULTS.subtitle;
  const bgImage = data?.banner_image_url || DEFAULTS.bgImage;

  return (
    <section className="relative pt-16">
      <div className="absolute inset-0 z-0">
        <img src={bgImage} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-foreground/60" />
      </div>
      <div className="relative z-10 container mx-auto px-4 py-24 md:py-36">
        <div className="max-w-3xl mx-auto text-center mb-10">
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground mb-4 animate-fade-up">
            {title}
          </h1>
          <p
            className="text-lg md:text-xl text-primary-foreground/80 animate-fade-up"
            style={{ animationDelay: "0.1s" }}
          >
            {subtitle}
          </p>
        </div>
        <div className="max-w-4xl mx-auto animate-fade-up" style={{ animationDelay: "0.2s" }}>
          <HeroSearchBar />
        </div>
      </div>
    </section>
  );
}
