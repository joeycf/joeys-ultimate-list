import type { MetadataRoute } from "next";
import { getPublishedCollections } from "@/db/queries";
import { siteUrl } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: siteUrl, lastModified: new Date() },
    { url: `${siteUrl}/about`, lastModified: new Date() },
  ];

  // Build-safe: if the DB is unreachable (e.g. building without DATABASE_URL),
  // still emit the static routes rather than crashing the build.
  try {
    const collections = await getPublishedCollections();
    return [
      ...staticRoutes,
      ...collections.map((c) => ({
        url: `${siteUrl}/c/${c.slug}`,
        lastModified: c.updatedAt ?? new Date(),
      })),
    ];
  } catch {
    return staticRoutes;
  }
}
