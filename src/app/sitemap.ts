import type { MetadataRoute } from "next";
import { getFormats } from "@/lib/api";
import { SITE_URL } from "@/lib/site";

const PUBLIC_PAGES: [string, number][] = [
  ["", 1],
  ["/formats", 0.9],
  ["/services", 0.8],
  ["/booking", 0.8],
  ["/survey", 0.6],
  ["/reviews", 0.6],
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const pages: MetadataRoute.Sitemap = PUBLIC_PAGES.map(([path, priority]) => ({
    url: `${SITE_URL}${path || "/"}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority,
  }));

  try {
    const formats = await getFormats();
    pages.push(
      ...formats.map((f) => ({
        url: `${SITE_URL}/formats/${f.slug}`,
        lastModified: now,
        changeFrequency: "monthly" as const,
        priority: 0.8,
      })),
    );
  } catch {
    //
  }

  return pages;
}
