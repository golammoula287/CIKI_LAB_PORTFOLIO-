"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

export function AdminNavigation({
  items,
}: {
  items: { href: string; label: string }[];
}) {
  const pathname = usePathname();
  const navigation = useRef<HTMLElement>(null);
  useEffect(() => {
    const nav = navigation.current;
    const active = nav?.querySelector<HTMLElement>('[aria-current="page"]');
    if (nav && active && window.matchMedia("(max-width: 800px)").matches) {
      nav.scrollTo({ left: active.offsetLeft - nav.offsetLeft - 12 });
    }
  }, [pathname]);
  return (
    <nav ref={navigation} aria-label="Staff navigation">
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
