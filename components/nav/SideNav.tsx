"use client";

import Link from "./NavigationLink";
import { usePathname } from "next/navigation";
import type { CSSProperties } from "react";
import { MODULE_ICONS } from "./icons";
import { ThemeToggle } from "./ThemeToggle";
import { signOut } from "@/lib/actions/auth";

export const NAV_GROUPS = [
  { label: "Planung", items: [
    { key: "heute", label: "Heute", href: "/heute" },
    { key: "termine", label: "Kalender", href: "/termine" },
    { key: "todos", label: "Aufgaben", href: "/erik/todos" },
    { key: "goals", label: "Ziele", href: "/erik/goals" },
  ] },
  { label: "Bereiche", items: [
    { key: "finanzielles", label: "Finanzen", href: "/finanzielles" },
    { key: "erik", label: "Körper & Routinen", href: "/erik" },
    { key: "arbeit", label: "Arbeit & Master", href: "/arbeit" },
    { key: "training", label: "Training", href: "/training" },
    { key: "nutrition", label: "Ernährung", href: "/erik/ernaehrung" },
    { key: "fussball", label: "Fußball", href: "/fussball" },
  ] },
];
const items = NAV_GROUPS.flatMap(group => group.items);

/** Longest nav href matching the path, so /erik/todos wins over /erik. */
export function activeNavHref(pathname: string) {
  return items
    .filter(item => pathname === item.href || pathname.startsWith(`${item.href}/`))
    .reduce<string | undefined>((active, item) => !active || item.href.length > active.length ? item.href : active, undefined);
}

export function SideNav() {
  const pathname = usePathname();
  const activeHref = activeNavHref(pathname);

  return <>
    <div className="os-mobile-header"><Link href="/heute" className="os-wordmark" aria-label="Personal OS – Heute">personal<span>os</span></Link><ThemeToggle/></div>
    <aside className="os-sidebar" aria-label="Personal OS Navigation">
      <Link href="/heute" className="os-brand os-wordmark" aria-label="Personal OS – Heute">personal<span>os</span></Link>
      <div className="os-sidebar-scroll">
        {NAV_GROUPS.map((group, groupIndex) => <nav key={group.label} aria-label={group.label}>
          {group.label === "Bereiche" && <div className="os-nav-label">Bereiche</div>}
          {group.items.map((item, itemIndex) => <Link key={item.key} href={item.href} style={{ "--nav-order": groupIndex * 4 + itemIndex } as CSSProperties} className={`os-nav-link${activeHref === item.href ? " selected" : ""}`} aria-current={activeHref === item.href ? "page" : undefined}>
            <span className="os-nav-icon" aria-hidden="true">{MODULE_ICONS[item.key]}</span><span className="os-nav-text">{item.label}</span>
          </Link>)}
        </nav>)}
      </div>
      <div className="os-sidebar-bottom">
        <Link href="/erik" className="os-account" aria-label="Persönlichen Bereich von Erik Wolters öffnen"><span>Erik Wolters</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg></Link>
        <div className="os-utilities"><ThemeToggle/><form action={signOut}><button className="os-signout" type="submit" aria-label="Abmelden" title="Abmelden"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M10 4H5v16h5M9 12h12m-4-4 4 4-4 4"/></svg><span>Abmelden</span></button></form></div>
      </div>
    </aside>
  </>;
}