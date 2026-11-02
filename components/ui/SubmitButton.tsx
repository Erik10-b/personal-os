"use client";

import { useFormStatus } from "react-dom";
import type { ButtonHTMLAttributes } from "react";

export function SubmitButton({ children, disabled, pendingLabel = "Wird gespeichert …", className = "btn primary", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { pendingLabel?: string }) {
  const { pending } = useFormStatus();
  return <button {...props} type="submit" className={`${className} submit-feedback`} disabled={disabled || pending} aria-busy={pending} aria-label={pending ? pendingLabel : props["aria-label"]}>
    {children}<span className={`submit-spinner${pending ? " spinning" : ""}`} aria-hidden="true"/>
    <span className="visually-hidden" role="status">{pending ? pendingLabel : ""}</span>
  </button>;
}