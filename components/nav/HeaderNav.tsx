"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/lib/modules";
import { signOut } from "@/lib/actions/auth";
import { ThemeToggle } from "./ThemeToggle";
import { Avatar } from "@/components/ui/Avatar";

export function HeaderNav({ userInitials }: { userInitials: string }) {
  const pathname = usePathname();

  return (
    <header className="app-header">
      <div className="header-inner">
        <Link href="/heute" className="brand">
          <div className="brand-mark">P</div>
          <div className="brand-block">
            <span className="brand-name">Personal OS</span>
            <span className="brand-meta">PRIVAT</span>
          </div>
        </Link>

        <div className="header-spacer" />

        <nav className="header-tabs">
          {NAV_ITEMS.map((mod) => {
            const active = pathname.startsWith(mod.href);
            return (
              <Link
                key={mod.key}
                href={mod.href}
                className={`header-tab ${active ? "active" : ""}`}
                style={{ "--tab-color": `var(${mod.colorVar})` } as React.CSSProperties}
              >
                {mod.label}
              </Link>
            );
          })}
        </nav>

        <div className="header-spacer" />

        <ThemeToggle />

        <form action={signOut}>
          <button className="user-pin" type="submit" title="Abmelden" style={{ overflow: "hidden", padding: 0 }}>
            <Avatar size={36} fallback={<span>{userInitials}</span>} />
          </button>
        </form>
      </div>
    </header>
  );
}
