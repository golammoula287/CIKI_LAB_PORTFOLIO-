"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getDb } from "@/server/db";
import { requireStaff } from "@/server/auth";
import {
  saveAchievementRecord,
  publishAchievementRecord,
} from "@/server/services/achievement-core";
import { actionError } from "@/server/services/permissions";
export type SaveResult = { error: string };
export async function saveAchievement(
  _previous: SaveResult,
  form: FormData,
): Promise<SaveResult> {
  const user = await requireStaff();
  let id: string;
  try {
    id = await saveAchievementRecord(getDb(), user.id, {
      id: String(form.get("id") || "") || undefined,
      version: Number(form.get("version") || 0),
      data: {
        ...Object.fromEntries(form),
        disclosureApproved: form.get("disclosureApproved") === "on",
        authorEntries: JSON.parse(String(form.get("authorEntries") || "[]")),
        departmentIds: form.getAll("departmentIds").map(String),
      },
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
  revalidatePath("/admin", "layout");
  redirect(`/admin/achievements/${id}?saved=1`);
}
export async function changePublication(
  _previous: SaveResult,
  form: FormData,
): Promise<SaveResult> {
  const user = await requireStaff();
  const id = String(form.get("id"));
  const operation = z
    .enum(["publish", "archive", "restore"])
    .safeParse(form.get("operation"));
  if (!operation.success) return { error: "Unknown action." };
  try {
    await publishAchievementRecord(getDb(), user.id, {
      id,
      version: Number(form.get("version")),
      operation: operation.data,
    });
  } catch (error) {
    return { error: actionError(error) };
  }
  revalidatePath("/", "layout");
  redirect(`/admin/achievements/${id}?published=1`);
}
