import type { PrismaClient, Prisma } from "@/generated/prisma/client";
import { departments, membershipCategories } from "@/lib/catalog";
import { pageDefaults } from "@/lib/page-defaults";
import { parseContent } from "@/features/content/schema";
export async function seedCatalog(db: PrismaClient) {
  for (const [sortOrder, label] of membershipCategories.entries()) {
    const key = label.toLowerCase().replaceAll(" ", "-");
    await db.membershipCategory.upsert({
      where: { key },
      update: {},
      create: { key, label, sortOrder },
    });
  }
  for (const [sortOrder, d] of departments.entries())
    await db.$transaction(async (tx) => {
      if (
        await tx.contentRecord.findUnique({
          where: { kind_slug: { kind: "DEPARTMENT", slug: d.slug } },
        })
      )
        return;
      const legacy = await tx.department.findUnique({
        where: { slug: d.slug },
      });
      const data = parseContent("DEPARTMENT", {
        title: legacy?.name || d.name,
        summary: legacy?.description || d.description,
        icon: d.icon,
        sortOrder: legacy?.sortOrder ?? sortOrder,
      });
      const row = await tx.contentRecord.create({
        data: { kind: "DEPARTMENT", slug: d.slug },
      });
      const revision = await tx.contentRevision.create({
        data: {
          recordId: row.id,
          version: 1,
          title: data.title,
          summary: data.summary,
          body: data.body,
          seoTitle: "",
          seoDescription: "",
          sortOrder,
          payload: { ...data, slug: d.slug } as Prisma.InputJsonValue,
          createdBy: "system-seed",
        },
      });
      await tx.contentRecord.update({
        where: { id: row.id },
        data: { publishedRevisionId: revision.id },
      });
    });
  for (const [slug, page] of Object.entries(pageDefaults))
    await db.$transaction(async (tx) => {
      if (
        await tx.contentRecord.findUnique({
          where: { kind_slug: { kind: "PAGE", slug } },
        })
      )
        return;
      const data = parseContent("PAGE", {
        title: page.title,
        summary: page.description,
      });
      await tx.contentRecord.create({
        data: {
          kind: "PAGE",
          slug,
          revisions: {
            create: {
              version: 1,
              title: data.title,
              summary: data.summary,
              body: "",
              seoTitle: "",
              seoDescription: "",
              payload: { ...data, slug } as Prisma.InputJsonValue,
              createdBy: "system-seed",
            },
          },
        },
      });
    });
}
