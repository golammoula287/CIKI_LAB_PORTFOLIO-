import "dotenv/config";
import { randomUUID } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import { z } from "zod";
import { getDb } from "../src/server/db";
const input = z
  .object({
    OWNER_EMAIL: z.email(),
    OWNER_NAME: z.string().min(2),
    OWNER_PASSWORD: z.string().min(12).max(128),
  })
  .parse(process.env);
const db = getDb();
try {
  const password = await hashPassword(input.OWNER_PASSWORD);
  await db.$transaction(async (tx) => {
    // Serializes first-owner provisioning across concurrent executions.
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(81927341)`;
    if (await tx.user.count({ where: { role: "OWNER" } }))
      throw new Error("An owner already exists. Bootstrap is disabled.");
    const id = randomUUID();
    await tx.user.create({
      data: {
        id,
        name: input.OWNER_NAME,
        email: input.OWNER_EMAIL.toLowerCase(),
        role: "OWNER",
        accounts: {
          create: {
            id: randomUUID(),
            accountId: id,
            providerId: "credential",
            password,
          },
        },
      },
    });
    await tx.auditEvent.create({
      data: { actorId: id, entityId: id, operation: "OWNER_BOOTSTRAPPED" },
    });
  });
  console.log(
    "Owner created. Remove OWNER_PASSWORD from your environment now.",
  );
} finally {
  await db.$disconnect();
}
