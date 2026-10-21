import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { seedDemoContent } from "../src/server/services/demo-seed-core";

if (process.env.SEED_DEMO !== "1")
  throw new Error(
    "Set SEED_DEMO=1 to intentionally add fictional demonstration content to the configured database.",
  );
const db = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
    max: 2,
    connectionTimeoutMillis: 20000,
  }),
  transactionOptions: { maxWait: 20000, timeout: 60000 },
});
try {
  const result = await seedDemoContent(db, console.log);
  console.log(
    `Demo seed complete: ${result.created.length} records added; ${result.skipped.length} existing records preserved.`,
  );
} finally {
  await db.$disconnect();
}
