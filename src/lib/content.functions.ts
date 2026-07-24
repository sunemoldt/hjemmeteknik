import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  sort_order: number;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface ArticleListItem {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  featured_image_url: string | null;
  featured_image_alt: string | null;
  published_at: string;
  updated_at: string;
  category: { name: string; slug: string };
  tags: string[];
}

export interface Article extends ArticleListItem {
  meta_title: string | null;
  meta_description: string | null;
  body_markdown: string;
  author: string;
  faq: FaqItem[] | null;
  category_id: string;
}

function getServerClient() {
  const url =
    process.env.SUPABASE_URL ||
    (import.meta as unknown as { env: Record<string, string | undefined> }).env
      .VITE_SUPABASE_URL;
  const key =
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    (import.meta as unknown as { env: Record<string, string | undefined> }).env
      .VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Missing Supabase env vars (SUPABASE_URL / SUPABASE_PUBLISHABLE_KEY or VITE_ equivalents).",
    );
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`)
          h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

const ARTICLE_LIST_SELECT =
  "id,title,slug,excerpt,featured_image_url,featured_image_alt,published_at,updated_at,tags,category:categories!inner(name,slug)";
const ARTICLE_FULL_SELECT =
  "id,title,slug,meta_title,meta_description,excerpt,body_markdown,featured_image_url,featured_image_alt,author,faq,published_at,updated_at,tags,category_id,category:categories!inner(name,slug)";

export const listCategories = createServerFn({ method: "GET" }).handler(
  async (): Promise<Category[]> => {
    const sb = getServerClient();
    const { data, error } = await sb
      .from("categories")
      .select("id,name,slug,description,sort_order")
      .order("sort_order", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []) as Category[];
  },
);

export const getCategoryBySlug = createServerFn({ method: "GET" })
  .inputValidator((d: { slug: string }) => d)
  .handler(async ({ data }): Promise<Category | null> => {
    const sb = getServerClient();
    const { data: row, error } = await sb
      .from("categories")
      .select("id,name,slug,description,sort_order")
      .eq("slug", data.slug)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (row as Category | null) ?? null;
  });

export const listLatestArticles = createServerFn({ method: "GET" })
  .inputValidator((d: { limit?: number }) => d)
  .handler(async ({ data }): Promise<ArticleListItem[]> => {
    const sb = getServerClient();
    const { data: rows, error } = await sb
      .from("articles")
      .select(ARTICLE_LIST_SELECT)
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(data.limit ?? 10);
    if (error) throw new Error(error.message);
    return (rows ?? []) as unknown as ArticleListItem[];
  });

export const listArticlesByCategory = createServerFn({ method: "GET" })
  .inputValidator((d: { categoryId: string; page: number; pageSize?: number }) => d)
  .handler(
    async ({
      data,
    }): Promise<{ items: ArticleListItem[]; total: number; page: number; pageSize: number }> => {
      const sb = getServerClient();
      const pageSize = data.pageSize ?? 12;
      const from = (data.page - 1) * pageSize;
      const to = from + pageSize - 1;
      const { data: rows, error, count } = await sb
        .from("articles")
        .select(ARTICLE_LIST_SELECT, { count: "exact" })
        .eq("status", "published")
        .eq("category_id", data.categoryId)
        .order("published_at", { ascending: false })
        .range(from, to);
      if (error) {
        // PostgREST returns PGRST103 when the requested range exceeds the row count.
        // Treat as an empty page rather than a server error.
        if ((error as { code?: string }).code === "PGRST103") {
          return { items: [], total: count ?? 0, page: data.page, pageSize };
        }
        throw new Error(error.message);
      }
      return {
        items: (rows ?? []) as unknown as ArticleListItem[],
        total: count ?? 0,
        page: data.page,
        pageSize,
      };
    },
  );

export const getArticleBySlug = createServerFn({ method: "GET" })
  .inputValidator((d: { categorySlug: string; articleSlug: string }) => d)
  .handler(async ({ data }): Promise<Article | null> => {
    const sb = getServerClient();
    const { data: row, error } = await sb
      .from("articles")
      .select(ARTICLE_FULL_SELECT)
      .eq("status", "published")
      .eq("slug", data.articleSlug)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) return null;
    const article = row as unknown as Article;
    if (article.category.slug !== data.categorySlug) return null;
    return article;
  });

export const listRelatedArticles = createServerFn({ method: "GET" })
  .inputValidator((d: { articleId: string; categoryId: string; tags: string[]; limit?: number }) => d)
  .handler(async ({ data }): Promise<ArticleListItem[]> => {
    const sb = getServerClient();
    const { data: rows, error } = await sb
      .from("articles")
      .select(ARTICLE_LIST_SELECT)
      .eq("status", "published")
      .eq("category_id", data.categoryId)
      .neq("id", data.articleId)
      .order("published_at", { ascending: false })
      .limit(data.limit ?? 4);
    if (error) throw new Error(error.message);
    return (rows ?? []) as unknown as ArticleListItem[];
  });

export const searchArticles = createServerFn({ method: "GET" })
  .inputValidator((d: { q: string }) => d)
  .handler(async ({ data }): Promise<ArticleListItem[]> => {
    const q = data.q.trim();
    if (!q) return [];
    const sb = getServerClient();
    const pattern = `%${q.replace(/[%_]/g, "\\$&")}%`;
    const { data: rows, error } = await sb
      .from("articles")
      .select(ARTICLE_LIST_SELECT)
      .eq("status", "published")
      .or(`title.ilike.${pattern},excerpt.ilike.${pattern}`)
      .order("published_at", { ascending: false })
      .limit(30);
    if (error) throw new Error(error.message);
    return (rows ?? []) as unknown as ArticleListItem[];
  });

export const listAllPublishedForSitemap = createServerFn({ method: "GET" }).handler(
  async (): Promise<{
    categories: Category[];
    articles: Array<{ slug: string; updated_at: string; category: { slug: string } }>;
  }> => {
    const sb = getServerClient();
    const [cats, arts] = await Promise.all([
      sb.from("categories").select("id,name,slug,description,sort_order").order("sort_order"),
      sb
        .from("articles")
        .select("slug,updated_at,category:categories!inner(slug)")
        .eq("status", "published")
        .order("updated_at", { ascending: false }),
    ]);
    if (cats.error) throw new Error(cats.error.message);
    if (arts.error) throw new Error(arts.error.message);
    return {
      categories: (cats.data ?? []) as Category[],
      articles: (arts.data ?? []) as unknown as Array<{
        slug: string;
        updated_at: string;
        category: { slug: string };
      }>,
    };
  },
);

export const listRecentForFeed = createServerFn({ method: "GET" }).handler(async () => {
  const sb = getServerClient();
  const { data, error } = await sb
    .from("articles")
    .select(
      "title,slug,excerpt,published_at,updated_at,author,category:categories!inner(slug,name)",
    )
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(20);
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as Array<{
    title: string;
    slug: string;
    excerpt: string;
    published_at: string;
    updated_at: string;
    author: string;
    category: { slug: string; name: string };
  }>;
});
