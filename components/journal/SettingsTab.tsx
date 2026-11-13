"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/Toaster";
import { removeJournal } from "@/lib/storage";
import { timeAgo } from "@/lib/format";
import type { JournalData } from "@/lib/types";

export default function SettingsTab({ journal, username }: { journal: JournalData; username: string }) {
  const router = useRouter();
  const toast = useToast();
  const [title, setTitle] = useState(journal.title);
  const [savingTitle, setSavingTitle] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState("");
  const [busyTrash, setBusyTrash] = useState<string | null>(null);

  const authors = [
    ...new Set(journal.docs.flatMap((d) => [d.createdBy, d.updatedBy]).filter((a): a is string => Boolean(a))),
  ];
  const trash = journal.trash;
  const inviteUrl = typeof window !== "undefined" ? `${window.location.origin}/journal/${journal.shareId}` : `/journal/${journal.shareId}`;
  const safeName = journal.title.replace(/[^\w\- ]/g, "") || "journal";

  async function restore(docId: string) {
    setBusyTrash(docId);
    const res = await fetch(`/api/journals/${journal.shareId}/docs/${docId}/trash?author=${encodeURIComponent(username)}`, { method: "POST" });
    if (!res.ok) {
      toast("Could not restore", true);
    } else {
      toast("Restored to documents");
      router.refresh();
    }
    setBusyTrash(null);
  }

  async function deleteForever(docId: string) {
    if (!window.confirm("Delete this document forever? This cannot be undone.")) return;
    setBusyTrash(docId);
    const res = await fetch(`/api/journals/${journal.shareId}/docs/${docId}?author=${encodeURIComponent(username)}&forever=1`, { method: "DELETE" });
    if (!res.ok) {
      toast("Could not delete", true);
    } else {
      toast("Deleted forever");
      router.refresh();
    }
    setBusyTrash(null);
  }

  async function rename() {
    if (!title.trim() || savingTitle) return;
    setSavingTitle(true);
    try {
      const res = await fetch(`/api/journals/${journal.shareId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not rename");
      router.refresh();
      toast("Journal renamed");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Something went wrong", true);
    } finally {
      setSavingTitle(false);
    }
  }

  async function copyInvite() {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      toast("Invite link copied");
    } catch {
      toast(inviteUrl);
    }
  }

  function leave() {
    removeJournal(journal.shareId);
    toast("Left journal (removed from your list)");
    router.push("/");
  }

  async function destroy() {
    if (confirmDelete.trim() !== journal.title) return;
    const res = await fetch(`/api/journals/${journal.shareId}`, { method: "DELETE" });
    if (!res.ok) {
      toast("Could not delete journal", true);
      return;
    }
    removeJournal(journal.shareId);
    toast("Journal deleted");
    router.push("/");
  }

  return (
    <div>
      <section className="section">
        <div className="section-head">
          <h2>Journal</h2>
        </div>
        <div className="settings-row">
          <div className="info">
            <div className="t">Name</div>
            <div className="d">Everyone sees this title.</div>
          </div>
          <div className="row">
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={60} />
            <button className="small" onClick={rename} disabled={savingTitle || !title.trim() || title === journal.title}>
              {savingTitle ? "…" : "Save"}
            </button>
          </div>
        </div>
        <div className="settings-row">
          <div className="info">
            <div className="t">Invite link</div>
            <div className="d">Anyone with this link can read and write.</div>
          </div>
          <button className="ghost small" onClick={copyInvite}>
            Copy link
          </button>
        </div>
        <div className="settings-row">
          <div className="info">
            <div className="t">Journal ID</div>
            <div className="d">Created {timeAgo(journal.createdAt)}</div>
          </div>
          <span className="code">{journal.shareId}</span>
        </div>
        <div className="settings-row">
          <div className="info">
            <div className="t">Writers</div>
            <div className="d">Everyone who has added an entry.</div>
          </div>
          <div className="row" style={{ flexWrap: "wrap", justifyContent: "flex-end" }}>
            {authors.map((a) => (
              <span className="row" key={a} style={{ gap: 4 }}>
                <span className="avatar">{a.slice(0, 1).toUpperCase()}</span>
                <span style={{ fontSize: 13, color: "var(--text-dim)" }}>{a}</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2>Trash</h2>
          <span className="sub">{trash.length} recoverable</span>
        </div>
        {trash.length === 0 ? (
          <div className="muted">Deleted documents rest here. Restore them or remove them forever.</div>
        ) : (
          <div className="trash-list">
            {trash.map((d) => (
              <div className="trash-item" key={d.id}>
                <div className="info">
                  <div className="t">{d.title || "Untitled"}</div>
                  <div className="d">deleted by {d.updatedBy || d.createdBy || "someone"} · restored or gone forever from here</div>
                </div>
                <div className="row" style={{ gap: 6 }}>
                  <button className="ghost small" onClick={() => restore(d.id)} disabled={busyTrash === d.id}>
                    {busyTrash === d.id ? "…" : "Restore"}
                  </button>
                  <button className="danger-ghost small" onClick={() => deleteForever(d.id)} disabled={busyTrash === d.id}>
                    Delete forever
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="section">
        <div className="section-head">
          <h2>Export</h2>
          <span className="sub">take it with you</span>
        </div>
        <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
          <a className="dl-link" href={`/api/journals/${journal.shareId}/export?format=md`} download={`${safeName}.md`}>
            ↓ Markdown
          </a>
          <a className="dl-link" href={`/api/journals/${journal.shareId}/export?format=json`} download={`${safeName}.json`}>
            ↓ JSON
          </a>
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2 className="danger-title">Danger zone</h2>
        </div>
        <div className="settings-row">
          <div className="info">
            <div className="t">Leave journal</div>
            <div className="d">Removes it from your sidebar. Others keep writing; the link still works.</div>
          </div>
          <button className="danger-ghost small" onClick={leave}>
            Leave
          </button>
        </div>
        <div className="settings-row">
          <div className="info">
            <div className="t">Delete journal</div>
            <div className="d">Erases every entry and prompt for everyone. This cannot be undone.</div>
          </div>
          <div className="row">
            <input
              type="text"
              placeholder={`Type "${journal.title}" to confirm`}
              value={confirmDelete}
              onChange={(e) => setConfirmDelete(e.target.value)}
              style={{ width: 190 }}
            />
            <button className="danger small" onClick={destroy} disabled={confirmDelete.trim() !== journal.title}>
              Delete forever
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
