"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function AdminNavigation({
  items,
}: {
  items: { href: string; label: string }[];
}) {
  const pathname = usePathname();
  return (
    <nav aria-label="Staff navigation">
      {items.map(({ href, label }) => {
        const active =
          pathname === href ||
          (href !== "/admin" &&
            href !== "/" &&
            pathname.startsWith(`${href}/`));
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
