import { z } from "zod";
export const statuses: Record<string, string[]> = {
  CONFERENCE: ["UNDER_REVIEW", "ACCEPTED", "ONLINE"],
  JOURNAL: ["UNDER_REVIEW", "ACCEPTED", "ONLINE"],
  BOOK_CHAPTER: ["UNDER_REVIEW", "ACCEPTED", "ONLINE"],
  PATENT: ["FILED", "PUBLISHED", "GRANTED"],
};
export const achievementSchema = z
  .object({
    title: z.string().trim().min(5).max(240),
    slug: z
      .string()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      .max(120),
    type: z.enum(["CONFERENCE", "JOURNAL", "BOOK_CHAPTER", "PATENT"]),
    year: z.coerce
      .number()
      .int()
      .min(1900)
      .max(new Date().getFullYear() + 5),
    status: z.string(),
    authors: z.string().trim().min(2).max(2000),
    venue: z.string().trim().max(300),
    abstract: z.string().trim().max(12000),
    url: z.union([
      z.literal(""),
      z
        .url()
        .refine(
          (v) => ["https:", "http:"].includes(new URL(v).protocol),
          "Use an HTTP or HTTPS URL",
        ),
    ]),
    disclosureApproved: z.boolean(),
    authorEntries: z
      .array(
        z.object({
          name: z.string().trim().min(2).max(200),
          affiliation: z.string().trim().max(300).default(""),
          personId: z.string().max(100).default(""),
        }),
      )
      .max(100)
      .default([]),
    departmentIds: z.array(z.string().max(100)).max(30).default([]),
  })
  .refine((data) => statuses[data.type].includes(data.status), {
    message: "This status does not apply to the achievement type.",
    path: ["status"],
  });
export function canPublish(role: string) {
  return role === "ADMIN" || role === "OWNER";
}
export function isDisclosable(status: string, approved: boolean) {
  return status !== "UNDER_REVIEW" || approved;
}
