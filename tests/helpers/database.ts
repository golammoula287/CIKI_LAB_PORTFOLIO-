import { createServer } from "node:net";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { randomUUID, randomBytes } from "node:crypto";
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";
import { hashPassword } from "better-auth/crypto";
export async function freePort() {
  const server = createServer();
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("No local port");
  await new Promise<void>((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
  return address.port;
}
export async function testDatabase() {
  const engine = await PGlite.create();
  const migrations = path.join(process.cwd(), "prisma", "migrations");
  for (const entry of (await readdir(migrations, { withFileTypes: true }))
    .filter((e) => e.isDirectory())
    .sort((a, b) => a.name.localeCompare(b.name)))
    await engine.exec(
      await readFile(
        path.join(migrations, entry.name, "migration.sql"),
        "utf8",
      ),
    );
  const port = await freePort();
  const server = new PGLiteSocketServer({
    db: engine,
    port,
    host: "127.0.0.1",
    maxConnections: 20,
  });
  await server.start();
  const url = `postgresql://postgres:postgres@127.0.0.1:${port}/postgres`;
  const db = new PrismaClient({
    adapter: new PrismaPg({ connectionString: url, max: 1 }),
  });
  const ownerId = randomUUID(),
    editorId = randomUUID(),
    revokedId = randomUUID();
  const password = `Test-${randomBytes(16).toString("hex")}`;
  await db.user.createMany({
    data: [
      {
        id: ownerId,
        name: "Test Owner",
        email: "owner@example.test",
        role: "OWNER",
      },
      {
        id: editorId,
        name: "Test Editor",
        email: "editor@example.test",
        role: "EDITOR",
      },
      {
        id: revokedId,
        name: "Revoked",
        email: "revoked@example.test",
        role: "ADMIN",
        active: false,
      },
    ],
  });
  await db.account.create({
    data: {
      id: randomUUID(),
      userId: ownerId,
      accountId: ownerId,
      providerId: "credential",
      password: await hashPassword(password),
    },
  });
  return {
    db,
    url,
    ownerId,
    editorId,
    revokedId,
    password,
    async close() {
      await db.$disconnect();
      await server.stop();
      await engine.close();
    },
  };
}
