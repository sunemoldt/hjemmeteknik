import GithubSlugger from "github-slugger";

export interface TocItem {
  id: string;
  text: string;
}

export function buildToc(markdown: string): TocItem[] {
  const slugger = new GithubSlugger();
  const lines = markdown.split("\n");
  const items: TocItem[] = [];
  let inCode = false;
  for (const line of lines) {
    if (line.startsWith("```")) {
      inCode = !inCode;
      continue;
    }
    if (inCode) continue;
    const m = /^##\s+(.+?)\s*$/.exec(line);
    if (m) {
      const text = m[1].replace(/[*_`]/g, "").trim();
      items.push({ id: slugger.slug(text), text });
    }
  }
  return items;
}
