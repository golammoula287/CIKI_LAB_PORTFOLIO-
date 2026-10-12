import { requireStaff } from "@/server/auth";
import { getDb } from "@/server/db";
import { InviteForm, StaffEditor, RevokeGrant } from "@/features/staff/forms";
import { Pagination } from "@/components/pagination";
import {
  pageNumber,
  valueOf,
  PAGE_SIZE,
  type SearchParams,
} from "@/lib/pagination";
export default async function Staff({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const user = await requireStaff();
  if (user.role !== "OWNER")
    return <p className="notice">Only the owner can manage staff access.</p>;
  const query = await searchParams;
  const page = pageNumber(query.page);
  const q = valueOf(query.q).slice(0, 200);
  const where = q
    ? {
        OR: [
          { name: { contains: q, mode: "insensitive" as const } },
          { email: { contains: q, mode: "insensitive" as const } },
        ],
      }
    : {};
  const [users, total, grants] = await Promise.all([
    getDb().user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
    }),
    getDb().user.count({ where }),
    getDb().accessGrant.findMany({
      where: { usedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
  ]);
  return (
    <>
      <div className="admin-heading">
        <div>
          <h1>Staff access</h1>
          <p>
            Invite staff, issue recovery links, change roles, and revoke access.
          </p>
        </div>
      </div>
      <InviteForm />
      <form className="filter-form">
        <label className="field">
          Search staff
          <input name="q" defaultValue={q} />
        </label>
        <button className="button secondary">Search</button>
      </form>
      <div className="content-blocks">
        {users.map((u) => (
          <StaffEditor key={u.id} user={u} />
        ))}
      </div>
      <Pagination
        path="/admin/users"
        params={query}
        page={page}
        total={total}
      />
      <h2>Pending links</h2>
      <p className="muted">
        Latest 100 active links. Tokens cannot be retrieved after creation;
        issue a replacement if needed.
      </p>
      {grants.map((g) => (
        <div className="panel" key={g.id}>
          <h3>{g.email}</h3>
          <p>
            {g.purpose} · Expires {g.expiresAt.toISOString()}
          </p>
          <RevokeGrant id={g.id} />
        </div>
      ))}
    </>
  );
}
