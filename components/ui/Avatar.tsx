"use client";

import { useState } from "react";

export function Avatar({
  src = "/profile.jpg",
  alt = "Profilbild",
  fallback,
  size = 36,
  rounded = "50%",
}: {
  src?: string;
  alt?: string;
  fallback: React.ReactNode;
  size?: number;
  rounded?: number | string;
}) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return <>{fallback}</>;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      onError={() => setFailed(true)}
      style={{ width: size, height: size, borderRadius: rounded, objectFit: "cover", display: "block" }}
    />
  );
}
