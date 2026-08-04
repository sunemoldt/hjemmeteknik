import { createFileRoute, notFound } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import {
  getCategoryBySlug,
  listArticlesByCategory,
} from "@/lib/content.functions";
import { ArticleCard } from "@/components/article-card";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { Pagination } from "@/components/pagination";
import { SITE_NAME, SITE_URL, absUrl, OG_IMAGE, OG_IMAGE_ALT } from "@/lib/site";
import { categoryUnderlineClass } from "@/lib/categories";

const PAGE_SIZE = 12;

const categoryQuery = (slug: string) =>
  queryOptions({
    queryKey: ["category", slug],
    queryFn: () => getCategoryBySlug({ data: { slug } }),
  });

const articlesQuery = (categoryId: string, page: number) =>
  queryOptions({
    queryKey: ["articles", "category", categoryId, page],
    queryFn: () =>
      listArticlesByCategory({
        data: { categoryId, page, pageSize: PAGE_SIZE },
      }),
  });

export const Route = createFileRoute("/$categorySlug/")({
  loader: async ({ context, params }) => {
    const category = await context.queryClient.ensureQueryData(
      categoryQuery(params.categorySlug),
    );
    if (!category) throw notFound();
    await context.queryClient.ensureQueryData(articlesQuery(category.id, 1));
    return { category };
  },
  head: ({ loaderData, params }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: `Kategori ikke fundet — ${SITE_NAME}` },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const { category } = loaderData;
    const title = `${category.name} — ${SITE_NAME}`;
    const url = absUrl(`/${params.categorySlug}`);
    return {
      meta: [
        { title },
        { name: "description", content: category.description },
        { property: "og:title", content: title },
        { property: "og:description", content: category.description },
        { property: "og:url", content: url },
        { property: "og:type", content: "website" },
        { property: "og:image", content: OG_IMAGE },
        { property: "og:image:width", content: "1200" },
        { property: "og:image:height", content: "630" },
        { property: "og:image:alt", content: OG_IMAGE_ALT },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:image", content: OG_IMAGE },
        { name: "twitter:image:alt", content: OG_IMAGE_ALT },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Forside", item: absUrl("/") },
              { "@type": "ListItem", position: 2, name: category.name, item: url },
            ],
          }),
        },
      ],
    };
  },
  component: CategoryIndex,
  notFoundComponent: () => (
    <div className="mx-auto max-w-2xl px-4 py-24 text-center md:px-6">
      <h1 className="font-serif text-3xl">Kategorien findes ikke</h1>
    </div>
  ),
});

function CategoryIndex() {
  const { categorySlug } = Route.useParams();
  const { data: category } = useSuspenseQuery(categoryQuery(categorySlug));
  const { data: page } = useSuspenseQuery(articlesQuery(category!.id, 1));
  const totalPages = Math.max(1, Math.ceil(page.total / PAGE_SIZE));

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
      <Breadcrumbs
        items={[
          { label: "Forside", to: "/" },
          { label: category!.name },
        ]}
      />
      <header className="mt-6 max-w-3xl">
        <h1
          className={`inline-block border-b-2 pb-2 font-serif text-4xl md:text-5xl ${categoryUnderlineClass(category!.slug)}`}
        >
          {category!.name}
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">{category!.description}</p>
      </header>

      {page.items.length === 0 ? (
        <p className="mt-16 text-muted-foreground">
          Der er endnu ingen artikler i denne kategori.
        </p>
      ) : (
        <div className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          {page.items.map((a) => (
            <ArticleCard key={a.id} article={a} />
          ))}
        </div>
      )}

      <Pagination categorySlug={categorySlug} page={1} totalPages={totalPages} />
    </div>
  );
}
