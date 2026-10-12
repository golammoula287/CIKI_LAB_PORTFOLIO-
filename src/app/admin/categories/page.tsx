import { requireStaff } from "@/server/auth";
import { getDb } from "@/server/db";
import { CategoryEditor } from "@/features/settings/editor";
export default async function Categories() {
  const user = await requireStaff();
  if (user.role === "EDITOR")
    return (
      <p className="notice">Administrators manage membership categories.</p>
    );
  const items = await getDb().membershipCategory.findMany({
    orderBy: { sortOrder: "asc" },
  });
  return (
    <>
      <div className="admin-heading">
        <div>
          <h1>Membership categories</h1>
          <p>
            Rename and reorder categories, or create additional categories.
            Existing profile references are preserved.
          </p>
        </div>
      </div>
      {items.map((item) => (
        <CategoryEditor key={item.id} value={item} />
      ))}
      <h2>Add a category</h2>
      <CategoryEditor
        value={{ id: "", key: "", label: "", sortOrder: items.length }}
      />
    </>
  );
}
