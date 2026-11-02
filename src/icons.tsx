type IconName =
  | "activity"
  | "arrow-left"
  | "arrow-right"
  | "bolt"
  | "bus"
  | "calendar"
  | "clock"
  | "gauge"
  | "leaf"
  | "map"
  | "pin"
  | "plug"
  | "search"
  | "truck";

export function Icon(props: { name: IconName; size?: number }) {
  const common = {
    width: props.size ?? 16,
    height: props.size ?? 16,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
    focusable: false as const,
  };
  switch (props.name) {
    case "bolt":
      return (
        <svg {...common} fill="currentColor" stroke="none">
          <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z" />
        </svg>
      );
    case "arrow-right":
      return (
        <svg {...common}>
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      );
    case "arrow-left":
      return (
        <svg {...common}>
          <path d="M19 12H5M11 6l-6 6 6 6" />
        </svg>
      );
    case "search":
      return (
        <svg {...common}>
          <circle cx="11" cy="11" r="6" />
          <path d="m20 20-3.5-3.5" />
        </svg>
      );
    case "bus":
      return (
        <svg {...common}>
          <rect x="5" y="4" width="14" height="12" rx="2" />
          <path d="M5 10h14M7 19v1M17 19v1" />
          <circle cx="8" cy="16.5" r="1.2" fill="currentColor" stroke="none" />
          <circle cx="16" cy="16.5" r="1.2" fill="currentColor" stroke="none" />
        </svg>
      );
    case "clock":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8" />
          <path d="M12 8v5l3 2" />
        </svg>
      );
    case "pin":
      return (
        <svg {...common}>
          <path d="M12 21s6-5.2 6-10a6 6 0 1 0-12 0c0 4.8 6 10 6 10z" />
          <circle cx="12" cy="11" r="1.6" />
        </svg>
      );
    case "gauge":
      return (
        <svg {...common}>
          <path d="M5 16a7 7 0 1 1 14 0" />
          <path d="m12 13 3-4" />
        </svg>
      );
    case "leaf":
      return (
        <svg {...common}>
          <path d="M5 19C8 8 14 5 20 4c0 8-3 14-15 15z" />
          <path d="M9 15c2-2 4-3 7-4" />
        </svg>
      );
    case "map":
      return (
        <svg {...common}>
          <path d="m4 6 5-2 6 2 5-2v14l-5 2-6-2-5 2V6z" />
          <path d="M9 4v14M15 6v14" />
        </svg>
      );
    case "activity":
      return (
        <svg {...common}>
          <path d="M3 12h4l2-5 4 10 2-5h6" />
        </svg>
      );
    case "calendar":
      return (
        <svg {...common}>
          <rect x="4" y="5" width="16" height="15" rx="2" />
          <path d="M8 3v4M16 3v4M4 10h16" />
        </svg>
      );
    case "plug":
      return (
        <svg {...common}>
          <path d="M8 8V3M16 8V3M7 8h10v3a5 5 0 0 1-10 0V8zM12 16v5" />
        </svg>
      );
    case "truck":
      return (
        <svg {...common}>
          <path d="M3 7h11v8H3zM14 10h4l3 3v2h-7z" />
          <circle cx="7" cy="17.5" r="1.4" />
          <circle cx="17" cy="17.5" r="1.4" />
        </svg>
      );
  }
}
