import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface LegalPageLayoutProps {
  children: React.ReactNode;
}

export default function LegalPageLayout({ children }: LegalPageLayoutProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 pt-24 pb-16">{children}</main>
      <Footer />
    </div>
  );
}
