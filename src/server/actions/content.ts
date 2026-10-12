"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getDb } from "@/server/db";
import { requireStaff } from "@/server/auth";
import { isModule, modules } from "@/features/content/schema";
import { saveContent, publishContent } from "@/server/services/content-core";
import { actionError } from "@/server/services/permissions";
export type FormState = { error: string; success?: string; link?: string };
export async function saveContentAction(
  _state: FormState,
  form: FormData,
): Promise<FormState> {
  const user = await requireStaff();
  const section = String(form.get("module"));
  if (!isModule(section)) return { error: "Unknown content section." };
  let id: string;
  try {
    const data = {
      ...Object.fromEntries(form),
      advisory: form.get("advisory") === "on",
      closed: form.get("closed") === "on",
      deadline: form.get("deadline")
        ? new Date(`${form.get("deadline")}Z`).toISOString()
        : "",
      sections: JSON.parse(String(form.get("sections") || "[]")),
      photos: JSON.parse(String(form.get("photos") || "[]")),
      departmentIds: form.getAll("departmentIds").map(String),
    };
    id = await saveContent(getDb(), user.id, {
      id: String(form.get("id") || "") || undefined,
      version: Number(form.get("version") || 0),
      kind: modules[section].kind,
      slug: String(form.get("slug")),
      data,
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
  redirect(`/admin/${section}/${id}?saved=1`);
}
export async function publishContentAction(
  _state: FormState,
  form: FormData,
): Promise<FormState> {
  const user = await requireStaff();
  const section = String(form.get("module"));
  const operation = String(form.get("operation"));
  if (
    !isModule(section) ||
    !["publish", "archive", "restore"].includes(operation)
  )
    return { error: "Unknown action." };
  const id = String(form.get("id"));
  try {
    await publishContent(getDb(), user.id, {
      id,
      version: Number(form.get("version")),
      operation: operation as "publish" | "archive" | "restore",
    });
  } catch (error) {
    return { error: actionError(error) };
  }
  revalidatePath("/", "layout");
  redirect(`/admin/${section}/${id}?updated=1`);
}
