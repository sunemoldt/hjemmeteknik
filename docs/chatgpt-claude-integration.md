# ChatGPT / Claude-integration til hjemmeteknik.dk

Dette endpoint gør det muligt for ChatGPT (via en Custom GPT/Action) eller Claude (via Claude Projects / API) at oprette artikler direkte på hjemmeteknik.dk.

## Endpoint

```
POST https://hjemmeteknik.dk/api/public/publish-article
```

## Autentifikation

Send hemmelig nøgle i `Authorization`-headeren:

```
Authorization: Bearer <PUBLISH_SECRET>
```

> **Vigtigt:** Nøglen findes i dine Vercel environment variables som `PUBLISH_SECRET`. Hvis den ikke er sat på Vercel endnu, skal du kopiere den fra Lovable-projektets secrets ind på Vercel under Settings → Environment Variables.

## Request body (JSON)

```json
{
  "title": "Sådan vælger du den bedste mesh-router til hjemmet",
  "category": "netvaerk-og-wifi",
  "excerpt": "En guide til at finde det rigtige mesh-system, så du får stabilt WiFi i alle rum.",
  "body_markdown": "## Hvad er mesh WiFi?\n\nMesh WiFi er...",
  "tags": ["wifi", "mesh", "router", "guide"],
  "meta_title": "Bedste mesh-router til hjemmet 2026 | Hjemmeteknik.dk",
  "meta_description": "Lær hvordan du vælger den bedste mesh-router til dit hjem. Vi gennemgår dækning, hastighed og pris.",
  "faq": [
    {
      "question": "Hvad koster en mesh-router?",
      "answer": "Priserne ligger typisk mellem 1.000 og 3.500 kroner for et sæt til de fleste hjem."
    }
  ],
  "status": "draft"
}
```

## Felter

| Felt | Type | Påkrævet | Bemærkning |
|---|---|---|---|
| `title` | string | Ja | Artiklens overskrift. |
| `slug` | string | Nej | URL-venlig slug. Hvis den udelades, genereres den automatisk ud fra `title`. |
| `category` | string | Ja | Kategoriens slug eller UUID. |
| `excerpt` | string | Ja | Kort resume (vises på kategorisider og forsiden). |
| `body_markdown` | string | Ja | Artiklens hovedindhold i Markdown. |
| `tags` | string[] | Nej | Op til 20 tags. |
| `meta_title` | string | Nej | SEO-titel. |
| `meta_description` | string | Nej | SEO-beskrivelse. |
| `faq` | array | Nej | FAQ som array af `{ question, answer }`. |
| `author` | string | Nej | Standard: `Hjemmeteknik.dk`. |
| `status` | enum | Nej | `draft` (standard) eller `published`. |
| `published_at` | ISO-dato | Nej | Sættes automatisk ved `published`, hvis den udelades. |
| `featured_image_url` | URL | Nej | URL til fremhævet billede. |
| `featured_image_alt` | string | Nej | Alt-tekst til fremhævet billede. |

## Kategorier

| Navn | Slug | UUID |
|---|---|---|
| Smart Home | `smart-home` | `254c7d6c-c776-4427-9ef9-e86263ea9244` |
| Netværk & WiFi | `netvaerk-og-wifi` | `720e9344-369c-4bc2-9c30-1f7ab88582c7` |
| Guides | `guides` | `7d1baf51-c6fb-45d0-bedc-92a07ebeb641` |

## Response

Ved succes (HTTP 201):

```json
{
  "success": true,
  "articleId": "...",
  "slug": "saadan-vaelger-du-den-bedste-mesh-router-til-hjemmet",
  "status": "draft",
  "url": "https://hjemmeteknik.dk/netvaerk-og-wifi/saadan-vaelger-du-den-bedste-mesh-router-til-hjemmet"
}
```

Ved fejl (HTTP 400/401/409/500):

```json
{
  "error": "Beskrivelse af fejlen"
}
```

## Prompt til ChatGPT / Claude

Kopier denne prompt ind i din Custom GPT eller Claude Project:

```
Du er en dansk tekstforfatter og teknisk skribent for hjemmeteknik.dk.

Din opgave er at skrive SEO-venlige artikler om hjemmeteknik til det danske publikum.

Når brugeren giver dig et emne, skal du:
1. Skrive en artikel på dansk med en klar overskrift.
2. Skrive indholdet i Markdown med passende overskrifter (H2, H3).
3. Skrive et kort excerpt (resume) på 1-2 sætninger.
4. Foreslå 3-7 relevante tags.
5. Skrive en meta_title (maks. 60 tegn) og meta_description (maks. 160 tegn).
6. Tilføje 3-5 FAQ-punkter med spørgsmål og svar.
7. Vælge den korrekte kategori ud fra emnet.
8. Publicere artiklen ved at kalde publish-endpointet på hjemmeteknik.dk.

Gyldige kategorier:
- smart-home (smart home udstyr, robotstøvsugere, stemmeassistenter, belysning)
- netvaerk-og-wifi (routere, mesh, internet, netværk)
- guides (trin-for-trin guides, fejlfinding, opsætning)

Brug endpointet:
POST https://hjemmeteknik.dk/api/public/publish-article
Authorization: Bearer <PUBLISH_SECRET>

Body skal være JSON med felterne: title, category, excerpt, body_markdown, tags, meta_title, meta_description, faq, status.

Status skal som udgangspunkt være "draft", medmindre brugeren beder om at publicere med det samme.

Hvis brugeren ikke angiver et slug, skal du generere et fra titlen (små bogstaver, bindestreger, ingen specialtegn).

Ved succes viser du URL’en til den oprettede artikel.
```

## Opsætning på Vercel

Sørg for at følgende environment variable er sat på Vercel:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_PROJECT_ID`
- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `PUBLISH_SECRET`

`PUBLISH_SECRET` er genereret i Lovable-projektet. Den skal kopieres til Vercel for at endpointet kan validere kald fra ChatGPT/Claude.

## Fejlfinding

- **401 Unauthorized**: `Authorization`-headeren mangler eller `PUBLISH_SECRET` er forkert / ikke sat på Vercel.
- **400 Validation failed**: JSON-bodyen overholder ikke skemaet. Tjek fejlbeskeden.
- **409 Conflict**: Der findes allerede en artikel med samme slug. Vælg et unikt slug eller lad systemet generere det fra titlen.
- **500 Internal error**: Noget gik galt på serveren. Tjek Vercel logs.
