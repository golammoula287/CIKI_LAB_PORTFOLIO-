import type { PrismaClient } from "@/generated/prisma/client";
import { actorIn, UserFacingError } from "./permissions";
export async function mediaIsPublic(db: PrismaClient, id: string) {
  return Boolean(
    await db.mediaAsset.findFirst({
      where: {
        id,
        OR: [
          {
            references: {
              some: {
                revision: { publishedFor: { is: { archivedAt: null } } },
              },
            },
          },
          { logoFor: { some: { id: "site" } } },
        ],
      },
      select: { id: true },
    }),
  );
}
export async function deleteMediaRecord(
  db: PrismaClient,
  actorId: string,
  id: string,
) {
  return db.$transaction(async (tx) => {
    await actorIn(tx, actorId, "publish");
    const asset = await tx.mediaAsset.findUnique({
      where: { id },
      include: { _count: { select: { references: true, logoFor: true } } },
    });
    if (!asset) throw new UserFacingError("Image not found.");
    if (asset._count.references || asset._count.logoFor)
      throw new UserFacingError(
        "This image is referenced by content or its revision history and cannot be deleted.",
      );
    await tx.mediaAsset.delete({ where: { id } });
    await tx.auditEvent.create({
      data: { actorId, entityId: id, operation: "MEDIA_DELETED" },
    });
    return asset;
  });
}
