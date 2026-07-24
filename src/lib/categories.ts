// Maps category slug → utility class names defined in src/styles.css.
// Unknown slugs fall back to a neutral accent style.

export function categoryTagClass(slug: string): string {
  switch (slug) {
    case "smart-home":
      return "cat-tag-smart-home";
    case "netvaerk-wifi":
      return "cat-tag-netvaerk-wifi";
    case "guides":
      return "cat-tag-guides";
    default:
      return "cat-tag-default";
  }
}

export function categoryUnderlineClass(slug: string): string {
  switch (slug) {
    case "smart-home":
      return "cat-underline-smart-home";
    case "netvaerk-wifi":
      return "cat-underline-netvaerk-wifi";
    case "guides":
      return "cat-underline-guides";
    default:
      return "cat-underline-default";
  }
}
