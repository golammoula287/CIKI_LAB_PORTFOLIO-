import type { PrismaClient, Prisma } from "@/generated/prisma/client";
import {
  parseContent,
  mediaIds,
  pageKeys,
  slugSchema,
  type Kind,
} from "@/features/content/schema";
import { actorIn, UserFacingError } from "./permissions";

export async function saveContent(
  db: PrismaClient,
  actorId: string,
  input: {
    id?: string;
    version: number;
    kind: Kind;
    slug: string;
    data: unknown;
  },
) {
  const data = parseContent(input.kind, input.data);
  const slug = slugSchema.parse(input.slug);
  if (input.kind === "PAGE" && !pageKeys.includes(slug))
    throw new UserFacingError("Choose one of the supported page addresses.");
  return db.$transaction(async (tx) => {
    await actorIn(tx, actorId);
    const assets = mediaIds(data);
    if (
      assets.length !==
      (await tx.mediaAsset.count({ where: { id: { in: assets } } }))
    )
      throw new UserFacingError("One or more selected images no longer exist.");
    const departments = [...new Set(data.departmentIds)];
    if (
      departments.length !==
      (await tx.contentRecord.count({
        where: {
          id: { in: departments },
          kind: "DEPARTMENT",
          archivedAt: null,
        },
      }))
    )
      throw new UserFacingError("Select existing, active departments.");
    if (
      data.categoryId &&
      !(await tx.membershipCategory.findUnique({
        where: { id: data.categoryId },
      }))
    )
      throw new UserFacingError("Select an existing membership category.");
    let id = input.id;
    let revisionVersion = 1;
    if (id) {
      const current = await tx.contentRecord.findUnique({ where: { id } });
      if (!current || current.kind !== input.kind || current.archivedAt)
        throw new UserFacingError("This record is unavailable or archived.");
      if (input.kind === "PAGE" && slug !== current.slug)
        throw new UserFacingError(
          "Core page addresses are fixed. Edit the matching page instead.",
        );
      // A slug change becomes public only when the associated draft is published.
      const updated = await tx.contentRecord.updateMany({
        where: { id, version: input.version, archivedAt: null },
        data: { version: { increment: 1 } },
      });
      if (updated.count !== 1)
        throw new UserFacingError("A newer edit exists. Reload before saving.");
      revisionVersion = input.version + 1;
    } else {
      if (
        await tx.contentRedirect.findUnique({
          where: { kind_oldSlug: { kind: input.kind, oldSlug: slug } },
        })
      )
        throw new UserFacingError(
          "This address is reserved by a previous page.",
        );
      const record = await tx.contentRecord.create({
        data: { kind: input.kind, slug },
      });
      id = record.id;
    }
    const payload = { ...data, slug } as Prisma.InputJsonValue;
    await tx.contentRevision.create({
      data: {
        recordId: id,
        version: revisionVersion,
        title: data.title,
        summary: data.summary,
        body: data.body,
        payload,
        seoTitle: data.seoTitle,
        seoDescription: data.seoDescription,
        sortOrder: data.sortOrder,
        categoryId: data.categoryId || null,
        advisory: data.advisory,
        deadline: data.deadline ? new Date(data.deadline) : null,
        closed: data.closed,
        createdBy: actorId,
        media: { create: assets.map((assetId) => ({ assetId })) },
        links: { create: departments.map((targetId) => ({ targetId })) },
      },
    });
    await tx.auditEvent.create({
      data: { actorId, entityId: id, operation: `${input.kind}_DRAFT_SAVED` },
    });
    return id;
  });
}
export async function publishContent(
  db: PrismaClient,
  actorId: string,
  input: {
    id: string;
    version: number;
    operation: "publish" | "archive" | "restore";
  },
) {
  return db.$transaction(async (tx) => {
    await actorIn(tx, actorId, "publish");
    const record = await tx.contentRecord.findUnique({
      where: { id: input.id },
      include: { revisions: { orderBy: { version: "desc" }, take: 1 } },
    });
    if (!record || record.version !== input.version)
      throw new UserFacingError(
        "The record changed. Reload before continuing.",
      );
    const revision = record.revisions[0];
    if (!revision) throw new UserFacingError("Save a draft first.");
    if (record.archivedAt && input.operation !== "restore")
      throw new UserFacingError("Restore the record before publishing.");
    const data = parseContent(record.kind, revision.payload);
    const slug = slugSchema.parse(
      (revision.payload as { slug?: string }).slug || record.slug,
    );
    if (input.operation === "publish") {
      if (record.kind === "PERSON" && !data.categoryId && !data.advisory)
        throw new UserFacingError(
          "Select a membership category or advisory panel placement.",
        );
      if (record.kind === "ALBUM" && !data.photos.length)
        throw new UserFacingError(
          "Add at least one photograph before publishing.",
        );
      for (const targetId of data.departmentIds) {
        const target = await tx.contentRecord.findUnique({
          where: { id: targetId },
        });
        if (!target?.publishedRevisionId || target.archivedAt)
          throw new UserFacingError(
            "Publish selected departments before this record.",
          );
      }
      if (slug !== record.slug) {
        const reserved = await tx.contentRedirect.findUnique({
          where: { kind_oldSlug: { kind: record.kind, oldSlug: slug } },
        });
        if (reserved && reserved.recordId !== record.id)
          throw new UserFacingError(
            "This address is reserved by another record.",
          );
        if (reserved)
          await tx.contentRedirect.delete({ where: { id: reserved.id } });
        await tx.contentRedirect.upsert({
          where: { kind_oldSlug: { kind: record.kind, oldSlug: record.slug } },
          create: {
            kind: record.kind,
            oldSlug: record.slug,
            recordId: record.id,
          },
          update: { recordId: record.id },
        });
      }
    }
    const changed = await tx.contentRecord.updateMany({
      where: { id: record.id, version: input.version },
      data: {
        version: { increment: 1 },
        ...(input.operation === "publish"
          ? { publishedRevisionId: revision.id, slug }
          : input.operation === "archive"
            ? { archivedAt: new Date() }
            : { archivedAt: null, publishedRevisionId: null }),
      },
    });
    if (changed.count !== 1)
      throw new UserFacingError(
        "The record changed. Reload before continuing.",
      );
    await tx.auditEvent.create({
      data: {
        actorId,
        entityId: record.id,
        operation: `${record.kind}_${input.operation.toUpperCase()}`,
      },
    });
    return record;
  });
}
