import Link from "next/link";
import { ResearchIcon } from "@/components/research-icon";
import { PageHeading, EmptyState } from "@/components/page-heading";
import { Pagination } from "@/components/pagination";
import { ContentView } from "@/components/content-view";
import { getPublicContent, publicContent } from "@/server/services/content";
import { contentMetadata } from "@/server/services/seo";
import { pageNumber, valueOf, type SearchParams } from "@/lib/pagination";
import { pageDefaults } from "@/lib/page-defaults";
export async function generateMetadata() {
  const content = await getPublicContent("PAGE", "research");
  return contentMetadata("/research", "Research departments", content?.data);
}
export default async function Research({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const query = await searchParams;
  const page = pageNumber(query.page);
  const q = valueOf(query.q);
  const [departments, content] = await Promise.all([
    publicContent("DEPARTMENT", { page, q }),
    getPublicContent("PAGE", "research"),
  ]);
  const defaults = pageDefaults.research;
  return (
    <div className="container page-section">
      <PageHeading
        eyebrow={defaults.eyebrow}
        title={content?.data.title || defaults.title}
        description={content?.data.summary || defaults.description}
      />
      {content && (
        <ContentView kind="PAGE" data={{ ...content.data, summary: "" }} />
      )}
      <form className="filter-form">
        <label className="field">
          Search departments
          <input name="q" defaultValue={q} />
        </label>
        <button className="button secondary">Search</button>
      </form>
      <div className="department-grid">
        {departments.entries.map((d) => (
          <Link
            className="department-card"
            href={`/research/${d.slug}`}
            key={d.id}
          >
            <ResearchIcon slug={d.slug} />
            <h2>{d.data.title}</h2>
            <p>{d.data.summary}</p>
            <span>Explore department ↗</span>
          </Link>
        ))}
      </div>
      {!departments.entries.length && (
        <EmptyState
          title="No departments found"
          description="Try another search."
        />
      )}
      <Pagination
        path="/research"
        params={query}
        page={page}
        total={departments.total}
      />
    </div>
  );
}
