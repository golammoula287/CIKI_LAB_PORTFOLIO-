import Link from "next/link";
import { requireStaff } from "@/server/auth";
import { getDb } from "@/server/db";
import { modules } from "@/features/content/schema";
import { getSettings } from "@/server/services/content";
export default async function Dashboard() {
  const user = await requireStaff();
  const db = getDb();
  const now = new Date();
  const upcoming = new Date(now);
  upcoming.setUTCDate(now.getUTCDate() + 30);
  const [
    contentCount,
    publishedCount,
    achievementCount,
    mediaCount,
    drafts,
    positions,
    activity,
    settings,
  ] = await Promise.all([
    db.contentRecord.count(),
    db.contentRecord.count({
      where: { publishedRevisionId: { not: null }, archivedAt: null },
    }),
    db.achievement.count({ where: { archivedAt: null } }),
    db.mediaAsset.count(),
    db.contentRecord.findMany({
      where: { publishedRevisionId: null, archivedAt: null },
      include: { revisions: { orderBy: { version: "desc" }, take: 1 } },
      orderBy: { updatedAt: "desc" },
      take: 8,
    }),
    db.contentRecord.findMany({
      where: {
        kind: "POSITION",
        archivedAt: null,
        publishedRevision: {
          is: {
            closed: false,
            deadline: {
              gt: now,
              lt: upcoming,
            },
          },
        },
      },
      include: { publishedRevision: true },
      orderBy: { publishedRevision: { deadline: "asc" } },
      take: 8,
    }),
    user.role !== "EDITOR"
      ? db.auditEvent.findMany({ orderBy: { createdAt: "desc" }, take: 8 })
      : Promise.resolve([]),
    getSettings(),
  ]);
  return (
    <>
      <div className="admin-heading">
        <div>
          <div className="eyebrow">WORKSPACE / OVERVIEW</div>
          <h1>Hello, {user.name.split(" ")[0]}.</h1>
          <p>Manage the lab’s website and publishing workflow.</p>
        </div>
        <Link className="button primary" href="/admin/achievements/new">
          New achievement +
        </Link>
      </div>
      <div className="stat-grid">
        {[
          [contentCount, "Content records"],
          [publishedCount, "Published content"],
          [achievementCount, "Active achievements"],
          [mediaCount, "Media assets"],
        ].map(([count, label]) => (
          <div className="stat-card" key={String(label)}>
            <strong>{count}</strong>
            <span>{label}</span>
          </div>
        ))}
      </div>
      <div className="content-blocks">
        <section className="panel">
          <h2>Unpublished drafts</h2>
          {drafts.length ? (
            <ul className="activity-list">
              {drafts.map((d) => {
                const section = Object.entries(modules).find(
                  ([, m]) => m.kind === d.kind,
                )?.[0];
                return (
                  <li key={d.id}>
                    <Link href={`/admin/${section}/${d.id}`}>
                      {d.revisions[0]?.title || d.slug}
                    </Link>
                    <span>{d.kind.toLowerCase()}</span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p>No unpublished drafts.</p>
          )}
        </section>
        <section className="panel">
          <h2>Upcoming deadlines</h2>
          {positions.length ? (
            <ul className="activity-list">
              {positions.map((p) => (
                <li key={p.id}>
                  <Link href={`/admin/recruitment/${p.id}`}>
                    {p.publishedRevision!.title}
                  </Link>
                  <span>
                    {new Intl.DateTimeFormat("en-GB", {
                      dateStyle: "medium",
                      timeStyle: "short",
                      timeZone: settings.data.timezone,
                    }).format(p.publishedRevision!.deadline!)}{" "}
                    ({settings.data.timezone})
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p>No deadlines in the next 30 days.</p>
          )}
        </section>
      </div>
      {user.role !== "EDITOR" && (
        <section className="panel">
          <h2>Recent activity</h2>
          <ul className="activity-list">
            {activity.map((a) => (
              <li key={a.id}>
                <span>{a.operation.replaceAll("_", " ")}</span>
                <span>{a.createdAt.toISOString()}</span>
              </li>
            ))}
          </ul>
          <Link className="text-link" href="/admin/activity">
            Full activity log →
          </Link>
        </section>
      )}
      <section className="panel">
        <h2>Manage content</h2>
        <div className="filter-tabs">
          {Object.entries(modules).map(([key, m]) => (
            <Link href={`/admin/${key}`} key={key}>
              {m.label}
            </Link>
          ))}
        </div>
        <p>
          Draft revisions stay private until published. Public pages and media
          reflect publishing changes immediately.
        </p>
      </section>
    </>
  );
}
