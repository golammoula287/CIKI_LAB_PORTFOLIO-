import "dotenv/config";
import { randomUUID } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import { z } from "zod";
import { getDb } from "../src/server/db";
const input = z
  .object({
    OWNER_EMAIL: z.email(),
    OWNER_PASSWORD: z.string().min(12).max(128),
    RECOVERY_CONFIRM_EMAIL: z.email(),
  })
  .parse(process.env);
if (
  input.OWNER_EMAIL.toLowerCase() !== input.RECOVERY_CONFIRM_EMAIL.toLowerCase()
)
  throw new Error(
    "Recovery confirmation must match the existing owner's email.",
  );
const db = getDb();
try {
  const password = await hashPassword(input.OWNER_PASSWORD);
  await db.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(81927341)`;
    const user = await tx.user.findUnique({
      where: { email: input.OWNER_EMAIL.toLowerCase() },
    });
    if (!user || user.role !== "OWNER")
      throw new Error("Recovery only supports an existing owner account.");
    const account = await tx.account.findFirst({
      where: { userId: user.id, providerId: "credential" },
    });
    if (account)
      await tx.account.update({
        where: { id: account.id },
        data: { password },
      });
    else
      await tx.account.create({
        data: {
          id: randomUUID(),
          accountId: user.id,
          userId: user.id,
          providerId: "credential",
          password,
        },
      });
    await tx.user.update({ where: { id: user.id }, data: { active: true } });
    await tx.session.deleteMany({ where: { userId: user.id } });
    await tx.accessGrant.updateMany({
      where: {
        OR: [{ email: user.email }, { createdBy: user.id }],
        usedAt: null,
      },
      data: { usedAt: new Date() },
    });
    await tx.auditEvent.create({
      data: {
        actorId: user.id,
        entityId: user.id,
        operation: "OWNER_OPERATOR_RECOVERY",
      },
    });
  });
  console.log(
    "Owner password recovered; sessions and outstanding links revoked. Remove password and confirmation variables now.",
  );
} finally {
  await db.$disconnect();
}
