import { z } from "zod";
import { safeUrl } from "@/features/content/schema";
export const settingsSchema = z.object({
  labName: z.string().trim().min(2).max(80).default("CIKI Lab"),
  tagline: z.string().trim().max(150).default("Research & Discovery"),
  description: z
    .string()
    .trim()
    .max(300)
    .default(
      "Explore our research departments, achievements, and research community.",
    ),
  office: z.string().trim().max(1500).default(""),
  phone: z.string().trim().max(80).default(""),
  email: z.union([z.literal(""), z.email()]).default(""),
  timezone: z
    .string()
    .refine((value) => {
      try {
        new Intl.DateTimeFormat("en", { timeZone: value });
        return true;
      } catch {
        return false;
      }
    }, "Choose a valid IANA timezone")
    .default("Asia/Dhaka"),
  logoId: z.string().max(100).default(""),
  socialLinks: z
    .array(
      z.object({
        label: z.string().trim().min(1).max(50),
        url: safeUrl.refine(Boolean, "A link is required"),
      }),
    )
    .max(12)
    .default([]),
  researchLabel: z.string().min(1).max(40).default("Research"),
  achievementsLabel: z.string().min(1).max(40).default("Achievements"),
  membersLabel: z.string().min(1).max(40).default("People"),
  recruitmentLabel: z.string().min(1).max(40).default("Recruitment"),
  aboutLabel: z.string().min(1).max(40).default("About"),
});
export type SettingsData = z.infer<typeof settingsSchema>;
export const defaultSettings = settingsSchema.parse({});
