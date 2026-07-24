import { createFileRoute, notFound } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import {
  getCategoryBySlug,
  listArticlesByCategory,
} from "@/lib/content.functions";
import { ArticleCard } from "@/components/article-card";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { Pagination } from "@/components/pagination";
import { SITE_NAME, absUrl } from "@/lib/site";

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

export const Route = createFileRoute("/$categorySlug/side/$page")({
  loader: async ({ context, params }) => {
    const pageNum = Number.parseInt(params.page, 10);
    if (!Number.isFinite(pageNum) || pageNum < 2) throw notFound();
    const category = await context.queryClient.ensureQueryData(
      categoryQuery(params.categorySlug),
    );
    if (!category) throw notFound();
    const result = await context.queryClient.ensureQueryData(
      articlesQuery(category.id, pageNum),
    );
    if (result.items.length === 0) throw notFound();
    return { category, pageNum };
  },
  head: ({ loaderData, params }) => {
    if (!loaderData) return { meta: [{ name: "robots", content: "noindex" }] };
    const { category, pageNum } = loaderData;
    const title = `${category.name} — side ${pageNum} — ${SITE_NAME}`;
    const url = absUrl(`/${params.categorySlug}/side/${pageNum}`);
    return {
      meta: [
        { title },
        { name: "description", content: category.description },
        { property: "og:title", content: title },
        { property: "og:description", content: category.description },
        { property: "og:url", content: url },
        { property: "og:type", content: "website" },
      ],
      links: [{ rel: "canonical", href: url }],
    };
  },
  component: CategoryPage,
  notFoundComponent: () => (
    <div className="mx-auto max-w-2xl px-4 py-24 text-center md:px-6">
      <h1 className="font-serif text-3xl">Siden findes ikke</h1>
    </div>
  ),
});

function CategoryPage() {
  const { categorySlug, page } = Route.useParams();
  const pageNum = Number.parseInt(page, 10);
  const { data: category } = useSuspenseQuery(categoryQuery(categorySlug));
  const { data: result } = useSuspenseQuery(articlesQuery(category!.id, pageNum));
  const totalPages = Math.max(1, Math.ceil(result.total / PAGE_SIZE));

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
      <Breadcrumbs
        items={[
          { label: "Forside", to: "/" },
          { label: category!.name, to: "/$categorySlug", params: { categorySlug } },
          { label: `Side ${pageNum}` },
        ]}
      />
      <header className="mt-6 max-w-3xl">
        <h1 className="font-serif text-4xl md:text-5xl">
          {category!.name}
          <span className="ml-3 text-muted-foreground">— side {pageNum}</span>
        </h1>
      </header>

      <div className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
        {result.items.map((a) => (
          <ArticleCard key={a.id} article={a} />
        ))}
      </div>

      <Pagination categorySlug={categorySlug} page={pageNum} totalPages={totalPages} />
    </div>
  );
}
