"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/Toaster";
import ConfirmDialog from "@/components/ConfirmDialog";
import JournalContextMenu, { type JournalMenuPos } from "@/components/JournalContextMenu";
import { useDeleteJournal } from "@/components/useDeleteJournal";
import { addJournal, getJournals, getPinned, togglePin } from "@/lib/storage";
import { timeAgo, initials } from "@/lib/format";
import type { FeedItem, JournalRef } from "@/lib/types";

const ACCENT_HEX: Record<string, string> = {
  amber: "#d97706",
  sage: "#65a30d",
  clay: "#cd5240",
  ocean: "#0284c7",
  plum: "#9333ea",
};

type Totals = { journals: number; docs: number; words: number; activeThisWeek: number };

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return "Still up";
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export default function Dashboard() {
  const router = useRouter();
  const toast = useToast();
  const [journals, setJournals] = useState<JournalRef[]>([]);
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [totals, setTotals] = useState<Totals>({ journals: 0, docs: 0, words: 0, activeThisWeek: 0 });
  const [loading, setLoading] = useState(true);
  const [joinInput, setJoinInput] = useState("");
  const [pinned, setPinned] = useState<string[]>([]);
  const [menu, setMenu] = useState<JournalMenuPos | null>(null);
  const [confirm, setConfirm] = useState<{ shareId: string; title: string } | null>(null);
  const deleteJournal = useDeleteJournal();

  useEffect(() => {
    setJournals(getJournals());
    setPinned(getPinned());
  }, []);

  useEffect(() => {
    const ids = journals.map((j) => j.shareId);
    if (journals.length === 0) {
      setLoading(false);
      setFeed([]);
      setTotals({ journals: 0, docs: 0, words: 0, activeThisWeek: 0 });
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetch(`/api/feed?ids=${ids.join(",")}`)
      .then((r) => r.json())
      .then((data: { items: FeedItem[]; totals: Totals }) => {
        if (cancelled) return;
        setFeed(data.items ?? []);
        setTotals(data.totals ?? { journals: 0, docs: 0, words: 0, activeThisWeek: 0 });
      })
      .catch(() => toast("Could not load activity", true))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [journals, toast]);

  async function create() {
    const res = await fetch("/api/journals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Untitled journal" }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast(data.error || "Could not create", true);
      return;
    }
    addJournal({ shareId: data.shareId, title: data.title, color: data.color });
    router.push(`/journal/${data.shareId}`);
  }

  function join() {
    const raw = joinInput.trim();
    if (!raw) return;
    const match = raw.match(/\/journal\/([A-Za-z0-9_-]+)/);
    const shareId = match ? match[1] : raw.replace(/[^A-Za-z0-9_-]/g, "");
    if (shareId) router.push(`/journal/${shareId}`);
  }

  return (
    <div className="page wide">
      <div className="page-head">
        <h1>{greeting()}.</h1>
        <p>Your shared journals, all in one place. Everything syncs from one link.</p>
      </div>

      <div className="stat-row" style={{ marginBottom: 34 }}>
        <div className="stat">
          <div className="v">{totals.journals}</div>
          <div className="k">journals</div>
        </div>
        <div className="stat">
          <div className="v">{totals.docs}</div>
          <div className="k">documents</div>
        </div>
        <div className="stat">
          <div className="v">{totals.activeThisWeek}</div>
          <div className="k">edited this week</div>
        </div>
        <div className="stat">
          <div className="v">{totals.words.toLocaleString()}</div>
          <div className="k">words</div>
        </div>
      </div>

      <section className="section">
        <div className="section-head">
          <h2>Your journals</h2>
          <span className="sub">{journals.length} total</span>
        </div>
        <div className="jlist">
          {journals.map((j) => (
            <a key={j.shareId} className="jrow" href={`/journal/${j.shareId}`} onClick={(e) => { e.preventDefault(); router.push(`/journal/${j.shareId}`); }} onContextMenu={(e) => { e.preventDefault(); setMenu({ x: e.clientX, y: e.clientY, journal: j }); }}>
              <span className="ico" style={{ background: ACCENT_HEX[j.color] ?? "var(--accent)" }}>
                {j.title.slice(0, 1).toUpperCase()}
              </span>
              <span className="t">{j.title}</span>
              <span className="id">{j.shareId}</span>
              <span className="row" style={{ marginLeft: "auto", gap: 4 }}>
                <button
                  className={`icon${pinned.includes(j.shareId) ? " on" : ""}`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setPinned(togglePin(j.shareId));
                  }}
                  title={pinned.includes(j.shareId) ? "Unpin" : "Pin to sidebar"}
                >
                  {pinned.includes(j.shareId) ? "★" : "☆"}
                </button>
              </span>
            </a>
          ))}
          <button className="jrow new" onClick={create} style={{ background: "transparent" }}>
            <span className="ico" style={{ background: "var(--surface-2)", color: "var(--text-faint)" }}>＋</span>
            New journal
          </button>
        </div>

        {menu && (
          <JournalContextMenu
            pos={menu}
            isPinned={pinned.includes(menu.journal.shareId)}
            onOpen={() => router.push(`/journal/${menu.journal.shareId}`)}
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
              setJournals(getJournals());
            }}
          />
        )}
      </section>

      <section className="section">
        <div className="section-head">
          <h2>Join a journal</h2>
          <span className="sub">from an invite link</span>
        </div>
        <div className="row" style={{ gap: 10 }}>
          <input
            placeholder="Paste an invite link or journal ID"
            value={joinInput}
            onChange={(e) => setJoinInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && join()}
          />
          <button className="ghost" onClick={join} disabled={!joinInput.trim()}>
            Open
          </button>
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2>Recent activity</h2>
          <span className="sub">newest first</span>
        </div>
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div className="skeleton" style={{ height: 30 }} />
            <div className="skeleton" style={{ height: 30 }} />
            <div className="skeleton" style={{ height: 30 }} />
          </div>
        ) : feed.length === 0 ? (
          <div className="muted">
            Nothing yet. Create a journal or open an invite link to see activity here.
          </div>
        ) : (
          <div>
            {feed.map((item) => (
              <a
                key={`${item.journal.shareId}-${item.doc.id}`}
                className="feed-item"
                href={`/journal/${item.journal.shareId}#doc-${item.doc.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  router.push(`/journal/${item.journal.shareId}#doc-${item.doc.id}`);
                }}
              >
                <span className="avatar">{initials(item.doc.updatedBy || item.doc.createdBy || "?")}</span>
                <div className="body">
                  <div className="meta">
                    <b>{item.doc.updatedBy || item.doc.createdBy || "someone"}</b>
                    <span>edited</span>
                    <span>{item.doc.title || "Untitled"}</span>
                    <span>{timeAgo(item.doc.updatedAt)}</span>
                    {item.doc.mood && <span>{item.doc.mood}</span>}
                  </div>
                  <div className="snippet">{item.doc.content.replace(/[#*>`|\-]/g, "").slice(0, 140) || "empty document"}</div>
                  <div className="where">{item.journal.title}</div>
                </div>
              </a>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
