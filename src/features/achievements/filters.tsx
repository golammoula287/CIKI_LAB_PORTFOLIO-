import { statuses } from "./schema";
import { valueOf, type SearchParams } from "@/lib/pagination";
export function AchievementFilters({
  query,
  departments,
  admin = false,
}: {
  query: SearchParams;
  departments: { id: string; label: string }[];
  admin?: boolean;
}) {
  return (
    <form className="filter-form">
      <label className="field">
        Search
        <input
          name="q"
          defaultValue={valueOf(query.q)}
          placeholder="Title, author, venue"
        />
      </label>
      <label className="field">
        Type
        <select name="type" defaultValue={valueOf(query.type)}>
          <option value="">All types</option>
          {Object.keys(statuses).map((t) => (
            <option key={t}>{t}</option>
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
          defaultValue={valueOf(query.year)}
        />
      </label>
      <label className="field">
        Research status
        <select name="status" defaultValue={valueOf(query.status)}>
          <option value="">All statuses</option>
          {[...new Set(Object.values(statuses).flat())].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </label>
      <label className="field">
        Department
        <select name="department" defaultValue={valueOf(query.department)}>
          <option value="">All departments</option>
          {departments.map((d) => (
            <option value={d.id} key={d.id}>
              {d.label}
            </option>
          ))}
        </select>
      </label>
      {query.person && (
        <input type="hidden" name="person" value={valueOf(query.person)} />
      )}{" "}
      {admin && (
        <label className="field">
          Website state
          <select name="state" defaultValue={valueOf(query.state)}>
            <option value="">All states</option>
            <option value="draft">Unpublished</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </label>
      )}
      <button className="button secondary">Filter</button>
    </form>
  );
}
