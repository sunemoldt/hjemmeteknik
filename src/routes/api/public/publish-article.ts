import { createFileRoute } from "@tanstack/react-router";
import { timingSafeEqual } from "node:crypto";
import { publishArticleSchema, type PublishArticleInput } from "@/lib/publish-article.schema";
import { slugify } from "@/lib/utils";

const CATEGORY_NOT_FOUND = "Category not found. Valid categories: smart-home, netvaerk-og-wifi, guides.";

export const Route = createFileRoute("/api/public/publish-article")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // 1. Verify secret token
        const expectedSecret = process.env.PUBLISH_SECRET;
        if (!expectedSecret) {
          return Response.json({ error: "Server misconfiguration: missing publish secret" }, { status: 500 });
        }

        const authHeader = request.headers.get("Authorization") ?? "";
        const providedSecret = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
        const expectedBuf = Buffer.from(expectedSecret, "utf8");
        const providedBuf = Buffer.from(providedSecret, "utf8");

        if (providedBuf.length !== expectedBuf.length || !timingSafeEqual(providedBuf, expectedBuf)) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        // 2. Parse and validate body
        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return Response.json({ error: "Invalid JSON body" }, { status: 400 });
        }

        const parseResult = publishArticleSchema.safeParse(body);
        if (!parseResult.success) {
          return Response.json(
            {
              error: "Validation failed",
              issues: parseResult.error.issues.map((issue) => ({ path: issue.path, message: issue.message })),
            },
            { status: 400 },
          );
        }

        const data = parseResult.data;
        const finalSlug = data.slug ? data.slug : slugify(data.title);
        if (!finalSlug) {
          return Response.json({ error: "Could not generate a valid slug from title" }, { status: 400 });
        }

        // 3. Load admin client (lazy to avoid leaking into client bundle)
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        // 4. Resolve category (try slug first, then id)
        const { data: categoryBySlug, error: slugCategoryError } = await supabaseAdmin
          .from("categories")
          .select("id, slug, name")
          .eq("slug", data.category)
          .maybeSingle();

        if (slugCategoryError) {
          return Response.json(
            { error: "Failed to resolve category", details: slugCategoryError.message },
            { status: 500 },
          );
        }

        let category = categoryBySlug;
        if (!category) {
          const { data: categoryById, error: idCategoryError } = await supabaseAdmin
            .from("categories")
            .select("id, slug, name")
            .eq("id", data.category)
            .maybeSingle();

          if (idCategoryError) {
            return Response.json(
              { error: "Failed to resolve category", details: idCategoryError.message },
              { status: 500 },
            );
          }
          category = categoryById;
        }

        if (!category) {
          return Response.json({ error: CATEGORY_NOT_FOUND }, { status: 400 });
        }

        // 5. Check slug uniqueness
        const { data: existingArticle, error: slugError } = await supabaseAdmin
          .from("articles")
          .select("id")
          .eq("slug", finalSlug)
          .maybeSingle();

        if (slugError) {
          return Response.json({ error: "Failed to check slug uniqueness", details: slugError.message }, { status: 500 });
        }
        if (existingArticle) {
          return Response.json(
            { error: "An article with this slug already exists", slug: finalSlug },
            { status: 409 },
          );
        }

        // 6. Build article payload
        const articlePayload = {
          title: data.title,
          slug: finalSlug,
          category_id: category.id,
          excerpt: data.excerpt,
          body_markdown: data.body_markdown,
          tags: data.tags,
          meta_title: data.meta_title ?? null,
          meta_description: data.meta_description ?? null,
          faq: data.faq ? data.faq : null,
          author: data.author,
          status: data.status,
          published_at: data.status === "published" ? (data.published_at ?? new Date().toISOString()) : null,
          featured_image_url: data.featured_image_url ?? null,
          featured_image_alt: data.featured_image_alt ?? null,
        };

        // 7. Insert article
        const { data: inserted, error: insertError } = await supabaseAdmin
          .from("articles")
          .insert(articlePayload)
          .select("id, slug, title, status, category:categories!inner(slug)")
          .single();

        if (insertError) {
          return Response.json({ error: "Failed to publish article", details: insertError.message }, { status: 500 });
        }

        const categorySlug = (inserted.category as { slug: string } | null)?.slug ?? category.slug;
        const url = `https://hjemmeteknik.dk/${categorySlug}/${inserted.slug}`;

        return Response.json(
          {
            success: true,
            articleId: inserted.id,
            slug: inserted.slug,
            status: inserted.status,
            url,
          },
          { status: 201 },
        );
      },
    },
  },
});

// Prevent TS unused error if the type is never consumed
export type PublishArticleRoute = typeof Route;
