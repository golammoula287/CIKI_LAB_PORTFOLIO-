import { notFound } from "next/navigation";
import { requireStaff } from "@/server/auth";
import { getDb } from "@/server/db";
import { canPublish } from "@/features/achievements/schema";
import { contentChoices, authorChoices } from "@/server/services/content";
import {
  AchievementEditor,
  PublicationActions,
} from "@/features/achievements/editor";
export default async function EditAchievement({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; published?: string }>;
}) {
  const user = await requireStaff();
  const { id } = await params;
  const query = await searchParams;
  const entry = await getDb().achievement.findUnique({
    where: { id },
    include: {
      revisions: {
        orderBy: { version: "desc" },
        take: 1,
        include: {
          authorEntries: { orderBy: { sortOrder: "asc" } },
          departments: true,
        },
      },
    },
  });
  if (!entry?.revisions[0]) notFound();
  const r = entry.revisions[0];
  const [choices, people] = await Promise.all([
    contentChoices(),
    authorChoices(),
  ]);
  return (
    <>
      <div className="admin-heading">
        <div>
          <h1>Review achievement</h1>
          <p>
            Saved revision {r.version} ·{" "}
            {entry.archivedAt
              ? "Archived"
              : entry.publishedRevisionId === r.id
                ? "Published"
                : "Draft"}
          </p>
        </div>
      </div>
      {query.saved && (
        <div className="notice" role="status">
          Draft saved. The public version has not changed.
        </div>
      )}
      {query.published && (
        <div className="notice" role="status">
          Publication state updated.
        </div>
      )}
      <section className="revision-preview">
        <div className="eyebrow">SAVED REVISION PREVIEW / {r.year}</div>
        <h2>{r.title}</h2>
        <p>{r.authors}</p>
        <p>{r.venue}</p>
        <p className="preserve-lines">{r.abstract}</p>
        <span className="badge">{r.status}</span>
      </section>
      {!entry.archivedAt && (
        <>
          <AchievementEditor
            departments={choices.departments}
            people={people}
            key={entry.version}
            allowPublish={canPublish(user.role)}
            initial={{
              id,
              version: entry.version,
              slug: r.requestedSlug || entry.slug,
              title: r.title,
              type: r.type,
              year: r.year,
              status: r.status,
              authors: r.authors,
              venue: r.venue,
              abstract: r.abstract,
              url: r.url || "",
              disclosureApproved: r.disclosureApproved,
              authorEntries: r.authorEntries.map((a) => ({
                name: a.name,
                affiliation: a.affiliation,
                personId: a.personId || "",
              })),
              departmentIds: r.departments.map((d) => d.departmentId),
            }}
          />
          {canPublish(user.role) && (
            <PublicationActions id={id} version={entry.version} />
          )}
        </>
      )}
      {entry.archivedAt && canPublish(user.role) && (
        <PublicationActions id={id} version={entry.version} archived />
      )}
    </>
  );
}
