"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MODULES } from "@/lib/modules";
import { MODULE_ICONS } from "./icons";

export function BottomTabBar() {
  const pathname = usePathname();

  return (
    <nav className="bottom-bar">
      {MODULES.map((mod) => {
        const active = pathname.startsWith(mod.href);
        return (
          <Link
            key={mod.key}
            href={mod.href}
            className={`bb-item ${active ? "active" : ""}`}
            style={{ "--tab-color": `var(${mod.colorVar})` } as React.CSSProperties}
          >
            {MODULE_ICONS[mod.key]}
            <span>{mod.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
