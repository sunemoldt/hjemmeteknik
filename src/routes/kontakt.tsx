import { createFileRoute } from "@tanstack/react-router";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export const Route = createFileRoute("/kontakt")({
  head: () => ({
    meta: [
      { title: `Kontakt — ${SITE_NAME}` },
      {
        name: "description",
        content:
          "Kontakt redaktionen på hjemmeteknik.dk med spørgsmål, rettelser eller forslag til nye guides.",
      },
      { property: "og:title", content: `Kontakt — ${SITE_NAME}` },
      {
        property: "og:description",
        content: "Kontakt redaktionen på hjemmeteknik.dk.",
      },
      { property: "og:url", content: SITE_URL + "/kontakt" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: SITE_URL + "/kontakt" }],
  }),
  component: Kontakt,
});

function Kontakt() {
  return (
    <article className="mx-auto max-w-2xl px-4 py-16 md:px-6">
      <h1 className="font-serif text-4xl md:text-5xl">Kontakt</h1>
      <div className="prose-article mt-8">
        <p>
          Har du en rettelse, et forslag til en guide, eller vil du fortælle os hvad
          der ikke virker på sitet? Vi hører gerne fra dig.
        </p>
        <p>
          Skriv til: <a href="mailto:redaktion@hjemmeteknik.dk">redaktion@hjemmeteknik.dk</a>
        </p>
        <p>
          Vi svarer normalt inden for et par hverdage. Der er ingen support på
          konkrete produkter — kun redaktionelle henvendelser.
        </p>
      </div>
    </article>
  );
}
