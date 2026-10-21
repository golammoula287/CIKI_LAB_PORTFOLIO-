import { AdminNavigation } from "@/components/admin-navigation";
import "./admin.css";
import { Brand } from "@/components/site-shell";
import { requireStaff, getAuth } from "@/server/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { modules } from "@/features/content/schema";
import { getSettings } from "@/server/services/content";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Staff dashboard",
  robots: { index: false, follow: false },
};
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireStaff();
  const { data: settings } = await getSettings();
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Brand settings={settings} />
        <AdminNavigation
          items={[
            { href: "/admin", label: "Overview" },
            { href: "/admin/achievements", label: "Achievements" },
            ...Object.entries(modules).map(([key, module]) => ({
              href: `/admin/${key}`,
              label: module.label,
            })),
            { href: "/admin/media", label: "Media library" },
            ...(user.role !== "EDITOR"
              ? [
                  { href: "/admin/categories", label: "Membership categories" },
                  { href: "/admin/settings", label: "Site settings" },
                ]
              : []),
            ...(user.role === "OWNER"
              ? [{ href: "/admin/users", label: "Staff access" }]
              : []),
            { href: "/admin/activity", label: "Activity log" },
            { href: "/admin/account", label: "Your account" },
            { href: "/admin/setup", label: "Project setup" },
            { href: "/", label: "View public website ↗" },
          ]}
        />
        <small>CIKI LAB / STAFF WORKSPACE</small>
      </aside>
      <main id="main" className="admin-main">
        <div className="admin-topbar">
          <span>
            {user.name} · {user.role.toLowerCase()}
          </span>
          <form
            action={async () => {
              "use server";
              await getAuth().api.signOut({ headers: await headers() });
              redirect("/login");
            }}
          >
            <button>Sign out ↗</button>
          </form>
        </div>
        {children}
      </main>
    </div>
  );
}
