import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getPublicContent,
  getSettings,
  publicContent,
} from "@/server/services/content";
import { contentMetadata } from "@/server/services/seo";
import { ContentView } from "@/components/content-view";
import { PageHeading } from "@/components/page-heading";
import { type Kind } from "@/features/content/schema";
const kinds: Record<string, Kind> = {
  members: "PERSON",
  recruitment: "POSITION",
  gallery: "ALBUM",
};
export async function generateMetadata({
  params,
}: {
  params: Promise<{ section: string; slug: string }>;
}) {
  const { section, slug } = await params;
  if (!Object.hasOwn(kinds, section)) return {};
  const entry = await getPublicContent(kinds[section], slug);
  return entry
    ? contentMetadata(`/${section}/${slug}`, entry.data.title, entry.data)
    : {};
}
export default async function Detail({
  params,
}: {
  params: Promise<{ section: string; slug: string }>;
}) {
  const { section, slug } = await params;
  const kind = kinds[section];
  if (!Object.hasOwn(kinds, section)) notFound();
  const entry = await getPublicContent(kind, slug);
  if (!entry) notFound();
  const [{ data: settings }, departments] = await Promise.all([
    getSettings(),
    publicContent("DEPARTMENT", { limit: 1000 }),
  ]);
  return (
    <div className="container page-section narrow">
      <Link className="back-link" href={`/${section}`}>
        ← {section}
      </Link>
      <PageHeading
        eyebrow={section.toUpperCase()}
        title={entry.data.title}
        description=""
      />
      <ContentView kind={kind} data={entry.data} timezone={settings.timezone} />
      {entry.data.departmentIds.length > 0 && (
        <section>
          <h2>Research departments</h2>
          <div className="filter-tabs">
            {departments.entries
              .filter((d) => entry.data.departmentIds.includes(d.id))
              .map((d) => (
                <Link key={d.id} href={`/research/${d.slug}`}>
                  {d.data.title}
                </Link>
              ))}
          </div>
        </section>
      )}
      {kind === "PERSON" && (
        <Link
          className="button secondary"
          href={`/achievements?person=${entry.id}`}
        >
          Research by this member →
        </Link>
      )}
    </div>
  );
}
