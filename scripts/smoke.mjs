import assert from "node:assert/strict";

const base = process.env.SMOKE_BASE_URL || "http://localhost:3000";
const routes = [
  "/",
  "/about",
  "/policies",
  "/research",
  "/research/artificial-intelligence",
  "/achievements",
  "/members",
  "/advisory-panel",
  "/recruitment",
  "/gallery",
  "/contact",
  "/login",
  "/accept-invite",
];
for (const route of routes) {
  const response = await fetch(new URL(route, base));
  assert.equal(response.status, 200, `${route} should respond successfully`);
  assert.match(
    await response.text(),
    /<main/,
    `${route} should have a main landmark`,
  );
  console.log(`PASS ${route}`);
}
for (const route of [
  "/admin",
  "/admin/achievements",
  "/admin/achievements/new",
  "/admin/activity",
  "/admin/pages",
  "/admin/pages/new",
  "/admin/departments",
  "/admin/people",
  "/admin/recruitment",
  "/admin/faqs",
  "/admin/gallery",
  "/admin/media",
  "/admin/settings",
  "/admin/categories",
  "/admin/users",
  "/admin/account",
]) {
  const response = await fetch(new URL(route, base), { redirect: "manual" });
  assert.ok(
    [303, 307, 308].includes(response.status),
    `${route} should redirect anonymous requests`,
  );
  assert.ok(
    response.headers.get("location")?.includes("/login"),
    `${route} should redirect to login`,
  );
  console.log(`PASS protected ${route}`);
}
const unknown = await fetch(new URL("/unknown-page", base));
assert.equal(unknown.status, 404);
const health = await fetch(new URL("/api/health", base));
assert.equal(health.status, 200);
assert.equal((await health.json()).status, "ok");
console.log("PASS missing route and health endpoint");
assert.equal(
  (await fetch(new URL("/api/uploads", base), { method: "POST" })).status,
  401,
);
assert.equal(
  (await fetch(new URL("/api/media/nonexistent", base))).status,
  404,
);
assert.equal((await fetch(new URL("/constructor/example", base))).status, 404);
const sitemap = await fetch(new URL("/sitemap.xml", base));
assert.equal(sitemap.status, 200);
assert.doesNotMatch(await sitemap.text(), /\/admin|\/accept-invite/);
console.log(
  "PASS upload authorization, private media, invalid route, and sitemap",
);
