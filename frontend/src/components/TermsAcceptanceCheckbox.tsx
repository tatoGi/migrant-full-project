"use client";

import Link from "next/link";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface TermsAcceptanceCheckboxProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  id?: string;
}

export default function TermsAcceptanceCheckbox({
  checked,
  onCheckedChange,
  id = "terms",
}: TermsAcceptanceCheckboxProps) {
  return (
    <div className="flex items-start gap-3">
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(value) => onCheckedChange(value === true)}
        required
        className="mt-0.5"
      />
      <Label htmlFor={id} className="text-sm font-normal leading-relaxed cursor-pointer">
        მე ვეთანხმები{" "}
        <Link href="/terms" target="_blank" className="text-primary hover:underline">
          პლატფორმის წესებსა და პირობებს
        </Link>
        ,{" "}
        <Link href="/privacy" target="_blank" className="text-primary hover:underline">
          კონფიდენციალურობის პოლიტიკას
        </Link>{" "}
        და{" "}
        <Link href="/cookies" target="_blank" className="text-primary hover:underline">
          Cookie პოლიტიკას
        </Link>
        .
      </Label>
    </div>
  );
}
