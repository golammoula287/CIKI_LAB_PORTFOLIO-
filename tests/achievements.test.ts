import test from "node:test";
import assert from "node:assert/strict";
import {
  achievementSchema,
  canPublish,
  isDisclosable,
} from "../src/features/achievements/schema";
const valid = {
  title: "An example research paper",
  slug: "example-paper",
  type: "CONFERENCE",
  year: 2026,
  status: "UNDER_REVIEW",
  authors: "Example Author",
  venue: "",
  abstract: "",
  url: "",
  disclosureApproved: false,
};
test("conference statuses cannot be used for patents", () => {
  assert.equal(
    achievementSchema.safeParse({
      ...valid,
      type: "PATENT",
      status: "ACCEPTED",
    }).success,
    false,
  );
  assert.equal(
    achievementSchema.safeParse({ ...valid, type: "PATENT", status: "GRANTED" })
      .success,
    true,
  );
});
test("unsafe outbound links are rejected", () => {
  for (const url of [
    "javascript:alert(1)",
    "data:text/html,test",
    "file:///test",
  ])
    assert.equal(achievementSchema.safeParse({ ...valid, url }).success, false);
  assert.equal(
    achievementSchema.safeParse({ ...valid, url: "https://example.org/paper" })
      .success,
    true,
  );
});
test("under-review records require explicit disclosure approval", () => {
  assert.equal(isDisclosable("UNDER_REVIEW", false), false);
  assert.equal(isDisclosable("UNDER_REVIEW", true), true);
  assert.equal(isDisclosable("ACCEPTED", false), true);
});
test("only administrators and owner publish", () => {
  assert.equal(canPublish("EDITOR"), false);
  assert.equal(canPublish("VISITOR"), false);
  assert.equal(canPublish("ADMIN"), true);
  assert.equal(canPublish("OWNER"), true);
});
test("slugs and years are bounded", () => {
  assert.equal(
    achievementSchema.safeParse({ ...valid, slug: "../../admin" }).success,
    false,
  );
  assert.equal(
    achievementSchema.safeParse({ ...valid, year: 1800 }).success,
    false,
  );
  assert.equal(achievementSchema.safeParse(valid).success, true);
});
