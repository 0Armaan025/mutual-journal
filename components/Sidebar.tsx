"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme, ACCENTS } from "./ThemeProvider";
import { useToast } from "./Toaster";
import { addJournal, getJournals, getPinned, togglePin, type Accent } from "@/lib/storage";
import ConfirmDialog from "./ConfirmDialog";
import JournalContextMenu, { type JournalMenuPos } from "./JournalContextMenu";
import { useDeleteJournal } from "./useDeleteJournal";

const ACCENT_HEX: Record<Accent, string> = {
  amber: "#e8913a",
  sage: "#79b533",
  clay: "#e06a5c",
  ocean: "#3b95d6",
  plum: "#a76fd6",
};

export default function Sidebar({
  open,
  activeShareId,
  onNavigate,
}: {
  open: boolean;
  activeShareId?: string;
  onNavigate?: () => void;
}) {
  const router = useRouter();
  const { theme, toggleTheme, accent, setAccent } = useTheme();
  const toast = useToast();

  const [journals, setJournals] = useState<{ shareId: string; title: string; color: string }[]>([]);
  const [pinned, setPinned] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [menu, setMenu] = useState<JournalMenuPos | null>(null);
  const [confirm, setConfirm] = useState<{ shareId: string; title: string } | null>(null);
  const deleteJournal = useDeleteJournal();

  useEffect(() => {
    setJournals(getJournals());
    setPinned(getPinned());
  }, [open]);

  function refresh() {
    setJournals(getJournals());
    setPinned(getPinned());
  }

  function go(path: string) {
    onNavigate?.();
    router.push(path);
  }

  async function quickCreate() {
    const title = query.trim() || "Untitled";
    const res = await fetch("/api/journals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast(data.error || "Could not create journal", true);
      return;
    }
    addJournal({ shareId: data.shareId, title: data.title, color: data.color });
    setQuery("");
    refresh();
    onNavigate?.();
    router.push(`/journal/${data.shareId}`);
  }

  const q = query.trim().toLowerCase();
  const visible = journals.filter((j) => !q || j.title.toLowerCase().includes(q));
  const pinnedList = visible.filter((j) => pinned.includes(j.shareId));
  const rest = visible.filter((j) => !pinned.includes(j.shareId));

  return (
    <aside className={`sidebar${open ? " open" : ""}`}>
      <a href="/" className="side-user" onClick={(e) => { e.preventDefault(); go("/"); }}>
        <span className="mark">M</span>
        Mutual <span className="amp">Journal</span>
      </a>

      <div className="side-search">
        <span className="ico">⌕</span>
        <input
          placeholder="Search everything…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              if (query.trim()) go(`/search?q=${encodeURIComponent(query.trim())}`);
              else quickCreate();
            }
          }}
        />
      </div>

      <button className="side-action" onClick={quickCreate}>
        <span className="plus">＋</span>
        New journal
      </button>

      <div className="side-label">Journals</div>
      {journals.length === 0 && (
        <div className="side-empty">No journals yet — create one, or open an invite link.</div>
      )}

        {pinnedList.length > 0 && <div className="side-label" style={{ paddingTop: 8 }}>Pinned</div>}
        {pinnedList.map((j) => (
          <JournalNavItem
            key={j.shareId}
            j={j}
            active={j.shareId === activeShareId}
            isPinned
            onPin={() => setPinned(togglePin(j.shareId))}
            onOpen={() => go(`/journal/${j.shareId}`)}
            onContextMenu={(e) => {
              e.preventDefault();
              setMenu({ x: e.clientX, y: e.clientY, journal: j });
            }}
          />
        ))}

        {rest.map((j) => (
          <JournalNavItem
            key={j.shareId}
            j={j}
            active={j.shareId === activeShareId}
            isPinned={false}
            onPin={() => setPinned(togglePin(j.shareId))}
            onOpen={() => go(`/journal/${j.shareId}`)}
            onContextMenu={(e) => {
              e.preventDefault();
              setMenu({ x: e.clientX, y: e.clientY, journal: j });
            }}
          />
        ))}

      <div className="side-foot">
        <div className="row">
          <span className="lbl">Theme</span>
          <button className="theme-toggle" onClick={toggleTheme} title="Toggle theme">
            {theme === "dark" ? "☾ dark" : "☀ light"}
          </button>
        </div>
        <div className="row">
          <span className="lbl">Accent</span>
          <div className="accents">
            {ACCENTS.map((a) => (
              <button
                key={a}
                className={`accent-dot${a === accent ? " sel" : ""}`}
                style={{ background: ACCENT_HEX[a] }}
                onClick={() => setAccent(a)}
                title={a}
                aria-label={`${a} accent`}
              />
            ))}
          </div>
        </div>
      </div>

      {menu && (
        <JournalContextMenu
          pos={menu}
          isPinned={pinned.includes(menu.journal.shareId)}
          onOpen={() => go(`/journal/${menu.journal.shareId}`)}
          onTogglePin={() => setPinned(togglePin(menu.journal.shareId))}
          onDelete={() => setConfirm({ shareId: menu.journal.shareId, title: menu.journal.title })}
          onClose={() => setMenu(null)}
        />
      )}

      {confirm && (
        <ConfirmDialog
          title={`Delete "${confirm.title}"?`}
          message="This erases every document, comment, and prompt in this journal for everyone with the link. This cannot be undone."
          confirmLabel="Delete forever"
          onCancel={() => setConfirm(null)}
          onConfirm={async () => {
            const target = confirm;
            setConfirm(null);
            await deleteJournal(target.shareId, target.title);
            refresh();
          }}
        />
      )}
    </aside>
  );
}

function JournalNavItem({
  j,
  active,
  isPinned,
  onPin,
  onOpen,
  onContextMenu,
}: {
  j: { shareId: string; title: string; color: string };
  active: boolean;
  isPinned: boolean;
  onPin: () => void;
  onOpen: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
}) {
  return (
    <div className="side-item-row" onContextMenu={onContextMenu}>
      <a
        href={`/journal/${j.shareId}`}
        className={`side-item${active ? " active" : ""}`}
        onClick={(e) => {
          e.preventDefault();
          onOpen();
        }}
        title={j.title}
      >
        <span className="dot" style={{ background: ACCENT_HEX[(j.color as Accent) in ACCENT_HEX ? (j.color as Accent) : "amber"] }} />
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{j.title}</span>
      </a>
      <button
        className={`icon pin${isPinned ? " on" : ""}`}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onPin();
        }}
        title={isPinned ? "Unpin" : "Pin"}
        aria-label={isPinned ? "Unpin journal" : "Pin journal"}
      >
        {isPinned ? "★" : "☆"}
      </button>
    </div>
  );
}
