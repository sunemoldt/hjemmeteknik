import { Link } from "@tanstack/react-router";
import { formatDanishDate } from "@/lib/format";
import type { ArticleListItem } from "@/lib/content.functions";

interface Props {
  article: ArticleListItem;
  size?: "default" | "large" | "compact";
}

export function ArticleCard({ article, size = "default" }: Props) {
  const large = size === "large";
  const compact = size === "compact";
  return (
    <article className="group flex flex-col">
      <Link
        to="/$categorySlug/$articleSlug"
        params={{ categorySlug: article.category.slug, articleSlug: article.slug }}
        className="block overflow-hidden rounded-lg bg-subtle"
      >
        {article.featured_image_url ? (
          <img
            src={article.featured_image_url}
            alt={article.featured_image_alt ?? ""}
            width={large ? 1200 : 800}
            height={large ? 675 : 450}
            loading="lazy"
            className={
              large
                ? "aspect-[16/9] w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                : "aspect-[16/9] w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
            }
          />
        ) : (
          <div className="aspect-[16/9] w-full bg-secondary" />
        )}
      </Link>
      <div className="mt-4">
        <Link
          to="/$categorySlug"
          params={{ categorySlug: article.category.slug }}
          className="text-xs font-medium uppercase tracking-wider text-primary"
        >
          {article.category.name}
        </Link>
        <h3
          className={
            large
              ? "mt-2 font-serif text-3xl leading-tight md:text-4xl"
              : compact
                ? "mt-2 font-serif text-lg leading-tight"
                : "mt-2 font-serif text-2xl leading-tight"
          }
        >
          <Link
            to="/$categorySlug/$articleSlug"
            params={{
              categorySlug: article.category.slug,
              articleSlug: article.slug,
            }}
            className="text-foreground hover:text-primary"
          >
            {article.title}
          </Link>
        </h3>
        {!compact && (
          <p className="mt-2 max-w-prose text-[15px] text-muted-foreground">
            {article.excerpt}
          </p>
        )}
        <p className="mt-3 text-xs text-muted-foreground">
          {formatDanishDate(article.published_at)}
        </p>
      </div>
    </article>
  );
}
