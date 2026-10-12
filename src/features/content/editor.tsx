"use client";
import { useActionState, useState } from "react";
import {
  saveContentAction,
  publishContentAction,
} from "@/server/actions/content";
import { modules, pageKeys, type ModuleKey, type ContentData } from "./schema";
export type Choice = { id: string; label: string };
export function TextField({
  name,
  label,
  value = "",
  type = "text",
  required = false,
  multiline = false,
}: {
  name: string;
  label: string;
  value?: string | number;
  type?: string;
  required?: boolean;
  multiline?: boolean;
}) {
  return (
    <label className={`field ${multiline ? "full-width" : ""}`}>
      {label}
      {multiline ? (
        <textarea
          name={name}
          defaultValue={value}
          required={required}
          maxLength={20000}
        />
      ) : (
        <input
          name={name}
          type={type}
          defaultValue={value}
          required={required}
        />
      )}
    </label>
  );
}
export function ContentEditor({
  module,
  initial,
  id,
  version,
  slug,
  media,
  departments,
  categories,
}: {
  module: ModuleKey;
  initial: ContentData;
  id?: string;
  version: number;
  slug: string;
  media: Choice[];
  departments: Choice[];
  categories: Choice[];
}) {
  const [state, action, pending] = useActionState(saveContentAction, {
    error: "",
  });
  const [sections, setSections] = useState(initial.sections);
  const [photos, setPhotos] = useState(initial.photos);
  const kind = modules[module].kind;
  return (
    <form action={action} className="panel form-stack">
      <input type="hidden" name="module" value={module} />
      <input type="hidden" name="id" value={id || ""} />
      <input type="hidden" name="version" value={version} />
      <input type="hidden" name="sections" value={JSON.stringify(sections)} />
      <input type="hidden" name="photos" value={JSON.stringify(photos)} />
      <div className="form-grid">
        <TextField
          name="title"
          label={
            kind === "PERSON"
              ? "Full name"
              : kind === "FAQ"
                ? "Question"
                : "Title"
          }
          value={initial.title}
          required
        />
        {kind === "PAGE" ? (
          <label className="field">
            Page
            <select aria-label="Page" name="slug" defaultValue={slug || "home"}>
              {pageKeys.map((key) => (
                <option key={key}>{key}</option>
              ))}
            </select>
          </label>
        ) : (
          <TextField name="slug" label="URL slug" value={slug} required />
        )}
        <TextField
          name="summary"
          label={kind === "PERSON" ? "Role / affiliation" : "Short description"}
          value={initial.summary}
          multiline
        />
        <TextField
          name="body"
          label={
            kind === "PERSON"
              ? "Biography"
              : kind === "FAQ"
                ? "Answer"
                : "Main content"
          }
          value={initial.body}
          multiline
        />
        <TextField
          name="sortOrder"
          label="Display order (lower first)"
          value={initial.sortOrder}
          type="number"
        />
        {kind === "DEPARTMENT" && (
          <TextField
            name="icon"
            label="Short symbol or icon"
            value={initial.icon}
          />
        )}
        {["PAGE", "DEPARTMENT", "PERSON", "ALBUM"].includes(kind) && (
          <label className="field">
            {kind === "PERSON" ? "Portrait" : "Cover image"}
            <select
              aria-label={kind === "PERSON" ? "Portrait" : "Cover image"}
              name="coverId"
              defaultValue={initial.coverId}
            >
              <option value="">No image</option>
              {media.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
            <span className="muted">
              Upload images in the media library first.
            </span>
          </label>
        )}
        {kind === "PERSON" && (
          <>
            <label className="field">
              Membership category
              <select
                aria-label="Membership category"
                name="categoryId"
                defaultValue={initial.categoryId}
              >
                <option value="">Advisory only / no category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="checkbox-field">
              <input
                type="checkbox"
                name="advisory"
                defaultChecked={initial.advisory}
              />
              Show on the advisory panel
            </label>
            <TextField
              name="email"
              label="Public email (optional)"
              value={initial.email}
              type="email"
            />
            <TextField
              name="website"
              label="Public profile / website"
              value={initial.website}
              type="url"
            />
          </>
        )}
        {["PERSON", "POSITION"].includes(kind) && (
          <fieldset className="full-width">
            <legend>Research departments</legend>
            {departments.length ? (
              departments.map((d) => (
                <label className="checkbox-field" key={d.id}>
                  <input
                    type="checkbox"
                    name="departmentIds"
                    value={d.id}
                    defaultChecked={initial.departmentIds.includes(d.id)}
                  />
                  {d.label}
                </label>
              ))
            ) : (
              <p className="muted">Create departments first.</p>
            )}
          </fieldset>
        )}
        {kind === "POSITION" && (
          <>
            <TextField
              name="eligibility"
              label="Eligibility criteria"
              value={initial.eligibility}
              multiline
            />
            <TextField
              name="benefits"
              label="Benefits"
              value={initial.benefits}
              multiline
            />
            <TextField
              name="howToApply"
              label="How to apply"
              value={initial.howToApply}
              multiline
            />
            <TextField
              name="applyUrl"
              label="External application URL (optional)"
              value={initial.applyUrl}
              type="url"
            />
            <TextField
              name="deadline"
              label="Application deadline (UTC)"
              value={
                initial.deadline
                  ? new Date(initial.deadline).toISOString().slice(0, 16)
                  : ""
              }
              type="datetime-local"
            />
            <label className="checkbox-field">
              <input
                name="closed"
                type="checkbox"
                defaultChecked={initial.closed}
              />
              Close this position
            </label>
          </>
        )}
        {kind === "ALBUM" && (
          <TextField
            name="eventDate"
            label="Event date"
            value={initial.eventDate}
            type="date"
          />
        )}
        <TextField
          name="seoTitle"
          label="SEO title (optional)"
          value={initial.seoTitle}
        />
        <TextField
          name="seoDescription"
          label="SEO description (optional)"
          value={initial.seoDescription}
          multiline
        />
      </div>
      {kind === "PAGE" && (
        <fieldset>
          <legend>Content sections</legend>
          {sections.map((section, index) => (
            <div className="repeat-row" key={index}>
              <label className="field">
                Heading
                <input
                  required
                  value={section.heading}
                  onChange={(e) =>
                    setSections(
                      sections.map((s, i) =>
                        i === index ? { ...s, heading: e.target.value } : s,
                      ),
                    )
                  }
                />
              </label>
              <label className="field">
                Content
                <textarea
                  required
                  value={section.body}
                  onChange={(e) =>
                    setSections(
                      sections.map((s, i) =>
                        i === index ? { ...s, body: e.target.value } : s,
                      ),
                    )
                  }
                />
              </label>
              <button
                className="button secondary"
                type="button"
                onClick={() =>
                  setSections(sections.filter((_, i) => i !== index))
                }
              >
                Remove section {index + 1}
              </button>
            </div>
          ))}
          <button
            className="button secondary"
            type="button"
            disabled={sections.length >= 30}
            onClick={() =>
              setSections([...sections, { heading: "", body: "" }])
            }
          >
            Add section +
          </button>
        </fieldset>
      )}
      {kind === "ALBUM" && (
        <fieldset>
          <legend>Photos in display order</legend>
          {photos.map((photo, index) => (
            <div className="repeat-row" key={index}>
              <label className="field">
                Image
                <select
                  aria-label="Image"
                  required
                  value={photo.assetId}
                  onChange={(e) =>
                    setPhotos(
                      photos.map((p, i) =>
                        i === index ? { ...p, assetId: e.target.value } : p,
                      ),
                    )
                  }
                >
                  <option value="">Choose an image</option>
                  {media.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                Alt text
                <input
                  required
                  value={photo.alt}
                  onChange={(e) =>
                    setPhotos(
                      photos.map((p, i) =>
                        i === index ? { ...p, alt: e.target.value } : p,
                      ),
                    )
                  }
                />
              </label>
              <label className="field">
                Caption
                <input
                  value={photo.caption}
                  onChange={(e) =>
                    setPhotos(
                      photos.map((p, i) =>
                        i === index ? { ...p, caption: e.target.value } : p,
                      ),
                    )
                  }
                />
              </label>
              <div className="editor-actions">
                <button
                  className="button secondary"
                  type="button"
                  disabled={index === 0}
                  onClick={() => {
                    const next = [...photos];
                    [next[index - 1], next[index]] = [
                      next[index],
                      next[index - 1],
                    ];
                    setPhotos(next);
                  }}
                >
                  Move up
                </button>
                <button
                  type="button"
                  className="button secondary"
                  onClick={() =>
                    setPhotos(photos.filter((_, i) => i !== index))
                  }
                >
                  Remove photo {index + 1}
                </button>
              </div>
            </div>
          ))}
          <button
            type="button"
            className="button secondary"
            disabled={photos.length >= 100}
            onClick={() =>
              setPhotos([...photos, { assetId: "", alt: "", caption: "" }])
            }
          >
            Add photo +
          </button>
        </fieldset>
      )}
      <p className="muted">
        Text is rendered as plain text with paragraphs. HTML and scripts are not
        executed. Slug changes take effect on publication and preserve the
        previous URL as a redirect.
      </p>
      {state.error && (
        <p role="alert" className="form-error">
          {state.error}
        </p>
      )}
      <button disabled={pending} className="button primary">
        {pending ? "Saving…" : "Save private draft"}
      </button>
    </form>
  );
}
export function ContentPublication({
  module,
  id,
  version,
  archived,
}: {
  module: ModuleKey;
  id: string;
  version: number;
  archived: boolean;
}) {
  const [state, action, pending] = useActionState(publishContentAction, {
    error: "",
  });
  return (
    <form action={action} className="panel form-stack">
      <input name="module" type="hidden" value={module} />
      <input name="id" type="hidden" value={id} />
      <input name="version" type="hidden" value={version} />
      <h2>Publication</h2>
      <p>
        Actions apply to the saved preview. Save changes before publishing.
        Restoring an archived record returns it to a private draft.
      </p>
      <div className="editor-actions">
        {archived ? (
          <button
            className="button primary"
            name="operation"
            value="restore"
            disabled={pending}
          >
            Restore to draft
          </button>
        ) : (
          <>
            <button
              className="button primary"
              name="operation"
              value="publish"
              disabled={pending}
            >
              Publish saved revision
            </button>
            <button
              className="button danger"
              name="operation"
              value="archive"
              disabled={pending}
            >
              Archive
            </button>
          </>
        )}
      </div>
      {state.error && (
        <p className="form-error" role="alert">
          {state.error}
        </p>
      )}
    </form>
  );
}
