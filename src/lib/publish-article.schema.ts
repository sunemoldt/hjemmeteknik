import { z } from "zod";

const faqItemSchema = z.object({
  question: z.string().min(1).max(500),
  answer: z.string().min(1).max(5000),
});

export const publishArticleSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z
    .string()
    .min(1)
    .max(200)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be URL-friendly (lowercase letters, numbers, and hyphens only)")
    .optional(),
  category: z.string().min(1).max(100),
  excerpt: z.string().min(1).max(1000),
  body_markdown: z.string().min(1).max(50000),
  tags: z.array(z.string().min(1).max(50)).max(20).default([]),
  meta_title: z.string().max(200).optional(),
  meta_description: z.string().max(500).optional(),
  faq: z.array(faqItemSchema).max(30).optional(),
  author: z.string().min(1).max(100).default("Hjemmeteknik.dk"),
  status: z.enum(["draft", "published"]).default("draft"),
  published_at: z.string().datetime().optional().nullable(),
  featured_image_url: z.string().url().max(1000).optional().nullable(),
  featured_image_alt: z.string().max(300).optional().nullable(),
});

export type PublishArticleInput = z.infer<typeof publishArticleSchema>;
