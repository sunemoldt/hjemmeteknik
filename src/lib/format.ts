const DA = new Intl.DateTimeFormat("da-DK", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

export function formatDanishDate(iso: string | null | undefined): string {
  if (!iso) return "";
  try {
    return DA.format(new Date(iso));
  } catch {
    return "";
  }
}

export function xmlEscape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
