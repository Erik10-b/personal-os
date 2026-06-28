import { ReactNode } from "react";

type BadgeColor =
  | "club"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "purple"
  | "teal"
  | "neutral";

export function Badge({
  color = "neutral",
  children,
}: {
  color?: BadgeColor;
  children: ReactNode;
}) {
  return (
    <span className={`badge ${color}`}>
      <span className="bdot" style={{ background: "currentColor" }} />
      {children}
    </span>
  );
}
