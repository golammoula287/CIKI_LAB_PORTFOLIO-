import { notFound } from "next/navigation";
import Link from "next/link";
import { requireStaff } from "@/server/auth";
import { getDb } from "@/server/db";
import { contentChoices } from "@/server/services/content";
import {
  modules,
  isModule,
  contentSchema,
  parseContent,
} from "@/features/content/schema";
import { ContentEditor, ContentPublication } from "@/features/content/editor";
import { ContentView } from "@/components/content-view";
export default async function ContentEdit({
  params,
  searchParams,
}: {
  params: Promise<{ module: string; id: string }>;
  searchParams: Promise<{ saved?: string; updated?: string }>;
}) {
  const user = await requireStaff();
  const { module, id } = await params;
  if (!isModule(module)) notFound();
  const config = modules[module];
  const query = await searchParams;
  const choices = await contentChoices();
  const record =
    id === "new"
      ? null
      : await getDb().contentRecord.findUnique({
          where: { id },
          include: { revisions: { orderBy: { version: "desc" }, take: 10 } },
        });
  if (id !== "new" && (!record || record.kind !== config.kind)) notFound();
  const revision = record?.revisions[0];
  const data = revision
    ? parseContent(config.kind, revision.payload)
    : contentSchema.parse({ title: "New " + config.singular });
  const slug = revision
    ? (revision.payload as { slug: string }).slug || record!.slug
    : "";
  return (
    <>
      <Link className="back-link" href={`/admin/${module}`}>
        ← {config.label}
      </Link>
      <div className="admin-heading">
        <div>
          <h1>
            {record ? "Edit" : "New"} {config.singular}
          </h1>
          <p>
            {record?.archivedAt
              ? "Archived"
              : "Changes stay private until published."}
          </p>
        </div>
      </div>
      {(query.saved || query.updated) && (
        <div className="notice" role="status">
          {query.saved
            ? "Draft saved. The public version is unchanged."
            : "Publication state updated."}
        </div>
      )}
      {revision && (
        <details className="panel preview-panel">
          <summary>Preview saved revision {revision.version}</summary>
          <ContentView kind={config.kind} data={data} preview />
        </details>
      )}
      {!record?.archivedAt && (
        <ContentEditor
          key={record?.version || "new"}
          module={module}
          initial={data}
          id={record?.id}
          version={record?.version || 0}
          slug={slug}
          {...choices}
        />
      )}{" "}
      {record && user.role !== "EDITOR" && (
        <ContentPublication
          module={module}
          id={record.id}
          version={record.version}
          archived={Boolean(record.archivedAt)}
        />
      )}{" "}
      {record && (
        <details className="panel">
          <summary>Recent revision history</summary>
          <ul>
            {record.revisions.map((r) => (
              <li key={r.id}>
                Revision {r.version}: {r.title} · {r.createdAt.toISOString()}{" "}
                {r.id === record.publishedRevisionId ? "(public)" : ""}
              </li>
            ))}
          </ul>
        </details>
      )}
    </>
  );
}
