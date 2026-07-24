## Mål
Gør det muligt for ChatGPT/Claude at oprette nye artikler og blogs direkte på hjemmeteknik.dk — uden at du skal copy-paste indhold manuelt ind i databasen.

## Anbefalet løsning
Eksponér et sikkert public API-endepunkt på sitet, som ChatGPT (via en Custom GPT/Action) eller Claude (via Claude Projects / API) kan kalde. Endepunktet modtager en færdig artikel, tjekker en hemmelig nøgle, og gemmer artiklen i databasen.

## Implementering

### 1. Publicerings-API
Opret en server route under `src/routes/api/public/publish-article.ts`:
- Accepter kun `POST` med `Content-Type: application/json`.
- Valider input med Zod (title, slug, category, excerpt, body_markdown, tags, meta_title, meta_description, faq, author, status, published_at).
- Tjek hemmelig nøgle `PUBLISH_SECRET` fra `Authorization: Bearer <secret>` eller en header.
- Slug skal være unik og URL-venlig; returner 409 hvis den findes i forvejen.
- Slugify i valideringen, så ChatGPT/Claude kan sende en "menneskelig" titel og få et korrekt slug tilbage.
- Sæt `status` til `draft` som default, så du kan gennemgå indholdet før publicering. Tillad `published` hvis brugeren angiver det eksplicit.
- Gem i `public.articles` via Supabase publishable-klient eller service-role-klient (afhængig af RLS). Da endpointet er offentligt, men beskyttet af hemmelig nøgle, bruges service-role-klient indeni handleren til indsættelse.
- Returner JSON med `{ success, articleId, slug, url }`.

### 2. Sikkerhed
- Generér og gem `PUBLISH_SECRET` som project secret (via `generate_secret` eller `add_secret`).
- Brug constant-time sammenligning (`timingSafeEqual`) af token.
- Log aldrig nøglen.
- Sørg for at endpointet kun tillader `POST` og returnerer 401 på manglende/invalid nøgle.
- Overvej rate limiting via en simpel in-memory eller Supabase-baseret tæller, eller instruér brugeren om at holde nøglen hemmelig.

### 3. Opsætningsvejledning til ChatGPT/Claude
Skriv en kort dokumentation med:
- Endpoint-URL: `https://hjemmeteknik.dk/api/public/publish-article`
- Autorisation: `Authorization: Bearer <PUBLISH_SECRET>`
- Eksempel på JSON-body.
- Liste over gyldige kategorier (slugs: `smart-home`, `netvaerk-og-wifi`, `guides`) med id'er.
- Instruktion/prompt til ChatGPT/Claude om at skrive dansksproget SEO-artikler, generere slug, tags, meta_title, meta_description og FAQ i det ønskede format.
- Link til den færdige artikel efter publicering.

### 4. (Valgfri) Gennemgangs-side
Opret en beskyttet intern side `/admin/udkast` (beskyttet af samme `PUBLISH_SECRET` eller en admin-nøgle):
- Vis artikler med `status = 'draft'`.
- Gør det muligt at ændre status til `published` eller redigere indholdet.
- Dette giver dig kontrol over, hvad der går live.

### 5. (Valgfri) Intern AI-generering
Hvis brugeren ønsker det, tilføjes en server function `generateArticle` der bruger Lovable AI Gateway (fx `openai/gpt-5.4-mini` eller `google/gemini-3.6-flash`) til at generere artikel-udkast ud fra et emne. Dette kan enten kaldes fra en intern admin-side eller fra samme public endpoint, når ChatGPT/Claude kun sender et emne.

## Tekniske detaljer
- Fil: `src/routes/api/public/publish-article.ts`
- Zod-skema i `src/lib/publish-article.schema.ts`
- Supabase service-role client loades lazy i handleren (`await import('@/integrations/supabase/client.server')`).
- Nødvendige env-vars: `PUBLISH_SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (findes allerede).
- Vercel-deploy: endpointet virker automatisk på `hjemmeteknik.dk/api/public/publish-article` efter push.

## Leverancer
1. Publicerings-API klar til brug.
2. `PUBLISH_SECRET` genereret og instruktioner til at kopiere den.
3. Klar prompt/template til ChatGPT/Claude.
4. (Valgfri) Admin-side til gennemgang af udkast.
5. README-noter med endpoint og eksempel-JSON.

## Næste skridt
Godkend planen, og jeg implementerer endepunktet + vejledningen. Hvis du hellere vil have, at AI'en selv genererer teksten ud fra bare et emne, siger du det — så tilføjer jeg også den interne AI-generator.