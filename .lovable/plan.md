## Mål

Gøre sitet mere stilrent og letlæseligt, men med lidt mere farve — via farvede kategori-tags og et strammere magasin-layout. Ingen ændringer i indhold eller data.

## Designbeslutninger

**Palet** (redaktionel + kategorifarver)
- Baggrund: `#faf9f6` (varm papir)
- Tekst: `#111827` (næsten sort)
- Muted tekst: `#4b5563`
- Brand/link: `#1e5aa8` (rolig blå)
- Accent: `#c2410c` (varm orange, sparsomt brugt)
- Kategorifarver (kun til tags/badges og tynde kant-detaljer):
  - Smart Home → indigo `#4f46e5`
  - Netværk & WiFi → teal `#0d7a5f`
  - Guides → orange `#c2410c`
- Kort/card: hvid `#ffffff` med tynd border `#e7e5e0`

**Typografi**
- Overskrifter: **Outfit** (600/700) — erstatter nuværende serif
- Brødtekst + UI: **Figtree** (400/500)
- Loades via `<link>` i `__root.tsx` head (Google Fonts, preconnect)
- Registreres som `--font-display` og `--font-sans` i `@theme` i `src/styles.css`

**Layout — magasin**
- Forside: uændret magasin-struktur (featured venstre, to sidekort højre), men strammere:
  - Mere luft mellem hero og grid
  - Kategori-tags får farvet baggrund (subtil tint, farvet tekst) i stedet for ren blå tekst
  - Datoer bliver `text-muted-foreground` med `text-sm`
- Kategori-sider: samme kort-stil, kategori-titel får en tynd farvet underlinje i kategoriens farve
- Artikel: strammere linjebredde (`max-w-[68ch]`), tydeligere overskrifts-hierarki, farvet kategori-tag øverst
- Header: uændret struktur, men lettere (mindre vertikal padding, subtil border-bottom)
- Footer: uændret struktur, lidt mere luft

## Filer der ændres

1. `src/styles.css`
   - Opdatér `:root` farvetokens til papir-paletten (oklch-ækvivalenter af hex ovenfor)
   - Tilføj `--color-cat-smart-home`, `--color-cat-netvaerk`, `--color-cat-guides` under `@theme inline`
   - Skift `--font-display` og `--font-sans` til Outfit / Figtree
   - Justér prose-styling: linjehøjde, overskriftsvægte, link-underlinje

2. `src/routes/__root.tsx`
   - Tilføj `<link>` preconnect + stylesheet til Outfit + Figtree i `head().links`

3. `src/components/SiteHeader.tsx`
   - Reducér padding, tilføj tynd `border-b`

4. `src/components/ArticleCard.tsx`
   - Kategori-eyebrow bliver et rigtigt tag: `inline-flex px-2 py-0.5 rounded text-xs font-medium` med kategori-farve baggrund/tekst
   - Dato: `text-sm text-muted-foreground`

5. `src/components/Breadcrumbs.tsx`
   - Farvet accent på kategori-led

6. `src/routes/index.tsx` (og evt. `$categorySlug.index.tsx`)
   - Justér spacing (større `mb`/`gap`), ellers uændret struktur

7. `src/lib/site.ts` eller ny `src/lib/categories.ts`
   - Hjælpefunktion `getCategoryColor(slug)` der mapper slug → token-navn, så tags kan styles ensartet

Ingen ændringer i data-lag, routing, SEO-tags, sitemap, feed eller server-funktioner.

## Verifikation

Playwright-screenshots af `/`, `/smart-home`, og en artikel-side før/efter for at bekræfte at layout, farver og typografi rammer plet, og at kontrast er god.
