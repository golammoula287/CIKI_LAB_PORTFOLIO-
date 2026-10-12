import "dotenv/config";
import { getDb } from "../src/server/db";
import { seedCatalog } from "../src/server/services/seed-core";
const db = getDb();
try {
  await seedCatalog(db);
  console.log(
    "Initial departments, membership categories, and page drafts seeded. Existing content preserved.",
  );
} finally {
  await db.$disconnect();
}
