import type { PrismaClient, Prisma } from "@/generated/prisma/client";
import { seedCatalog } from "./seed-core";
import { saveContent, publishContent } from "./content-core";
import {
  saveAchievementRecord,
  publishAchievementRecord,
} from "./achievement-core";
import { parseContent, type Kind } from "@/features/content/schema";

const notice =
  "DEMO DATA — fictional content for testing only. Remove before public launch.";
export async function seedDemoContent(
  db: PrismaClient,
  report: (message: string) => void = () => {},
) {
  await seedCatalog(db);
  const owner = await db.user.findFirstOrThrow({
    where: { role: "OWNER", active: true },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  const departments = await db.contentRecord.findMany({
    where: {
      kind: "DEPARTMENT",
      archivedAt: null,
      publishedRevisionId: { not: null },
    },
    orderBy: { slug: "asc" },
  });
  const categories = await db.membershipCategory.findMany({
    orderBy: { sortOrder: "asc" },
  });
  const media = await db.mediaAsset.findMany({
    where: { name: { startsWith: "CIKI generated banner" } },
    orderBy: { createdAt: "asc" },
    take: 3,
    select: { id: true },
  });
  const photos = media.map((item, index) => ({
    assetId: item.id,
    alt: `AI-generated research concept image ${index + 1}; not a photograph of actual members or facilities.`,
    caption: "Demo illustration — AI-generated research imagery.",
  }));
  const created: string[] = [];
  const skipped: string[] = [];
  async function add(
    kind: Kind,
    slug: string,
    data: Record<string, unknown>,
    state: "published" | "draft" | "archived" = "published",
  ) {
    const existing = await db.contentRecord.findUnique({
      where: { kind_slug: { kind, slug } },
    });
    if (existing) {
      skipped.push(slug);
      return existing.id;
    }
    const id = await saveContent(db, owner.id, {
      kind,
      slug,
      version: 0,
      data: { ...data, body: `${notice}\n\n${data.body || ""}` },
    });
    let row = await db.contentRecord.findUniqueOrThrow({ where: { id } });
    if (state !== "draft")
      await publishContent(db, owner.id, {
        id,
        version: row.version,
        operation: "publish",
      });
    if (state === "archived") {
      row = await db.contentRecord.findUniqueOrThrow({ where: { id } });
      await publishContent(db, owner.id, {
        id,
        version: row.version,
        operation: "archive",
      });
    }
    created.push(slug);
    report(`Created ${state} ${kind.toLowerCase()}: ${slug}`);
    return id;
  }
  const names = [
    "Alex Morgan",
    "Samira Noor",
    "Jordan Lee",
    "Maya Chen",
    "Riley Ahmed",
  ];
  const personIds: string[] = [];
  for (let index = 0; index < names.length; index++) {
    personIds.push(
      await add("PERSON", `demo-member-${index + 1}`, {
        title: `Demo — ${names[index]}`,
        summary: `Fictional ${categories[index % categories.length].label.toLowerCase()} profile for testing member filters and department links.`,
        body: "Interests include reproducible experiments, collaborative learning, and responsible research. No academic credentials or affiliations are asserted.",
        categoryId: categories[index % categories.length].id,
        departmentIds: [departments[index % departments.length].id],
        email: `demo.member${index + 1}@ciki.example`,
        sortOrder: 100 + index,
      }),
    );
  }
  for (const [index, name] of ["Taylor Rahman", "Robin Ellis"].entries())
    await add("PERSON", `demo-advisor-${index + 1}`, {
      title: `Demo — ${name}`,
      summary:
        "Fictional advisory profile for testing advisory placement and related departments.",
      advisory: true,
      departmentIds: [departments[index].id],
      sortOrder: 110 + index,
    });
  const achievements = [
    {
      slug: "demo-conference-computing",
      title: "Demo — Reproducible Learning Systems",
      type: "CONFERENCE",
      status: "ONLINE",
      year: 2026,
      state: "published",
    },
    {
      slug: "demo-journal-vision",
      title: "Demo — Evaluating Visual Models",
      type: "JOURNAL",
      status: "ACCEPTED",
      year: 2025,
      state: "published",
    },
    {
      slug: "demo-chapter-responsible-data",
      title: "Demo — Responsible Data Workflows",
      type: "BOOK_CHAPTER",
      status: "ONLINE",
      year: 2024,
      state: "published",
    },
    {
      slug: "demo-patent-efficient-sensing",
      title: "Demo — Efficient Sensing Concept",
      type: "PATENT",
      status: "FILED",
      year: 2026,
      state: "published",
    },
    {
      slug: "demo-review-private",
      title: "Demo — Private Under-Review Experiment",
      type: "JOURNAL",
      status: "UNDER_REVIEW",
      year: 2026,
      state: "draft",
    },
    {
      slug: "demo-archived-publication",
      title: "Demo — Archived Baseline Study",
      type: "CONFERENCE",
      status: "ONLINE",
      year: 2023,
      state: "archived",
    },
  ] as const;
  for (const [index, item] of achievements.entries()) {
    if (await db.achievement.findUnique({ where: { slug: item.slug } })) {
      skipped.push(item.slug);
      continue;
    }
    const id = await saveAchievementRecord(db, owner.id, {
      version: 0,
      data: {
        title: item.title,
        slug: item.slug,
        type: item.type,
        status: item.status,
        year: item.year,
        authors: "Demo Alex Morgan; Demo Samira Noor",
        venue:
          "Fictional demonstration venue — not a real publication or patent office",
        abstract: `${notice}\n\nA synthetic record for testing type/status/year filters, ordered authors, department links, draft visibility, and archive behavior. This is not a real scientific achievement.`,
        url: "",
        disclosureApproved: false,
        authorEntries: [
          {
            name: "Demo Alex Morgan",
            affiliation: "Fictional demo community",
            personId: personIds[0],
          },
          {
            name: "Demo Samira Noor",
            affiliation: "Fictional demo community",
            personId: personIds[1],
          },
        ],
        departmentIds: [departments[index % departments.length].id],
      },
    });
    let row = await db.achievement.findUniqueOrThrow({ where: { id } });
    if (item.state !== "draft")
      await publishAchievementRecord(db, owner.id, {
        id,
        version: row.version,
        operation: "publish",
      });
    if (item.state === "archived") {
      row = await db.achievement.findUniqueOrThrow({ where: { id } });
      await publishAchievementRecord(db, owner.id, {
        id,
        version: row.version,
        operation: "archive",
      });
    }
    created.push(item.slug);
    report(`Created ${item.state} achievement: ${item.slug}`);
  }
  const future = new Date(Date.now() + 21 * 86400000).toISOString();
  const past = new Date(Date.now() - 7 * 86400000).toISOString();
  for (const item of [
    {
      slug: "demo-open-research-assistant",
      title: "Demo — Research Assistant",
      deadline: future,
      closed: false,
      state: "published",
    },
    {
      slug: "demo-expired-reading-group",
      title: "Demo — Reading Group (Expired)",
      deadline: past,
      closed: false,
      state: "published",
    },
    {
      slug: "demo-closed-collaboration",
      title: "Demo — Collaboration (Closed)",
      deadline: future,
      closed: true,
      state: "published",
    },
    {
      slug: "demo-draft-opportunity",
      title: "Demo — Upcoming Opportunity (Draft)",
      deadline: future,
      closed: false,
      state: "draft",
    },
  ] as const) {
    await add(
      "POSITION",
      item.slug,
      {
        title: item.title,
        summary:
          "Fictional opportunity for testing application guidance and deadline filters. Do not submit an application.",
        departmentIds: [departments[0].id],
        eligibility:
          "Demo criteria: interest in computing and willingness to document experiments.",
        benefits:
          "Demo benefits: reading discussions, code review, and peer learning. No employment or funding is offered.",
        howToApply:
          "Testing only. No applications are collected; this is not an actual opening.",
        deadline: item.deadline,
        closed: item.closed,
      },
      item.state,
    );
  }
  const questions = [
    [
      "eligibility",
      "Who can join the demo community?",
      "This fictional example illustrates membership guidance; it does not establish actual admission criteria.",
    ],
    [
      "applications",
      "How do demo applications work?",
      "They do not collect information. Use the sample positions to check application instructions and deadline states.",
    ],
    [
      "participation",
      "Can researchers collaborate remotely?",
      "This is sample guidance for testing the FAQ layout. Replace it with approved participation policies.",
    ],
    [
      "ethics",
      "What are the demo research principles?",
      "Document methods, respect data permissions, and distinguish synthetic examples from real findings.",
    ],
    [
      "publishing",
      "How are research updates published?",
      "Staff save drafts, review the saved version, and explicitly publish it from the dashboard.",
    ],
  ];
  for (const [index, [slug, question, answer]] of questions.entries())
    await add("FAQ", `demo-faq-${slug}`, {
      title: `Demo — ${question}`,
      summary: answer,
      body: answer,
      sortOrder: 100 + index,
    });
  if (photos.length) {
    await add("ALBUM", "demo-research-concepts", {
      title: "Demo — Research Concepts",
      summary:
        "AI-generated illustrative images for testing albums, captions, and alt text; not real lab photographs.",
      eventDate: new Date().toISOString().slice(0, 10),
      photos,
      coverId: photos[0].assetId,
    });
    await add("ALBUM", "demo-community-showcase", {
      title: "Demo — Community Showcase",
      summary:
        "Synthetic gallery presentation using conceptual research imagery.",
      photos: [...photos].reverse(),
      coverId: photos[photos.length - 1].assetId,
    });
    await add(
      "ALBUM",
      "demo-private-album",
      {
        title: "Demo — Private Album Draft",
        summary:
          "This draft should appear only in admin and previews, never the public gallery.",
        photos,
      },
      "draft",
    );
  }
  for (const slug of [
    "about",
    "policies",
    "contact",
    "recruitment",
    "research",
    "members",
    "advisory-panel",
    "gallery",
    "achievements",
  ]) {
    const page = await db.contentRecord.findUnique({
      where: { kind_slug: { kind: "PAGE", slug } },
      include: { revisions: { orderBy: { version: "desc" }, take: 1 } },
    });
    if (
      !page ||
      page.version !== 1 ||
      page.publishedRevisionId ||
      page.revisions[0]?.createdBy !== "system-seed"
    ) {
      skipped.push(`page:${slug}`);
      continue;
    }
    const data = parseContent("PAGE", page.revisions[0].payload);
    const updated = {
      ...data,
      summary: `${notice} Browse the ${slug.replaceAll("-", " ")} section to test the website and CMS.`,
      body: notice,
      sections: [
        {
          heading: "Demonstration content",
          body: "All demo-prefixed people, publications, positions, and albums are fictional examples. They are provided only to check layouts, filters, links, and editorial workflows.",
        },
        {
          heading:
            slug === "contact"
              ? "Demo contact information"
              : "Testing this section",
          body:
            slug === "contact"
              ? "Fictional office: Demo Research Space, Example Campus. Demo email: demo@ciki.example. This is not a real office or contact address."
              : "Use the admin dashboard to edit a draft, preview it, publish the saved revision, and verify the public result. Archive demo records to remove them from public lists.",
        },
      ],
    };
    await saveContent(db, owner.id, {
      id: page.id,
      version: page.version,
      kind: "PAGE",
      slug,
      data: updated as Prisma.InputJsonValue,
    });
    const saved = await db.contentRecord.findUniqueOrThrow({
      where: { id: page.id },
    });
    await publishContent(db, owner.id, {
      id: page.id,
      version: saved.version,
      operation: "publish",
    });
    created.push(`page:${slug}`);
    report(`Populated untouched seed page: ${slug}`);
  }
  return { created, skipped };
}
