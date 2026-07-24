import { createFileRoute } from "@tanstack/react-router";
import { listAllPublishedForSitemap } from "@/lib/content.functions";
import { SITE_URL } from "@/lib/site";
import { xmlEscape } from "@/lib/format";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const { categories, articles } = await listAllPublishedForSitemap();
        const urls: string[] = [];
        const push = (loc: string, lastmod?: string, priority?: string) => {
          urls.push(
            [
              "  <url>",
              `    <loc>${xmlEscape(loc)}</loc>`,
              lastmod ? `    <lastmod>${lastmod}</lastmod>` : null,
              priority ? `    <priority>${priority}</priority>` : null,
              "  </url>",
            ]
              .filter(Boolean)
              .join("\n"),
          );
        };
        push(SITE_URL + "/", undefined, "1.0");
        push(SITE_URL + "/om");
        push(SITE_URL + "/kontakt");
        for (const c of categories) {
          push(SITE_URL + `/${c.slug}`, undefined, "0.8");
        }
        for (const a of articles) {
          push(
            SITE_URL + `/${a.category.slug}/${a.slug}`,
            new Date(a.updated_at).toISOString(),
            "0.7",
          );
        }
        const xml =
          `<?xml version="1.0" encoding="UTF-8"?>\n` +
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
          urls.join("\n") +
          `\n</urlset>\n`;
        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
