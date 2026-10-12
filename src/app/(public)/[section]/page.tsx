import { notFound } from "next/navigation";
import Link from "next/link";
import { PageHeading, EmptyState } from "@/components/page-heading";
import { ContentView } from "@/components/content-view";
import { MediaImage } from "@/components/media-image";
import { Pagination } from "@/components/pagination";
import {
  getPublicContent,
  publicContent,
  getSettings,
} from "@/server/services/content";
import { getDb } from "@/server/db";
import { getEnv } from "@/lib/env";
import { pageDefaults } from "@/lib/page-defaults";
import { pageNumber, valueOf, type SearchParams } from "@/lib/pagination";
import { positionIsOpen } from "@/features/content/schema";
import { contentMetadata } from "@/server/services/seo";
const sections = [
  "about",
  "policies",
  "members",
  "advisory-panel",
  "recruitment",
  "gallery",
  "contact",
];
export async function generateMetadata({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  if (!sections.includes(section)) return {};
  const content = await getPublicContent("PAGE", section);
  return contentMetadata(
    `/${section}`,
    pageDefaults[section].title,
    content?.data,
  );
}
export default async function ContentPage({
  params,
  searchParams,
}: {
  params: Promise<{ section: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { section } = await params;
  if (!sections.includes(section)) notFound();
  const query = await searchParams;
  const page = pageNumber(query.page);
  const q = valueOf(query.q).slice(0, 200);
  const content = await getPublicContent("PAGE", section);
  const defaults = pageDefaults[section];
  const { data: settings } = await getSettings();
  let extra: React.ReactNode = null;
  if (section === "members" || section === "advisory-panel") {
    const category = valueOf(query.category);
    const department = valueOf(query.department);
    const [people, categories, departments] = await Promise.all([
      publicContent("PERSON", {
        page,
        q,
        category,
        department,
        ...(section === "advisory-panel"
          ? { advisory: true }
          : { membersOnly: true }),
      }),
      getEnv().DATABASE_URL
        ? getDb().membershipCategory.findMany({ orderBy: { sortOrder: "asc" } })
        : Promise.resolve([]),
      publicContent("DEPARTMENT", { limit: 1000 }),
    ]);
    extra = (
      <>
        <form className="filter-form">
          <label className="field">
            Search people
            <input name="q" defaultValue={q} />
          </label>
          <label className="field">
            Membership
            <select name="category" defaultValue={category}>
              <option value="">All categories</option>
              {categories.map((c) => (
                <option value={c.id} key={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            Department
            <select name="department" defaultValue={department}>
              <option value="">All departments</option>
              {departments.entries.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.data.title}
                </option>
              ))}
            </select>
          </label>
          <button className="button secondary">Filter</button>
        </form>
        {people.entries.length ? (
          <div className="people-grid">
            {people.entries.map((person) => (
              <Link
                className="department-card person-card"
                href={`/members/${person.slug}`}
                key={person.id}
              >
                {person.data.coverId ? (
                  <MediaImage
                    id={person.data.coverId}
                    alt={person.data.title}
                  />
                ) : (
                  <span className="person-placeholder" aria-hidden>
                    {person.data.title.slice(0, 1)}
                  </span>
                )}
                <h2>{person.data.title}</h2>
                <p>{person.data.summary}</p>
                <span className="badge">
                  {categories.find((c) => c.id === person.data.categoryId)
                    ?.label || "Advisory panel"}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No profiles found"
            description="Published profiles will appear here. Try changing your filters."
          />
        )}
        <Pagination
          path={`/${section}`}
          params={query}
          page={page}
          total={people.total}
        />
        {section === "members" && (
          <Link className="text-link" href="/advisory-panel">
            Explore the advisory panel →
          </Link>
        )}
      </>
    );
  } else if (section === "recruitment") {
    const showAll = valueOf(query.status) === "all";
    const [positions, faqs] = await Promise.all([
      publicContent("POSITION", { page, q, open: !showAll }),
      publicContent("FAQ", { limit: 1000 }),
    ]);
    extra = (
      <>
        <h2>Research opportunities</h2>
        <form className="filter-form">
          <label className="field">
            Search positions
            <input name="q" defaultValue={q} />
          </label>
          <label className="field">
            Status
            <select name="status" defaultValue={showAll ? "all" : "open"}>
              <option value="open">Open positions</option>
              <option value="all">All positions</option>
            </select>
          </label>
          <button className="button secondary">Filter</button>
        </form>
        {positions.entries.length ? (
          <div className="content-blocks">
            {positions.entries.map((p) => (
              <Link
                className="content-block"
                href={`/recruitment/${p.slug}`}
                key={p.id}
              >
                <span className="badge">
                  {positionIsOpen(p.data) ? "Open" : "Closed"}
                </span>
                <h2>{p.data.title}</h2>
                <p>{p.data.summary}</p>
                {p.data.deadline && (
                  <p>
                    Deadline:{" "}
                    {new Intl.DateTimeFormat("en-GB", {
                      dateStyle: "medium",
                      timeStyle: "short",
                      timeZone: settings.timezone,
                    }).format(new Date(p.data.deadline))}{" "}
                    ({settings.timezone})
                  </p>
                )}
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No matching positions"
            description="Check back for future opportunities or change the status filter."
          />
        )}
        <Pagination
          path="/recruitment"
          params={query}
          page={page}
          total={positions.total}
        />
        <h2>Frequently asked questions</h2>
        {faqs.entries.length ? (
          faqs.entries.map((f) => (
            <details className="faq-item" key={f.id}>
              <summary>{f.data.title}</summary>
              <p className="preserve-lines">{f.data.body}</p>
            </details>
          ))
        ) : (
          <p>Recruitment FAQs will be published here.</p>
        )}
      </>
    );
  } else if (section === "gallery") {
    const albums = await publicContent("ALBUM", { page, q });
    extra = (
      <>
        <form className="filter-form">
          <label className="field">
            Search albums
            <input name="q" defaultValue={q} />
          </label>
          <button className="button secondary">Search</button>
        </form>
        {albums.entries.length ? (
          <div className="people-grid">
            {albums.entries.map((a) => (
              <Link
                className="department-card"
                key={a.id}
                href={`/gallery/${a.slug}`}
              >
                {(a.data.coverId || a.data.photos[0]?.assetId) && (
                  <MediaImage
                    id={a.data.coverId || a.data.photos[0].assetId}
                    alt={a.data.title}
                  />
                )}
                <h2>{a.data.title}</h2>
                <p>{a.data.summary}</p>
                <span className="muted">
                  {a.data.photos.length} photos{" "}
                  {a.data.eventDate && `· ${a.data.eventDate}`}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No albums published yet"
            description="Lab photographs will appear here as albums are published."
          />
        )}
        <Pagination
          path="/gallery"
          params={query}
          page={page}
          total={albums.total}
        />
      </>
    );
  } else if (section === "contact")
    extra = (
      <div className="content-blocks">
        <section className="content-block">
          <h2>Office</h2>
          <p className="preserve-lines">
            {settings.office || "Office details will be published here."}
          </p>
        </section>
        <section className="content-block">
          <h2>Contact details</h2>
          {settings.phone ? (
            <p>
              <a href={`tel:${settings.phone.replace(/[^+\d]/g, "")}`}>
                {settings.phone}
              </a>
            </p>
          ) : (
            <p>Phone details will be published here.</p>
          )}
          {settings.email && (
            <p>
              <a href={`mailto:${settings.email}`}>{settings.email}</a>
            </p>
          )}
          {settings.socialLinks.map((link) => (
            <p key={link.url}>
              <a href={link.url} target="_blank" rel="noopener noreferrer">
                {link.label} ↗
              </a>
            </p>
          ))}
        </section>
      </div>
    );
  return (
    <div className="container page-section">
      <PageHeading
        eyebrow={defaults.eyebrow}
        title={content?.data.title || defaults.title}
        description={content?.data.summary || defaults.description}
      />
      {content ? (
        <ContentView kind="PAGE" data={{ ...content.data, summary: "" }} />
      ) : ["about", "policies"].includes(section) ? (
        <EmptyState
          title="Information coming soon"
          description="Approved lab information will be published here."
        />
      ) : null}
      {extra}
    </div>
  );
}
