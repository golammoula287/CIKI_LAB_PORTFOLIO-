"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStaff } from "@/server/auth";
import { getDb } from "@/server/db";
import { getEnv, isConfigured } from "@/lib/env";
import {
  issueGrant,
  acceptGrant,
  updateStaff,
} from "@/server/services/staff-core";
import { actionError, actorIn } from "@/server/services/permissions";
import type { FormState } from "./content";
import { z } from "zod";
export async function issueStaffLink(
  _state: FormState,
  form: FormData,
): Promise<FormState> {
  const user = await requireStaff();
  try {
    const token = await issueGrant(getDb(), user.id, Object.fromEntries(form));
    revalidatePath("/admin/users");
    return {
      error: "",
      link: `${getEnv().BETTER_AUTH_URL}/accept-invite#${token}`,
      success:
        "Share this private link directly with the intended recipient. It expires in 24 hours and is shown only here.",
    };
  } catch (error) {
    return {
      error:
        error instanceof z.ZodError
          ? "Check the email, name, and role."
          : actionError(error),
    };
  }
}
export async function acceptStaffLink(
  _state: FormState,
  form: FormData,
): Promise<FormState> {
  if (!isConfigured()) return { error: "Staff access is not configured." };
  if (form.get("password") !== form.get("confirmPassword"))
    return { error: "Passwords do not match." };
  try {
    await acceptGrant(
      getDb(),
      String(form.get("token")),
      String(form.get("password")),
    );
  } catch (error) {
    return {
      error:
        error instanceof z.ZodError
          ? "Use a valid link and a password of 12–128 characters."
          : actionError(error),
    };
  }
  redirect("/login?setup=complete");
}
export async function updateStaffAction(
  _state: FormState,
  form: FormData,
): Promise<FormState> {
  const user = await requireStaff();
  try {
    const role = z.enum(["OWNER", "ADMIN", "EDITOR"]).parse(form.get("role"));
    await updateStaff(
      getDb(),
      user.id,
      String(form.get("id")),
      role,
      form.get("active") === "on",
    );
  } catch (error) {
    return { error: actionError(error) };
  }
  revalidatePath("/admin", "layout");
  return {
    error: "",
    success: "Access updated. Existing sessions were revoked.",
  };
}
export async function revokeGrantAction(
  _state: FormState,
  form: FormData,
): Promise<FormState> {
  const user = await requireStaff();
  try {
    await getDb().$transaction(async (tx) => {
      await actorIn(tx, user.id, "owner");
      const id = String(form.get("id"));
      await tx.accessGrant.updateMany({
        where: { id, usedAt: null },
        data: { usedAt: new Date() },
      });
      await tx.auditEvent.create({
        data: {
          actorId: user.id,
          entityId: id,
          operation: "STAFF_LINK_REVOKED",
        },
      });
    });
  } catch (error) {
    return { error: actionError(error) };
  }
  revalidatePath("/admin/users");
  return { error: "", success: "Link revoked." };
}
