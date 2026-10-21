"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, Microscope, Users, Images } from "lucide-react";

export function MobileNavigation() {
  const pathname = usePathname();
  const items = [
    { href: "/", label: "Home", icon: House },
    { href: "/research", label: "Research", icon: Microscope },
    { href: "/members", label: "Community", icon: Users },
    { href: "/gallery", label: "Gallery", icon: Images },
  ];
  return (
    <nav className="mobile-dock" aria-label="Mobile quick navigation">
      {items.map(({ href, label, icon: Icon }) => {
        const active =
          pathname === href ||
          (href !== "/" && pathname.startsWith(`${href}/`)) ||
          (href === "/members" && pathname.startsWith("/advisory-panel"));
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
          >
            <Icon size={21} strokeWidth={1.8} aria-hidden="true" />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
