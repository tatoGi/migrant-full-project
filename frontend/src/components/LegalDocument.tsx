import Link from "next/link";
import { LegalSection } from "@/lib/legal-content";

interface LegalDocumentProps {
  title: string;
  sections: LegalSection[];
  relatedLinks?: boolean;
}

function LegalTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto my-4">
      <table className="w-full text-sm border border-border rounded-lg overflow-hidden">
        <thead>
          <tr className="bg-muted">
            {headers.map((header) => (
              <th key={header} className="text-left px-4 py-3 font-semibold border-b border-border">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-border last:border-b-0">
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-3 align-top text-muted-foreground">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LegalSectionBlock({ section }: { section: LegalSection }) {
  return (
    <section className="scroll-mt-24">
      <h2 className="font-display text-xl font-semibold text-foreground mb-4">{section.title}</h2>
      {section.paragraphs?.map((p, i) => (
        <p key={i} className="text-muted-foreground leading-relaxed mb-3">
          {p}
        </p>
      ))}
      {section.list && (
        <ul className="list-disc list-outside ml-5 space-y-2 text-muted-foreground mb-4">
          {section.list.map((item, i) => (
            <li key={i} className="leading-relaxed">
              {item}
            </li>
          ))}
        </ul>
      )}
      {section.table && <LegalTable headers={section.table.headers} rows={section.table.rows} />}
    </section>
  );
}

export default function LegalDocument({ title, sections, relatedLinks = true }: LegalDocumentProps) {
  return (
    <article className="max-w-3xl mx-auto">
      <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-8">{title}</h1>
      <div className="space-y-10">
        {sections.map((section) => (
          <LegalSectionBlock key={section.title} section={section} />
        ))}
      </div>
      {relatedLinks && (
        <nav className="mt-12 pt-8 border-t border-border">
          <p className="text-sm font-medium text-foreground mb-3">დაკავშირებული დოკუმენტები</p>
          <ul className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
            <li>
              <Link href="/terms" className="text-primary hover:underline">
                წესები და პირობები
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="text-primary hover:underline">
                კონფიდენციალურობის პოლიტიკა
              </Link>
            </li>
            <li>
              <Link href="/refund" className="text-primary hover:underline">
                თანხის დაბრუნება
              </Link>
            </li>
            <li>
              <Link href="/cookies" className="text-primary hover:underline">
                Cookie პოლიტიკა
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </article>
  );
}
