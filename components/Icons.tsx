/* one icon system: 24px grid, 1.75 stroke, round caps — currentColor */

type P = { d: string; fill?: boolean };

const PATHS: Record<string, P[]> = {
  star: [{ d: "M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.8-5.2 2.8 1-5.8L3.5 9.7l5.9-.9z" }],
  plus: [{ d: "M12 5v14M5 12h14" }],
  close: [{ d: "M6 6l12 12M18 6L6 18" }],
  search: [{ d: "M10.5 4a6.5 6.5 0 105.4 11.2L20 19.3" }, { d: "M10.5 4a6.5 6.5 0 100 13 6.5 6.5 0 000-13z" }],
  sun: [{ d: "M12 8.5a3.5 3.5 0 100 7 3.5 3.5 0 000-7z" }, { d: "M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6L17 7M7 17l-1.4 1.4" }],
  moon: [{ d: "M20 14.5A8.5 8.5 0 019.5 4 8.5 8.5 0 1020 14.5z" }],
  trash: [{ d: "M4 7h16M9.5 7V4.5h5V7M6.5 7l1 13.5h9l1-13.5" }, { d: "M10 11v6M14 11v6" }],
  pencil: [{ d: "M4 20l1-4L16.5 4.5a2.1 2.1 0 013 3L8 19z" }, { d: "M14.5 6.5l3 3" }],
  link: [{ d: "M9 15l6-6" }, { d: "M10.5 7.5l1.8-1.8a3.5 3.5 0 015 5L17 10.5" }, { d: "M13.5 16.5l-1.8 1.8a3.5 3.5 0 01-5-5L7 13.5" }],
  copy: [{ d: "M8.5 8.5h11v11h-11z" }, { d: "M15.5 8.5V5.5h-11v11h3" }],
  clock: [{ d: "M12 7.5V12l3 2" }, { d: "M12 4a8 8 0 100 16 8 8 0 000-16z" }],
  comment: [{ d: "M4.5 6.5h15v9h-9l-4 3.5v-3.5h-2z" }],
  reply: [{ d: "M9 10l-4 3 4 3" }, { d: "M5 13h8a5 5 0 005-5V6" }],
  check: [{ d: "M4.5 12.5l5 5 10-11" }],
  doc: [{ d: "M6 3.5h8l4.5 4.5v12.5H6z" }, { d: "M14 3.5V8h4.5" }, { d: "M9 12.5h6M9 16h6" }],
  users: [{ d: "M8.5 8a3 3 0 100 6 3 3 0 000-6z" }, { d: "M15.5 9.5a2.5 2.5 0 100 5 2.5 2.5 0 000-5z" }, { d: "M3.5 19c.6-3 2.5-4.5 5-4.5s4.4 1.5 5 4.5" }, { d: "M15 14.5c2.2 0 3.8 1.3 4.5 4.5" }],
  activity: [{ d: "M3.5 12.5h3.5l2.5-6 3.5 12 2.5-6h5" }],
  vault: [{ d: "M4.5 5.5h15v13h-15z" }, { d: "M8 5.5v13M12 9.5v5" }],
  arrow: [{ d: "M4.5 12h14M13 6.5l5.5 5.5L13 17.5" }],
  sparkles: [{ d: "M12 4l1.6 4.4L18 10l-4.4 1.6L12 16l-1.6-4.4L6 10l4.4-1.6z" }, { d: "M18.5 15.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z" }],
  filter: [{ d: "M4.5 6.5h15l-6 7v6l-3-1.5v-4.5z" }],
  sort: [{ d: "M7 5v14M7 19l-3-3M7 19l3-3" }, { d: "M13 6h7M13 11h5M13 16h3" }],

  // moods
  moodHappy: [{ d: "M12 4a8 8 0 100 16 8 8 0 000-16z" }, { d: "M9 10h.01M15 10h.01" }, { d: "M8.5 13.5a4 4 0 007 0" }],
  moodLoved: [{ d: "M12 20s-7-4.5-7-9.5A4 4 0 0112 8a4 4 0 017 2.5c0 5-7 9.5-7 9.5z" }],
  moodCalm: [{ d: "M12 4a8 8 0 100 16 8 8 0 000-16z" }, { d: "M9 10h.01M15 10h.01" }, { d: "M9 14.5h6" }],
  moodLow: [{ d: "M12 4a8 8 0 100 16 8 8 0 000-16z" }, { d: "M9 10h.01M15 10h.01" }, { d: "M8.5 15.5a4 4 0 017 0" }],
  moodTense: [{ d: "M12 4a8 8 0 100 16 8 8 0 000-16z" }, { d: "M9 10h.01M15 10h.01" }, { d: "M8.5 16a4.5 4.5 0 017 0" }, { d: "M7.5 7.5l3 1.5M16.5 7.5l-3 1.5" }],
  moodRainy: [{ d: "M7 15a4 4 0 01.4-8 5.5 5.5 0 0110.3 1.2A3.5 3.5 0 0117.5 15z" }, { d: "M8.5 18.5l-.8 2M12.5 18.5l-.8 2M16.5 18.5l-.8 2" }],
  moodInspired: [{ d: "M12 4l1.6 4.4L18 10l-4.4 1.6L12 16l-1.6-4.4L6 10l4.4-1.6z" }],
  moodTired: [{ d: "M20 14.5A8.5 8.5 0 019.5 4 8.5 8.5 0 1020 14.5z" }],
};

export type IconName = keyof typeof PATHS;

export default function Icon({ name, size = 16, className }: { name: IconName; size?: number; className?: string }) {
  const paths = PATHS[name];
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
      focusable="false"
    >
      {paths.map((p, i) => (
        <path key={i} d={p.d} />
      ))}
    </svg>
  );
}
