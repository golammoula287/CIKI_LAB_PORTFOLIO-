import "server-only";
import { cache } from "react";
import { permanentRedirect } from "next/navigation";
import { getDb } from "@/server/db";
import { getEnv } from "@/lib/env";
import { parseContent, publicPath, type Kind } from "@/features/content/schema";
import { defaultSettings, settingsSchema } from "@/features/settings/schema";
import { departments as initialDepartments } from "@/lib/catalog";
import type { Prisma } from "@/generated/prisma/client";
import { PAGE_SIZE } from "@/lib/pagination";
export const getSettings = cache(async () => {
  if (!getEnv().DATABASE_URL) return { data: defaultSettings, version: 0 };
  const row = await getDb().siteSettings.findUnique({ where: { id: "site" } });
  return {
    data: row ? settingsSchema.parse(row.payload) : defaultSettings,
    version: row?.version || 0,
  };
});
export async function publicContent(
  kind: Kind,
  options: {
    q?: string;
    page?: number;
    category?: string;
    advisory?: boolean;
    membersOnly?: boolean;
    department?: string;
    open?: boolean;
    limit?: number;
  } = {},
) {
  if (!getEnv().DATABASE_URL) {
    const entries =
      kind === "DEPARTMENT"
        ? initialDepartments.map((d, i) => ({
            id: d.slug,
            slug: d.slug,
            updatedAt: new Date("2026-10-11"),
            data: parseContent("DEPARTMENT", {
              title: d.name,
              summary: d.description,
              icon: d.icon,
              sortOrder: i,
            }),
          }))
        : [];
    const filtered = entries.filter(
      (entry) =>
        !options.q ||
        `${entry.data.title} ${entry.data.summary}`
          .toLowerCase()
          .includes(options.q.toLowerCase()),
    );
    const offset = ((options.page || 1) - 1) * PAGE_SIZE;
    return {
      entries: filtered.slice(offset, offset + (options.limit || PAGE_SIZE)),
      total: filtered.length,
    };
  }
  const where: Prisma.ContentRecordWhereInput = {
    kind,
    archivedAt: null,
    publishedRevision: {
      is: {
        ...(options.q
          ? {
              OR: [
                {
                  title: {
                    contains: options.q.slice(0, 200),
                    mode: "insensitive",
                  },
                },
                {
                  summary: {
                    contains: options.q.slice(0, 200),
                    mode: "insensitive",
                  },
                },
              ],
            }
          : {}),
        ...(options.category ? { categoryId: options.category } : {}),
        ...(options.membersOnly && !options.category
          ? { categoryId: { not: null } }
          : {}),
        ...(options.advisory !== undefined
          ? { advisory: options.advisory }
          : {}),
        ...(options.department
          ? {
              links: {
                some: {
                  targetId: options.department,
                  target: {
                    archivedAt: null,
                    publishedRevisionId: { not: null },
                  },
                },
              },
            }
          : {}),
        ...(options.open
          ? {
              closed: false,
              AND: [
                { OR: [{ deadline: null }, { deadline: { gt: new Date() } }] },
              ],
            }
          : {}),
      },
    },
  };
  const [rows, total] = await Promise.all([
    getDb().contentRecord.findMany({
      where,
      include: { publishedRevision: true },
      orderBy: [
        { publishedRevision: { sortOrder: "asc" } },
        { createdAt: "desc" },
      ],
      skip: ((options.page || 1) - 1) * PAGE_SIZE,
      take: Math.min(options.limit || PAGE_SIZE, 1000),
    }),
    getDb().contentRecord.count({ where }),
  ]);
  return {
    total,
    entries: rows.map((row) => ({
      id: row.id,
      slug: row.slug,
      updatedAt: row.updatedAt,
      data: parseContent(kind, row.publishedRevision!.payload),
    })),
  };
}
export const getPublicContent = cache(async (kind: Kind, slug: string) => {
  if (!getEnv().DATABASE_URL) {
    if (kind === "DEPARTMENT") {
      const d = initialDepartments.find((d) => d.slug === slug);
      if (d)
        return {
          id: d.slug,
          slug,
          data: parseContent(kind, {
            title: d.name,
            summary: d.description,
            icon: d.icon,
          }),
        };
    }
    return null;
  }
  const record = await getDb().contentRecord.findUnique({
    where: { kind_slug: { kind, slug } },
    include: { publishedRevision: true },
  });
  if (record?.publishedRevision && !record.archivedAt)
    return {
      id: record.id,
      slug: record.slug,
      data: parseContent(kind, record.publishedRevision.payload),
    };
  if (!record) {
    const alias = await getDb().contentRedirect.findUnique({
      where: { kind_oldSlug: { kind, oldSlug: slug } },
      include: { record: true },
    });
    if (alias?.record.publishedRevisionId && !alias.record.archivedAt)
      permanentRedirect(publicPath(kind, alias.record.slug));
  }
  return null;
});
export async function contentChoices() {
  const db = getDb();
  const [media, departments, categories] = await Promise.all([
    db.mediaAsset.findMany({ orderBy: { createdAt: "desc" } }),
    db.contentRecord.findMany({
      where: { kind: "DEPARTMENT", archivedAt: null },
      include: { revisions: { orderBy: { version: "desc" }, take: 1 } },
    }),
    db.membershipCategory.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);
  return {
    media: media.map((m) => ({ id: m.id, label: m.name })),
    departments: departments.map((d) => ({
      id: d.id,
      label: d.revisions[0]?.title || d.slug,
    })),
    categories: categories.map((c) => ({ id: c.id, label: c.label })),
  };
}
export async function authorChoices() {
  const people = await getDb().contentRecord.findMany({
    where: { kind: "PERSON", archivedAt: null },
    include: { revisions: { orderBy: { version: "desc" }, take: 1 } },
  });
  return people.map((p) => ({
    id: p.id,
    label: p.revisions[0]?.title || p.slug,
  }));
}
