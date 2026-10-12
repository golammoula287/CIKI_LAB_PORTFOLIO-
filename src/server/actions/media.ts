"use server";
import { revalidatePath } from "next/cache";
import { requireStaff } from "@/server/auth";
import { getDb } from "@/server/db";
import { deleteMediaRecord } from "@/server/services/media-core";
import { actionError } from "@/server/services/permissions";
import { removeImage, type Driver } from "@/server/storage";
import type { FormState } from "./content";
export async function deleteMedia(
  _state: FormState,
  form: FormData,
): Promise<FormState> {
  const user = await requireStaff();
  try {
    const asset = await deleteMediaRecord(
      getDb(),
      user.id,
      String(form.get("id")),
    );
    try {
      await removeImage(asset.storageKey, asset.driver as Driver);
    } catch {
      console.error(
        "Storage cleanup required for deleted media",
        asset.storageKey,
      );
    }
  } catch (error) {
    return { error: actionError(error) };
  }
  revalidatePath("/admin/media");
  return { error: "", success: "Image removed." };
}
