import { z } from "zod";
const schema = z.object({
  DATABASE_URL: z
    .url()
    .refine(
      (value) => ["postgres:", "postgresql:"].includes(new URL(value).protocol),
      "Use a PostgreSQL connection URL",
    )
    .optional(),
  BETTER_AUTH_SECRET: z.string().min(32).optional(),
  BETTER_AUTH_URL: z.url().default("http://localhost:3000"),
});
export function getEnv() {
  return schema.parse({
    DATABASE_URL: process.env.DATABASE_URL || undefined,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET || undefined,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL || undefined,
  });
}
export function isConfigured() {
  const env = getEnv();
  return Boolean(env.DATABASE_URL && env.BETTER_AUTH_SECRET);
}
