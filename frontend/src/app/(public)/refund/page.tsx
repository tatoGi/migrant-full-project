import type { Metadata } from "next";
import LegalPageLayout from "@/components/LegalPageLayout";
import LegalDocument from "@/components/LegalDocument";
import { REFUND_SECTIONS } from "@/lib/legal-content";

export const metadata: Metadata = {
  title: "თანხის დაბრუნება — ემიგრანტ.GE",
  description: "ემიგრანტ.GE თანხის დაბრუნების პოლიტიკა",
};

export default function RefundPage() {
  return (
    <LegalPageLayout>
      <LegalDocument title="თანხის დაბრუნება" sections={REFUND_SECTIONS} />
    </LegalPageLayout>
  );
}
