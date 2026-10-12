import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublicAchievement } from "@/server/services/achievements";
import { contentMetadata } from "@/server/services/seo";
import { PageHeading } from "@/components/page-heading";
export const dynamic = "force-dynamic";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const entry = await getPublicAchievement(slug);
  return entry?.publishedRevision
    ? contentMetadata(`/achievements/${slug}`, entry.publishedRevision.title)
    : {};
}
export default async function AchievementDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const entry = await getPublicAchievement(slug);
  const revision = entry?.publishedRevision;
  if (!entry || !revision) notFound();
  return (
    <article className="container page-section narrow">
      <Link href="/achievements" className="back-link">
        ← Achievements
      </Link>
      <PageHeading
        eyebrow={`${revision.type.replaceAll("_", " ")} / ${revision.year}`}
        title={revision.title}
        description={revision.authors}
      />
      <span className="badge">{revision.status.replaceAll("_", " ")}</span>
      <p>{revision.venue}</p>
      {revision.authorEntries.some((a) => a.affiliation) && (
        <ul>
          {revision.authorEntries.map((a) => (
            <li key={a.id}>
              {a.name}
              {a.affiliation && ` — ${a.affiliation}`}
            </li>
          ))}
        </ul>
      )}
      <div className="filter-tabs">
        {revision.departments
          .filter(
            (d) => !d.department.archivedAt && d.department.publishedRevision,
          )
          .map((d) => (
            <Link key={d.departmentId} href={`/research/${d.department.slug}`}>
              {d.department.publishedRevision!.title}
            </Link>
          ))}
      </div>
      <h2>Abstract</h2>
      <p className="preserve-lines">
        {revision.abstract || "No abstract provided."}
      </p>
      {revision.url && (
        <a
          className="button primary"
          href={revision.url}
          rel="noopener noreferrer"
          target="_blank"
        >
          View research ↗
        </a>
      )}
    </article>
  );
}
