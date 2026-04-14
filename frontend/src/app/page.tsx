import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import axios from "axios";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HeroSection from "@/components/HeroSection";
import VipOffers from "@/components/VipOffers";
import CategoryGrid from "@/components/CategoryGrid";
import SupportChat from "@/components/SupportChat";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8082/api";

export default async function HomePage() {
  const queryClient = new QueryClient();

  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: ["site-settings"],
      queryFn: () => axios.get(`${API}/site-settings`).then((r) => r.data),
    }),
    queryClient.prefetchQuery({
      queryKey: ["vip-listings"],
      queryFn: () => axios.get(`${API}/listings/vip`).then((r) => r.data),
    }),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="min-h-screen bg-background">
        <Header />
        <HeroSection />
        <VipOffers />
        <CategoryGrid />
        <Footer />
        <SupportChat />
      </div>
    </HydrationBoundary>
  );
}
