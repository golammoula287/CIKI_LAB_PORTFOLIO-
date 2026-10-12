import type { PrismaClient, Prisma } from "@/generated/prisma/client";
import { settingsSchema } from "@/features/settings/schema";
import { actorIn, UserFacingError } from "./permissions";
export async function saveSettings(
  db: PrismaClient,
  actorId: string,
  version: number,
  input: unknown,
) {
  const data = settingsSchema.parse(input);
  return db.$transaction(async (tx) => {
    await actorIn(tx, actorId, "publish");
    if (
      data.logoId &&
      !(await tx.mediaAsset.findUnique({ where: { id: data.logoId } }))
    )
      throw new UserFacingError("Choose an existing logo image.");
    if (version === 0)
      await tx.siteSettings.create({
        data: {
          id: "site",
          payload: data as Prisma.InputJsonValue,
          logoId: data.logoId || null,
        },
      });
    else {
      const updated = await tx.siteSettings.updateMany({
        where: { id: "site", version },
        data: {
          payload: data as Prisma.InputJsonValue,
          logoId: data.logoId || null,
          version: { increment: 1 },
        },
      });
      if (updated.count !== 1)
        throw new UserFacingError("Settings changed. Reload before saving.");
    }
    await tx.auditEvent.create({
      data: { actorId, entityId: "site", operation: "SETTINGS_PUBLISHED" },
    });
  });
}
