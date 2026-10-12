import type { PrismaClient, Prisma } from "@/generated/prisma/client";
import {
  achievementSchema,
  isDisclosable,
} from "@/features/achievements/schema";
import { actorIn, UserFacingError } from "./permissions";
export const publicAchievementWhere: Prisma.AchievementWhereInput = {
  archivedAt: null,
  publishedRevision: {
    is: {
      OR: [{ status: { not: "UNDER_REVIEW" } }, { disclosureApproved: true }],
    },
  },
};
export async function saveAchievementRecord(
  db: PrismaClient,
  actorId: string,
  input: { id?: string; version: number; data: unknown },
) {
  const parsed = achievementSchema.parse(input.data);
  const { slug, authorEntries, departmentIds, ...fields } = parsed;
  const authors = authorEntries.length
    ? authorEntries
    : fields.authors
        .split(";")
        .filter(Boolean)
        .map((name) => ({ name: name.trim(), affiliation: "", personId: "" }));
  return db.$transaction(async (tx) => {
    const actor = await actorIn(tx, actorId);
    if (fields.disclosureApproved && actor.role === "EDITOR")
      throw new UserFacingError(
        "Only administrators may approve public disclosure.",
      );
    const departmentSet = [...new Set(departmentIds)];
    if (
      departmentSet.length !==
      (await tx.contentRecord.count({
        where: {
          id: { in: departmentSet },
          kind: "DEPARTMENT",
          archivedAt: null,
        },
      }))
    )
      throw new UserFacingError("Choose existing departments.");
    for (const author of authors)
      if (
        author.personId &&
        !(await tx.contentRecord.findFirst({
          where: { id: author.personId, kind: "PERSON", archivedAt: null },
        }))
      )
        throw new UserFacingError(
          "Choose an existing person for linked authors.",
        );
    let id = input.id;
    let version = 1;
    if (id) {
      const current = await tx.achievement.findUnique({ where: { id } });
      if (!current || current.archivedAt)
        throw new UserFacingError("This record is unavailable or archived.");
      const updated = await tx.achievement.updateMany({
        where: { id, version: input.version, archivedAt: null },
        data: { version: { increment: 1 } },
      });
      if (!updated.count)
        throw new UserFacingError("A newer edit exists. Reload before saving.");
      version = input.version + 1;
    } else {
      if (await tx.achievementRedirect.findUnique({ where: { oldSlug: slug } }))
        throw new UserFacingError(
          "This URL is reserved by a previous achievement.",
        );
      id = (await tx.achievement.create({ data: { slug } })).id;
    }
    await tx.achievementRevision.create({
      data: {
        ...fields,
        authors: authors.map((a) => a.name).join("; "),
        url: fields.url || null,
        requestedSlug: slug,
        achievementId: id,
        version,
        createdBy: actorId,
        authorEntries: {
          create: authors.map((a, sortOrder) => ({
            ...a,
            personId: a.personId || null,
            sortOrder,
          })),
        },
        departments: {
          create: departmentSet.map((departmentId) => ({ departmentId })),
        },
      },
    });
    await tx.auditEvent.create({
      data: { actorId, entityId: id, operation: "ACHIEVEMENT_DRAFT_SAVED" },
    });
    return id;
  });
}
export async function publishAchievementRecord(
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
    const record = await tx.achievement.findUnique({
      where: { id: input.id },
      include: {
        revisions: {
          orderBy: { version: "desc" },
          take: 1,
          include: { departments: { include: { department: true } } },
        },
      },
    });
    if (!record || record.version !== input.version)
      throw new UserFacingError(
        "The record changed. Reload before continuing.",
      );
    if (record.archivedAt && input.operation !== "restore")
      throw new UserFacingError("Restore the record before publishing.");
    const r = record.revisions[0];
    if (!r) throw new UserFacingError("Save a draft first.");
    const slug = r.requestedSlug || record.slug;
    if (input.operation === "publish") {
      if (!isDisclosable(r.status, r.disclosureApproved))
        throw new UserFacingError(
          "Approve public disclosure before publishing under-review work.",
        );
      if (
        r.departments.some(
          (d) => d.department.archivedAt || !d.department.publishedRevisionId,
        )
      )
        throw new UserFacingError("Publish the related departments first.");
      if (slug !== record.slug) {
        const reserved = await tx.achievementRedirect.findUnique({
          where: { oldSlug: slug },
        });
        if (reserved && reserved.achievementId !== record.id)
          throw new UserFacingError(
            "This URL is reserved by another achievement.",
          );
        if (reserved)
          await tx.achievementRedirect.delete({ where: { oldSlug: slug } });
        await tx.achievementRedirect.upsert({
          where: { oldSlug: record.slug },
          create: { oldSlug: record.slug, achievementId: record.id },
          update: { achievementId: record.id },
        });
      }
    }
    const changed = await tx.achievement.updateMany({
      where: { id: record.id, version: input.version },
      data: {
        version: { increment: 1 },
        ...(input.operation === "publish"
          ? { slug, publishedRevisionId: r.id }
          : input.operation === "archive"
            ? { archivedAt: new Date() }
            : { archivedAt: null, publishedRevisionId: null }),
      },
    });
    if (!changed.count)
      throw new UserFacingError(
        "The record changed. Reload before continuing.",
      );
    await tx.auditEvent.create({
      data: {
        actorId,
        entityId: record.id,
        operation: `ACHIEVEMENT_${input.operation.toUpperCase()}`,
      },
    });
    return record;
  });
}
