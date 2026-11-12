export type LayoutPrefs = {
  width: "comfortable" | "wide" | "full";
  fontSize: "sm" | "md" | "lg";
  density: "airy" | "cozy";
  docsLayout: "strip" | "grid";
  sidebar: "open" | "closed";
};

export const DEFAULT_PREFS: LayoutPrefs = {
  width: "comfortable",
  fontSize: "md",
  density: "airy",
  docsLayout: "strip",
  sidebar: "open",
};

const KEY = "mj:layout";

function safe(): Storage | null {
  try {
    if (typeof window === "undefined") return null;
    return window.localStorage;
  } catch {
    return null;
  }
}

export function loadPrefs(): LayoutPrefs {
  const store = safe();
  if (!store) return DEFAULT_PREFS;
  try {
    const raw = store.getItem(KEY);
    if (!raw) return DEFAULT_PREFS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_PREFS, ...parsed };
  } catch {
    return DEFAULT_PREFS;
  }
}

export function savePrefs(prefs: LayoutPrefs) {
  safe()?.setItem(KEY, JSON.stringify(prefs));
}

export function applyPrefs(prefs: LayoutPrefs) {
  const el = document.documentElement;
  el.dataset.width = prefs.width;
  el.dataset.fontsize = prefs.fontSize;
  el.dataset.density = prefs.density;
  el.dataset.sidebar = prefs.sidebar;
}
