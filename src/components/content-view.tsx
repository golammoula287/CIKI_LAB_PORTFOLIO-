import {
  type ContentData,
  type Kind,
  positionIsOpen,
} from "@/features/content/schema";
import { MediaImage } from "./media-image";
export function ContentView({
  kind,
  data,
  preview = false,
  timezone = "Asia/Dhaka",
}: {
  kind: Kind;
  data: ContentData;
  preview?: boolean;
  timezone?: string;
}) {
  return (
    <article className="content-view">
      {preview && <h2>{data.title}</h2>}
      {data.coverId && <MediaImage id={data.coverId} alt={data.title} />}
      <p className="content-intro">{data.summary}</p>
      <div className="prose preserve-lines">{data.body}</div>
      {data.sections.map((s, i) => (
        <section className="content-block" key={i}>
          <h2>{s.heading}</h2>
          <p className="preserve-lines">{s.body}</p>
        </section>
      ))}
      {kind === "PERSON" && (
        <div className="button-row">
          {data.email && (
            <a className="text-link" href={`mailto:${data.email}`}>
              Email →
            </a>
          )}
          {data.website && (
            <a
              className="text-link"
              href={data.website}
              target="_blank"
              rel="noopener noreferrer"
            >
              Website / profile ↗
            </a>
          )}
        </div>
      )}
      {kind === "POSITION" && (
        <>
          <span className="badge">
            {positionIsOpen(data) ? "Open position" : "Applications closed"}
          </span>
          {data.deadline && (
            <p>
              Deadline:{" "}
              {new Intl.DateTimeFormat("en-GB", {
                dateStyle: "long",
                timeStyle: "short",
                timeZone: timezone,
              }).format(new Date(data.deadline))}{" "}
              ({timezone})
            </p>
          )}
          {[
            ["Eligibility criteria", data.eligibility],
            ["Benefits", data.benefits],
            ["How to apply", data.howToApply],
          ].map(
            ([title, text]) =>
              text && (
                <section className="content-block" key={title}>
                  <h2>{title}</h2>
                  <p className="preserve-lines">{text}</p>
                </section>
              ),
          )}
          {data.applyUrl && positionIsOpen(data) && (
            <a
              href={data.applyUrl}
              className="button primary"
              target="_blank"
              rel="noopener noreferrer"
            >
              Apply externally ↗
            </a>
          )}
        </>
      )}
      {kind === "ALBUM" && (
        <>
          {data.eventDate && <p>Event date: {data.eventDate}</p>}
          <div className="photo-grid">
            {data.photos.map((p, i) => (
              <figure key={`${p.assetId}-${i}`}>
                <MediaImage id={p.assetId} alt={p.alt} />
                {p.caption && <figcaption>{p.caption}</figcaption>}
              </figure>
            ))}
          </div>
        </>
      )}
    </article>
  );
}
