import { randomUUID } from "node:crypto";
import { getStaff } from "@/server/auth";
import { getDb } from "@/server/db";
import { getEnv } from "@/lib/env";
import { putImage, removeImage, storageDriver } from "@/server/storage";
import {
  normalizeImage,
  limitedBody,
  MAX_UPLOAD_BYTES,
} from "@/server/storage/validate";
export const runtime = "nodejs";
export const maxDuration = 60;
export async function POST(request: Request) {
  const user = await getStaff();
  if (!user)
    return Response.json(
      { error: "Sign in to upload images." },
      { status: 401 },
    );
  if (
    request.headers.get("origin") !== new URL(getEnv().BETTER_AUTH_URL).origin
  )
    return Response.json(
      { error: "Untrusted upload origin." },
      { status: 403 },
    );
  const recent = await getDb().mediaAsset.count({
    where: {
      createdBy: user.id,
      createdAt: { gt: new Date(Date.now() - 60_000) },
    },
  });
  if (recent >= 20)
    return Response.json(
      { error: "Please wait a minute before uploading more images." },
      { status: 429 },
    );
  try {
    const bytes = await limitedBody(request, MAX_UPLOAD_BYTES + 128_000);
    const form = await new Request(request.url, {
      method: "POST",
      headers: { "content-type": request.headers.get("content-type") || "" },
      body: bytes,
    }).formData();
    const file = form.get("file");
    if (!(file instanceof File))
      return Response.json({ error: "Choose an image." }, { status: 400 });
    const image = await normalizeImage(
      new Uint8Array(await file.arrayBuffer()),
    );
    const key = `${randomUUID()}.webp`;
    const driver = storageDriver();
    await putImage(key, image.bytes, driver);
    try {
      const asset = await getDb().$transaction(async (tx) => {
        const active = await tx.user.findUnique({ where: { id: user.id } });
        if (!active?.active) throw new Error("Account revoked");
        const item = await tx.mediaAsset.create({
          data: {
            storageKey: key,
            driver,
            name: file.name.slice(0, 200),
            mimeType: "image/webp",
            byteSize: image.bytes.length,
            width: image.width,
            height: image.height,
            createdBy: user.id,
          },
        });
        await tx.auditEvent.create({
          data: {
            actorId: user.id,
            operation: "MEDIA_UPLOADED",
            entityId: item.id,
          },
        });
        return item;
      });
      return Response.json({ id: asset.id }, { status: 201 });
    } catch {
      await removeImage(key, driver).catch(() => undefined);
      return Response.json(
        { error: "The image could not be registered. Please try again." },
        { status: 500 },
      );
    }
  } catch {
    return Response.json(
      {
        error:
          "Upload failed. Use a non-animated JPEG, PNG, or WebP under 4 MB and verify storage configuration.",
      },
      { status: 400 },
    );
  }
}
