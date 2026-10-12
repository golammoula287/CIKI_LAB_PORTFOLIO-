import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublicContent, publicContent } from "@/server/services/content";
import { contentMetadata } from "@/server/services/seo";
import { PageHeading } from "@/components/page-heading";
import { ContentView } from "@/components/content-view";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const entry = await getPublicContent("DEPARTMENT", slug);
  return entry
    ? contentMetadata(`/research/${slug}`, entry.data.title, entry.data)
    : {};
}
export default async function Department({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const entry = await getPublicContent("DEPARTMENT", slug);
  if (!entry) notFound();
  const people = await publicContent("PERSON", {
    department: entry.id,
    limit: 6,
  });
  return (
    <div className="container page-section">
      <Link className="back-link" href="/research">
        ← Research departments
      </Link>
      <PageHeading
        eyebrow="RESEARCH DEPARTMENT"
        title={entry.data.title}
        description={entry.data.summary}
      />
      <ContentView kind="DEPARTMENT" data={{ ...entry.data, summary: "" }} />
      <h2>People and research</h2>
      <div className="content-blocks">
        {people.entries.map((p) => (
          <Link
            className="content-block"
            href={`/members/${p.slug}`}
            key={p.id}
          >
            <h3>{p.data.title}</h3>
            <p>{p.data.summary}</p>
          </Link>
        ))}
      </div>
      <div className="button-row">
        <Link
          className="button primary"
          href={`/achievements?department=${entry.id}`}
        >
          Related achievements →
        </Link>
        <Link className="text-link" href={`/members?department=${entry.id}`}>
          All department members →
        </Link>
      </div>
    </div>
  );
}
