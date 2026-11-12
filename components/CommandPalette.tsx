"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getJournals } from "@/lib/storage";
import { loadPrefs, savePrefs, applyPrefs } from "@/lib/prefs";
import { useTheme } from "./ThemeProvider";

type Item = { label: string; hint?: string; run: () => void };

export default function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [query, setQuery] = useState("");
  const [sel, setSel] = useState(0);
  const [journals, setJournals] = useState<{ shareId: string; title: string }[]>([]);

  useEffect(() => {
    if (open) {
      setJournals(getJournals());
      setQuery("");
      setSel(0);
    }
  }, [open]);

  const items: Item[] = useMemo(() => {
    const q = query.trim();
    const go = (path: string) => () => {
      onClose();
      router.push(path);
    };
    const setLayout = (patch: Record<string, string>) => () => {
      const merged = { ...loadPrefs(), ...patch };
      savePrefs(merged);
      applyPrefs(merged);
      window.dispatchEvent(new Event("mj:layout-change"));
      onClose();
    };
    const list: Item[] = journals
      .filter((j) => !q || j.title.toLowerCase().includes(q.toLowerCase()))
      .map((j) => ({ label: j.title, hint: "journal", run: go(`/journal/${j.shareId}`) }));
    if (q) {
      list.unshift({ label: `Search “${q}”`, hint: "search", run: go(`/search?q=${encodeURIComponent(q)}`) });
    }
    list.unshift({ label: "Dashboard", hint: "home", run: go("/") });
    if (!q || "layout width sidebar content reading".includes(q.toLowerCase())) {
      list.unshift({ label: "Layout options…", hint: "panel", run: () => {
        const trigger = document.querySelector<HTMLButtonElement>('[aria-label="Layout options"]');
        trigger?.click();
        onClose();
      } });
      list.unshift({ label: "Toggle sidebar", hint: "⌘B", run: setLayout({ sidebar: loadPrefs().sidebar === "open" ? "closed" : "open" }) });
      list.unshift({ label: "Wide content", hint: "layout", run: setLayout({ width: "wide" }) });
      list.unshift({ label: "Comfortable content", hint: "layout", run: setLayout({ width: "comfortable" }) });
      list.unshift({ label: "Documents as cards", hint: "layout", run: setLayout({ docsLayout: "grid" }) });
      list.unshift({ label: "Documents as tabs", hint: "layout", run: setLayout({ docsLayout: "strip" }) });
    }
    if (!q || "new journal".includes(q.toLowerCase())) {
      list.unshift({ label: "New journal", hint: "create", run: go("/") });
    }
    if (!q || "theme light dark".includes(q.toLowerCase())) {
      list.unshift({ label: `Switch to ${theme === "dark" ? "light" : "dark"} theme`, hint: "theme", run: () => { toggleTheme(); onClose(); } });
    }
    return list.slice(0, 12);
  }, [query, journals, router, onClose, theme, toggleTheme]);

  if (!open) return null;

  return (
    <div
      className="palette-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div className="palette" onClick={(e) => e.stopPropagation()}>
        <input
          autoFocus
          placeholder="Jump to a journal, search, or run a command…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSel(0);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setSel((s) => Math.min(s + 1, items.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setSel((s) => Math.max(s - 1, 0));
            } else if (e.key === "Enter") {
              e.preventDefault();
              items[sel]?.run();
            } else if (e.key === "Escape") {
              onClose();
            }
          }}
        />
        <div className="palette-list">
          {items.length === 0 && <div className="palette-empty">No matches</div>}
          {items.map((item, i) => (
            <button
              key={item.label + i}
              className={`palette-item${i === sel ? " sel" : ""}`}
              onMouseEnter={() => setSel(i)}
              onClick={item.run}
            >
              {item.label}
              {item.hint && <span className="hint">{item.hint}</span>}
            </button>
          ))}
        </div>
        <div className="palette-foot">
          <span>
            <kbd>↑</kbd> <kbd>↓</kbd> navigate
          </span>
          <span>
            <kbd>↵</kbd> select
          </span>
          <span>
            <kbd>esc</kbd> close
          </span>
        </div>
      </div>
    </div>
  );
}
