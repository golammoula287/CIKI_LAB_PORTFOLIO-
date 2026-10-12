import Link from "next/link";
import { ArrowRight, ArrowUpRight, MoveUpRight } from "lucide-react";
import { getPublicContent, publicContent } from "@/server/services/content";
import { contentMetadata } from "@/server/services/seo";
import { ContentView } from "@/components/content-view";
import { pageDefaults } from "@/lib/page-defaults";
export async function generateMetadata() {
  const home = await getPublicContent("PAGE", "home");
  return contentMetadata("/", "Research & Discovery", home?.data);
}
export default async function Home() {
  const [home, research] = await Promise.all([
    getPublicContent("PAGE", "home"),
    publicContent("DEPARTMENT", { limit: 6 }),
  ]);
  const departments = research.entries.map((d) => ({
    slug: d.slug,
    name: d.data.title,
    description: d.data.summary,
    icon: d.data.icon,
  }));
  return (
    <>
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <div className="eyebrow">
              <span className="green-dot" /> A SPACE FOR RESEARCH & DISCOVERY
            </div>
            <h1 className="preserve-lines">
              {home?.data.title || pageDefaults.home.title}
            </h1>
            <p>{home?.data.summary || pageDefaults.home.description}</p>
            <div className="button-row">
              <Link href="/research" className="button primary">
                Explore our research <ArrowUpRight size={17} />
              </Link>
              <Link href="/about" className="text-link">
                Meet the lab <ArrowRight size={17} />
              </Link>
            </div>
            <div className="hero-footnote">
              <span>01 — EXPLORE THE POSSIBILITIES</span>
              <span>SCROLL TO DISCOVER ↓</span>
            </div>
          </div>
          <div
            className="research-art"
            role="img"
            aria-label="Abstract orbital diagram representing connected research disciplines"
          >
            <div className="art-grid" />
            <div className="art-label">
              THE SCIENCE OF CONNECTION<span>CIKI / RESEARCH LAB</span>
            </div>
            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />
            <div className="orbit orbit-three" />
            <div className="art-core">
              <span>ciki</span>
              <small>IDEAS IN ORBIT</small>
            </div>
            <i className="node node-one" />
            <i className="node node-two" />
            <i className="node node-three" />
            <span className="art-tag tag-one">INTELLIGENCE</span>
            <span className="art-tag tag-two">HUMAN IMPACT</span>
            <div className="art-bottom">
              <span>INTERDISCIPLINARY BY DESIGN</span>
              <MoveUpRight size={30} />
            </div>
          </div>
        </div>
      </section>
      {home && (
        <section className="section container">
          <ContentView kind="PAGE" data={{ ...home.data, summary: "" }} />
        </section>
      )}
      <section className="research-strip">
        <div className="container">
          <span>CONNECTED BY CURIOSITY</span>
          <p>
            Intelligence <i>·</i> Vision <i>·</i> Health <i>·</i> Data <i>·</i>{" "}
            Systems <i>·</i> Sustainability
          </p>
        </div>
      </section>
      <section className="section container">
        <div className="section-heading">
          <div>
            <div className="eyebrow">01 / OUR RESEARCH</div>
            <h2>
              Different perspectives.
              <br />
              Shared possibilities.
            </h2>
          </div>
          <div>
            <p>
              {research.total} research directions. A common interest in what
              computing can help us understand.
            </p>
            <Link href="/research" className="text-link">
              All research departments <ArrowUpRight size={17} />
            </Link>
          </div>
        </div>
        <div className="department-grid">
          {departments.map((d, i) => (
            <Link
              href={`/research/${d.slug}`}
              className="department-card"
              key={d.slug}
            >
              <div className="card-top">
                <span className="discipline-icon">{d.icon}</span>
                <span>0{i + 1}</span>
              </div>
              <h3>{d.name}</h3>
              <p>{d.description}</p>
              <div className="card-bottom">
                <span>EXPLORE DEPARTMENT</span>
                <ArrowUpRight size={18} />
              </div>
            </Link>
          ))}
        </div>
      </section>
      <section className="about-band">
        <div className="container about-grid">
          <div>
            <div className="eyebrow">02 / THE LAB</div>
            <h2>
              Good questions lead
              <br />
              to meaningful work.
            </h2>
          </div>
          <div>
            <p>
              Discover the people, principles, and research directions that
              shape CIKI Lab.
            </p>
            <div className="about-links">
              <Link href="/about">
                Introduction, mission & vision <ArrowUpRight size={18} />
              </Link>
              <Link href="/policies">
                Research ethics & lab policy <ArrowUpRight size={18} />
              </Link>
              <Link href="/advisory-panel">
                Our advisory panel <ArrowUpRight size={18} />
              </Link>
            </div>
          </div>
        </div>
      </section>
      <section className="section container">
        <div className="section-heading">
          <div>
            <div className="eyebrow">03 / RESEARCH OUTPUT</div>
            <h2>Knowledge worth sharing.</h2>
          </div>
          <Link href="/achievements" className="text-link">
            Explore achievements <ArrowUpRight size={18} />
          </Link>
        </div>
        <div className="output-types">
          {[
            "Conference papers",
            "Journal articles",
            "Book chapters",
            "Patents",
          ].map((type, i) => (
            <Link
              key={type}
              href={`/achievements?type=${["CONFERENCE", "JOURNAL", "BOOK_CHAPTER", "PATENT"][i]}`}
            >
              <span>0{i + 1}</span>
              <h3>{type}</h3>
              <ArrowUpRight size={20} />
            </Link>
          ))}
        </div>
      </section>
      <section className="container join-band">
        <div>
          <div className="eyebrow">YOUR NEXT CHAPTER</div>
          <h2>Bring your curiosity.</h2>
          <p>
            Explore membership, research opportunities, and how to get involved.
          </p>
        </div>
        <Link href="/recruitment" className="button light">
          Explore opportunities <ArrowUpRight size={18} />
        </Link>
      </section>
    </>
  );
}
