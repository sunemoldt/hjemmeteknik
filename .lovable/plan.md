
# Plan: hjemmeteknik.dk

Et rent, redaktionelt dansk guidesite. Indhold ligger i Lovable Cloud (Supabase under motorhjelmen) og skrives eksternt via service role. Ingen admin-UI, ingen login, ingen tracking. Fokus: organisk trafik fra Google og AI-søgemaskiner.

## 1. Backend (Lovable Cloud)

Aktiverer Cloud og opretter migration med:

**Tabel `categories`**: id, name, slug (unique), description, sort_order.
**Tabel `articles`**: id, title, slug (unique), meta_title, meta_description, excerpt, body_markdown, category_id (fk), tags text[], featured_image_url, featured_image_alt, author (default 'Hjemmeteknik.dk'), faq jsonb, status text check in ('draft','published'), published_at, updated_at.

- Indexes på slug, category_id, published_at, status, samt et GIN-index på `to_tsvector('danish', title || ' ' || excerpt)` til søgning.
- Trigger der auto-opdaterer `updated_at`.
- RLS enabled. Policies:
  - `categories`: SELECT for anon + authenticated (alle rækker).
  - `articles`: SELECT for anon + authenticated kun hvor `status = 'published'`.
  - Ingen INSERT/UPDATE/DELETE-policies (skrivning sker udelukkende via service role fra n8n).
- GRANT SELECT til anon og authenticated på begge tabeller.
- Seed: 3 kategorier ("Smart Home", "Netværk & WiFi", "Guides") og 3 dummy-artikler med rigtig markdown, FAQ, og billeder.

## 2. Routing (TanStack Start, fil-baseret)

```text
src/routes/
  __root.tsx              html lang="da", sitewide head, header/footer
  index.tsx               forside (hero + kategorier + seneste)
  om.tsx
  kontakt.tsx
  soeg.tsx                ?q=... via search params
  $categorySlug.tsx       layout for kategori (Outlet)
  $categorySlug.index.tsx kategorioversigt side 1
  $categorySlug.side.$page.tsx  pagineret /kategori/side/2
  $categorySlug.$articleSlug.tsx  artikelside
  sitemap[.]xml.ts        server route (dynamisk)
  feed[.]xml.ts           RSS server route
```

Alle links som `<Link>` (rigtige `<a href>`). Ingen trailing slashes, ingen hash-nav.

## 3. Data-lag

Server-funktioner (`createServerFn`) med publishable-key server-client (public read-only, RLS som anon):

- `listCategories()` — sorteret efter sort_order
- `getCategoryBySlug(slug)`
- `listArticlesByCategory(categoryId, page, pageSize=12)` — returnerer også total count til paginering
- `listLatestArticles(limit)`
- `listFeaturedAndRecent()` — forside
- `getArticleBySlug(categorySlug, articleSlug)` — join med kategori
- `listRelatedArticles(articleId, categoryId, tags, limit=4)`
- `searchArticles(q)` — Postgres full-text på dansk, fallback til ilike
- `listAllPublishedForSitemap()` — bruges af sitemap-route

Loader-mønster: `ensureQueryData` i loader + `useSuspenseQuery` i komponent. Head-metadata læses fra loaderData.

## 4. Sider

**Forside**: Hero (nyeste/fremhævede), 2-3 sekundære kort, kategorioversigt med beskrivelser, grid af seneste artikler.

**Kategoriside**: H1 + beskrivelse, artikelliste 12/side, pagineringskomponent med rigtige URL'er.

**Artikelside**:
- Breadcrumb (Forside → Kategori → Artikel)
- H1, forfatter, publiceret-dato, "Opdateret [dato]" hvis nyere
- Auto-TOC fra h2'er i markdown (sticky på desktop) — genereres ved at parse markdown-ast og injicere id-slugs på headings
- Featured image (width/height sat, LCP — ikke lazy)
- react-markdown + remark-gfm renderer body med semantiske klasser via Tailwind typography
- FAQ-accordion når `faq` udfyldt
- Relaterede artikler nederst

**Søgning**: `/soeg?q=...` — kalder `searchArticles`, viser resultatliste.

**Om / Kontakt**: Statiske sider.

**404**: `notFoundComponent` på root med links til populære artikler.

## 5. SEO

Pr. rute `head()` returnerer unikke:
- title (meta_title || title), description, canonical (absolut `https://hjemmeteknik.dk/...`)
- og:title, og:description, og:image (featured_image_url), og:type (article/website), og:locale=da_DK
- twitter:card=summary_large_image
- article:published_time, article:modified_time (kun artikelsider)

JSON-LD via `head().scripts`:
- Forside: WebSite + Organization
- Alle sider: BreadcrumbList
- Artikelsider: Article
- Artikelsider med faq: FAQPage

**Crawler-filer**:
- `public/robots.txt`: `Allow: /` for `*`, samt eksplicitte blokke for GPTBot, ClaudeBot, Claude-SearchBot, PerplexityBot, Google-Extended, CCBot (alle Allow). `Sitemap: https://hjemmeteknik.dk/sitemap.xml`.
- `public/llms.txt`: kort beskrivelse + kategorilinks + top-guides.
- `src/routes/sitemap[.]xml.ts`: dynamisk fra DB (forside + kategorier + publicerede artikler med `<lastmod>` fra updated_at).
- `src/routes/feed[.]xml.ts`: seneste 20 artikler som RSS 2.0.

## 6. Design

- `<html lang="da">` sat i __root.
- Lys baggrund, mørk brødtekst, én dyb blå accent (`--primary: oklch(~0.35 0.09 250)`). Alle farver som semantic tokens i `src/styles.css`.
- Én serif til overskrifter (Fraunces eller lignende redaktionel), én sans til brødtekst (Inter) — indlæses via `<link rel="preload">` i __root, `font-display: swap`.
- Brødtekst max ~70 tegn, line-height 1.7, generøs luft. Ingen gradients, ingen animation-cirkus.
- Header: sticky, tekstlogo "hjemmeteknik.dk", kategori-nav (fra DB), søgeikon → `/soeg`.
- Footer: kategorilinks, om/kontakt, © år.
- Mobile-first, fuldt responsivt.

## 7. Performance

- SSR er standard i TanStack Start → alt indhold i initial HTML.
- LCP-billede pr. artikelside: preload i route `head().links`, `fetchpriority="high"`, `loading="eager"`.
- Alle andre billeder: `loading="lazy"`, eksplicit width/height.
- Ingen third-party scripts, ingen cookie-banner.

## Tekniske detaljer

- Data-fetch: publishable server-client i `createServerFn` (loaders er isomorfe, så ingen direct-supabase i loaders). New-format `sb_`-nøgle håndteres med fetch-shim per knowledge.
- Markdown: `react-markdown` + `remark-gfm` + `rehype-slug` + `rehype-autolink-headings` for anker-id'er. Ingen raw HTML fra brugere (indhold er tillid).
- TOC: separat parser der læser markdown-headings før render for at bygge listen (bruger `mdast-util-from-markdown`).
- Full-text search: `websearch_to_tsquery('danish', $1)` med fallback `ilike '%q%'` hvis tom.
- Absolut base-URL til canonical/sitemap: konstant `https://hjemmeteknik.dk`.
- Alle head-tags via TanStack `head()`, aldrig ved React-mount.

## Ikke i denne omgang
Admin-UI, auth, kommentarer, tracking, cookie-banner, billed-upload.

Efter migrationen og seed'en er dette leverbart i én bygge-tur. Klar til at implementere?
