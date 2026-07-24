import { createServerFn } from "@tanstack/react-start";
import { useSession } from "@tanstack/react-start/server";
import { createHash, timingSafeEqual } from "node:crypto";

type AdminSession = { authed?: boolean };

function sessionConfig() {
  const password = process.env.SESSION_SECRET;
  if (!password) throw new Error("SESSION_SECRET is not set");
  return {
    password,
    name: "ht-admin",
    maxAge: 60 * 60 * 24 * 7,
    cookie: {
      httpOnly: true,
      secure: true,
      sameSite: "lax" as const,
      path: "/",
    },
  };
}

function passwordMatches(a: string, b: string): boolean {
  const ah = createHash("sha256").update(a, "utf8").digest();
  const bh = createHash("sha256").update(b, "utf8").digest();
  return timingSafeEqual(ah, bh);
}

async function requireAdmin() {
  const session = await useSession<AdminSession>(sessionConfig());
  if (!session.data.authed) {
    throw new Error("Unauthorized");
  }
  return session;
}

export const adminLogin = createServerFn({ method: "POST" })
  .inputValidator((data: { password: string }) => data)
  .handler(async ({ data }) => {
    const expected = process.env.ADMIN_PASSWORD;
    if (!expected) throw new Error("ADMIN_PASSWORD is not set");
    if (!passwordMatches(data.password, expected)) {
      return { ok: false as const };
    }
    const session = await useSession<AdminSession>(sessionConfig());
    await session.update({ authed: true });
    return { ok: true as const };
  });

export const adminLogout = createServerFn({ method: "POST" }).handler(async () => {
  const session = await useSession<AdminSession>(sessionConfig());
  await session.clear();
  return { ok: true as const };
});

export const adminCheckSession = createServerFn({ method: "GET" }).handler(async () => {
  const session = await useSession<AdminSession>(sessionConfig());
  return { authed: !!session.data.authed };
});

export interface AdminArticleRow {
  id: string;
  title: string;
  slug: string;
  status: string;
  author: string;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  excerpt: string;
  category: { name: string; slug: string } | null;
}

export const adminListArticles = createServerFn({ method: "GET" })
  .inputValidator((d: { status?: "draft" | "published" | "all" }) => d)
  .handler(async ({ data }): Promise<AdminArticleRow[]> => {
    await requireAdmin();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let query = supabaseAdmin
      .from("articles")
      .select(
        "id,title,slug,status,author,created_at,updated_at,published_at,excerpt,category:categories!inner(name,slug)",
      )
      .order("updated_at", { ascending: false });
    if (data.status && data.status !== "all") query = query.eq("status", data.status);
    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);
    return (rows ?? []) as unknown as AdminArticleRow[];
  });

export const adminSetStatus = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string; status: "draft" | "published" }) => d)
  .handler(async ({ data }) => {
    await requireAdmin();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const patch =
      data.status === "published"
        ? { status: "published", published_at: new Date().toISOString() }
        : { status: "draft" };
    const { error } = await supabaseAdmin.from("articles").update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const adminDeleteArticle = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data }) => {
    await requireAdmin();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("articles").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export interface AdminArticleFull extends AdminArticleRow {
  meta_title: string | null;
  meta_description: string | null;
  body_markdown: string;
  tags: string[];
  featured_image_url: string | null;
  featured_image_alt: string | null;
  faq: Array<{ question: string; answer: string }> | null;
  category_id: string;
}

export const adminGetArticle = createServerFn({ method: "GET" })
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data }): Promise<AdminArticleFull | null> => {
    await requireAdmin();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("articles")
      .select(
        "id,title,slug,status,author,created_at,updated_at,published_at,excerpt,meta_title,meta_description,body_markdown,tags,featured_image_url,featured_image_alt,faq,category_id,category:categories!inner(name,slug)",
      )
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (row as unknown as AdminArticleFull | null) ?? null;
  });
