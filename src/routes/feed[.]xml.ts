import { createFileRoute } from "@tanstack/react-router";
import { listRecentForFeed } from "@/lib/content.functions";
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION } from "@/lib/site";
import { xmlEscape } from "@/lib/format";

export const Route = createFileRoute("/feed.xml")({
  server: {
    handlers: {
      GET: async () => {
        const items = await listRecentForFeed();
        const now = new Date().toUTCString();
        const rssItems = items
          .map((a) => {
            const url = `${SITE_URL}/${a.category.slug}/${a.slug}`;
            const pub = new Date(a.published_at).toUTCString();
            return [
              "    <item>",
              `      <title>${xmlEscape(a.title)}</title>`,
              `      <link>${xmlEscape(url)}</link>`,
              `      <guid isPermaLink="true">${xmlEscape(url)}</guid>`,
              `      <pubDate>${pub}</pubDate>`,
              `      <category>${xmlEscape(a.category.name)}</category>`,
              `      <description>${xmlEscape(a.excerpt)}</description>`,
              `      <author>redaktion@hjemmeteknik.dk (${xmlEscape(a.author)})</author>`,
              "    </item>",
            ].join("\n");
          })
          .join("\n");
        const xml =
          `<?xml version="1.0" encoding="UTF-8"?>\n` +
          `<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n` +
          `  <channel>\n` +
          `    <title>${xmlEscape(SITE_NAME)}</title>\n` +
          `    <link>${SITE_URL}</link>\n` +
          `    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml" />\n` +
          `    <description>${xmlEscape(SITE_DESCRIPTION)}</description>\n` +
          `    <language>da-DK</language>\n` +
          `    <lastBuildDate>${now}</lastBuildDate>\n` +
          rssItems +
          `\n  </channel>\n</rss>\n`;
        return new Response(xml, {
          headers: {
            "Content-Type": "application/rss+xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
