import type { Metadata } from "next";
import LegalPageLayout from "@/components/LegalPageLayout";
import LegalDocument from "@/components/LegalDocument";
import { TERMS_SECTIONS } from "@/lib/legal-content";

export const metadata: Metadata = {
  title: "წესები და პირობები — ემიგრანტ.GE",
  description: "ემიგრანტ.GE პლატფორმის წესები და პირობები",
};

export default function TermsPage() {
  return (
    <LegalPageLayout>
      <LegalDocument title="წესები და პირობები" sections={TERMS_SECTIONS} />
    </LegalPageLayout>
  );
}
