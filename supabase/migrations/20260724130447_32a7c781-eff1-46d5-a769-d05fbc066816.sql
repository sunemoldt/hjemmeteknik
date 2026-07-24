
-- Categories table
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text NOT NULL DEFAULT '',
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.categories TO anon;
GRANT SELECT ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Categories are readable by anyone"
  ON public.categories FOR SELECT
  TO anon, authenticated
  USING (true);

-- Articles table
CREATE TABLE public.articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  meta_title text,
  meta_description text,
  excerpt text NOT NULL DEFAULT '',
  body_markdown text NOT NULL DEFAULT '',
  category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
  tags text[] NOT NULL DEFAULT '{}',
  featured_image_url text,
  featured_image_alt text,
  author text NOT NULL DEFAULT 'Hjemmeteknik.dk',
  faq jsonb,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
  published_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX articles_slug_idx ON public.articles(slug);
CREATE INDEX articles_category_id_idx ON public.articles(category_id);
CREATE INDEX articles_published_at_idx ON public.articles(published_at DESC);
CREATE INDEX articles_status_idx ON public.articles(status);
CREATE INDEX articles_search_idx ON public.articles
  USING GIN (to_tsvector('danish', coalesce(title,'') || ' ' || coalesce(excerpt,'')));

GRANT SELECT ON public.articles TO anon;
GRANT SELECT ON public.articles TO authenticated;
GRANT ALL ON public.articles TO service_role;

ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published articles are readable by anyone"
  ON public.articles FOR SELECT
  TO anon, authenticated
  USING (status = 'published');

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER articles_set_updated_at
BEFORE UPDATE ON public.articles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Seed categories
INSERT INTO public.categories (name, slug, description, sort_order) VALUES
  ('Smart Home', 'smart-home', 'Guides og anmeldelser af smart home-udstyr — belysning, sensorer, robotstøvsugere og stemmeassistenter til det danske hjem.', 1),
  ('Netværk & WiFi', 'netvaerk-og-wifi', 'Alt om at få stabilt internet i hele boligen: routere, mesh-systemer, kabelføring og fejlfinding.', 2),
  ('Guides', 'guides', 'Praktiske trin-for-trin guides til hjemmeteknik — fra opsætning til fejlfinding.', 3);

