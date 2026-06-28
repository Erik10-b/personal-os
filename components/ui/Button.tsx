import { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  block?: boolean;
}

export function Button({
  variant = "secondary",
  size = "md",
  block = false,
  className = "",
  ...props
}: ButtonProps) {
  const sizeClass = size === "sm" ? "sm" : size === "lg" ? "lg" : "";
  const classes = ["btn", variant, sizeClass, block ? "block" : "", className]
    .filter(Boolean)
    .join(" ");
  return <button className={classes} {...props} />;
}
