import type { MetadataRoute } from "next";
import { getDb } from "@/server/db";
import { getEnv } from "@/lib/env";
import { siteOrigin } from "@/server/services/seo";
import { publicPath } from "@/features/content/schema";
import { publicAchievementWhere } from "@/server/services/achievement-core";
export const dynamic = "force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = siteOrigin();
  const base = [
    "/",
    "/about",
    "/policies",
    "/research",
    "/achievements",
    "/members",
    "/advisory-panel",
    "/recruitment",
    "/gallery",
    "/contact",
  ].map((path) => ({ url: `${origin}${path}` }));
  if (!getEnv().DATABASE_URL) return base;
  const [content, achievements] = await Promise.all([
    getDb().contentRecord.findMany({
      where: {
        archivedAt: null,
        publishedRevisionId: { not: null },
        kind: { notIn: ["PAGE", "FAQ"] },
      },
      select: { kind: true, slug: true, updatedAt: true },
      take: 20000,
    }),
    getDb().achievement.findMany({
      where: publicAchievementWhere,
      select: { slug: true, updatedAt: true },
      take: 20000,
    }),
  ]);
  return [
    ...base,
    ...content.map((c) => ({
      url: `${origin}${publicPath(c.kind, c.slug)}`,
      lastModified: c.updatedAt,
    })),
    ...achievements.map((a) => ({
      url: `${origin}/achievements/${a.slug}`,
      lastModified: a.updatedAt,
    })),
  ];
}
