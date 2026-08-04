import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { listLatestArticles } from "@/lib/content.functions";
import { categoriesQuery } from "./__root";
import { ArticleCard } from "@/components/article-card";
import { SITE_NAME, SITE_URL, SITE_DESCRIPTION, absUrl, OG_IMAGE, OG_IMAGE_ALT } from "@/lib/site";

const latestQuery = queryOptions({
  queryKey: ["articles", "latest", 12],
  queryFn: () => listLatestArticles({ data: { limit: 12 } }),
});

export const Route = createFileRoute("/")({
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(latestQuery),
      context.queryClient.ensureQueryData(categoriesQuery),
    ]),
  head: () => ({
    meta: [
      { title: `${SITE_NAME} — Guides om smart home, netværk og hjemmeteknik` },
      { name: "description", content: SITE_DESCRIPTION },
      { property: "og:title", content: `${SITE_NAME}` },
      { property: "og:description", content: SITE_DESCRIPTION },
      { property: "og:url", content: SITE_URL + "/" },
      { property: "og:type", content: "website" },
      { property: "og:image", content: OG_IMAGE },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:alt", content: OG_IMAGE_ALT },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: OG_IMAGE },
      { name: "twitter:image:alt", content: OG_IMAGE_ALT },
    ],
    links: [{ rel: "canonical", href: SITE_URL + "/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Forside", item: absUrl("/") },
          ],
        }),
      },
    ],
  }),
  component: Index,
});

function Index() {
  const { data: articles } = useSuspenseQuery(latestQuery);
  const { data: categories } = useSuspenseQuery(categoriesQuery);
  const [hero, ...rest] = articles;
  const secondaries = rest.slice(0, 2);
  const grid = rest.slice(2);

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 md:px-6">
      <section className="pt-10 md:pt-16">
        <h1 className="max-w-3xl font-serif text-4xl leading-[1.1] md:text-6xl">
          Guides og anmeldelser om det tekniske i det danske hjem.
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-muted-foreground">
          Smart home, WiFi, robotstøvsugere og alt det, der gør et hjem lidt smartere —
          uden marketingsprog.
        </p>
      </section>

      {hero && (
        <section className="mt-14 grid gap-10 md:grid-cols-3">
          <div className="md:col-span-2">
            <ArticleCard article={hero} size="large" />
          </div>
          <div className="flex flex-col gap-8">
            {secondaries.map((a) => (
              <ArticleCard key={a.id} article={a} size="compact" />
            ))}
          </div>
        </section>
      )}

      <section className="mt-20">
        <div className="flex items-baseline justify-between">
          <h2 className="font-serif text-3xl">Kategorier</h2>
        </div>
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          {categories.map((c) => (
            <Link
              key={c.id}
              to="/$categorySlug"
              params={{ categorySlug: c.slug }}
              className="group rounded-lg border border-border bg-card p-6 transition-colors hover:border-primary/40"
            >
              <h3 className="font-serif text-2xl text-foreground group-hover:text-primary">
                {c.name}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">{c.description}</p>
              <span className="mt-4 inline-block text-sm text-primary">
                Se guides →
              </span>
            </Link>
          ))}
        </div>
      </section>

      {grid.length > 0 && (
        <section className="mt-20">
          <h2 className="font-serif text-3xl">Seneste artikler</h2>
          <div className="mt-8 grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
            {grid.map((a) => (
              <ArticleCard key={a.id} article={a} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
