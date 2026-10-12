import { getStaff } from "@/server/auth";
import { getDb } from "@/server/db";
import { getEnv } from "@/lib/env";
import { readImage, type Driver } from "@/server/storage";
import { mediaIsPublic } from "@/server/services/media-core";
export const runtime = "nodejs";
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!getEnv().DATABASE_URL) return new Response(null, { status: 404 });
  const asset = await getDb().mediaAsset.findUnique({ where: { id } });
  if (!asset) return new Response(null, { status: 404 });
  if (!(await mediaIsPublic(getDb(), id)) && !(await getStaff()))
    return new Response(null, { status: 404 });
  try {
    const bytes = await readImage(asset.storageKey, asset.driver as Driver);
    return new Response(new Uint8Array(bytes), {
      headers: {
        "Content-Type": "image/webp",
        "Content-Length": String(bytes.length),
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'",
      },
    });
  } catch {
    return new Response(null, { status: 404 });
  }
}
