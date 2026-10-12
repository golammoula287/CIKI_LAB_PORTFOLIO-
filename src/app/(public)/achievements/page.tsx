import Link from "next/link";
import { PageHeading, EmptyState } from "@/components/page-heading";
import { ContentView } from "@/components/content-view";
import { Pagination } from "@/components/pagination";
import { getPublishedAchievements } from "@/server/services/achievements";
import { getPublicContent, publicContent } from "@/server/services/content";
import { AchievementFilters } from "@/features/achievements/filters";
import { pageNumber, type SearchParams } from "@/lib/pagination";
import { contentMetadata } from "@/server/services/seo";
import { pageDefaults } from "@/lib/page-defaults";
export async function generateMetadata() {
  const content = await getPublicContent("PAGE", "achievements");
  return contentMetadata("/achievements", "Achievements", content?.data);
}
export default async function Achievements({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const query = await searchParams;
  const page = pageNumber(query.page);
  const [result, departments, content] = await Promise.all([
    getPublishedAchievements(query, page),
    publicContent("DEPARTMENT", { limit: 1000 }),
    getPublicContent("PAGE", "achievements"),
  ]);
  const defaults = pageDefaults.achievements;
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
      <AchievementFilters
        query={query}
        departments={departments.entries.map((d) => ({
          id: d.id,
          label: d.data.title,
        }))}
      />
      {query.person && (
        <p>
          <Link className="text-link" href="/achievements">
            Clear member filter →
          </Link>
        </p>
      )}
      {result.entries.length ? (
        <div className="achievement-list">
          {result.entries.map((e) => {
            const r = e.publishedRevision!;
            return (
              <Link
                className="achievement-row"
                href={`/achievements/${e.slug}`}
                key={e.slug}
              >
                <div className="eyebrow">
                  {r.type.replaceAll("_", " ")} / {r.year}
                </div>
                <h2>{r.title}</h2>
                <p>{r.authors}</p>
                <span className="badge">{r.status.replaceAll("_", " ")}</span>
              </Link>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="No matching achievements"
          description="Published research will appear here. Try adjusting your filters."
        />
      )}
      <Pagination
        path="/achievements"
        params={query}
        page={page}
        total={result.total}
      />
    </div>
  );
}
