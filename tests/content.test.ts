import test from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import {
  parseContent,
  mediaIds,
  positionIsOpen,
  isModule,
} from "../src/features/content/schema";
import { pageNumber } from "../src/lib/pagination";
import {
  normalizeImage,
  MAX_UPLOAD_BYTES,
  limitedBody,
} from "../src/server/storage/validate";
test("deadline closes exactly at the boundary", () => {
  const deadline = "2026-10-12T10:00:00.000Z";
  assert.equal(
    positionIsOpen(
      { closed: false, deadline },
      new Date("2026-10-12T09:59:59Z"),
    ),
    true,
  );
  assert.equal(
    positionIsOpen({ closed: false, deadline }, new Date(deadline)),
    false,
  );
  assert.equal(positionIsOpen({ closed: true, deadline: "" }), false);
});
test("module schemas reject unsafe URLs and do not carry unrelated private fields", () => {
  assert.throws(() =>
    parseContent("PERSON", { title: "Person", website: "javascript:alert(1)" }),
  );
  assert.equal(
    parseContent("FAQ", {
      title: "Question?",
      email: "private@example.test",
      advisory: true,
    }).email,
    "",
  );
  assert.equal(isModule("constructor"), false);
  assert.equal(isModule("people"), true);
});
test("pagination rejects malformed and unbounded input", () => {
  assert.equal(pageNumber("-1"), 1);
  assert.equal(pageNumber("2.2"), 1);
  assert.equal(pageNumber("Infinity"), 1);
  assert.equal(pageNumber("900000"), 100000);
});
test("uploads are decoded and normalized and reject executable or oversized data", async () => {
  await assert.rejects(
    normalizeImage(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>')),
  );
  await assert.rejects(normalizeImage(new Uint8Array(MAX_UPLOAD_BYTES + 1)));
  const png = await sharp({
    create: { width: 5, height: 8, channels: 3, background: "green" },
  })
    .png()
    .toBuffer();
  const normalized = await normalizeImage(png);
  assert.equal(normalized.width, 5);
  assert.equal((await sharp(normalized.bytes).metadata()).format, "webp");
});
test("request size is bounded independently of headers", async () => {
  const request = new Request("http://localhost/upload", {
    method: "POST",
    body: "123456789",
  });
  await assert.rejects(limitedBody(request, 4), /too large/);
});

test("page banner preserves multiple image selections and their media references", () => {
  const photos = [1, 2, 3].map((index) => ({
    assetId: `image-${index}`,
    alt: `Research photograph ${index}`,
    caption: "",
  }));
  const page = parseContent("PAGE", { title: "Home", photos });
  assert.deepEqual(page.photos, photos);
  assert.deepEqual(mediaIds(page), ["image-1", "image-2", "image-3"]);
  assert.equal(
    parseContent("PERSON", { title: "Researcher", photos }).photos.length,
    0,
  );
});
