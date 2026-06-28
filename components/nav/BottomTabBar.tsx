"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/lib/modules";
import { MODULE_ICONS } from "./icons";

export function BottomTabBar() {
  const pathname = usePathname();

  return (
    <nav className="bottom-bar">
      {NAV_ITEMS.map((mod) => {
        const active = pathname.startsWith(mod.href);
        return (
          <Link
            key={mod.key}
            href={mod.href}
            className={`bb-item ${active ? "active" : ""}`}
            style={{ "--tab-color": `var(${mod.colorVar})` } as React.CSSProperties}
          >
            {MODULE_ICONS[mod.key]}
            <span>{mod.short}</span>
          </Link>
        );
      })}
    </nav>
  );
}
