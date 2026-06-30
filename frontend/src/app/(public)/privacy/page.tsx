import type { Metadata } from "next";
import LegalPageLayout from "@/components/LegalPageLayout";
import LegalDocument from "@/components/LegalDocument";
import { PRIVACY_SECTIONS } from "@/lib/legal-content";

export const metadata: Metadata = {
  title: "კონფიდენციალურობის პოლიტიკა — ემიგრანტ.GE",
  description: "ემიგრანტ.GE პირადი მონაცემების დაცვის პოლიტიკა",
};

export default function PrivacyPage() {
  return (
    <LegalPageLayout>
      <LegalDocument title="კონფიდენციალურობის პოლიტიკა" sections={PRIVACY_SECTIONS} />
    </LegalPageLayout>
  );
}
