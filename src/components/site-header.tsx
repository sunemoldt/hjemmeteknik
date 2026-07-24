import { Link } from "@tanstack/react-router";
import { Search } from "lucide-react";
import type { Category } from "@/lib/content.functions";

export function SiteHeader({ categories }: { categories: Category[] }) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 md:px-6">
        <Link to="/" className="font-serif text-xl tracking-tight text-foreground">
          hjemmeteknik<span className="text-primary">.dk</span>
        </Link>
        <nav className="hidden items-center gap-6 md:flex" aria-label="Hovednavigation">
          {categories.map((c) => (
            <Link
              key={c.id}
              to="/$categorySlug"
              params={{ categorySlug: c.slug }}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              activeProps={{ className: "text-foreground" }}
            >
              {c.name}
            </Link>
          ))}
        </nav>
        <Link
          to="/soeg"
          aria-label="Søg"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <Search className="h-4 w-4" />
        </Link>
      </div>
      <nav
        className="flex gap-4 overflow-x-auto border-t border-border px-4 py-2 md:hidden"
        aria-label="Kategorier"
      >
        {categories.map((c) => (
          <Link
            key={c.id}
            to="/$categorySlug"
            params={{ categorySlug: c.slug }}
            className="whitespace-nowrap text-sm text-muted-foreground"
            activeProps={{ className: "text-foreground" }}
          >
            {c.name}
          </Link>
        ))}
      </nav>
    </header>
  );
}
