import type { Prisma } from "@/generated/prisma/client";
export class UserFacingError extends Error {}
export async function actorIn(
  tx: Prisma.TransactionClient,
  id: string,
  permission: "edit" | "publish" | "owner" = "edit",
) {
  const actor = await tx.user.findUnique({ where: { id } });
  if (
    !actor?.active ||
    (permission === "publish" && actor.role === "EDITOR") ||
    (permission === "owner" && actor.role !== "OWNER")
  )
    throw new UserFacingError(
      "You do not have permission to perform this action.",
    );
  return actor;
}
export function actionError(error: unknown) {
  return error instanceof UserFacingError
    ? error.message
    : "The operation could not be completed. Check for duplicate slugs and reload before retrying.";
}
