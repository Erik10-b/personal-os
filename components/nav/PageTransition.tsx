"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";

export function PageTransition({ children }: { children: ReactNode }) {
  const [intro, setIntro] = useState(true);
  useEffect(() => {
    const stopIntro = () => setIntro(false);
    document.addEventListener("pointerdown", stopIntro, { once: true, capture: true });
    document.addEventListener("keydown", stopIntro, { once: true, capture: true });
    const timer = setTimeout(stopIntro, 1300);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("pointerdown", stopIntro, true);
      document.removeEventListener("keydown", stopIntro, true);
    };
  }, []);
  return <div className="page-enter" data-intro={intro}>{children}</div>;
}