"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, ChevronDown, Menu, X } from "lucide-react";

type Labels = {
  research: string;
  achievements: string;
  members: string;
  recruitment: string;
  about: string;
};
export function PublicNavigation({ labels }: { labels: Labels }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [peopleOpen, setPeopleOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const peopleButton = useRef<HTMLButtonElement>(null);
  const mobileButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    function dismiss(event: PointerEvent) {
      if (!root.current?.contains(event.target as Node)) {
        setPeopleOpen(false);
        setMobileOpen(false);
      }
    }
    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  }, []);
  function close() {
    setPeopleOpen(false);
    setMobileOpen(false);
  }
  function link(href: string, label: string) {
    return (
      <Link
        href={href}
        onClick={close}
        aria-current={
          pathname === href || pathname.startsWith(`${href}/`)
            ? "page"
            : undefined
        }
      >
        {label}
      </Link>
    );
  }
  return (
    <div
      className="navigation"
      ref={root}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          if (peopleOpen) {
            setPeopleOpen(false);
            peopleButton.current?.focus();
          } else if (mobileOpen) {
            setMobileOpen(false);
            mobileButton.current?.focus();
          }
        }
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) close();
      }}
    >
      <button
        ref={mobileButton}
        className="mobile-toggle"
        aria-expanded={mobileOpen}
        aria-controls="public-navigation"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? (
          <X size={19} aria-hidden="true" />
        ) : (
          <Menu size={19} aria-hidden="true" />
        )}{" "}
        Menu
      </button>
      <nav
        id="public-navigation"
        className={`public-navigation${mobileOpen ? " is-open" : ""}`}
        aria-label={mobileOpen ? "Mobile navigation" : "Main navigation"}
      >
        {link("/research", labels.research)}
        {link("/achievements", labels.achievements)}
        <div className="people-navigation">
          <button
            ref={peopleButton}
            aria-expanded={peopleOpen}
            aria-controls="people-navigation"
            className="nav-trigger"
            data-active={
              pathname.startsWith("/members") ||
              pathname.startsWith("/advisory-panel")
            }
            onClick={() => setPeopleOpen(!peopleOpen)}
          >
            {labels.members} <ChevronDown size={14} aria-hidden="true" />
          </button>
          <div
            id="people-navigation"
            className="people-dropdown"
            hidden={!peopleOpen}
          >
            <span className="dropdown-eyebrow">THE CIKI COMMUNITY</span>
            <Link
              href="/members"
              onClick={close}
              aria-current={pathname === "/members" ? "page" : undefined}
            >
              <span>
                <strong>Members</strong>
                <small>Meet our research community</small>
              </span>
              <ArrowUpRight size={17} aria-hidden="true" />
            </Link>
            <Link
              href="/advisory-panel"
              onClick={close}
              aria-current={pathname === "/advisory-panel" ? "page" : undefined}
            >
              <span>
                <strong>Advisory panel</strong>
                <small>The people guiding our work</small>
              </span>
              <ArrowUpRight size={17} aria-hidden="true" />
            </Link>
          </div>
        </div>
        {link("/recruitment", labels.recruitment)}
        {link("/about", labels.about)}
        <Link href="/contact" className="navigation-contact" onClick={close}>
          Get in touch <ArrowUpRight size={15} aria-hidden="true" />
        </Link>
      </nav>
    </div>
  );
}
