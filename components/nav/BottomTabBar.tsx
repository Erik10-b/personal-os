"use client";

import Link from "./NavigationLink";
import { usePathname } from "next/navigation";
import { useMobileSheet } from "./useMobileSheet";
import { MODULE_ICONS } from "./icons";
import { NAV_GROUPS, activeNavHref } from "./SideNav";
import { ThemeToggle } from "./ThemeToggle";
import { signOut } from "@/lib/actions/auth";

// Die vier Bereiche, die unten immer sichtbar sind; alles andere liegt unter „Mehr“.
const PRIMARY_KEYS = ["heute", "termine", "todos", "training"];
const primary = PRIMARY_KEYS.map(key => NAV_GROUPS.flatMap(group => group.items).find(item => item.key === key)!);

export function BottomTabBar() {
  const pathname = usePathname();
  const activeHref = activeNavHref(pathname);
  const { sheetRef, isOpen, openSheet, closeSheet, dialogProps, dragProps } = useMobileSheet();
  const moreActive = !primary.some(item => item.href === activeHref);



  return (
    <>
      <nav className="bottom-bar" aria-label="Hauptnavigation">
        {primary.map(item => {
          const active = item.href === activeHref;
          return (
            <Link key={item.key} href={item.href} className={`bb-item${active ? " active" : ""}`} aria-current={active ? "page" : undefined}>
              {MODULE_ICONS[item.key]}
              <span>{item.label}</span>
            </Link>
          );
        })}
        <button type="button" className={`bb-item${moreActive ? " active" : ""}`} onClick={openSheet} aria-haspopup="dialog" aria-controls="mobile-navigation" aria-expanded={isOpen}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h10"/></svg>
          <span>Mehr</span>
        </button>
      </nav>

      <dialog ref={sheetRef} id="mobile-navigation" className="os-more-sheet" aria-labelledby="mobile-navigation-title" {...dialogProps}>
        <div className="os-more-drag-area" aria-hidden="true" {...dragProps}><div className="os-more-handle"/></div><div className="os-more-header"><h2 id="mobile-navigation-title">Alle Bereiche</h2><button type="button" className="os-more-close" onClick={closeSheet}>Schließen</button></div>
        {NAV_GROUPS.map(group => (
          <nav key={group.label} aria-label={group.label}>
            <div className="os-nav-label">{group.label}</div>
            <div className="os-more-grid">
              {group.items.map(item => (
                <Link key={item.key} href={item.href} onClick={closeSheet} className={`os-more-link${activeHref === item.href ? " selected" : ""}`} aria-current={activeHref === item.href ? "page" : undefined}>
                  <span className="os-nav-icon" aria-hidden="true">{MODULE_ICONS[item.key]}</span>{item.label}
                </Link>
              ))}
            </div>
          </nav>
        ))}
        <div className="os-more-utilities">
          <ThemeToggle/>
          <form action={signOut}><button className="os-signout" type="submit"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M10 4H5v16h5M9 12h12m-4-4 4 4-4 4"/></svg><span>Abmelden</span></button></form>
        </div>
      </dialog>
    </>
  );
}
