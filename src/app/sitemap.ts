import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/siteUrl";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl();
  const now = new Date();

  const paths = [
    { path: "", priority: 1, changeFrequency: "weekly" as const },
    {
      path: "/maps-analyzer",
      priority: 0.9,
      changeFrequency: "weekly" as const,
    },
    {
      path: "/local-content-pack-generator",
      priority: 0.9,
      changeFrequency: "weekly" as const,
    },
  ];

  return paths.map(({ path, priority, changeFrequency }) => ({
    url: `${base}${path || "/"}`,
    lastModified: now,
    changeFrequency,
    priority,
  }));
}