-- Seed articles
INSERT INTO public.articles (title, slug, meta_title, meta_description, excerpt, body_markdown, category_id, tags, featured_image_url, featured_image_alt, faq, status, published_at, updated_at)
VALUES
(
  'Sådan vælger du den rigtige robotstøvsuger i 2026',
  'saadan-vaelger-du-robotstoevsuger',
  'Guide: Sådan vælger du robotstøvsuger (2026)',
  'Komplet dansk købsguide til robotstøvsugere i 2026 — sugeevne, kortlægning, moppefunktion og pris. Sådan vælger du rigtigt.',
  'En robotstøvsuger kan spare dig for timer om ugen — hvis du vælger den rigtige. Her er hvad du skal se efter.',
  E'Robotstøvsugere er blevet markant bedre de seneste år, men forskellen mellem en billig og en dyr model er stadig stor. Denne guide gennemgår hvad du skal kigge efter.\n\n## Sugeevne og børster\n\nSugeevne måles i pascal (Pa). Til de fleste danske hjem er 2500-4000 Pa rigeligt. Har du langhårede kæledyr eller mange tæpper, så gå efter 5000 Pa eller derover.\n\n- **Under 2000 Pa**: Kun til hårde gulve\n- **2500-4000 Pa**: Blandet gulv, familier uden kæledyr\n- **5000+ Pa**: Tæpper og dyrehår\n\n## Kortlægning med LiDAR\n\nBilligere modeller navigerer tilfældigt, mens dyrere modeller bruger LiDAR til at lave et præcist kort af din bolig. Fordelene:\n\n1. Systematisk rengøring i lige baner\n2. Zoner du kan udelukke via app\n3. Multi-etage-kort til huse\n\n## Moppefunktion — er det pengene værd?\n\nModerne 2-i-1 robotter kan både støvsuge og moppe. Kvaliteten varierer voldsomt. Se efter roterende moppepuder frem for statiske klude, og en base-station der selv vasker og tørrer puderne.\n\n## Prisniveauer\n\n| Prisklasse | Hvad får du |\n|---|---|\n| 1.500-3.000 kr | Basis-model, tilfældig navigation |\n| 4.000-7.000 kr | LiDAR-kortlægning, app-styring |\n| 8.000-15.000 kr | Selv-tømmende base, moppe-vask |\n\n## Vores anbefaling\n\nFor de fleste danske hjem rammer 5.000-7.000 kr-segmentet den bedste balance mellem pris og funktion. Betaler du mere, betaler du primært for base-stationens komfort.',
  (SELECT id FROM public.categories WHERE slug = 'smart-home'),
  ARRAY['robotstøvsuger', 'smart home', 'købsguide'],
  'https://images.unsplash.com/photo-1567016376408-0226e4d0c1ea?w=1200&q=80',
  'Robotstøvsuger på et trægulv i en stue',
  '[
    {"question":"Hvor meget koster en god robotstøvsuger?","answer":"For et dansk hjem rammer 5.000-7.000 kr det bedste forhold mellem pris og funktion. Under 3.000 kr får du typisk kun tilfældig navigation."},
    {"question":"Kan en robotstøvsuger erstatte en almindelig støvsuger?","answer":"Til daglig vedligehold ja, men til grundig rengøring af sofaer, trapper og hjørner har du stadig brug for en håndstøvsuger."},
    {"question":"Virker robotstøvsugere på tæpper?","answer":"Ja, men vælg en model med mindst 4000 Pa sugeevne hvis du har mange eller tykke tæpper."}
  ]'::jsonb,
  'published',
  now() - interval '2 days',
  now() - interval '1 day'
),
(
  'Mesh WiFi eller kraftig router — hvad passer til din bolig?',
  'mesh-wifi-eller-router',
  'Mesh WiFi vs router: Hvad skal du vælge?',
  'Skal du købe en kraftig router eller et mesh-system? Guide til danske lejligheder og huse — med konkrete anbefalinger.',
  'Dårligt WiFi er sjældent routerens skyld — det er placeringen. Sådan finder du ud af om du skal have mesh eller en bedre router.',
  E'Hvis WiFi\'et halter i visse rum, er den intuitive løsning at købe en dyrere router. Men i mange tilfælde er svaret et mesh-system.\n\n## Sådan afgør du hvad du har brug for\n\nEt mesh-system er den rigtige løsning hvis:\n\n- Boligen er over ca. 100 m²\n- Væggene er tunge (beton, gasbeton)\n- Der er mere end én etage\n- Du har døde zoner allerede med den nuværende router\n\nEn kraftig enkelt-router er nok hvis du bor i en lejlighed under 90 m² med rimeligt åben planløsning.\n\n## WiFi 6 og WiFi 7\n\nWiFi 6 (802.11ax) er standarden i dag. WiFi 7 (802.11be) er hurtigere på papiret, men få klientenheder understøtter det endnu. Køb WiFi 6 eller WiFi 6E og spar penge.\n\n## Placering — det vigtigste råd\n\nDen bedste router placeret forkert slår aldrig en billig router placeret rigtigt.\n\n1. Central i boligen, ikke i et hjørne\n2. Frit fremme, ikke i et skab\n3. Væk fra metal, mikroovne og vandholdige objekter (akvarier)\n\n## Anbefalede mesh-systemer\n\n- **TP-Link Deco X50** — god pris, WiFi 6\n- **Asus ZenWiFi XT8** — kraftig, mange funktioner\n- **Eero Pro 6E** — nem opsætning, integrerer med smart home',
  (SELECT id FROM public.categories WHERE slug = 'netvaerk-og-wifi'),
  ARRAY['wifi', 'router', 'mesh', 'netværk'],
  'https://images.unsplash.com/photo-1606904825846-647eb07f5be2?w=1200&q=80',
  'WiFi-router på et skrivebord',
  '[
    {"question":"Hvor mange mesh-noder skal jeg bruge?","answer":"En regel er én node pr. 80-100 m² i et almindeligt hjem. Har du to etager, så minimum én node pr. etage."},
    {"question":"Skal jeg opgradere til WiFi 7?","answer":"Ikke endnu. WiFi 6 eller 6E dækker næsten alle behov, og få enheder udnytter WiFi 7 i dag."}
  ]'::jsonb,
  'published',
  now() - interval '5 days',
  now() - interval '5 days'
),
(
  'Kom i gang med Matter — smart home-standarden forklaret',
  'kom-i-gang-med-matter',
  'Matter forklaret: Kom i gang med den nye smart home-standard',
  'Matter samler smart home under én standard. Guide til hvad det er, hvad det kan, og hvordan du kommer i gang.',
  'Matter er standarden der skulle gøre smart home nemt. Sådan fungerer det i praksis — og hvad du skal købe.',
  E'Matter er en åben standard støttet af Apple, Google, Amazon og Samsung. Målet er enkelt: én standard, alle enheder, uanset producent.\n\n## Hvad kan Matter i praksis?\n\nEn Matter-enhed kan styres fra alle Matter-kompatible økosystemer samtidig. Køber du en Matter-pære, virker den i både Apple Home, Google Home og Amazon Alexa uden ekstra broer.\n\n## Hvad du skal bruge\n\n1. **En Matter-controller** — fx en HomePod Mini, Google Nest Hub eller Amazon Echo (4. gen)\n2. **Thread border router** — mange controllere har det indbygget\n3. **Matter-enheder** — kig efter Matter-logoet på pakken\n\n## Thread vs Wi-Fi\n\nMatter kører oven på flere netværkstyper. Thread er et mesh-netværk med lavt strømforbrug, ideelt til batteridrevne sensorer. Wi-Fi bruges til enheder der alligevel trækker strøm, som pærer og stikkontakter.\n\n## Realistisk forventningsafstemning\n\nMatter virker, men det er stadig tidlige dage. Avancerede funktioner (fx farvescener på en pære) fungerer bedst i det økosystem producenten primært supporterer. Basale funktioner — tænd/sluk, dæmpning, sensordata — virker på tværs.',
  (SELECT id FROM public.categories WHERE slug = 'guides'),
  ARRAY['matter', 'smart home', 'thread'],
  'https://images.unsplash.com/photo-1558002038-1055907df827?w=1200&q=80',
  'Smart home-enheder på et bord',
  NULL,
  'published',
  now() - interval '10 days',
  now() - interval '3 days'
);
