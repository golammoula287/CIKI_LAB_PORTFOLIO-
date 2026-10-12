import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStaff } from "@/server/auth";
import { getDb } from "@/server/db";
import { modules, isModule } from "@/features/content/schema";
import { Pagination } from "@/components/pagination";
import { EmptyState } from "@/components/page-heading";
import {
  pageNumber,
  valueOf,
  PAGE_SIZE,
  type SearchParams,
} from "@/lib/pagination";
import type { Prisma } from "@/generated/prisma/client";
export default async function ContentList({
  params,
  searchParams,
}: {
  params: Promise<{ module: string }>;
  searchParams: Promise<SearchParams>;
}) {
  await requireStaff();
  const { module } = await params;
  if (!isModule(module)) notFound();
  const config = modules[module];
  const query = await searchParams;
  const page = pageNumber(query.page);
  const q = valueOf(query.q).slice(0, 200);
  const state = valueOf(query.state);
  const where: Prisma.ContentRecordWhereInput = {
    kind: config.kind,
    ...(q
      ? {
          OR: [
            { slug: { contains: q, mode: "insensitive" } },
            {
              revisions: {
                some: { title: { contains: q, mode: "insensitive" } },
              },
            },
          ],
        }
      : {}),
    ...(state === "archived"
      ? { archivedAt: { not: null } }
      : state === "published"
        ? { archivedAt: null, publishedRevisionId: { not: null } }
        : state === "draft"
          ? { archivedAt: null, publishedRevisionId: null }
          : {}),
  };
  const db = getDb();
  const [entries, total] = await Promise.all([
    db.contentRecord.findMany({
      where,
      include: { revisions: { orderBy: { version: "desc" }, take: 1 } },
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    db.contentRecord.count({ where }),
  ]);
  return (
    <>
      <div className="admin-heading">
        <div>
          <h1>{config.label}</h1>
          <p>Prepare drafts, preview, publish, and archive.</p>
        </div>
        <Link className="button primary" href={`/admin/${module}/new`}>
          New {config.singular} +
        </Link>
      </div>
      <form className="filter-form">
        <label className="field">
          Search
          <input name="q" defaultValue={q} placeholder="Title or address" />
        </label>
        <label className="field">
          Website state
          <select name="state" defaultValue={state}>
            <option value="">All states</option>
            <option value="draft">Unpublished drafts</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </label>
        <button className="button secondary">Filter</button>
      </form>
      {entries.length ? (
        <div className="panel table-scroll">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Address</th>
                <th>State</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id}>
                  <td>
                    <Link href={`/admin/${module}/${e.id}`}>
                      {e.revisions[0]?.title || e.slug}
                    </Link>
                  </td>
                  <td>{e.slug}</td>
                  <td>
                    {e.archivedAt
                      ? "Archived"
                      : e.publishedRevisionId === e.revisions[0]?.id
                        ? "Published"
                        : e.publishedRevisionId
                          ? "Published · draft changes"
                          : "Draft"}
                  </td>
                  <td>
                    {e.updatedAt.toLocaleDateString("en-GB", {
                      timeZone: "UTC",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          title="No matching content"
          description="Create a new record or adjust your filters."
        />
      )}
      <Pagination
        path={`/admin/${module}`}
        params={query}
        page={page}
        total={total}
      />
    </>
  );
}
