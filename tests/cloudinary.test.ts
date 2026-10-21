import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  uploadCloudinary,
  readCloudinary,
  deleteCloudinary,
} from "../src/server/storage/cloudinary";

test("Cloudinary signs authenticated upload, expiring read, and deletion; rejects failures", async () => {
  const originalFetch = globalThis.fetch;
  const originalEnv = { ...process.env };
  process.env.CLOUDINARY_CLOUD_NAME = "test-cloud";
  process.env.CLOUDINARY_API_KEY = "test-key";
  process.env.CLOUDINARY_API_SECRET = "test-secret";
  const calls: string[] = [];
  try {
    globalThis.fetch = async (input, options) => {
      const url = String(input);
      calls.push(new URL(url).pathname);
      const body = options?.body;
      const params =
        body instanceof FormData
          ? new URLSearchParams(
              [...body.entries()].filter(([name]) => name !== "file") as [
                string,
                string,
              ][],
            )
          : body instanceof URLSearchParams
            ? body
            : new URL(url).searchParams;
      assert.equal(params.get("type"), "authenticated");
      assert.equal(params.get("public_id"), "ciki-lab/abc-123");
      const signed = [...params.entries()]
        .filter(([name]) => !["api_key", "signature"].includes(name))
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([name, value]) => `${name}=${value}`)
        .join("&");
      assert.equal(
        params.get("signature"),
        createHash("sha256")
          .update(signed + "test-secret")
          .digest("hex"),
      );
      if (url.includes("/upload")) {
        assert(body instanceof FormData);
        assert(body.get("file") instanceof File);
        assert.equal(params.get("overwrite"), "false");
      }
      if (url.includes("/download")) {
        assert.equal(options?.cache, "no-store");
        assert(Number(params.get("timestamp")) > 0);
        assert(Number(params.get("expires_at")) > Date.now() / 1000);
        assert(Number(params.get("expires_at")) <= Date.now() / 1000 + 60);
      }
      return new Response(new Uint8Array([1, 2, 3]));
    };
    await uploadCloudinary("abc-123.webp", new Uint8Array([1, 2, 3]));
    assert.deepEqual(
      await readCloudinary("abc-123.webp"),
      new Uint8Array([1, 2, 3]),
    );
    await deleteCloudinary("abc-123.webp");
    assert.deepEqual(calls, [
      "/v1_1/test-cloud/image/upload",
      "/v1_1/test-cloud/image/download",
      "/v1_1/test-cloud/image/destroy",
    ]);
    await assert.rejects(
      () => readCloudinary("../invalid.webp"),
      /Invalid storage key/,
    );
    globalThis.fetch = async () => new Response("", { status: 403 });
    await assert.rejects(
      () => uploadCloudinary("abc-123.webp", new Uint8Array([1])),
      /upload failed/,
    );
    await assert.rejects(() => readCloudinary("abc-123.webp"), /unavailable/);
    await assert.rejects(
      () => deleteCloudinary("abc-123.webp"),
      /deletion failed/,
    );
    delete process.env.CLOUDINARY_API_SECRET;
    await assert.rejects(
      () => readCloudinary("abc-123.webp"),
      /not configured/,
    );
  } finally {
    globalThis.fetch = originalFetch;
    for (const key of [
      "CLOUDINARY_CLOUD_NAME",
      "CLOUDINARY_API_KEY",
      "CLOUDINARY_API_SECRET",
    ]) {
      if (originalEnv[key] === undefined) delete process.env[key];
      else process.env[key] = originalEnv[key];
    }
  }
});
