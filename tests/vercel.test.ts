import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

const valid = {
  DATABASE_URL:
    "postgresql://user:password@pooled.example.test/lab?sslmode=require",
  DIRECT_URL:
    "postgresql://user:password@direct.example.test/lab?sslmode=require",
  BETTER_AUTH_SECRET: "a".repeat(48),
  BETTER_AUTH_URL: "https://lab.example.test",
  NEXT_PUBLIC_APP_URL: "https://lab.example.test",
  STORAGE_DRIVER: "cloudinary",
  CLOUDINARY_CLOUD_NAME: "test-cloud",
  CLOUDINARY_API_KEY: "test-key",
  CLOUDINARY_API_SECRET: "private-test-secret",
};
function check(overrides: Record<string, string | undefined>) {
  return spawnSync(process.execPath, ["scripts/check-vercel-env.mjs"], {
    env: { ...process.env, ...valid, ...overrides },
    encoding: "utf8",
  });
}
test("Vercel build accepts complete deployment configuration without exposing secrets", () => {
  const result = check({});
  assert.equal(result.status, 0, result.stderr);
  assert(!result.stdout.includes(valid.CLOUDINARY_API_SECRET));
});
test("Vercel build rejects missing credentials, local URLs, and mismatched origins", () => {
  for (const overrides of [
    { CLOUDINARY_API_SECRET: "" },
    { BETTER_AUTH_URL: "http://localhost:3000" },
    { NEXT_PUBLIC_APP_URL: "https://other.example.test" },
    { STORAGE_DRIVER: "local" },
    { DIRECT_URL: "not-a-database-url" },
  ]) {
    const result = check(overrides);
    assert.equal(result.status, 1);
    assert(!result.stderr.includes(valid.CLOUDINARY_API_SECRET));
    assert(!result.stderr.includes(valid.DATABASE_URL));
  }
});
