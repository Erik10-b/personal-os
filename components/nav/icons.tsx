const common = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export const MODULE_ICONS: Record<string, React.ReactElement> = {
  heute: (
    <svg {...common}>
      <path d="M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0Z" />
      <path d="M12 7v5l3 2" />
    </svg>
  ),
  finanzielles: (
    <svg {...common}>
      <path d="M18 5a7 7 0 0 0-4-1c-4 0-7 3-7 8s3 8 7 8a7 7 0 0 0 4-1M4 10h11M4 14h10" />
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
  training: (
    <svg {...common}>
      <path d="M6.5 7v10M17.5 7v10" />
      <path d="M4 9.5h2.5v5H4zM17.5 9.5H20v5h-2.5z" />
      <path d="M6.5 12h11" />
    </svg>
  ),
  todos: (
    <svg {...common}>
      <rect x="4" y="3" width="16" height="18" rx="3" />
      <path d="m8 9 1.5 1.5L12 8M14 9h3M8 16h9" />
    </svg>
  ),
  goals: (
    <svg {...common}>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4" />
      <path d="m12 12 8-8M16 4h4v4" />
    </svg>
  ),
  nutrition: (
    <svg {...common}>
      <path d="M12 7c-2-3-7-2-7 3 0 5 3 10 5 10 1 0 1-1 2-1s1 1 2 1c2 0 5-5 5-10 0-5-5-6-7-3Z" />
      <path d="M12 7c0-3 1-5 4-5 0 3-1 4-4 5Z" />
    </svg>
  ),};
