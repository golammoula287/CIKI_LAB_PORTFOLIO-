import { z } from "zod";

export const modules = {
  pages: { kind: "PAGE", label: "Pages", singular: "page", path: "" },
  departments: {
    kind: "DEPARTMENT",
    label: "Departments",
    singular: "department",
    path: "/research",
  },
  people: {
    kind: "PERSON",
    label: "People",
    singular: "person",
    path: "/members",
  },
  recruitment: {
    kind: "POSITION",
    label: "Positions",
    singular: "position",
    path: "/recruitment",
  },
  faqs: {
    kind: "FAQ",
    label: "Recruitment FAQs",
    singular: "FAQ",
    path: "/recruitment",
  },
  gallery: {
    kind: "ALBUM",
    label: "Photo albums",
    singular: "album",
    path: "/gallery",
  },
} as const;
export type ModuleKey = keyof typeof modules;
export type Kind = (typeof modules)[ModuleKey]["kind"];
export function isModule(value: string): value is ModuleKey {
  return Object.hasOwn(modules, value);
}
export const pageKeys = [
  "home",
  "about",
  "policies",
  "contact",
  "recruitment",
  "research",
  "members",
  "advisory-panel",
  "gallery",
  "achievements",
];
export const slugSchema = z
  .string()
  .trim()
  .min(1)
  .max(120)
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Use lowercase words separated by hyphens.",
  );
export const safeUrl = z.union([
  z.literal(""),
  z
    .url()
    .refine(
      (v) => ["https:", "http:"].includes(new URL(v).protocol),
      "Use an HTTP or HTTPS link",
    ),
]);
const short = z.string().trim().max(300);
const text = z.string().trim().max(20000);
export const contentSchema = z.object({
  title: short.min(2),
  summary: z.string().trim().max(1200).default(""),
  body: text.default(""),
  seoTitle: z.string().trim().max(100).default(""),
  seoDescription: z.string().trim().max(300).default(""),
  sortOrder: z.coerce.number().int().min(0).max(100000).default(0),
  sections: z
    .array(z.object({ heading: short.min(1), body: text.min(1) }))
    .max(30)
    .default([]),
  icon: z.string().max(8).default("◎"),
  categoryId: z.string().max(100).default(""),
  advisory: z.boolean().default(false),
  departmentIds: z.array(z.string().max(100)).max(30).default([]),
  email: z.union([z.literal(""), z.email()]).default(""),
  website: safeUrl.default(""),
  coverId: z.string().max(100).default(""),
  eligibility: text.default(""),
  benefits: text.default(""),
  howToApply: text.default(""),
  applyUrl: safeUrl.default(""),
  deadline: z.union([z.literal(""), z.iso.datetime()]).default(""),
  closed: z.boolean().default(false),
  eventDate: z.union([z.literal(""), z.iso.date()]).default(""),
  photos: z
    .array(
      z.object({
        assetId: z.string().min(1).max(100),
        alt: short.min(1),
        caption: short.default(""),
      }),
    )
    .max(100)
    .default([]),
});
export type ContentData = z.infer<typeof contentSchema>;
export function parseContent(kind: Kind, value: unknown): ContentData {
  const parsed = contentSchema.parse(value);
  // Keep each module's persisted shape explicit: ignore fields belonging to other kinds.
  const common = {
    title: parsed.title,
    summary: parsed.summary,
    body: parsed.body,
    seoTitle: parsed.seoTitle,
    seoDescription: parsed.seoDescription,
    sortOrder: parsed.sortOrder,
  };
  const fields =
    kind === "PAGE"
      ? { sections: parsed.sections, coverId: parsed.coverId }
      : kind === "DEPARTMENT"
        ? { icon: parsed.icon, coverId: parsed.coverId }
        : kind === "PERSON"
          ? {
              categoryId: parsed.categoryId,
              advisory: parsed.advisory,
              departmentIds: parsed.departmentIds,
              email: parsed.email,
              website: parsed.website,
              coverId: parsed.coverId,
            }
          : kind === "POSITION"
            ? {
                departmentIds: parsed.departmentIds,
                eligibility: parsed.eligibility,
                benefits: parsed.benefits,
                howToApply: parsed.howToApply,
                applyUrl: parsed.applyUrl,
                deadline: parsed.deadline,
                closed: parsed.closed,
              }
            : kind === "ALBUM"
              ? {
                  eventDate: parsed.eventDate,
                  photos: parsed.photos,
                  coverId: parsed.coverId,
                }
              : {};
  return contentSchema.parse({ ...common, ...fields });
}
export function mediaIds(data: ContentData) {
  return [
    ...new Set(
      [data.coverId, ...data.photos.map((p) => p.assetId)].filter(Boolean),
    ),
  ];
}
export function positionIsOpen(
  data: Pick<ContentData, "deadline" | "closed">,
  now = new Date(),
) {
  return (
    !data.closed &&
    (!data.deadline || new Date(data.deadline).getTime() > now.getTime())
  );
}
export function publicPath(kind: Kind, slug: string) {
  return kind === "PAGE"
    ? slug === "home"
      ? "/"
      : `/${slug}`
    : `${Object.values(modules).find((m) => m.kind === kind)!.path}/${slug}`;
}
