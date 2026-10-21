import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { getEnv } from "@/lib/env";
const globalDb = globalThis as unknown as { db?: PrismaClient };
export function getDb() {
  const { DATABASE_URL } = getEnv();
  if (!DATABASE_URL) throw new Error("Database is not configured.");
  if (!globalDb.db)
    globalDb.db = new PrismaClient({
      adapter: new PrismaPg({
        connectionString: DATABASE_URL,
        max: 3,
        connectionTimeoutMillis: 10_000,
        idleTimeoutMillis: 30_000,
      }),
    });
  return globalDb.db;
}
