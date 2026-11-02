"use client";

import Link, { useLinkStatus } from "next/link";
import type { ComponentProps } from "react";

function PendingFeedback() {
  const { pending } = useLinkStatus();
  return <span className="nav-feedback" data-pending={pending} role="status"><span className="visually-hidden">{pending ? "Bereich wird geladen" : ""}</span></span>;
}

export default function NavigationLink({ children, className = "", ...props }: ComponentProps<typeof Link>) {
  return <Link {...props} className={`${className} navigation-link`}>{children}<PendingFeedback/></Link>;
}