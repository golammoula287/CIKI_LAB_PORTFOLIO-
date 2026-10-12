"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireStaff } from "@/server/auth";
import { getDb } from "@/server/db";
import { saveSettings } from "@/server/services/settings-core";
import {
  actionError,
  actorIn,
  UserFacingError,
} from "@/server/services/permissions";
import type { FormState } from "./content";
export async function saveSettingsAction(
  _state: FormState,
  form: FormData,
): Promise<FormState> {
  const user = await requireStaff();
  try {
    await saveSettings(getDb(), user.id, Number(form.get("version")), {
      ...Object.fromEntries(form),
      socialLinks: JSON.parse(String(form.get("socialLinks") || "[]")),
    });
  } catch (error) {
    return {
      error:
        error instanceof z.ZodError
          ? error.issues
              .map((i) => `${i.path.join(".")}: ${i.message}`)
              .join(" · ")
          : actionError(error),
    };
  }
  revalidatePath("/", "layout");
  return { error: "", success: "Settings published." };
}
export async function saveCategoryAction(
  _state: FormState,
  form: FormData,
): Promise<FormState> {
  const user = await requireStaff();
  try {
    const input = z
      .object({
        id: z.string(),
        label: z.string().trim().min(2).max(100),
        key: z
          .string()
          .regex(/^[a-z0-9-]+$/)
          .max(100),
        sortOrder: z.coerce.number().int().min(0).max(10000),
      })
      .parse(Object.fromEntries(form));
    await getDb().$transaction(async (tx) => {
      await actorIn(tx, user.id, "publish");
      if (input.id) {
        const updated = await tx.membershipCategory.updateMany({
          where: { id: input.id },
          data: { label: input.label, sortOrder: input.sortOrder },
        });
        if (!updated.count)
          throw new UserFacingError("Category no longer exists.");
      } else
        await tx.membershipCategory.create({
          data: {
            key: input.key,
            label: input.label,
            sortOrder: input.sortOrder,
          },
        });
      await tx.auditEvent.create({
        data: {
          actorId: user.id,
          entityId: input.id || input.key,
          operation: "MEMBERSHIP_CATEGORY_SAVED",
        },
      });
    });
  } catch (error) {
    return {
      error:
        error instanceof z.ZodError
          ? "Check the category label, key, and order."
          : actionError(error),
    };
  }
  revalidatePath("/", "layout");
  return { error: "", success: "Category saved." };
}
