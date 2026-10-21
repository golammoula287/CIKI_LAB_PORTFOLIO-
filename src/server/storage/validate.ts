import sharp from "sharp";
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
export async function normalizeImage(bytes: Uint8Array) {
  if (!bytes.byteLength || bytes.byteLength > MAX_UPLOAD_BYTES)
    throw new Error("Images must be no larger than 4 MB.");
  const image = sharp(bytes, { limitInputPixels: 40_000_000, animated: false });
  const metadata = await image.metadata();
  if (
    !["jpeg", "png", "webp"].includes(metadata.format || "") ||
    (metadata.pages || 1) > 1
  )
    throw new Error("Upload a non-animated JPEG, PNG, or WebP image.");
  const result = await image
    .rotate()
    .resize({
      width: 2400,
      height: 2400,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 85 })
    .toBuffer({ resolveWithObject: true });
  if (result.data.length > MAX_UPLOAD_BYTES)
    throw new Error("The processed image exceeds 4 MB. Use a smaller image.");
  return {
    bytes: result.data,
    width: result.info.width,
    height: result.info.height,
  };
}
export async function limitedBody(request: Request, limit: number) {
  const reader = request.body?.getReader();
  if (!reader) throw new Error("Empty upload");
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.length;
      if (length > limit) {
        await reader.cancel();
        throw new Error("Upload is too large.");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  return bytes;
}
