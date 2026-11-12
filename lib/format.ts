export const MOODS = ["😊", "🥰", "😐", "😢", "😤", "🌧", "✨", "😴"] as const;

export const QUICK_REACTIONS = ["❤️", "😂", "🤯", "✨", "🙌"];

export function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  const seconds = Math.max(1, Math.round((Date.now() - then) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function fullTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function dayKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function wordCount(text: string): number {
  const m = text.trim().match(/\S+/g);
  return m ? m.length : 0;
}

export function initials(name: string): string {
  return (name.trim().slice(0, 1) || "?").toUpperCase();
}

// Obsidian-style [[wikilinks]]
export function findWikilinks(content: string): string[] {
  const links: string[] = [];
  const rx = /\[\[([^\]|]+)(?:\|[^\]]*)?\]\]/g;
  let m: RegExpExecArray | null;
  while ((m = rx.exec(content))) links.push(m[1].trim());
  return links;
}

// Obsidian-style #hashtags (word-boundary, not pure numbers)
export function extractTags(content: string): string[] {
  const tags: string[] = [];
  const rx = /(?:^|\s)#([A-Za-z][A-Za-z0-9_-]*)/g;
  let m: RegExpExecArray | null;
  while ((m = rx.exec(content))) {
    const t = m[1].toLowerCase();
    if (!tags.includes(t)) tags.push(t);
  }
  return tags;
}
