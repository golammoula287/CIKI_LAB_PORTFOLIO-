import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { chromium, expect, type Browser } from "@playwright/test";
import sharp from "sharp";
import { freePort, testDatabase } from "../tests/helpers/database";
import { seedCatalog } from "../src/server/services/seed-core";

const fixture = await testDatabase();
await seedCatalog(fixture.db);
const port = await freePort();
const origin = `http://127.0.0.1:${port}`;
const app = spawn(
  process.execPath,
  [
    path.join(process.cwd(), "node_modules/next/dist/bin/next"),
    "start",
    "--hostname",
    "127.0.0.1",
    "--port",
    String(port),
  ],
  {
    cwd: process.cwd(),
    env: {
      ...process.env,
      DATABASE_URL: fixture.url,
      DIRECT_URL: fixture.url,
      BETTER_AUTH_URL: origin,
      NEXT_PUBLIC_APP_URL: origin,
      BETTER_AUTH_SECRET: randomBytes(48).toString("hex"),
      STORAGE_DRIVER: "local",
      NODE_ENV: "production",
      NEXT_TELEMETRY_DISABLED: "1",
    },
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  },
);
let serverLog = "";
app.stdout?.on("data", (chunk) => {
  serverLog = (serverLog + String(chunk)).slice(-12000);
});
app.stderr?.on("data", (chunk) => {
  serverLog = (serverLog + String(chunk)).slice(-12000);
});
let browser: Browser | undefined;
const generatedKeys: string[] = [];
try {
  let ready = false;
  for (let i = 0; i < 90; i++) {
    try {
      if ((await fetch(`${origin}/api/health`)).ok) {
        ready = true;
        break;
      }
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  if (!ready) throw new Error(`Test server failed to start: ${serverLog}`);
  const edge = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
  browser = await chromium.launch({
    headless: true,
    ...(process.platform === "win32" && existsSync(edge)
      ? { executablePath: edge }
      : {}),
  });
  const ownerContext = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
  });
  const visitorContext = await browser.newContext({
    viewport: { width: 1280, height: 900 },
  });
  const page = await ownerContext.newPage();
  const visitor = await visitorContext.newPage();
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  visitor.on("pageerror", (error) => pageErrors.push(error.message));
  const loginResponse = await visitor.request.get(`${origin}/login`);
  expect(loginResponse.headers()["x-frame-options"]).toBe("DENY");
  expect(loginResponse.headers()["x-content-type-options"]).toBe("nosniff");
  expect(loginResponse.headers()["content-security-policy"]).toContain(
    "frame-ancestors 'none'",
  );
  const anonymousUpload = await visitor.request.post(`${origin}/api/uploads`, {
    headers: { origin },
  });
  expect(anonymousUpload.status()).toBe(401);
  await page.goto(`${origin}/login`);
  await page.getByLabel("Email", { exact: true }).fill("owner@example.test");
  await page.getByLabel("Password", { exact: true }).fill(fixture.password);
  await page.getByRole("button", { name: "Sign in →" }).click();
  await page.waitForURL(`${origin}/admin`, { timeout: 30000 });
  await expect(
    page.getByRole("heading", { name: "Hello, Test." }),
  ).toBeVisible();
  await mkdir("test-results", { recursive: true });
  await page.screenshot({
    path: "test-results/admin-desktop.png",
    fullPage: true,
  });
  console.log("PASS real staff sign-in and dashboard");
  const crossOriginUpload = await page.request.post(`${origin}/api/uploads`, {
    headers: { origin: "https://untrusted.example" },
  });
  expect(crossOriginUpload.status()).toBe(403);
  console.log("PASS browser security headers and upload access boundaries");
  for (const width of [390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of [
      "/admin",
      "/admin/pages",
      "/admin/settings",
      "/admin/media",
      "/admin/activity",
    ]) {
      await page.goto(`${origin}${route}`);
      await expect(
        page.locator('.admin-sidebar a[aria-current="page"]'),
      ).toHaveCount(1);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth + 1,
        ),
        `${route} must fit at ${width}px`,
      ).toBe(true);
    }
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  console.log("PASS admin navigation and responsive workspace layouts");
  await visitor.goto(`${origin}/`);
  await visitor
    .locator(".home-sections")
    .getByRole("link", { name: "Research", exact: true })
    .click();
  await expect(visitor).toHaveURL(`${origin}/#research-areas`);
  await expect(
    visitor.getByRole("heading", { name: "Ideas across disciplines." }),
  ).toBeVisible();
  await visitor.emulateMedia({ reducedMotion: "reduce" });
  expect(
    await visitor.evaluate(
      () => getComputedStyle(document.documentElement).scrollBehavior,
    ),
  ).toBe("auto");
  await visitor.emulateMedia({ reducedMotion: "no-preference" });
  console.log("PASS homepage section links and reduced-motion browsing");
  const peopleMenu = visitor.locator(".nav-trigger");
  await peopleMenu.focus();
  await visitor.keyboard.press("Enter");
  await expect(peopleMenu).toHaveAttribute("aria-expanded", "true");
  await expect(
    visitor
      .locator(".people-dropdown")
      .getByRole("link", { name: /Advisory panel/ }),
  ).toBeVisible();
  await visitor.keyboard.press("Escape");
  await expect(peopleMenu).toHaveAttribute("aria-expanded", "false");
  await expect(peopleMenu).toBeFocused();
  await peopleMenu.click();
  await visitor
    .locator(".people-dropdown")
    .getByRole("link", { name: /Members/ })
    .click();
  await visitor.waitForURL(`${origin}/members`);
  await expect(visitor.locator(".nav-trigger")).toHaveAttribute(
    "aria-expanded",
    "false",
  );
  console.log(
    "PASS keyboard community dropdown, escape focus, and members navigation",
  );

  const about = await fixture.db.contentRecord.findUniqueOrThrow({
    where: { kind_slug: { kind: "PAGE", slug: "about" } },
  });
  await page.goto(`${origin}/admin/pages/${about.id}`);
  await page
    .getByLabel("Title", { exact: true })
    .fill("Browser-verified laboratory");
  await page
    .getByLabel("Main content", { exact: true })
    .fill("Published through the real administrative form.");
  await page.getByRole("button", { name: "Save private draft" }).click();
  await page.waitForURL(/\?saved=1$/);
  await expect
    .poll(
      async () =>
        (
          await fixture.db.contentRecord.findUniqueOrThrow({
            where: { id: about.id },
          })
        ).version,
    )
    .toBe(2);
  await visitor.goto(`${origin}/about`);
  await expect(
    visitor.getByRole("heading", { name: "Browser-verified laboratory" }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "Publish saved revision", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText(
    "Publication state updated",
  );
  await expect
    .poll(
      async () =>
        (
          await fixture.db.contentRecord.findUniqueOrThrow({
            where: { id: about.id },
          })
        ).version,
    )
    .toBe(3);
  await visitor.reload();
  await expect(
    visitor.getByRole("heading", { name: "Browser-verified laboratory" }),
  ).toBeVisible();
  await page
    .getByLabel("Title", { exact: true })
    .fill("Private unpublished revision");
  await page.getByRole("button", { name: "Save private draft" }).click();
  await page.waitForURL(/\?saved=1$/);
  await expect
    .poll(
      async () =>
        (
          await fixture.db.contentRecord.findUniqueOrThrow({
            where: { id: about.id },
          })
        ).version,
    )
    .toBe(4);
  await visitor.reload();
  await expect(
    visitor.getByRole("heading", { name: "Browser-verified laboratory" }),
  ).toBeVisible();
  console.log("PASS page editing, publishing, and private revisions");
  await page.goto(`${origin}/admin/media`);
  const png = await sharp({
    create: { width: 500, height: 320, channels: 3, background: "#477b55" },
  })
    .png()
    .toBuffer();
  await page.locator('input[type="file"]').setInputFiles({
    name: "browser-test.png",
    mimeType: "image/png",
    buffer: png,
  });
  const uploaded = page.waitForResponse(
    (r) => r.url().endsWith("/api/uploads") && r.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Upload image", exact: true }).click();
  const uploadResponse = await uploaded;
  if (uploadResponse.status() !== 201)
    throw new Error(await uploadResponse.text());
  const { id: assetId } = await uploadResponse.json();
  const asset = await fixture.db.mediaAsset.findUniqueOrThrow({
    where: { id: assetId },
  });
  generatedKeys.push(asset.storageKey);
  expect(
    (
      await visitorContext.request.get(`${origin}/api/media/${assetId}`)
    ).status(),
  ).toBe(404);
  await page.goto(`${origin}/admin/gallery/new`);
  await page.getByLabel("Title", { exact: true }).fill("Browser Album");
  await page.getByLabel("URL slug", { exact: true }).fill("browser-album");
  await page.getByRole("button", { name: "Add photo +", exact: true }).click();
  await page.getByLabel("Image", { exact: true }).selectOption(assetId);
  await page.getByLabel("Alt text", { exact: true }).fill("A green test image");
  await page
    .getByLabel("Caption", { exact: true })
    .fill("A browser-tested upload");
  await page.getByRole("button", { name: "Save private draft" }).click();
  await page.waitForURL(/\/admin\/gallery\/[^/]+\?saved=1/);
  await visitor.goto(`${origin}/`);
  await expect(
    visitor.locator(`.banner-gallery img[src="/api/media/${assetId}"]`),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "Publish saved revision", exact: true })
    .click();
  await expect
    .poll(async () =>
      (
        await visitorContext.request.get(`${origin}/api/media/${assetId}`)
      ).status(),
    )
    .toBe(200);
  await visitor.goto(`${origin}/gallery/browser-album`);
  await expect(
    visitor.getByRole("img", { name: "A green test image" }),
  ).toBeVisible();
  await visitor.goto(`${origin}/`);
  await expect(
    visitor
      .locator(".banner-gallery")
      .getByRole("img", { name: "A green test image" }),
  ).toBeVisible();
  await expect(
    visitor.getByRole("button", { name: "Pause motion" }),
  ).toHaveCount(0);
  await visitor.emulateMedia({ reducedMotion: "reduce" });
  expect(
    await visitor
      .locator(".banner-photo")
      .first()
      .evaluate((el) => getComputedStyle(el).animationName),
  ).toBe("none");
  await visitor.emulateMedia({ reducedMotion: "no-preference" });
  await page.getByRole("button", { name: "Archive", exact: true }).click();
  await expect
    .poll(async () =>
      (
        await visitorContext.request.get(`${origin}/api/media/${assetId}`)
      ).status(),
    )
    .toBe(404);
  await visitor.goto(`${origin}/`);
  await expect(
    visitor.locator(`.banner-gallery img[src="/api/media/${assetId}"]`),
  ).toHaveCount(0);
  console.log(
    "PASS banner uses published photos, supports pause/reduced motion, and excludes drafts/archives",
  );
  console.log(
    "PASS image upload, album publication, and media privacy after archive",
  );
  const bannerAssetIds = [assetId];
  for (let index = 2; index <= 3; index++) {
    const response = await ownerContext.request.post(`${origin}/api/uploads`, {
      headers: { origin },
      multipart: {
        file: {
          name: `banner-${index}.png`,
          mimeType: "image/png",
          buffer: png,
        },
      },
    });
    expect(response.status()).toBe(201);
    const { id } = await response.json();
    bannerAssetIds.push(id);
    const row = await fixture.db.mediaAsset.findUniqueOrThrow({
      where: { id },
    });
    generatedKeys.push(row.storageKey);
  }
  const homeRecord = await fixture.db.contentRecord.findUniqueOrThrow({
    where: { kind_slug: { kind: "PAGE", slug: "home" } },
  });
  await page.goto(`${origin}/admin/pages/${homeRecord.id}`);
  const bannerEditor = page.getByRole("group", {
    name: "Banner images (up to 3)",
  });
  for (let index = 0; index < 3; index++) {
    await bannerEditor.getByRole("button", { name: "Add photo +" }).click();
    await bannerEditor
      .getByLabel("Image", { exact: true })
      .nth(index)
      .selectOption(bannerAssetIds[index]);
    await bannerEditor
      .getByLabel("Alt text", { exact: true })
      .nth(index)
      .fill(`Banner research photo ${index + 1}`);
  }
  await expect(
    bannerEditor.getByRole("button", { name: "Add photo +" }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Save private draft" }).click();
  await page.waitForURL(/\?saved=1$/);
  await visitor.goto(`${origin}/`);
  await expect(
    visitor.locator(".banner-gallery img[src^='/api/media/']"),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "Publish saved revision", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText(
    "Publication state updated",
  );
  await visitor.goto(`${origin}/`);
  await expect(visitor.locator(".banner-gallery .banner-photo")).toHaveCount(3);
  for (let index = 0; index < 3; index++)
    await expect(
      visitor.getByRole("img", { name: `Banner research photo ${index + 1}` }),
    ).toBeVisible();
  await visitor.mouse.move(0, 0);
  const layers = await visitor
    .locator(".banner-photo")
    .evaluateAll((cards) =>
      cards.map((card) => (card as HTMLElement).style.zIndex).join(","),
    );
  await expect
    .poll(
      () =>
        visitor
          .locator(".banner-photo")
          .evaluateAll((cards) =>
            cards.map((card) => (card as HTMLElement).style.zIndex).join(","),
          ),
      { timeout: 10_000 },
    )
    .not.toBe(layers);
  await visitor.locator(".banner-gallery").focus();
  const pausedLayout = await visitor
    .locator(".banner-photo")
    .evaluateAll((cards) => cards.map((card) => card.getAttribute("style")));
  await visitor.waitForTimeout(6500);
  expect(
    await visitor
      .locator(".banner-photo")
      .evaluateAll((cards) => cards.map((card) => card.getAttribute("style"))),
  ).toEqual(pausedLayout);
  console.log("PASS layered photos change alignment and stop when paused");
  console.log(
    "PASS selecting, saving, publishing, and showing three banner images together",
  );
  await page.goto(`${origin}/admin/recruitment/new`);
  await page
    .getByLabel("Title", { exact: true })
    .fill("Expired browser position");
  await page
    .getByLabel("URL slug", { exact: true })
    .fill("expired-browser-position");
  await page
    .getByLabel("Application deadline (UTC)", { exact: true })
    .fill("2000-01-01T00:00");
  await page.getByRole("button", { name: "Save private draft" }).click();
  await page.waitForURL(/\/admin\/recruitment\/[^/]+\?saved=1/);
  await page
    .getByRole("button", { name: "Publish saved revision", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText(
    "Publication state updated",
  );
  await visitor.goto(`${origin}/recruitment`);
  await expect(
    visitor.getByRole("heading", { name: "Expired browser position" }),
  ).toHaveCount(0);
  await visitor.goto(`${origin}/recruitment?status=all`);
  await expect(
    visitor.getByRole("heading", { name: "Expired browser position" }),
  ).toBeVisible();
  console.log("PASS recruitment deadline filtering");
  await page.goto(`${origin}/admin/achievements/new`);
  await page
    .getByLabel("Title", { exact: true })
    .fill("Browser-tested research paper");
  await page.getByLabel("URL slug", { exact: true }).fill("browser-paper");
  await page
    .getByLabel("Research status", { exact: true })
    .selectOption("ACCEPTED");
  await page.getByLabel("Author name", { exact: true }).fill("Test Author");
  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  await page.waitForURL(/\/admin\/achievements\/[^/]+\?saved=1/);
  await page.getByRole("button", { name: /Publish saved revision/ }).click();
  await expect(page.getByRole("status")).toContainText(
    "Publication state updated",
  );
  await visitor.goto(`${origin}/achievements/browser-paper`);
  await expect(
    visitor.getByRole("heading", { name: "Browser-tested research paper" }),
  ).toBeVisible();
  console.log("PASS achievement author editor and publication");
  await page.goto(`${origin}/admin/settings`);
  await page
    .getByLabel("Official lab name", { exact: true })
    .fill("Browser Verified Lab");
  await page
    .getByLabel("Office address", { exact: true })
    .fill("Test office, isolated database");
  await page.getByRole("button", { name: "Save and publish settings" }).click();
  await expect(page.getByRole("status")).toContainText("Settings published.");
  await expect
    .poll(
      async () =>
        (
          await fixture.db.siteSettings.findUniqueOrThrow({
            where: { id: "site" },
          })
        ).version,
    )
    .toBe(1);
  await visitor.goto(`${origin}/contact`);
  await expect(
    visitor.getByText("Test office, isolated database"),
  ).toBeVisible();
  console.log("PASS settings publication and contact data");
  await page.goto(`${origin}/admin/users`);
  await page
    .getByLabel("Recipient name", { exact: true })
    .fill("Browser Editor");
  await page
    .getByLabel("Recipient email", { exact: true })
    .fill("browser-editor@example.test");
  await page.getByRole("button", { name: "Create private link" }).click();
  const privateLink = page.getByLabel("Private single-use link", {
    exact: true,
  });
  await expect(privateLink).toBeVisible();
  const invitation = await privateLink.inputValue();
  const invitedPassword = `Invite-${randomBytes(12).toString("hex")}`;
  await visitor.goto(invitation);
  await visitor
    .getByLabel("New password (12–128 characters)", { exact: true })
    .fill(invitedPassword);
  await visitor
    .getByLabel("Confirm password", { exact: true })
    .fill(invitedPassword);
  await visitor
    .getByRole("button", { name: "Set password", exact: true })
    .click();
  await visitor.waitForURL(/\/login\?setup=complete/);
  await visitor
    .getByLabel("Email", { exact: true })
    .fill("browser-editor@example.test");
  await visitor.getByLabel("Password", { exact: true }).fill(invitedPassword);
  await visitor.getByRole("button", { name: "Sign in →" }).click();
  await visitor.waitForURL(`${origin}/admin`);
  await visitor.goto(`${origin}/admin/pages/${about.id}`);
  await expect(
    visitor.getByRole("button", {
      name: "Publish saved revision",
      exact: true,
    }),
  ).toHaveCount(0);
  await visitor.goto(`${origin}/admin/settings`);
  await expect(
    visitor.getByText("Only administrators can change global settings."),
  ).toBeVisible();
  console.log("PASS invitation acceptance and editor restrictions");
  const ownForm = page.locator("form").filter({
    has: page.getByRole("heading", { name: "Test Owner", exact: true }),
  });
  await ownForm.getByLabel("Active staff access").uncheck();
  await ownForm.getByRole("button", { name: "Update access" }).click();
  await expect(ownForm.getByRole("alert")).toContainText("last active owner");
  console.log("PASS last-owner protection in the dashboard");
  await visitorContext.clearCookies();
  await visitor.goto(`${origin}/`);
  await mkdir("test-results", { recursive: true });
  await visitor.screenshot({
    path: "test-results/home-desktop.png",
    fullPage: true,
  });
  await visitor.setViewportSize({ width: 390, height: 844 });
  await visitor.reload();
  await expect(visitor.getByRole("heading", { level: 1 })).toBeVisible();
  expect(
    await visitor.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 1,
    ),
  ).toBe(true);
  await visitor.screenshot({
    path: "test-results/home-mobile.png",
    fullPage: true,
  });
  await visitor.getByText("Menu", { exact: true }).click();
  await expect(
    visitor.getByRole("navigation", { name: "Mobile navigation" }),
  ).toBeVisible();
  expect(pageErrors).toEqual([]);
  await visitor.locator(".nav-trigger").click();
  await visitor
    .locator(".people-dropdown")
    .getByRole("link", { name: /Advisory panel/ })
    .click();
  await visitor.waitForURL(`${origin}/advisory-panel`);
  await expect(visitor.locator(".mobile-toggle")).toHaveAttribute(
    "aria-expanded",
    "false",
  );
  console.log(
    "PASS mobile layout, navigation, screenshots, and no browser runtime errors",
  );
  const sitemap = await visitorContext.request.get(`${origin}/sitemap.xml`);
  expect(await sitemap.text()).toContain("browser-paper");
  expect(await sitemap.text()).not.toContain("browser-album");
  console.log("PASS sitemap excludes archived content");
  for (const width of [390, 768, 1280]) {
    await visitor.setViewportSize({ width, height: 900 });
    for (const route of [
      "/research",
      "/members",
      "/advisory-panel",
      "/achievements",
      "/login",
    ]) {
      await visitor.goto(`${origin}${route}`);
      expect(
        await visitor.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth + 1,
        ),
        `${route} must fit at ${width}px`,
      ).toBe(true);
    }
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${origin}/admin`);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 1,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/admin-mobile.png",
    fullPage: true,
  });
  expect(pageErrors).toEqual([]);
  console.log(
    "PASS research, people, achievements, login, and admin responsive layouts",
  );
} catch (error) {
  console.error("Browser verification failed.");
  console.error(serverLog.slice(-6000));
  throw error;
} finally {
  await browser?.close();
  app.kill();
  await new Promise((resolve) => {
    if (app.exitCode !== null) resolve(null);
    else {
      app.once("exit", resolve);
      setTimeout(resolve, 3000);
    }
  });
  await fixture.close();
  const { unlink } = await import("node:fs/promises");
  for (const key of generatedKeys) {
    if (/^[a-f0-9-]+\.webp$/.test(key))
      await unlink(path.join(process.cwd(), ".storage", key)).catch(
        () => undefined,
      );
  }
}
