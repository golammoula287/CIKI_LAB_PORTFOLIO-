"use client";
import { useActionState, useState } from "react";
import {
  saveAchievement,
  changePublication,
} from "@/server/actions/achievements";
import { statuses } from "./schema";
import type { Choice } from "@/features/content/editor";
export type EditorValue = {
  id?: string;
  version?: number;
  title: string;
  slug: string;
  type: string;
  year: number;
  status: string;
  authors: string;
  venue: string;
  abstract: string;
  url: string;
  disclosureApproved: boolean;
  authorEntries?: { name: string; affiliation: string; personId: string }[];
  departmentIds?: string[];
};
export function AchievementEditor({
  initial,
  allowPublish,
  people = [],
  departments = [],
}: {
  initial: EditorValue;
  allowPublish: boolean;
  people?: Choice[];
  departments?: Choice[];
}) {
  const [state, action, pending] = useActionState(saveAchievement, {
    error: "",
  });
  const [type, setType] = useState(initial.type);
  const [authors, setAuthors] = useState(
    initial.authorEntries?.length
      ? initial.authorEntries
      : initial.authors
        ? initial.authors.split(";").map((name) => ({
            name: name.trim(),
            affiliation: "",
            personId: "",
          }))
        : [{ name: "", affiliation: "", personId: "" }],
  );
  return (
    <form action={action} className="panel">
      <input name="id" type="hidden" value={initial.id || ""} />
      <input name="version" type="hidden" value={initial.version || 0} />
      <input
        name="authors"
        type="hidden"
        value={authors.map((a) => a.name).join("; ")}
      />
      <input
        name="authorEntries"
        type="hidden"
        value={JSON.stringify(authors)}
      />
      <div className="form-grid">
        <label className="field full-width">
          Title
          <input
            name="title"
            defaultValue={initial.title}
            minLength={5}
            maxLength={240}
            required
          />
        </label>
        <label className="field full-width">
          URL slug
          <input
            name="slug"
            aria-label="URL slug"
            defaultValue={initial.slug}
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
            required
          />
          <span className="muted">
            Lowercase words separated by hyphens. Changes apply on publication;
            the old address redirects.
          </span>
        </label>
        <label className="field">
          Type
          <select
            name="type"
            aria-label="Type"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            {Object.keys(statuses).map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </label>
        <label className="field">
          Research status
          <select
            name="status"
            aria-label="Research status"
            key={type}
            defaultValue={
              statuses[type].includes(initial.status)
                ? initial.status
                : statuses[type][0]
            }
          >
            {statuses[type].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <label className="field">
          Year
          <input
            name="year"
            type="number"
            min={1900}
            max={new Date().getFullYear() + 5}
            defaultValue={initial.year}
            required
          />
        </label>
        <label className="field">
          Venue / publisher / patent office
          <input name="venue" defaultValue={initial.venue} maxLength={300} />
        </label>
        <fieldset className="full-width">
          <legend>Authors in citation order</legend>
          {authors.map((author, index) => (
            <div className="repeat-row" key={index}>
              <label className="field">
                Author name
                <input
                  required
                  value={author.name}
                  onChange={(e) =>
                    setAuthors(
                      authors.map((a, i) =>
                        i === index ? { ...a, name: e.target.value } : a,
                      ),
                    )
                  }
                />
              </label>
              <label className="field">
                Affiliation
                <input
                  value={author.affiliation}
                  onChange={(e) =>
                    setAuthors(
                      authors.map((a, i) =>
                        i === index ? { ...a, affiliation: e.target.value } : a,
                      ),
                    )
                  }
                />
              </label>
              <label className="field">
                Link to a lab member (optional)
                <select
                  aria-label="Link to a lab member (optional)"
                  value={author.personId}
                  onChange={(e) =>
                    setAuthors(
                      authors.map((a, i) =>
                        i === index ? { ...a, personId: e.target.value } : a,
                      ),
                    )
                  }
                >
                  <option value="">External / unlinked author</option>
                  {people.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </label>
              <div className="editor-actions">
                <button
                  type="button"
                  className="button secondary"
                  disabled={index === 0}
                  onClick={() => {
                    const next = [...authors];
                    [next[index - 1], next[index]] = [
                      next[index],
                      next[index - 1],
                    ];
                    setAuthors(next);
                  }}
                >
                  Move up
                </button>
                <button
                  type="button"
                  className="button secondary"
                  disabled={authors.length === 1}
                  onClick={() =>
                    setAuthors(authors.filter((_, i) => i !== index))
                  }
                >
                  Remove author
                </button>
              </div>
            </div>
          ))}
          <button
            type="button"
            className="button secondary"
            disabled={authors.length >= 100}
            onClick={() =>
              setAuthors([
                ...authors,
                { name: "", affiliation: "", personId: "" },
              ])
            }
          >
            Add author +
          </button>
        </fieldset>
        <fieldset className="full-width">
          <legend>Research departments</legend>
          {departments.map((d) => (
            <label className="checkbox-field" key={d.id}>
              <input
                name="departmentIds"
                type="checkbox"
                value={d.id}
                defaultChecked={initial.departmentIds?.includes(d.id)}
              />
              {d.label}
            </label>
          ))}
        </fieldset>
        <label className="field full-width">
          Abstract
          <textarea
            name="abstract"
            defaultValue={initial.abstract}
            maxLength={12000}
          />
        </label>
        <label className="field full-width">
          Research link
          <input name="url" type="url" defaultValue={initial.url} />
        </label>
        {allowPublish && (
          <label className="checkbox-field full-width">
            <input
              name="disclosureApproved"
              type="checkbox"
              defaultChecked={initial.disclosureApproved}
            />
            I approve public disclosure of this work, including any under-review
            status.
          </label>
        )}
      </div>
      {state.error && (
        <p className="form-error" role="alert">
          {state.error}
        </p>
      )}
      <div className="editor-actions">
        <button className="button primary" disabled={pending}>
          {pending ? "Saving…" : "Save draft"}
        </button>
        <span className="muted">Saving does not publish your changes.</span>
      </div>
    </form>
  );
}
export function PublicationActions({
  id,
  version,
  archived = false,
}: {
  id: string;
  version: number;
  archived?: boolean;
}) {
  const [state, action, pending] = useActionState(changePublication, {
    error: "",
  });
  return (
    <form action={action}>
      <input name="id" value={id} type="hidden" />
      <input name="version" value={version} type="hidden" />
      <div className="editor-actions">
        {archived ? (
          <button
            className="button primary"
            name="operation"
            value="restore"
            disabled={pending}
          >
            Restore to private draft
          </button>
        ) : (
          <>
            <button
              className="button primary"
              name="operation"
              value="publish"
              disabled={pending}
            >
              Publish saved revision ↗
            </button>
            <button
              className="button danger"
              name="operation"
              value="archive"
              disabled={pending}
            >
              Archive achievement
            </button>
          </>
        )}
      </div>
      <p className="muted">
        These actions apply to the saved revision shown above. Save your form
        changes first.
      </p>
      {state.error && (
        <p className="form-error" role="alert">
          {state.error}
        </p>
      )}
    </form>
  );
}
