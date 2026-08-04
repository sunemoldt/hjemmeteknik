import { Link } from "@tanstack/react-router";
import type { Category } from "@/lib/content.functions";
import logoMark from "@/assets/logo-mark.png";

export function SiteFooter({ categories }: { categories: Category[] }) {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-24 border-t border-border bg-subtle/50">
      <div className="mx-auto max-w-6xl px-4 py-12 md:px-6">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <Link
              to="/"
              className="flex items-center gap-2 font-serif text-lg text-foreground"
            >
              <img
                src={logoMark}
                alt="hjemmeteknik.dk logo"
                width={26}
                height={26}
                loading="lazy"
                className="h-6 w-6"
              />
              <span>
                hjemmeteknik<span className="text-primary">.dk</span>
              </span>
            </Link>
            <p className="mt-3 max-w-xs text-sm text-muted-foreground">
              Redaktionelle guides om smart home, netværk og alt det tekniske i det
              danske hjem.
            </p>
          </div>
          <div>
            <h3 className="font-serif text-base text-foreground">Kategorier</h3>
            <ul className="mt-3 space-y-2 text-sm">
              {categories.map((c) => (
                <li key={c.id}>
                  <Link
                    to="/$categorySlug"
                    params={{ categorySlug: c.slug }}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-serif text-base text-foreground">Sitet</h3>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link to="/om" className="text-muted-foreground hover:text-foreground">
                  Om
                </Link>
              </li>
              <li>
                <Link
                  to="/kontakt"
                  className="text-muted-foreground hover:text-foreground"
                >
                  Kontakt
                </Link>
              </li>
              <li>
                <a
                  href="/feed.xml"
                  className="text-muted-foreground hover:text-foreground"
                >
                  RSS-feed
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-10 border-t border-border pt-6 text-xs text-muted-foreground">
          © {year} hjemmeteknik.dk
        </div>
      </div>
    </footer>
  );
}
