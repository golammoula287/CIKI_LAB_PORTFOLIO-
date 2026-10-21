import { createHash } from "node:crypto";

function config() {
  const cloud = process.env.CLOUDINARY_CLOUD_NAME;
  const key = process.env.CLOUDINARY_API_KEY;
  const secret = process.env.CLOUDINARY_API_SECRET;
  if (!cloud || !key || !secret)
    throw new Error("Cloudinary storage is not configured.");
  return { cloud, key, secret };
}

function publicId(key: string) {
  if (!/^[a-f0-9-]+\.webp$/.test(key)) throw new Error("Invalid storage key");
  return `ciki-lab/${key.slice(0, -5)}`;
}

function signed(params: Record<string, string>) {
  const { cloud, key, secret } = config();
  const signature = createHash("sha256")
    .update(
      Object.keys(params)
        .sort()
        .map((name) => `${name}=${params[name]}`)
        .join("&") + secret,
    )
    .digest("hex");
  return {
    endpoint: `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloud)}/image`,
    params: new URLSearchParams({ ...params, api_key: key, signature }),
  };
}

export async function uploadCloudinary(key: string, bytes: Uint8Array) {
  const { endpoint, params } = signed({
    public_id: publicId(key),
    type: "authenticated",
    overwrite: "false",
    timestamp: String(Math.floor(Date.now() / 1000)),
  });
  const body = new FormData();
  params.forEach((value, name) => body.set(name, value));
  body.set(
    "file",
    new Blob([new Uint8Array(bytes)], { type: "image/webp" }),
    key,
  );
  const response = await fetch(`${endpoint}/upload`, {
    method: "POST",
    body,
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) throw new Error("Cloudinary upload failed.");
}

export async function readCloudinary(key: string) {
  const { endpoint, params } = signed({
    public_id: publicId(key),
    format: "webp",
    type: "authenticated",
    timestamp: String(Math.floor(Date.now() / 1000)),
    expires_at: String(Math.floor(Date.now() / 1000) + 60),
  });
  const response = await fetch(`${endpoint}/download?${params}`, {
    cache: "no-store",
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) throw new Error("Cloudinary image is unavailable.");
  return new Uint8Array(await response.arrayBuffer());
}

export async function deleteCloudinary(key: string) {
  const { endpoint, params } = signed({
    public_id: publicId(key),
    type: "authenticated",
    invalidate: "true",
    timestamp: String(Math.floor(Date.now() / 1000)),
  });
  const response = await fetch(`${endpoint}/destroy`, {
    method: "POST",
    body: params,
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) throw new Error("Cloudinary deletion failed.");
}
