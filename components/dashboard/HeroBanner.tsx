"use client";

import { useEffect, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";

export function HeroBanner({
  greeting,
  name,
  dateLabel,
  summary,
}: {
  greeting: string;
  name: string;
  dateLabel: string;
  summary?: string;
}) {
  const [hasImage, setHasImage] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.onload = () => setHasImage(true);
    img.src = "/hero.jpg";
  }, []);

  return (
    <div
      className={`hero-banner ${hasImage ? "has-image" : ""}`}
      style={hasImage ? ({ "--hero-img": "url(/hero.jpg)" } as React.CSSProperties) : undefined}
    >
      <div className="hero-avatar">
        <Avatar size={72} fallback={<span>{name.slice(0, 1).toUpperCase()}</span>} />
      </div>
      <div>
        <div className="hero-greeting">
          {greeting}
          {name ? `, ${name}` : ""}
        </div>
        <div className="hero-date">{dateLabel}</div>
        {summary && <div className="hero-date" style={{ marginTop: 2 }}>{summary}</div>}
      </div>
    </div>
  );
}
