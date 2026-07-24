import { createFileRoute } from "@tanstack/react-router";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export const Route = createFileRoute("/om")({
  head: () => ({
    meta: [
      { title: `Om ${SITE_NAME}` },
      {
        name: "description",
        content:
          "Om hjemmeteknik.dk — et redaktionelt site med guides og anmeldelser om smart home, netværk og hjemmeteknik i Danmark.",
      },
      { property: "og:title", content: `Om ${SITE_NAME}` },
      {
        property: "og:description",
        content: "Redaktionelt site om hjemmeteknik i Danmark.",
      },
      { property: "og:url", content: SITE_URL + "/om" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: SITE_URL + "/om" }],
  }),
  component: Om,
});

function Om() {
  return (
    <article className="mx-auto max-w-2xl px-4 py-16 md:px-6">
      <h1 className="font-serif text-4xl md:text-5xl">Om hjemmeteknik.dk</h1>
      <div className="prose-article mt-8">
        <p>
          hjemmeteknik.dk er et dansk, redaktionelt site om det tekniske i hjemmet:
          smart home, netværk, WiFi, robotstøvsugere, sensorer og alt derimellem.
        </p>
        <p>
          Vi laver guides, forklaringer og anbefalinger — uden marketingsprog, uden
          affiliate-cirkus og uden krav om cookies. Vores mål er, at du kan finde et
          reelt svar på et konkret spørgsmål på under et minut.
        </p>
        <h2>Redaktionel linje</h2>
        <p>
          Vi anbefaler produkter og løsninger baseret på hvad der faktisk virker i
          danske hjem — ikke hvad producenterne betaler mest for at fremhæve.
        </p>
        <h2>Kontakt</h2>
        <p>
          Fejl, forslag eller samarbejde? Skriv til os via <a href="/kontakt">kontakt-siden</a>.
        </p>
      </div>
    </article>
  );
}
