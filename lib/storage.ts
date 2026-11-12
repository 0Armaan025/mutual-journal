export type JournalRef = { shareId: string; title: string; color: string };

const JOURNALS_KEY = "mj:journals";
const PINNED_KEY = "mj:pinned";
const THEME_KEY = "mj:theme";
const ACCENT_KEY = "mj:accent";

export type Theme = "light" | "dark";
export const ACCENTS = ["amber", "sage", "clay", "ocean", "plum"] as const;
export type Accent = (typeof ACCENTS)[number];

export function usernameKey(shareId: string) {
  return `mj:username:${shareId}`;
}

function safeLocalStorage(): Storage | null {
  try {
    if (typeof window === "undefined") return null;
    return window.localStorage;
  } catch {
    return null;
  }
}

function readArray(key: string): string[] {
  const store = safeLocalStorage();
  if (!store) return [];
  try {
    const raw = store.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function writeArray(key: string, values: string[]) {
  safeLocalStorage()?.setItem(key, JSON.stringify(values));
}

export function getJournals(): JournalRef[] {
  const store = safeLocalStorage();
  if (!store) return [];
  try {
    const raw = store.getItem(JOURNALS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed)
      ? parsed.filter((j) => j && typeof j.shareId === "string" && typeof j.title === "string")
      : [];
  } catch {
    return [];
  }
}

export function saveJournals(journals: JournalRef[]) {
  safeLocalStorage()?.setItem(JOURNALS_KEY, JSON.stringify(journals));
}

export function addJournal(ref: JournalRef) {
  const journals = getJournals();
  const existing = journals.find((j) => j.shareId === ref.shareId);
  if (existing) {
    existing.title = ref.title;
    existing.color = ref.color;
  } else {
    journals.unshift(ref);
  }
  saveJournals(journals);
}

export function removeJournal(shareId: string) {
  saveJournals(getJournals().filter((j) => j.shareId !== shareId));
}

export function getPinned(): string[] {
  return readArray(PINNED_KEY);
}

export function togglePin(shareId: string) {
  const pinned = getPinned();
  const next = pinned.includes(shareId) ? pinned.filter((x) => x !== shareId) : [...pinned, shareId];
  writeArray(PINNED_KEY, next);
  return next;
}

export function isPinned(shareId: string) {
  return getPinned().includes(shareId);
}

export function getTheme(): Theme {
  const store = safeLocalStorage();
  const saved = store?.getItem(THEME_KEY);
  if (saved === "light" || saved === "dark") return saved;
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

export function setTheme(theme: Theme) {
  safeLocalStorage()?.setItem(THEME_KEY, theme);
}

export function getAccent(): Accent {
  const saved = safeLocalStorage()?.getItem(ACCENT_KEY);
  return ACCENTS.includes(saved as Accent) ? (saved as Accent) : "amber";
}

export function setAccent(accent: Accent) {
  safeLocalStorage()?.setItem(ACCENT_KEY, accent);
}

export function getUsername(shareId: string): string {
  return safeLocalStorage()?.getItem(usernameKey(shareId)) ?? "";
}

export function setUsername(shareId: string, username: string) {
  safeLocalStorage()?.setItem(usernameKey(shareId), username);
}

export function getDraft(shareId: string): string {
  return safeLocalStorage()?.getItem(`mj:draft:${shareId}`) ?? "";
}

export function setDraft(shareId: string, content: string) {
  const key = `mj:draft:${shareId}`;
  const store = safeLocalStorage();
  if (!store) return;
  if (content.trim()) store.setItem(key, content);
  else store.removeItem(key);
}
