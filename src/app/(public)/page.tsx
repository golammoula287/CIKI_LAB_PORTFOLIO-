import Link from "next/link";
import { BannerGallery } from "@/components/banner-gallery";
import { ArrowDown, ArrowRight, ArrowUpRight } from "lucide-react";
import { getPublicContent, publicContent } from "@/server/services/content";
import { contentMetadata } from "@/server/services/seo";
import { ContentView } from "@/components/content-view";
import { pageDefaults } from "@/lib/page-defaults";
import "./home.css";

export async function generateMetadata() {
  const home = await getPublicContent("PAGE", "home");
  return contentMetadata("/", "Research & Discovery", home?.data);
}
export default async function Home() {
  const [home, research, albums] = await Promise.all([
    getPublicContent("PAGE", "home"),
    publicContent("DEPARTMENT", { limit: 6 }),
    publicContent("ALBUM", { limit: 3 }),
  ]);
  const candidates = [
    ...(home?.data.photos.map((photo) => ({
      id: photo.assetId,
      alt: photo.alt,
    })) || []),
    ...(home?.data.coverId
      ? [{ id: home.data.coverId, alt: home.data.title }]
      : []),
    ...albums.entries.flatMap((album) =>
      album.data.photos.length
        ? album.data.photos.map((photo) => ({
            id: photo.assetId,
            alt: photo.alt,
          }))
        : album.data.coverId
          ? [{ id: album.data.coverId, alt: album.data.title }]
          : [],
    ),
  ];
  const bannerPhotos = candidates
    .filter(
      (photo, index) =>
        candidates.findIndex((candidate) => candidate.id === photo.id) ===
        index,
    )
    .slice(0, 3);
  const title = (home?.data.title || pageDefaults.home.title).split("\n");
  return (
    <div className="ciki-home">
      <section className="ciki-intro">
        <div className="container intro-layout">
          <div className="intro-copy">
            <div className="intro-kicker">
              <span /> CIKI · A RESEARCH COMMUNITY
            </div>
            <h1>
              {title.map((line, index) => (
                <span key={index}>
                  {index === title.length - 1 && title.length > 1 ? (
                    <em>{line}</em>
                  ) : (
                    line
                  )}
                </span>
              ))}
            </h1>
            <p className="intro-description">
              {home?.data.summary || pageDefaults.home.description}
            </p>
            <div className="intro-actions">
              <a href="#research-areas" className="button primary">
                Explore our research <ArrowDown size={16} aria-hidden="true" />
              </a>
              <Link href="/members" className="intro-link">
                Meet the community <ArrowUpRight size={17} aria-hidden="true" />
              </Link>
            </div>
            <p className="intro-institution">
              Cognexa Center for Intelligence, Knowledge, and Innovation
            </p>
          </div>
          <div className="intro-visual">
            <BannerGallery photos={bannerPhotos} />
          </div>
        </div>
      </section>
      <nav className="home-sections" aria-label="Homepage sections">
        <div className="container">
          <span>Explore CIKI</span>
          <a href="#research-areas">Research</a>
          <a href="#community">Community</a>
          <a href="#publications">Publications</a>
          <a href="#opportunities">
            Opportunities <ArrowDown size={13} aria-hidden="true" />
          </a>
        </div>
      </nav>
      {home &&
        (home.data.coverId ||
          home.data.body.trim() ||
          home.data.sections.length > 0) && (
          <section className="container ciki-content">
            <ContentView kind="PAGE" data={{ ...home.data, summary: "" }} />
          </section>
        )}
      <section
        id="research-areas"
        className="container ciki-research"
        tabIndex={-1}
      >
        <div className="editorial-heading">
          <div>
            <span className="section-label">01 / RESEARCH</span>
            <h2>Ideas across disciplines.</h2>
          </div>
          <p>
            Explore {research.total} research directions, connected by a shared
            curiosity about intelligent computing.
          </p>
        </div>
        <div className="research-directory">
          {research.entries.map((department, index) => (
            <Link
              key={department.id}
              href={`/research/${department.slug}`}
              className="directory-entry"
            >
              <span className="directory-number">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div>
                <h3>{department.data.title}</h3>
                <p>{department.data.summary}</p>
              </div>
              <ArrowUpRight size={20} strokeWidth={1.5} aria-hidden="true" />
            </Link>
          ))}
        </div>
        <Link href="/research" className="editorial-link">
          All research departments <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </section>
      <section id="community" className="ciki-community" tabIndex={-1}>
        <div className="container community-layout">
          <div>
            <span className="section-label">02 / OUR COMMUNITY</span>
            <h2>
              Good questions.
              <br />
              <em>Shared possibilities.</em>
            </h2>
            <p>
              Discover the people, principles, and research directions that
              shape CIKI.
            </p>
          </div>
          <div className="community-directory">
            {[
              {
                href: "/members",
                title: "Our members",
                description: "Meet the research community.",
              },
              {
                href: "/advisory-panel",
                title: "Advisory panel",
                description: "The people guiding our work.",
              },
              {
                href: "/about",
                title: "About CIKI",
                description: "Our introduction, mission, and vision.",
              },
              {
                href: "/policies",
                title: "Research ethics & policy",
                description: "The principles behind our research.",
              },
            ].map((item) => (
              <Link key={item.href} href={item.href}>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </div>
                <ArrowUpRight size={18} strokeWidth={1.5} aria-hidden="true" />
              </Link>
            ))}
          </div>
        </div>
      </section>
      <section
        id="publications"
        className="container ciki-output"
        tabIndex={-1}
      >
        <div className="editorial-heading">
          <div>
            <span className="section-label">03 / RESEARCH OUTPUT</span>
            <h2>Knowledge worth sharing.</h2>
          </div>
          <Link href="/achievements" className="editorial-link">
            Explore achievements <ArrowUpRight size={17} aria-hidden="true" />
          </Link>
        </div>
        <div className="publication-directory">
          {[
            { label: "Conference papers", type: "CONFERENCE" },
            { label: "Journal articles", type: "JOURNAL" },
            { label: "Book chapters", type: "BOOK_CHAPTER" },
            { label: "Patents", type: "PATENT" },
          ].map((item) => (
            <Link key={item.type} href={`/achievements?type=${item.type}`}>
              <h3>{item.label}</h3>
              <ArrowUpRight size={18} strokeWidth={1.5} aria-hidden="true" />
            </Link>
          ))}
        </div>
      </section>
      <section
        id="opportunities"
        className="container ciki-invitation"
        tabIndex={-1}
      >
        <span className="section-label">YOUR NEXT CHAPTER</span>
        <h2>
          Bring a question.
          <br />
          <em>Find your community.</em>
        </h2>
        <p>
          Explore membership, research opportunities, and how to get involved.
        </p>
        <Link href="/recruitment" className="button primary">
          Explore opportunities <ArrowUpRight size={17} aria-hidden="true" />
        </Link>
      </section>
    </div>
  );
}
