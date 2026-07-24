import { Link } from "@tanstack/react-router";

interface Props {
  categorySlug: string;
  page: number;
  totalPages: number;
}

export function Pagination({ categorySlug, page, totalPages }: Props) {
  if (totalPages <= 1) return null;
  const prev = page - 1;
  const next = page + 1;
  return (
    <nav
      aria-label="Paginering"
      className="mt-12 flex items-center justify-between border-t border-border pt-6 text-sm"
    >
      <div>
        {prev >= 1 &&
          (prev === 1 ? (
            <Link
              to="/$categorySlug"
              params={{ categorySlug }}
              className="text-primary hover:underline"
            >
              ← Nyere artikler
            </Link>
          ) : (
            <Link
              to="/$categorySlug/side/$page"
              params={{ categorySlug, page: String(prev) }}
              className="text-primary hover:underline"
            >
              ← Nyere artikler
            </Link>
          ))}
      </div>
      <div className="text-muted-foreground">
        Side {page} af {totalPages}
      </div>
      <div>
        {next <= totalPages && (
          <Link
            to="/$categorySlug/side/$page"
            params={{ categorySlug, page: String(next) }}
            className="text-primary hover:underline"
          >
            Ældre artikler →
          </Link>
        )}
      </div>
    </nav>
  );
}
