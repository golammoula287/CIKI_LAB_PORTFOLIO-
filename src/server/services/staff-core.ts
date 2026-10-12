import { createHash, randomBytes, randomUUID } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import type { PrismaClient, Role } from "@/generated/prisma/client";
import { z } from "zod";
import { actorIn, UserFacingError } from "./permissions";
export const hashToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");
const grantSchema = z.object({
  email: z.email().transform((v) => v.toLowerCase()),
  name: z.string().trim().min(2).max(100),
  role: z.enum(["EDITOR", "ADMIN", "OWNER"]),
  purpose: z.enum(["INVITE", "RESET"]),
});
export async function issueGrant(
  db: PrismaClient,
  actorId: string,
  input: unknown,
) {
  const data = grantSchema.parse(input);
  const token = randomBytes(32).toString("hex");
  await db.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(81927341)`;
    await actorIn(tx, actorId, "owner");
    const existing = await tx.user.findUnique({ where: { email: data.email } });
    if (data.purpose === "INVITE" && existing)
      throw new UserFacingError(
        "This user already exists. Use a recovery link instead.",
      );
    if (data.purpose === "RESET" && !existing?.active)
      throw new UserFacingError("Recovery requires an active staff account.");
    await tx.accessGrant.updateMany({
      where: { email: data.email, usedAt: null },
      data: { usedAt: new Date() },
    });
    await tx.accessGrant.create({
      data: {
        ...data,
        role: existing?.role || data.role,
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        createdBy: actorId,
      },
    });
    await tx.auditEvent.create({
      data: {
        actorId,
        entityId: existing?.id || data.email,
        operation: `STAFF_${data.purpose}_ISSUED`,
      },
    });
  });
  return token;
}
export async function acceptGrant(
  db: PrismaClient,
  token: string,
  password: string,
) {
  z.string()
    .regex(/^[a-f0-9]{64}$/)
    .parse(token);
  z.string().min(12).max(128).parse(password);
  const candidate = await db.accessGrant.findUnique({
    where: { tokenHash: hashToken(token) },
  });
  if (!candidate || candidate.usedAt || candidate.expiresAt <= new Date())
    throw new UserFacingError(
      "This link has expired or has already been used.",
    );
  const hashed = await hashPassword(password);
  return db.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(81927341)`;
    const grant = await tx.accessGrant.findUnique({
      where: { tokenHash: hashToken(token) },
    });
    if (!grant || grant.usedAt || grant.expiresAt <= new Date())
      throw new UserFacingError(
        "This link has expired or has already been used.",
      );
    const issuer = await tx.user.findUnique({ where: { id: grant.createdBy } });
    if (!issuer?.active || issuer.role !== "OWNER")
      throw new UserFacingError("This invitation was revoked.");
    const claimed = await tx.accessGrant.updateMany({
      where: { id: grant.id, usedAt: null, expiresAt: { gt: new Date() } },
      data: { usedAt: new Date() },
    });
    if (!claimed.count)
      throw new UserFacingError("This link has already been used.");
    let user = await tx.user.findUnique({ where: { email: grant.email } });
    if (grant.purpose === "INVITE") {
      if (user) throw new UserFacingError("An account already exists.");
      user = await tx.user.create({
        data: {
          id: randomUUID(),
          email: grant.email,
          name: grant.name,
          role: grant.role,
          active: true,
        },
      });
      await tx.account.create({
        data: {
          id: randomUUID(),
          accountId: user.id,
          providerId: "credential",
          userId: user.id,
          password: hashed,
        },
      });
    } else {
      if (!user?.active)
        throw new UserFacingError("Account access has been revoked.");
      const account = await tx.account.findFirst({
        where: { userId: user.id, providerId: "credential" },
      });
      if (account)
        await tx.account.update({
          where: { id: account.id },
          data: { password: hashed },
        });
      else
        await tx.account.create({
          data: {
            id: randomUUID(),
            accountId: user.id,
            providerId: "credential",
            userId: user.id,
            password: hashed,
          },
        });
      await tx.session.deleteMany({ where: { userId: user.id } });
    }
    await tx.auditEvent.create({
      data: {
        actorId: user.id,
        entityId: user.id,
        operation: `STAFF_${grant.purpose}_ACCEPTED`,
      },
    });
    return user.id;
  });
}
export async function updateStaff(
  db: PrismaClient,
  actorId: string,
  id: string,
  role: Role,
  active: boolean,
) {
  z.enum(["OWNER", "ADMIN", "EDITOR"]).parse(role);
  return db.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(81927341)`;
    await actorIn(tx, actorId, "owner");
    const user = await tx.user.findUnique({ where: { id } });
    if (!user) throw new UserFacingError("User not found.");
    if (
      user.role === "OWNER" &&
      user.active &&
      (!active || role !== "OWNER") &&
      (await tx.user.count({ where: { role: "OWNER", active: true } })) <= 1
    )
      throw new UserFacingError(
        "The last active owner cannot be demoted or revoked.",
      );
    await tx.user.update({ where: { id }, data: { role, active } });
    await tx.session.deleteMany({ where: { userId: id } });
    await tx.accessGrant.updateMany({
      where: { OR: [{ email: user.email }, { createdBy: id }], usedAt: null },
      data: { usedAt: new Date() },
    });
    await tx.auditEvent.create({
      data: { actorId, entityId: id, operation: "STAFF_ACCESS_UPDATED" },
    });
  });
}
