import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { z } from "zod";
import { Search } from "lucide-react";
import { searchArticles } from "@/lib/content.functions";
import { ArticleCard } from "@/components/article-card";
import { SITE_NAME, SITE_URL } from "@/lib/site";

const searchSchema = z.object({ q: z.string().optional().catch("") });

export const Route = createFileRoute("/soeg")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: `Søg — ${SITE_NAME}` },
      {
        name: "description",
        content: "Søg i guides og artikler på hjemmeteknik.dk.",
      },
      { property: "og:title", content: `Søg — ${SITE_NAME}` },
      { property: "og:description", content: "Søg i guides og artikler." },
      { property: "og:url", content: SITE_URL + "/soeg" },
      { property: "og:type", content: "website" },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "canonical", href: SITE_URL + "/soeg" }],
  }),
  component: SearchPage,
});

function SearchPage() {
  const { q } = Route.useSearch();
  const navigate = useNavigate();
  const [input, setInput] = useState(q ?? "");
  const query = (q ?? "").trim();

  const { data: results, isFetching } = useQuery({
    queryKey: ["search", query],
    queryFn: () => searchArticles({ data: { q: query } }),
    enabled: query.length > 0,
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 md:px-6">
      <h1 className="font-serif text-4xl md:text-5xl">Søg</h1>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          navigate({ to: "/soeg", search: { q: input.trim() || undefined } });
        }}
        className="mt-8 flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-3"
      >
        <Search className="h-5 w-5 text-muted-foreground" />
        <input
          type="search"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Søg efter fx robotstøvsuger, mesh eller Matter…"
          className="flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
          autoFocus
        />
        <button
          type="submit"
          className="rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Søg
        </button>
      </form>

      <div className="mt-10">
        {query.length === 0 && (
          <p className="text-muted-foreground">Skriv et søgeord for at komme i gang.</p>
        )}
        {query.length > 0 && isFetching && (
          <p className="text-muted-foreground">Søger…</p>
        )}
        {query.length > 0 && !isFetching && results && results.length === 0 && (
          <p className="text-muted-foreground">
            Ingen resultater for "{query}". Prøv et andet søgeord.
          </p>
        )}
        {results && results.length > 0 && (
          <>
            <p className="text-sm text-muted-foreground">
              {results.length} resultat{results.length === 1 ? "" : "er"} for "{query}"
            </p>
            <div className="mt-6 grid gap-10 sm:grid-cols-2">
              {results.map((a) => (
                <ArticleCard key={a.id} article={a} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
