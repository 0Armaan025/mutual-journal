"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { addJournal, getUsername, setUsername } from "@/lib/storage";
import { initials, timeAgo } from "@/lib/format";
import { useToast } from "@/components/Toaster";
import UsernameGate from "./UsernameGate";
import DocumentsTab from "./DocumentsTab";
import PromptsTab from "./PromptsTab";
import StatsTab from "./StatsTab";
import SettingsTab from "./SettingsTab";
import type { JournalData } from "@/lib/types";

const TABS = [
  { key: "docs", label: "Documents" },
  { key: "prompts", label: "Prompts" },
  { key: "stats", label: "Stats" },
  { key: "settings", label: "Settings" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

const ACCENT_HEX: Record<string, string> = {
  amber: "#e8913a",
  sage: "#79b533",
  clay: "#e06a5c",
  ocean: "#3b95d6",
  plum: "#a76fd6",
};

export default function JournalClient({ journal }: { journal: JournalData }) {
  const router = useRouter();
  const toast = useToast();
  const [tab, setTab] = useState<TabKey>("docs");
  const [username, setUsernameState] = useState<string | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
  const [syncedAt, setSyncedAt] = useState<string>("");

  useEffect(() => {
    setUsernameState(getUsername(journal.shareId) || null);
    setSyncedAt(new Date().toISOString());
    const m = window.location.hash.match(/^#doc-(.+)$/);
    if (m) setSelectedDoc(m[1]);
  }, [journal.shareId]);

  useEffect(() => {
    addJournal({ shareId: journal.shareId, title: journal.title, color: journal.color });
  }, [journal.shareId, journal.title, journal.color]);

  // heartbeat presence: everyone with the link sees who's currently here
  useEffect(() => {
    if (!username) return;
    const beat = () => {
      fetch(`/api/journals/${journal.shareId}/presence`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: username }),
      }).catch(() => {});
    };
    beat();
    const interval = setInterval(beat, 15_000);
    return () => clearInterval(interval);
  }, [username, journal.shareId]);

  // toast when someone else's edit arrives via sync
  const known = useRef<Map<string, { by: string; at: string }>>(new Map());
  useEffect(() => {
    for (const d of journal.docs) {
      const prev = known.current.get(d.id);
      if (!prev) {
        known.current.set(d.id, { by: d.updatedBy, at: d.updatedAt });
        continue;
      }
      if (prev.by !== d.updatedBy || prev.at !== d.updatedAt) {
        known.current.set(d.id, { by: d.updatedBy, at: d.updatedAt });
        if (d.updatedBy && d.updatedBy !== username) {
          toast(`${d.updatedBy} edited · ${d.title || "Untitled"}`);
        }
      }
    }
  }, [journal.docs, username, toast]);

  // live sync: poll the server so collaborators' edits appear automatically
  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh();
      setSyncedAt(new Date().toISOString());
    }, 6000);
    return () => clearInterval(interval);
  }, [router]);

  function pickUsername(name: string) {
    setUsername(journal.shareId, name);
    setUsernameState(name);
    toast(`You're ${name} in this vault`);
  }

  if (!username) {
    return <UsernameGate journal={journal} onDone={pickUsername} />;
  }

  const writers = new Set<string>();
  for (const d of journal.docs) {
    if (d.createdBy) writers.add(d.createdBy);
    if (d.updatedBy) writers.add(d.updatedBy);
  }
  const here = journal.presence.filter((p) => Date.now() - new Date(p.at).getTime() < 60_000);
  const answeredCount = journal.prompts.filter((p) => p.answers.some((a) => a.author === username)).length;

  return (
    <div className="page">
      <header className="jhead">
        <div className="cover">
          <span
            className="ico"
            style={{ background: ACCENT_HEX[journal.color as keyof typeof ACCENT_HEX] ?? "var(--accent)" }}
          >
            {initials(journal.title)}
          </span>
          <h1>{journal.title}</h1>
        </div>
        <div className="meta">
          <span>{journal.docs.length} {journal.docs.length === 1 ? "document" : "documents"}</span>
          <span>·</span>
          <span>{writers.size} {writers.size === 1 ? "writer" : "writers"}</span>
          <span>·</span>
          <span>started {timeAgo(journal.createdAt)}</span>
          <span className="live" title="Edits from everyone with the link appear automatically">
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--success)", display: "inline-block" }} />
            live{syncedAt ? ` · synced ${timeAgo(syncedAt)}` : ""}
          </span>
          {journal.migrated && <span className="chip-migrated" title="Earlier journal entries were folded into documents">entries migrated</span>}
        </div>
        {here.length > 0 && (
          <div className="presence" title="People with this journal open right now">
            {here.map((p) => (
              <span key={p.name} className={`presence-chip${p.name === username ? " me" : ""}`}>
                <span className="avatar">{initials(p.name)}</span>
                {p.name === username ? "you" : p.name}
              </span>
            ))}
          </div>
        )}
        <div className="props">
          <span className="id">#{journal.shareId}</span>
          <button
            className="ghost small"
            onClick={async () => {
              const url = `${window.location.origin}/journal/${journal.shareId}`;
              try {
                await navigator.clipboard.writeText(url);
                toast("Invite link copied");
              } catch {
                toast(url, false);
              }
            }}
          >
            Copy invite link
          </button>
        </div>
      </header>

      <nav className="tabs">
        {TABS.map((t) => (
          <button key={t.key} className={`tab${tab === t.key ? " on" : ""}`} onClick={() => setTab(t.key)}>
            {t.label}
            {t.key === "docs" && <span className="count">{journal.docs.length}</span>}
            {t.key === "prompts" && <span className="count">{journal.prompts.length}</span>}
          </button>
        ))}
        {tab === "prompts" && journal.prompts.length > 0 && (
          <span className="muted" style={{ marginLeft: "auto", alignSelf: "center", fontSize: 12.5 }}>
            {answeredCount} answered by you
          </span>
        )}
      </nav>

      {tab === "docs" && <DocumentsTab journal={journal} username={username} selectedId={selectedDoc} onSelect={setSelectedDoc} />}
      {tab === "prompts" && <PromptsTab journal={journal} username={username} />}
      {tab === "stats" && <StatsTab journal={journal} />}
      {tab === "settings" && <SettingsTab journal={journal} username={username} />}
    </div>
  );
}
