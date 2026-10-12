import { requireStaff } from "@/server/auth";
import { getDb } from "@/server/db";
import { UploadImage, DeleteImage } from "@/features/media/controls";
import { MediaImage } from "@/components/media-image";
import { Pagination } from "@/components/pagination";
import {
  pageNumber,
  valueOf,
  PAGE_SIZE,
  type SearchParams,
} from "@/lib/pagination";
export default async function Media({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const user = await requireStaff();
  const query = await searchParams;
  const page = pageNumber(query.page);
  const q = valueOf(query.q).slice(0, 200);
  const where = q
    ? { name: { contains: q, mode: "insensitive" as const } }
    : {};
  const [items, total] = await Promise.all([
    getDb().mediaAsset.findMany({
      where,
      include: { _count: { select: { references: true, logoFor: true } } },
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
    }),
    getDb().mediaAsset.count({ where }),
  ]);
  return (
    <>
      <div className="admin-heading">
        <div>
          <h1>Media library</h1>
          <p>Images, references, and upload management.</p>
        </div>
      </div>
      <UploadImage />
      <form className="filter-form">
        <label className="field">
          Search filenames
          <input name="q" defaultValue={q} />
        </label>
        <button className="button secondary">Search</button>
      </form>
      <div className="media-grid">
        {items.map((m) => (
          <article className="panel" key={m.id}>
            <MediaImage id={m.id} alt={m.name} />
            <h3>{m.name}</h3>
            <p className="muted">
              {m.width} × {m.height} · {Math.ceil(m.byteSize / 1024)} KB
              <br />
              {m._count.references + m._count.logoFor} references, including
              revision history
            </p>
            {user.role !== "EDITOR" && (
              <DeleteImage
                id={m.id}
                referenced={Boolean(m._count.references + m._count.logoFor)}
              />
            )}
          </article>
        ))}
      </div>
      {!items.length && <p>No images found.</p>}
      <Pagination
        path="/admin/media"
        params={query}
        page={page}
        total={total}
      />
    </>
  );
}
