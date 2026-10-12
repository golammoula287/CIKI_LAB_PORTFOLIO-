import Link from "next/link";
import { requireStaff } from "@/server/auth";
import { getDb } from "@/server/db";
import { contentChoices } from "@/server/services/content";
import { achievementFilter } from "@/server/services/achievements";
import { AchievementFilters } from "@/features/achievements/filters";
import { Pagination } from "@/components/pagination";
import {
  pageNumber,
  valueOf,
  PAGE_SIZE,
  type SearchParams,
} from "@/lib/pagination";
import type { Prisma } from "@/generated/prisma/client";
export default async function AchievementsAdmin({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requireStaff();
  const query = await searchParams;
  const page = pageNumber(query.page);
  const state = valueOf(query.state);
  const where: Prisma.AchievementWhereInput = {
    revisions: { some: achievementFilter(query) },
    ...(state === "archived"
      ? { archivedAt: { not: null } }
      : state === "published"
        ? { archivedAt: null, publishedRevisionId: { not: null } }
        : state === "draft"
          ? { archivedAt: null, publishedRevisionId: null }
          : {}),
  };
  const [entries, total, choices] = await Promise.all([
    getDb().achievement.findMany({
      where,
      include: { revisions: { orderBy: { version: "desc" }, take: 1 } },
      orderBy: { updatedAt: "desc" },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
    }),
    getDb().achievement.count({ where }),
    contentChoices(),
  ]);
  return (
    <>
      <div className="admin-heading">
        <div>
          <h1>Achievements</h1>
          <p>Research outputs and their publication history.</p>
        </div>
        <Link className="button primary" href="/admin/achievements/new">
          New achievement +
        </Link>
      </div>
      <AchievementFilters
        query={query}
        departments={choices.departments}
        admin
      />
      <p className="muted">
        Search and research filters include saved revision history.
      </p>
      <div className="panel table-scroll">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Year</th>
              <th>Website state</th>
              <th>Research status</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.id}>
                <td>
                  <Link href={`/admin/achievements/${e.id}`}>
                    {e.revisions[0]?.title}
                  </Link>
                </td>
                <td>{e.revisions[0]?.year}</td>
                <td>
                  {e.archivedAt
                    ? "Archived"
                    : e.publishedRevisionId === e.revisions[0]?.id
                      ? "Published"
                      : e.publishedRevisionId
                        ? "Published · new draft"
                        : "Draft"}
                </td>
                <td>{e.revisions[0]?.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!entries.length && <p>No matching achievements.</p>}
      </div>
      <Pagination
        path="/admin/achievements"
        params={query}
        page={page}
        total={total}
      />
    </>
  );
}
