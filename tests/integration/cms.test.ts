import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { testDatabase } from "../helpers/database";
import {
  saveContent,
  publishContent,
} from "../../src/server/services/content-core";
import {
  saveAchievementRecord,
  publishAchievementRecord,
  publicAchievementWhere,
} from "../../src/server/services/achievement-core";
import { saveSettings } from "../../src/server/services/settings-core";
import {
  issueGrant,
  acceptGrant,
  updateStaff,
  hashToken,
} from "../../src/server/services/staff-core";
import {
  mediaIsPublic,
  deleteMediaRecord,
} from "../../src/server/services/media-core";
import { seedCatalog } from "../../src/server/services/seed-core";

test(
  "CMS transactions against isolated PostgreSQL-compatible storage",
  { timeout: 120000 },
  async (t) => {
    const fixture = await testDatabase();
    const { db, ownerId, editorId, revokedId } = fixture;
    try {
      await t.test(
        "all migrations apply and seeds preserve existing edits",
        async () => {
          await seedCatalog(db);
          assert.equal(
            await db.contentRecord.count({ where: { kind: "DEPARTMENT" } }),
            6,
          );
          const category = await db.membershipCategory.findFirstOrThrow();
          await db.membershipCategory.update({
            where: { id: category.id },
            data: { label: "Edited category" },
          });
          await seedCatalog(db);
          assert.equal(
            (
              await db.membershipCategory.findUniqueOrThrow({
                where: { id: category.id },
              })
            ).label,
            "Edited category",
          );
          assert.equal(
            await db.contentRecord.count({ where: { kind: "PAGE" } }),
            10,
          );
        },
      );
      let departmentId = "";
      await t.test(
        "editor drafts, owner publishing, stale edits, redirects, and archive restoration",
        async () => {
          departmentId = await saveContent(db, editorId, {
            kind: "DEPARTMENT",
            slug: "test-department",
            version: 0,
            data: { title: "Public title", body: "Public body" },
          });
          await assert.rejects(
            publishContent(db, editorId, {
              id: departmentId,
              version: 1,
              operation: "publish",
            }),
            /permission/,
          );
          await publishContent(db, ownerId, {
            id: departmentId,
            version: 1,
            operation: "publish",
          });
          await saveContent(db, editorId, {
            id: departmentId,
            kind: "DEPARTMENT",
            slug: "renamed-department",
            version: 2,
            data: { title: "Private draft title", body: "Private draft" },
          });
          let row = await db.contentRecord.findUniqueOrThrow({
            where: { id: departmentId },
            include: { publishedRevision: true },
          });
          assert.equal(row.publishedRevision?.title, "Public title");
          assert.equal(row.slug, "test-department");
          await assert.rejects(
            saveContent(db, editorId, {
              id: departmentId,
              kind: "DEPARTMENT",
              slug: "test-department",
              version: 2,
              data: { title: "Stale overwrite" },
            }),
            /newer edit/,
          );
          await publishContent(db, ownerId, {
            id: departmentId,
            version: 3,
            operation: "publish",
          });
          row = await db.contentRecord.findUniqueOrThrow({
            where: { id: departmentId },
            include: { publishedRevision: true },
          });
          assert.equal(row.slug, "renamed-department");
          assert.equal(row.publishedRevision?.title, "Private draft title");
          assert.equal(
            (
              await db.contentRedirect.findUniqueOrThrow({
                where: {
                  kind_oldSlug: {
                    kind: "DEPARTMENT",
                    oldSlug: "test-department",
                  },
                },
              })
            ).recordId,
            departmentId,
          );
          await publishContent(db, ownerId, {
            id: departmentId,
            version: 4,
            operation: "archive",
          });
          assert.ok(
            (
              await db.contentRecord.findUniqueOrThrow({
                where: { id: departmentId },
              })
            ).archivedAt,
          );
          await publishContent(db, ownerId, {
            id: departmentId,
            version: 5,
            operation: "restore",
          });
          assert.equal(
            (
              await db.contentRecord.findUniqueOrThrow({
                where: { id: departmentId },
              })
            ).publishedRevisionId,
            null,
          );
          await publishContent(db, ownerId, {
            id: departmentId,
            version: 6,
            operation: "publish",
          });
        },
      );
      await t.test(
        "revoked staff cannot mutate and failed writes are atomic",
        async () => {
          const before = await db.contentRecord.count();
          await assert.rejects(
            saveContent(db, revokedId, {
              kind: "PAGE",
              slug: "about",
              version: 0,
              data: { title: "Forbidden" },
            }),
            /permission/,
          );
          await assert.rejects(
            saveContent(db, editorId, {
              kind: "PERSON",
              slug: "bad-person",
              version: 0,
              data: { title: "Invalid Person", categoryId: "missing" },
            }),
            /category/,
          );
          assert.equal(await db.contentRecord.count(), before);
        },
      );
      await t.test(
        "media is private until published and referenced images resist deletion",
        async () => {
          const asset = await db.mediaAsset.create({
            data: {
              storageKey: `${randomUUID()}.webp`,
              driver: "local",
              name: "test.webp",
              mimeType: "image/webp",
              byteSize: 100,
              width: 10,
              height: 10,
              createdBy: ownerId,
            },
          });
          assert.equal(await mediaIsPublic(db, asset.id), false);
          const album = await saveContent(db, editorId, {
            kind: "ALBUM",
            slug: "test-album",
            version: 0,
            data: {
              title: "Test Album",
              photos: [{ assetId: asset.id, alt: "A test image", caption: "" }],
            },
          });
          assert.equal(await mediaIsPublic(db, asset.id), false);
          await assert.rejects(
            deleteMediaRecord(db, ownerId, asset.id),
            /referenced/,
          );
          await publishContent(db, ownerId, {
            id: album,
            version: 1,
            operation: "publish",
          });
          assert.equal(await mediaIsPublic(db, asset.id), true);
          await publishContent(db, ownerId, {
            id: album,
            version: 2,
            operation: "archive",
          });
          assert.equal(await mediaIsPublic(db, asset.id), false);
        },
      );
      await t.test(
        "public achievement disclosure, normalized authors, department links and draft isolation",
        async () => {
          const data = {
            title: "Test conference paper",
            slug: "test-paper",
            type: "CONFERENCE",
            year: 2026,
            status: "UNDER_REVIEW",
            authors: "External Author",
            venue: "Test venue",
            abstract: "Original abstract",
            url: "",
            disclosureApproved: false,
            departmentIds: [departmentId],
            authorEntries: [
              {
                name: "External Author",
                affiliation: "Test Institute",
                personId: "",
              },
            ],
          };
          const id = await saveAchievementRecord(db, editorId, {
            version: 0,
            data,
          });
          await assert.rejects(
            publishAchievementRecord(db, ownerId, {
              id,
              version: 1,
              operation: "publish",
            }),
            /disclosure/,
          );
          await saveAchievementRecord(db, ownerId, {
            id,
            version: 1,
            data: { ...data, disclosureApproved: true },
          });
          await publishAchievementRecord(db, ownerId, {
            id,
            version: 2,
            operation: "publish",
          });
          assert.equal(
            await db.achievement.count({ where: publicAchievementWhere }),
            1,
          );
          let row = await db.achievement.findUniqueOrThrow({
            where: { id },
            include: {
              publishedRevision: {
                include: { authorEntries: true, departments: true },
              },
            },
          });
          assert.equal(
            row.publishedRevision?.authorEntries[0].affiliation,
            "Test Institute",
          );
          assert.equal(
            row.publishedRevision?.departments[0].departmentId,
            departmentId,
          );
          await saveAchievementRecord(db, editorId, {
            id,
            version: 3,
            data: { ...data, title: "Unpublished changed title" },
          });
          row = await db.achievement.findUniqueOrThrow({
            where: { id },
            include: {
              publishedRevision: {
                include: { authorEntries: true, departments: true },
              },
            },
          });
          assert.equal(row.publishedRevision?.title, data.title);
          await assert.rejects(
            publishAchievementRecord(db, editorId, {
              id,
              version: 4,
              operation: "archive",
            }),
            /permission/,
          );
        },
      );
      await t.test(
        "settings require publish permission and prevent lost updates",
        async () => {
          await assert.rejects(
            saveSettings(db, editorId, 0, { labName: "Forbidden" }),
            /permission/,
          );
          await saveSettings(db, ownerId, 0, { labName: "Integration Lab" });
          await assert.rejects(
            saveSettings(db, ownerId, 99, { labName: "Stale settings" }),
            /changed/,
          );
          assert.equal(
            (await db.siteSettings.findUniqueOrThrow({ where: { id: "site" } }))
              .version,
            1,
          );
        },
      );
      await t.test(
        "staff links are hashed, single use, expiring and issuer-controlled",
        async () => {
          await assert.rejects(
            issueGrant(db, editorId, {
              name: "Person",
              email: "person@example.test",
              role: "EDITOR",
              purpose: "INVITE",
            }),
            /permission/,
          );
          const token = await issueGrant(db, ownerId, {
            name: "Invited Person",
            email: "person@example.test",
            role: "EDITOR",
            purpose: "INVITE",
          });
          assert.ok(
            await db.accessGrant.findUnique({
              where: { tokenHash: hashToken(token) },
            }),
          );
          assert.equal(
            await db.accessGrant.findUnique({ where: { tokenHash: token } }),
            null,
          );
          const id = await acceptGrant(db, token, "Long-test-password-123");
          assert.equal(
            (await db.user.findUniqueOrThrow({ where: { id } })).role,
            "EDITOR",
          );
          await assert.rejects(
            acceptGrant(db, token, "Long-test-password-123"),
            /expired|used/,
          );
          const expired = await issueGrant(db, ownerId, {
            name: "Expired Person",
            email: "expired@example.test",
            role: "EDITOR",
            purpose: "INVITE",
          });
          await db.accessGrant.update({
            where: { tokenHash: hashToken(expired) },
            data: { expiresAt: new Date(0) },
          });
          await assert.rejects(
            acceptGrant(db, expired, "Long-test-password-123"),
            /expired/,
          );
        },
      );
      await t.test(
        "last owner protection, session revocation and password recovery",
        async () => {
          await assert.rejects(
            updateStaff(db, ownerId, ownerId, "EDITOR", true),
            /last active owner/,
          );
          await assert.rejects(
            updateStaff(db, ownerId, ownerId, "OWNER", false),
            /last active owner/,
          );
          await db.session.create({
            data: {
              id: randomUUID(),
              token: randomUUID(),
              userId: editorId,
              expiresAt: new Date(Date.now() + 86400000),
            },
          });
          await updateStaff(db, ownerId, editorId, "ADMIN", false);
          assert.equal(
            await db.session.count({ where: { userId: editorId } }),
            0,
          );
          await updateStaff(db, ownerId, editorId, "EDITOR", true);
          const token = await issueGrant(db, ownerId, {
            name: "Test Editor",
            email: "editor@example.test",
            role: "OWNER",
            purpose: "RESET",
          });
          await acceptGrant(db, token, "Recovery-test-password-123");
          assert.equal(
            (await db.user.findUniqueOrThrow({ where: { id: editorId } })).role,
            "EDITOR",
          );
          assert.ok(
            await db.account.findFirst({
              where: { userId: editorId, providerId: "credential" },
            }),
          );
        },
      );
      assert.ok((await db.auditEvent.count()) > 10);
    } finally {
      await fixture.close();
    }
  },
);
