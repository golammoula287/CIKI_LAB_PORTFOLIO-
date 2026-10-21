import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { testDatabase } from "../helpers/database";
import { seedCatalog } from "../../src/server/services/seed-core";
import { seedDemoContent } from "../../src/server/services/demo-seed-core";
import { saveContent } from "../../src/server/services/content-core";

test(
  "demo seed is organized, repeatable, and preserves user edits and private states",
  { timeout: 120000 },
  async () => {
    const fixture = await testDatabase();
    try {
      const db = fixture.db;
      await seedCatalog(db);
      const about = await db.contentRecord.findUniqueOrThrow({
        where: { kind_slug: { kind: "PAGE", slug: "about" } },
      });
      await saveContent(db, fixture.ownerId, {
        id: about.id,
        version: about.version,
        kind: "PAGE",
        slug: "about",
        data: {
          title: "User-owned introduction",
          body: "Keep this draft unchanged.",
        },
      });
      for (let index = 0; index < 3; index++)
        await db.mediaAsset.create({
          data: {
            storageKey: `${randomUUID()}.webp`,
            driver: "local",
            name: `CIKI generated banner ${index}`,
            mimeType: "image/webp",
            byteSize: 100,
            width: 10,
            height: 10,
            createdBy: fixture.ownerId,
          },
        });
      const first = await seedDemoContent(db);
      assert(first.created.length > 25);
      assert.equal(
        await db.contentRecord.count({
          where: { kind: "PERSON", slug: { startsWith: "demo-" } },
        }),
        7,
      );
      assert.equal(
        await db.contentRecord.count({
          where: { kind: "ALBUM", slug: { startsWith: "demo-" } },
        }),
        3,
      );
      assert.equal(
        await db.contentRecord.count({
          where: { kind: "FAQ", slug: { startsWith: "demo-" } },
        }),
        5,
      );
      assert.equal(
        await db.achievement.count({
          where: { slug: { startsWith: "demo-" } },
        }),
        6,
      );
      const opening = await db.contentRecord.findUniqueOrThrow({
        where: {
          kind_slug: { kind: "POSITION", slug: "demo-open-research-assistant" },
        },
        include: { publishedRevision: true },
      });
      assert(opening.publishedRevision?.deadline);
      assert(opening.publishedRevision.deadline.getTime() > Date.now());
      assert(
        opening.publishedRevision.deadline.getTime() <
          Date.now() + 30 * 86400000,
      );
      const privateAchievement = await db.achievement.findUniqueOrThrow({
        where: { slug: "demo-review-private" },
      });
      assert.equal(privateAchievement.publishedRevisionId, null);
      const archived = await db.achievement.findUniqueOrThrow({
        where: { slug: "demo-archived-publication" },
      });
      assert(archived.archivedAt);
      const privateAlbum = await db.contentRecord.findUniqueOrThrow({
        where: { kind_slug: { kind: "ALBUM", slug: "demo-private-album" } },
      });
      assert.equal(privateAlbum.publishedRevisionId, null);
      const preserved = await db.contentRecord.findUniqueOrThrow({
        where: { id: about.id },
        include: { revisions: { orderBy: { version: "desc" }, take: 1 } },
      });
      assert.equal(preserved.version, 2);
      assert.equal(preserved.publishedRevisionId, null);
      assert.equal(preserved.revisions[0].title, "User-owned introduction");
      const counts = [
        await db.contentRecord.count(),
        await db.achievement.count(),
        await db.contentRevision.count(),
      ];
      const second = await seedDemoContent(db);
      assert.equal(second.created.length, 0);
      assert.deepEqual(
        [
          await db.contentRecord.count(),
          await db.achievement.count(),
          await db.contentRevision.count(),
        ],
        counts,
      );
    } finally {
      await fixture.close();
    }
  },
);
