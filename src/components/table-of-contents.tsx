import type { TocItem } from "@/lib/toc";

export function TableOfContents({ items }: { items: TocItem[] }) {
  if (items.length === 0) return null;
  return (
    <nav aria-label="Indholdsfortegnelse" className="text-sm">
      <div className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Indhold
      </div>
      <ol className="space-y-2 border-l border-border">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className="block border-l-2 border-transparent pl-3 text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
            >
              {item.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
