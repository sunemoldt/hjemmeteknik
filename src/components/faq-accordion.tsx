import { useState } from "react";
import { Plus, Minus } from "lucide-react";
import type { FaqItem } from "@/lib/content.functions";

export function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="divide-y divide-border rounded-lg border border-border bg-card">
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <div key={i}>
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : i)}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
              aria-expanded={isOpen}
            >
              <span className="font-serif text-lg text-foreground">
                {item.question}
              </span>
              {isOpen ? (
                <Minus className="h-4 w-4 shrink-0 text-muted-foreground" />
              ) : (
                <Plus className="h-4 w-4 shrink-0 text-muted-foreground" />
              )}
            </button>
            {isOpen && (
              <div className="px-5 pb-5 text-[15px] leading-relaxed text-muted-foreground">
                {item.answer}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
