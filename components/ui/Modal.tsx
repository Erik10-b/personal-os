"use client";

import { ReactNode, useEffect } from "react";

type IconTone = "club" | "danger" | "warning" | "info";

export function Modal({
  title,
  eyebrow,
  icon,
  tone = "club",
  onClose,
  children,
  footer,
}: {
  title: string;
  eyebrow?: string;
  icon?: ReactNode;
  tone?: IconTone;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            {eyebrow && <div className="modal-eyebrow">{eyebrow}</div>}
            <h3>{title}</h3>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {icon && <div className={`modal-icon-box ${tone === "club" ? "" : tone}`}>{icon}</div>}
            <button className="btn ghost icon-only" onClick={onClose} aria-label="Schließen">
              ✕
            </button>
          </div>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  );
}
