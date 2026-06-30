import type { Metadata } from "next";
import LegalPageLayout from "@/components/LegalPageLayout";
import LegalDocument from "@/components/LegalDocument";
import { COOKIES_SECTIONS } from "@/lib/legal-content";

export const metadata: Metadata = {
  title: "Cookie პოლიტიკა — ემიგრანტ.GE",
  description: "ემიგრანტ.GE Cookie პოლიტიკა",
};

export default function CookiesPage() {
  return (
    <LegalPageLayout>
      <LegalDocument title="Cookie პოლიტიკა" sections={COOKIES_SECTIONS} />
    </LegalPageLayout>
  );
}
