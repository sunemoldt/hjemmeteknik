import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import {
  getArticleBySlug,
  listRelatedArticles,
} from "@/lib/content.functions";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { MarkdownContent } from "@/components/markdown-content";
import { TableOfContents } from "@/components/table-of-contents";
import { FaqAccordion } from "@/components/faq-accordion";
import { ArticleCard } from "@/components/article-card";
import { formatDanishDate } from "@/lib/format";
import { buildToc } from "@/lib/toc";
import { SITE_NAME, SITE_URL, absUrl, OG_IMAGE, OG_IMAGE_ALT } from "@/lib/site";
import { categoryTagClass } from "@/lib/categories";

const articleQuery = (categorySlug: string, articleSlug: string) =>
  queryOptions({
    queryKey: ["article", categorySlug, articleSlug],
    queryFn: () => getArticleBySlug({ data: { categorySlug, articleSlug } }),
  });

const relatedQuery = (articleId: string, categoryId: string, tags: string[]) =>
  queryOptions({
    queryKey: ["related", articleId],
    queryFn: () =>
      listRelatedArticles({ data: { articleId, categoryId, tags, limit: 4 } }),
  });

export const Route = createFileRoute("/$categorySlug/$articleSlug")({
  loader: async ({ context, params }) => {
    const article = await context.queryClient.ensureQueryData(
      articleQuery(params.categorySlug, params.articleSlug),
    );
    if (!article) throw notFound();
    await context.queryClient.ensureQueryData(
      relatedQuery(article.id, article.category_id, article.tags),
    );
    return { article };
  },
  head: ({ loaderData, params }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: `Artikel ikke fundet — ${SITE_NAME}` },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const a = loaderData.article;
    const title = a.meta_title || `${a.title} — ${SITE_NAME}`;
    const desc = a.meta_description || a.excerpt;
    const url = absUrl(`/${params.categorySlug}/${params.articleSlug}`);
    const image = a.featured_image_url || OG_IMAGE;

    const meta: Array<Record<string, string>> = [
      { title },
      { name: "description", content: desc },
      { property: "og:title", content: a.title },
      { property: "og:description", content: desc },
      { property: "og:url", content: url },
      { property: "og:type", content: "article" },
      { property: "og:locale", content: "da_DK" },
      { property: "article:published_time", content: a.published_at },
      { property: "article:modified_time", content: a.updated_at },
      { property: "article:section", content: a.category.name },
      { property: "article:author", content: a.author },
    ];
    meta.push({ property: "og:image", content: image });
    meta.push({ property: "og:image:alt", content: a.featured_image_url ? a.title : OG_IMAGE_ALT });
    meta.push({ name: "twitter:card", content: "summary_large_image" });
    meta.push({ name: "twitter:title", content: a.title });
    meta.push({ name: "twitter:description", content: desc });
    meta.push({ name: "twitter:image", content: image });
    if (!a.featured_image_url) {
      meta.push({ property: "og:image:width", content: "1200" });
      meta.push({ property: "og:image:height", content: "630" });
    }
    for (const tag of a.tags) {
      meta.push({ property: "article:tag", content: tag });
    }

    const article: Record<string, unknown> = {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: a.title,
      description: desc,
      datePublished: a.published_at,
      dateModified: a.updated_at,
      inLanguage: "da-DK",
      mainEntityOfPage: url,
      author: { "@type": "Organization", name: a.author },
      publisher: {
        "@type": "Organization",
        name: SITE_NAME,
        url: SITE_URL,
      },
    };
    if (image) article.image = image;

    const scripts: Array<{ type: string; children: string }> = [
      { type: "application/ld+json", children: JSON.stringify(article) },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Forside", item: absUrl("/") },
            {
              "@type": "ListItem",
              position: 2,
              name: a.category.name,
              item: absUrl(`/${a.category.slug}`),
            },
            { "@type": "ListItem", position: 3, name: a.title, item: url },
          ],
        }),
      },
    ];
    if (a.faq && a.faq.length > 0) {
      scripts.push({
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: a.faq.map((item) => ({
            "@type": "Question",
            name: item.question,
            acceptedAnswer: { "@type": "Answer", text: item.answer },
          })),
        }),
      });
    }

    return {
      meta,
      links: [{ rel: "canonical", href: url }],
      scripts,
    };
  },
  component: ArticlePage,
  notFoundComponent: () => (
    <div className="mx-auto max-w-2xl px-4 py-24 text-center md:px-6">
      <h1 className="font-serif text-3xl">Artiklen findes ikke</h1>
      <p className="mt-3 text-muted-foreground">
        Linket er måske forældet, eller artiklen er flyttet.
      </p>
    </div>
  ),
});

function ArticlePage() {
  const { categorySlug, articleSlug } = Route.useParams();
  const { data: article } = useSuspenseQuery(articleQuery(categorySlug, articleSlug));
  const a = article!;
  const { data: related } = useSuspenseQuery(
    relatedQuery(a.id, a.category_id, a.tags),
  );
  const toc = buildToc(a.body_markdown);
  const wasUpdated = new Date(a.updated_at).getTime() - new Date(a.published_at).getTime() > 24 * 3600 * 1000;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
      <Breadcrumbs
        items={[
          { label: "Forside", to: "/" },
          { label: a.category.name, to: "/$categorySlug", params: { categorySlug } },
          { label: a.title },
        ]}
      />

      <article className="mt-8 grid gap-12 lg:grid-cols-[minmax(0,1fr)_240px]">
        <div className="min-w-0">
          <header>
            <Link
              to="/$categorySlug"
              params={{ categorySlug }}
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${categoryTagClass(a.category.slug)}`}
            >
              {a.category.name}
            </Link>
            <h1 className="mt-3 max-w-3xl font-serif text-4xl leading-[1.15] md:text-5xl">
              {a.title}
            </h1>
            <p className="mt-5 max-w-2xl text-lg text-muted-foreground">{a.excerpt}</p>
            <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span>Af {a.author}</span>
              <span>·</span>
              <time dateTime={a.published_at}>
                {formatDanishDate(a.published_at)}
              </time>
              {wasUpdated && (
                <>
                  <span>·</span>
                  <span>Opdateret {formatDanishDate(a.updated_at)}</span>
                </>
              )}
            </div>
          </header>

          {a.featured_image_url && (
            <img
              src={a.featured_image_url}
              alt={a.featured_image_alt ?? ""}
              width={1200}
              height={675}
              loading="eager"
              fetchPriority="high"
              className="mt-10 aspect-[16/9] w-full rounded-lg object-cover"
            />
          )}

          <div className="mt-10">
            <MarkdownContent markdown={a.body_markdown} />
          </div>

          {a.faq && a.faq.length > 0 && (
            <section className="mt-16">
              <h2 className="font-serif text-3xl">Ofte stillede spørgsmål</h2>
              <div className="mt-6">
                <FaqAccordion items={a.faq} />
              </div>
            </section>
          )}
        </div>

        <aside className="lg:sticky lg:top-24 lg:h-fit">
          <TableOfContents items={toc} />
        </aside>
      </article>

      {related.length > 0 && (
        <section className="mt-24 border-t border-border pt-12">
          <h2 className="font-serif text-3xl">Relaterede artikler</h2>
          <div className="mt-8 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((r) => (
              <ArticleCard key={r.id} article={r} size="compact" />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
