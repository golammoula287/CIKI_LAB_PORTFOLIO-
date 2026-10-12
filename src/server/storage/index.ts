import { mkdir, writeFile, readFile, unlink } from "node:fs/promises";
import path from "node:path";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
export type Driver = "local" | "s3";
function localPath(key: string) {
  if (!/^[a-f0-9-]+\.webp$/.test(key)) throw new Error("Invalid storage key");
  return path.join(process.cwd(), ".storage", key);
}
function s3() {
  if (!process.env.S3_BUCKET || !process.env.S3_REGION)
    throw new Error("S3 storage is not configured.");
  return new S3Client({
    region: process.env.S3_REGION,
    endpoint: process.env.S3_ENDPOINT || undefined,
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
  });
}
export function storageDriver(): Driver {
  const selected =
    process.env.STORAGE_DRIVER ||
    (process.env.NODE_ENV === "production" ? "s3" : "local");
  if (selected !== "local" && selected !== "s3")
    throw new Error("Invalid storage driver");
  return selected;
}
export async function putImage(key: string, bytes: Uint8Array, driver: Driver) {
  if (driver === "local") {
    const file = localPath(key);
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, bytes, { flag: "wx" });
  } else {
    await s3().send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: key,
        Body: bytes,
        ContentType: "image/webp",
      }),
    );
  }
}
export async function readImage(key: string, driver: Driver) {
  if (driver === "local") return new Uint8Array(await readFile(localPath(key)));
  const result = await s3().send(
    new GetObjectCommand({ Bucket: process.env.S3_BUCKET, Key: key }),
  );
  if (!result.Body) throw new Error("Image is unavailable");
  return result.Body.transformToByteArray();
}
export async function removeImage(key: string, driver: Driver) {
  if (driver === "local") await unlink(localPath(key));
  else
    await s3().send(
      new DeleteObjectCommand({ Bucket: process.env.S3_BUCKET, Key: key }),
    );
}
