"use client";

import { useRouter } from "next/navigation";
import { CATEGORIES } from "@/lib/data";

const CategoryGrid = () => {
  const router = useRouter();

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2">
          კატეგორიის მიხედვით დათვალიერება
        </h2>
        <p className="text-muted-foreground mb-8">იპოვეთ თქვენი საჭიროებების შესაბამისი პროფესიონალი</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.name}
                onClick={() => router.push(`/search?profession=${encodeURIComponent(cat.name)}`)}
                className="group flex flex-col items-center gap-3 p-6 bg-card rounded-xl border border-border hover:border-primary/30 hover:shadow-card-hover transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <span className="text-sm font-medium text-foreground text-center">{cat.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default CategoryGrid;
