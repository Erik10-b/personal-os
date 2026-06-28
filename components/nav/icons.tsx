const common = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export const MODULE_ICONS: Record<string, React.ReactElement> = {
  finanzielles: (
    <svg {...common}>
      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  ),
  erik: (
    <svg {...common}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21v-1a8 8 0 0 1 16 0v1" />
    </svg>
  ),
  termine: (
    <svg {...common}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  ),
  arbeit: (
    <svg {...common}>
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
    </svg>
  ),
  fussball: (
    <svg {...common}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7l3.5 2.5-1.3 4.1H9.8L8.5 9.5z" />
      <path d="M12 3v4M3.5 9l3 1.2M3.5 15l3-1.2M20.5 9l-3 1.2M20.5 15l-3-1.2M12 21v-4M8.5 17.5L9.8 13.6M15.5 17.5l-1.3-3.9" />
    </svg>
  ),
};
