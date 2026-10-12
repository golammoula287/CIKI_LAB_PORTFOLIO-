import Link from "next/link";
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
        <nav aria-label="Staff navigation">
          <Link href="/admin">Overview</Link>
          <Link href="/admin/achievements">Achievements</Link>
          {Object.entries(modules).map(([key, module]) => (
            <Link key={key} href={`/admin/${key}`}>
              {module.label}
            </Link>
          ))}
          <Link href="/admin/media">Media library</Link>
          {user.role !== "EDITOR" && (
            <>
              <Link href="/admin/categories">Membership categories</Link>
              <Link href="/admin/settings">Site settings</Link>
            </>
          )}
          {user.role === "OWNER" && (
            <Link href="/admin/users">Staff access</Link>
          )}
          <Link href="/admin/activity">Activity log</Link>
          <Link href="/admin/account">Your account</Link>
          <Link href="/admin/setup">Project setup</Link>
          <Link href="/">View public website ↗</Link>
        </nav>
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
