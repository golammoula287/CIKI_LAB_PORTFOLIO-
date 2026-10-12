import { requireStaff } from "@/server/auth";
import { getDb } from "@/server/db";
import { Pagination } from "@/components/pagination";
import {
  pageNumber,
  valueOf,
  PAGE_SIZE,
  type SearchParams,
} from "@/lib/pagination";
export default async function Activity({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const user = await requireStaff();
  if (user.role === "EDITOR")
    return (
      <p className="notice">
        Activity history is available to administrators and the owner.
      </p>
    );
  const query = await searchParams;
  const page = pageNumber(query.page);
  const q = valueOf(query.q).slice(0, 200);
  const where = q
    ? {
        OR: [
          { operation: { contains: q, mode: "insensitive" as const } },
          { entityId: { contains: q } },
          { actorId: { contains: q } },
        ],
      }
    : {};
  const [entries, total] = await Promise.all([
    getDb().auditEvent.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    getDb().auditEvent.count({ where }),
  ]);
  const users = await getDb().user.findMany({
    where: { id: { in: [...new Set(entries.map((e) => e.actorId))] } },
    select: { id: true, name: true },
  });
  return (
    <>
      <div className="admin-heading">
        <div>
          <h1>Activity log</h1>
          <p>Content, publishing, and staff access events.</p>
        </div>
      </div>
      <form className="filter-form">
        <label className="field">
          Search action, record, or actor ID
          <input name="q" defaultValue={q} />
        </label>
        <button className="button secondary">Search</button>
      </form>
      <div className="panel table-scroll">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Action</th>
              <th>Actor</th>
              <th>Record</th>
              <th>Time (UTC)</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.id}>
                <td>{e.operation}</td>
                <td>
                  {users.find((u) => u.id === e.actorId)?.name || e.actorId}
                </td>
                <td>{e.entityId}</td>
                <td>{e.createdAt.toISOString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!entries.length && <p>No matching activity.</p>}
      </div>
      <Pagination
        path="/admin/activity"
        params={query}
        page={page}
        total={total}
      />
    </>
  );
}
