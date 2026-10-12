"use client";
import { useActionState, useState } from "react";
import {
  saveSettingsAction,
  saveCategoryAction,
} from "@/server/actions/settings";
import { type SettingsData } from "./schema";
import { TextField, type Choice } from "@/features/content/editor";
export function SettingsEditor({
  initial,
  version,
  media,
}: {
  initial: SettingsData;
  version: number;
  media: Choice[];
}) {
  const [state, action, pending] = useActionState(saveSettingsAction, {
    error: "",
  });
  const [links, setLinks] = useState(initial.socialLinks);
  return (
    <form action={action} className="panel form-stack">
      <input name="version" type="hidden" value={version} />
      <input name="socialLinks" type="hidden" value={JSON.stringify(links)} />
      <div className="form-grid">
        <TextField
          name="labName"
          label="Official lab name"
          value={initial.labName}
          required
        />
        <TextField name="tagline" label="Tagline" value={initial.tagline} />
        <TextField
          name="description"
          label="Default SEO description"
          value={initial.description}
          multiline
        />
        <TextField
          name="office"
          label="Office address"
          value={initial.office}
          multiline
        />
        <TextField name="phone" label="Public phone" value={initial.phone} />
        <TextField
          name="email"
          label="Public email"
          value={initial.email}
          type="email"
        />
        <TextField
          name="timezone"
          label="Lab timezone (IANA name)"
          value={initial.timezone}
          required
        />
        <label className="field">
          Logo
          <select aria-label="Logo" name="logoId" defaultValue={initial.logoId}>
            <option value="">Default lab symbol</option>
            {media.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
        </label>
        {(
          [
            "researchLabel",
            "achievementsLabel",
            "membersLabel",
            "recruitmentLabel",
            "aboutLabel",
          ] as const
        ).map((name) => (
          <TextField
            key={name}
            name={name}
            label={`Navigation: ${name.replace("Label", "")}`}
            value={initial[name]}
            required
          />
        ))}
      </div>
      <fieldset>
        <legend>Social links</legend>
        {links.map((link, index) => (
          <div key={index} className="repeat-row">
            <label className="field">
              Label
              <input
                value={link.label}
                required
                onChange={(e) =>
                  setLinks(
                    links.map((l, i) =>
                      i === index ? { ...l, label: e.target.value } : l,
                    ),
                  )
                }
              />
            </label>
            <label className="field">
              URL
              <input
                type="url"
                required
                value={link.url}
                onChange={(e) =>
                  setLinks(
                    links.map((l, i) =>
                      i === index ? { ...l, url: e.target.value } : l,
                    ),
                  )
                }
              />
            </label>
            <button
              className="button secondary"
              type="button"
              onClick={() => setLinks(links.filter((_, i) => i !== index))}
            >
              Remove link
            </button>
          </div>
        ))}
        <button
          type="button"
          className="button secondary"
          disabled={links.length >= 12}
          onClick={() => setLinks([...links, { label: "", url: "" }])}
        >
          Add social link +
        </button>
      </fieldset>
      <p className="muted">
        Settings are published immediately. Draft workflows apply to page
        content separately.
      </p>
      {state.error && (
        <p role="alert" className="form-error">
          {state.error}
        </p>
      )}
      {state.success && (
        <p role="status" className="notice">
          {state.success}
        </p>
      )}
      <button disabled={pending} className="button primary">
        Save and publish settings
      </button>
    </form>
  );
}
export function CategoryEditor({
  value,
}: {
  value: { id: string; key: string; label: string; sortOrder: number };
}) {
  const [state, action, pending] = useActionState(saveCategoryAction, {
    error: "",
  });
  return (
    <form action={action} className="panel form-stack">
      <input name="id" value={value.id} type="hidden" />
      <div className="form-grid">
        <TextField
          name="label"
          label="Category label"
          value={value.label}
          required
        />
        <label className="field">
          Stable key
          <input
            name="key"
            defaultValue={value.key}
            readOnly={Boolean(value.id)}
            required
          />
        </label>
        <TextField
          name="sortOrder"
          label="Order"
          value={value.sortOrder}
          type="number"
        />
      </div>
      {state.error && (
        <p className="form-error" role="alert">
          {state.error}
        </p>
      )}
      {state.success && <p role="status">{state.success}</p>}
      <button disabled={pending} className="button secondary">
        {value.id ? "Save category" : "Create category"}
      </button>
    </form>
  );
}
