import "server-only";
import { permanentRedirect } from "next/navigation";
import { getDb } from "@/server/db";
import { getEnv } from "@/lib/env";
import { statuses } from "@/features/achievements/schema";
import { publicAchievementWhere } from "./achievement-core";
import type { Prisma } from "@/generated/prisma/client";
import { PAGE_SIZE, type SearchParams, valueOf } from "@/lib/pagination";
export function achievementFilter(
  query: SearchParams,
): Prisma.AchievementRevisionWhereInput {
  const type = valueOf(query.type);
  const status = valueOf(query.status);
  const year = Number(valueOf(query.year));
  const q = valueOf(query.q).slice(0, 200);
  const department = valueOf(query.department);
  const person = valueOf(query.person);
  return {
    ...(Object.hasOwn(statuses, type) ? { type } : {}),
    ...(Object.values(statuses).flat().includes(status) ? { status } : {}),
    ...(Number.isInteger(year) &&
    year >= 1900 &&
    year <= new Date().getFullYear() + 5
      ? { year }
      : {}),
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { authors: { contains: q, mode: "insensitive" } },
            { venue: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(department
      ? {
          departments: {
            some: {
              departmentId: department,
              department: {
                archivedAt: null,
                publishedRevisionId: { not: null },
              },
            },
          },
        }
      : {}),
    ...(person
      ? {
          authorEntries: {
            some: {
              personId: person,
              person: { archivedAt: null, publishedRevisionId: { not: null } },
            },
          },
        }
      : {}),
  };
}
export async function getPublishedAchievements(
  query: SearchParams = {},
  page = 1,
) {
  if (!getEnv().DATABASE_URL) return { entries: [], total: 0 };
  const where: Prisma.AchievementWhereInput = {
    AND: [
      publicAchievementWhere,
      { publishedRevision: { is: achievementFilter(query) } },
    ],
  };
  const [entries, total] = await Promise.all([
    getDb().achievement.findMany({
      where,
      select: {
        id: true,
        slug: true,
        publishedRevision: {
          select: {
            title: true,
            type: true,
            year: true,
            status: true,
            authors: true,
            venue: true,
            abstract: true,
            url: true,
          },
        },
      },
      orderBy: [{ publishedRevision: { year: "desc" } }, { createdAt: "desc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    getDb().achievement.count({ where }),
  ]);
  return { entries, total };
}
export async function getPublicAchievement(slug: string) {
  if (!getEnv().DATABASE_URL) return null;
  const record = await getDb().achievement.findFirst({
    where: { AND: [publicAchievementWhere, { slug }] },
    include: {
      publishedRevision: {
        include: {
          authorEntries: { orderBy: { sortOrder: "asc" } },
          departments: {
            include: { department: { include: { publishedRevision: true } } },
          },
        },
      },
    },
  });
  if (record) return record;
  const existing = await getDb().achievement.findUnique({
    where: { slug },
    select: { id: true },
  });
  if (!existing) {
    const alias = await getDb().achievementRedirect.findUnique({
      where: { oldSlug: slug },
    });
    if (alias) {
      const target = await getDb().achievement.findFirst({
        where: { AND: [publicAchievementWhere, { id: alias.achievementId }] },
      });
      if (target) permanentRedirect(`/achievements/${target.slug}`);
    }
  }
  return null;
}
