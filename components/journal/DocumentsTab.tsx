"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/Toaster";
import Markdown from "@/components/Markdown";
import { MOODS, QUICK_REACTIONS, initials, timeAgo, wordCount, findWikilinks, extractTags } from "@/lib/format";
import { FormatToolbar, SlashMenu, caretCoords, type FormatKey, type SlashAction } from "./EditorTools";
import { DocOutline, DocHistory } from "./DocPanels";
import type { Doc, JournalData } from "@/lib/types";

const TEMPLATES: { key: string; label: string; hint: string; title: string; content: string }[] = [
  {
    key: "blank",
    label: "Blank",
    hint: "start from nothing",
    title: "",
    content: "",
  },
  {
    key: "daily",
    label: "Daily note",
    hint: "today, briefly",
    title: "",
    content: `## Today

- 

## Grateful for

- 

## Tomorrow

- 
`,
  },
  {
    key: "gratitude",
    label: "Gratitude",
    hint: "three good things",
    title: "Three good things",
    content: `## Three good things

1. 
2. 
3. 

## Why they mattered

`,
  },
  {
    key: "meeting",
    label: "Meeting",
    hint: "agenda + notes",
    title: "Meeting",
    content: `## Agenda

- [ ] 
- [ ] 

## Notes

## Actions

- [ ] who · what · when
`,
  },
  {
    key: "reading",
    label: "Reading log",
    hint: "what we're reading",
    title: "Reading",
    content: `## We're reading

| book | who | pages |
| --- | --- | --- |
|  |  |  |

## Quotes worth keeping

> 
`,
  },
];

export default function DocumentsTab({
  journal,
  username,
  selectedId,
  onSelect,
}: {
  journal: JournalData;
  username: string;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const router = useRouter();
  const toast = useToast();

  const docs = useMemo(
    () => [...journal.docs].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || b.updatedAt.localeCompare(a.updatedAt)),
    [journal.docs]
  );

  const [creating, setCreating] = useState(false);

  useEffect(() => {
    function onHash() {
      const m = window.location.hash.match(/^#doc-(.+)$/);
      if (m) {
        const target = journal.docs.find((d) => d.id === m[1]);
        if (target) onSelect(target.id);
      }
    }
    window.addEventListener("hashchange", onHash);
    onHash();
    return () => window.removeEventListener("hashchange", onHash);
  }, [journal.docs, onSelect]);

  // default selection applies ONCE (first load); after that, selection is explicit
  const initialized = useRef(false);
  useEffect(() => {
    if (initialized.current) return;
    if (!selectedId || !journal.docs.some((d) => d.id === selectedId)) {
      if (docs.length > 0) {
        onSelect(docs[0].id);
        initialized.current = true;
      }
    } else {
      initialized.current = true;
    }
  }, [docs, selectedId, onSelect, journal.docs]);

  const doc = journal.docs.find((d) => d.id === selectedId) ?? docs[0] ?? null;

  function pickReplacement(excludeId: string) {
    const remaining = journal.docs.filter((d) => d.id !== excludeId);
    remaining.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || b.updatedAt.localeCompare(a.updatedAt));
    onSelect(remaining[0]?.id ?? "");
  }

  async function createDoc(templateKey = "blank") {
    setCreating(true);
    const tpl = TEMPLATES.find((t) => t.key === templateKey) ?? TEMPLATES[0];
    const title = tpl.title || new Date().toLocaleDateString(undefined, { month: "long", day: "numeric" });
    try {
      const res = await fetch(`/api/journals/${journal.shareId}/docs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ author: username, title, content: tpl.content }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not create document");
      onSelect(data.id);
      router.refresh();
      toast(tpl.key === "blank" ? "New document" : `New: ${tpl.label}`);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Something went wrong", true);
    } finally {
      setCreating(false);
    }
  }

  return (
    <>
      <nav className="doctabs">
        {docs.map((d) => (
          <button
            key={d.id}
            className={`doctab${d.id === doc?.id ? " on" : ""}`}
            onClick={() => onSelect(d.id)}
            title={d.title}
          >
            {d.pinned && <span style={{ color: "var(--accent)", fontSize: 11 }}>★</span>}
            <span className="dt">{d.title || "Untitled"}</span>
            <span
              className="dx"
              role="button"
              title="Delete document"
              onClick={async (e) => {
                e.stopPropagation();
                if (!window.confirm(`Delete "${d.title || "Untitled"}"? This can't be undone.`)) return;
                if (d.createdBy && d.createdBy !== username) {
                  toast("Only the creator can delete this document", true);
                  return;
                }
                const res = await fetch(
                  `/api/journals/${journal.shareId}/docs/${d.id}?author=${encodeURIComponent(username)}`,
                  { method: "DELETE" }
                );
                if (!res.ok) {
                  const data = await res.json().catch(() => ({}));
                  toast(data.error || "Could not delete", true);
                  return;
                }
                pickReplacement(d.id);
                router.refresh();
              }}
            >
              ×
            </span>
          </button>
        ))}
        <TemplateMenu creating={creating} onCreate={createDoc} />
      </nav>

      {doc ? (
        <DocEditor journal={journal} doc={doc} username={username} onDeleted={(nextId) => onSelect(nextId)} />
      ) : (
        <div className="empty-state">
          <div className="big">This vault is empty</div>
          Create the first document — it's one shared page, edited live by everyone with the link.
        </div>
      )}
    </>
  );
}

function TemplateMenu({ creating, onCreate }: { creating: boolean; onCreate: (key: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="pop-wrap">
      <button className="doctab new" onClick={() => setOpen((o) => !o)} disabled={creating} title="New document">
        ＋
      </button>
      {open && (
        <span className="pop tpl-pop">
          <span className="side-label" style={{ padding: "2px 6px 4px" }}>Start from</span>
          {TEMPLATES.map((t) => (
            <button
              key={t.key}
              className="palette-item"
              onClick={() => {
                setOpen(false);
                onCreate(t.key);
              }}
            >
              <span className="tpl-ico">{t.key === "blank" ? "＋" : t.label.slice(0, 1)}</span>
              <span>{t.label}</span>
              <span className="hint">{t.hint}</span>
            </button>
          ))}
        </span>
      )}
    </span>
  );
}

function DocEditor({
  journal,
  doc,
  username,
  onDeleted,
}: {
  journal: JournalData;
  doc: Doc;
  username: string;
  onDeleted: (nextId: string) => void;
}) {
  const router = useRouter();
  const toast = useToast();

  const [title, setTitle] = useState(doc.title);
  const [content, setContent] = useState(doc.content);
  const [mode, setMode] = useState<"write" | "preview">("write");
  const [view, setView] = useState<"doc" | "history">("doc");
  const [saving, setSaving] = useState<"idle" | "saving" | "saved">("idle");
  const [busy, setBusy] = useState(false);
  const [busyVersionId, setBusyVersionId] = useState<string | null>(null);
  const [showReactions, setShowReactions] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [openPop, setOpenPop] = useState<"mood" | null>(null);
  const [slash, setSlash] = useState<{ top: number; left: number } | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dirty = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const docKey = doc.id;
  const isMine = !doc.createdBy || doc.createdBy === username;

  useEffect(() => {
    setTitle(doc.title);
    setContent(doc.content);
    dirty.current = false;
    setSaving("idle");
    setSlash(null);
    setView("doc");
  }, [docKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const hashtags = useMemo(() => extractTags(content), [content]);
  const allTags = useMemo(() => [...new Set([...doc.tags, ...hashtags])], [doc.tags, hashtags]);

  const backlinks = useMemo(() => {
    const self = title.trim() || "Untitled";
    return journal.docs.filter(
      (d) => d.id !== doc.id && findWikilinks(d.content).some((t) => t.toLowerCase() === self.toLowerCase())
    );
  }, [journal.docs, doc.id, title]);

  async function patch(payload: Record<string, unknown>) {
    setBusy(true);
    try {
      const res = await fetch(`/api/journals/${journal.shareId}/docs/${doc.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ author: username, ...payload }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      router.refresh();
      return data;
    } catch (err) {
      toast(err instanceof Error ? err.message : "Something went wrong", true);
      return null;
    } finally {
      setBusy(false);
    }
  }

  // debounced autosave (Obsidian-style: no save button)
  function edit(field: "title" | "content", value: string) {
    if (field === "title") setTitle(value);
    else setContent(value);
    dirty.current = true;
    setSaving("saving");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      if (!dirty.current) return;
      const ok = await patch({ [field]: value });
      dirty.current = false;
      setSaving(ok ? "saved" : "idle");
    }, 900);
  }

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  /* ---------- selection formatting ---------- */
  function applyFormat(kind: FormatKey) {
    const el = textareaRef.current;
    if (!el) return;
    const s = el.selectionStart;
    const e = el.selectionEnd;
    const sel = content.slice(s, e);
    const before = content.slice(0, s);
    const after = content.slice(e);
    const lineStart = before.lastIndexOf("\n") + 1;

    let next = content;
    let caret = s;

    const wrap = (token: string) => {
      next = `${before}${token}${sel || "text"}${token}${after}`;
      caret = s + token.length + (sel ? sel.length : 4);
    };
    const linePrefix = (token: string) => {
      const head = before.slice(0, lineStart);
      const tail = before.slice(lineStart);
      next = `${head}${token}${tail}${sel}${after}`;
      caret = s + token.length;
    };

    switch (kind) {
      case "bold": wrap("**"); break;
      case "italic": wrap("*"); break;
      case "code": wrap("`"); break;
      case "h1": linePrefix("# "); break;
      case "h2": linePrefix("## "); break;
      case "h3": linePrefix("### "); break;
      case "ul": linePrefix("- "); break;
      case "check": linePrefix("- [ ] "); break;
      case "quote": linePrefix("> "); break;
      case "divider": next = `${before}\n\n---\n\n${after}`; caret = s + 6; break;
      case "link":
        next = `${before}[[${sel || "document title"}]]${after}`;
        caret = s + 2 + (sel ? sel.length : 14);
        break;
    }

    setContent(next);
    dirty.current = true;
    setSaving("saving");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      const ok = await patch({ content: next });
      dirty.current = false;
      setSaving(ok ? "saved" : "idle");
    }, 900);

    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(caret, sel && kind !== "link" ? caret : caret + 0);
    });
  }

  /* ---------- slash menu ---------- */
  const slashAnchor = useRef(0);

  function onEditorKeyDown(ev: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (ev.key === "Escape" && slash) {
      setSlash(null);
      return;
    }
    if (ev.key === "Tab") {
      ev.preventDefault();
      applyFormat("ul");
      return;
    }
  }

  function onEditorChange(value: string) {
    setContent(value);
    edit("content", value);
    // slash detection runs after insertion (input event)
    const el = textareaRef.current;
    if (!el) return;
    const pos = el.selectionStart;
    const typedSlash = value[pos - 1] === "/" && (pos === 1 || value[pos - 2] === "\n" || value[pos - 2] === " ");
    if (typedSlash) {
      const { top, left } = caretCoords(el, pos);
      slashAnchor.current = pos - 1;
      setSlash({ top: top + 24, left: Math.min(left, 480) });
    } else if (slash && value[pos - 1] !== "/") {
      setSlash(null);
    }
  }

  function runSlashAction(action: SlashAction) {
    const el = textareaRef.current;
    if (!el) return;
    const start = slashAnchor.current;
    const end = el.selectionStart;
    const before = content.slice(0, start);
    const after = content.slice(end);

    let insert = "";
    let caretOffset = 0;
    switch (action.key) {
      case "h1": insert = "# "; break;
      case "h2": insert = "## "; break;
      case "h3": insert = "### "; break;
      case "bold": insert = "**text**"; caretOffset = -4; break;
      case "italic": insert = "*text*"; caretOffset = -4; break;
      case "list": insert = "- "; break;
      case "check": insert = "- [ ] "; break;
      case "quote": insert = "> "; break;
      case "code": insert = "```\n\n```"; caretOffset = -4; break;
      case "divider": insert = "\n---\n"; break;
      case "link": insert = "[[document title]]"; caretOffset = -14; break;
      case "table": insert = "\n| a | b |\n| --- | --- |\n|  |  |\n"; break;
    }

    const next = `${before}${insert}${after}`;
    setContent(next);
    setSlash(null);
    dirty.current = true;
    setSaving("saving");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      const ok = await patch({ content: next });
      dirty.current = false;
      setSaving(ok ? "saved" : "idle");
    }, 900);
    requestAnimationFrame(() => {
      el.focus();
      const pos = before.length + insert.length + caretOffset;
      el.setSelectionRange(pos, pos);
    });
  }

  async function restoreVersion(versionId: string) {
    setBusyVersionId(versionId);
    try {
      const res = await fetch(`/api/journals/${journal.shareId}/docs/${doc.id}/versions/${versionId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ author: username }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not restore");
      setTitle(data.title);
      setContent(data.content);
      setView("doc");
      toast("Version restored");
      router.refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Something went wrong", true);
    } finally {
      setBusyVersionId(null);
    }
  }

  async function deleteDoc() {
    if (!window.confirm(`Delete "${doc.title || "Untitled"}"? This can't be undone.`)) return;
    const res = await fetch(
      `/api/journals/${journal.shareId}/docs/${doc.id}?author=${encodeURIComponent(username)}`,
      { method: "DELETE" }
    );
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast(data.error || "Could not delete", true);
      return;
    }
    const remaining = journal.docs.filter((d) => d.id !== doc.id);
    remaining.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || b.updatedAt.localeCompare(a.updatedAt));
    onDeleted(remaining[0]?.id ?? "");
    router.refresh();
  }

  async function toggleReaction(emoji: string) {
    setShowReactions(false);
    await fetch(`/api/journals/${journal.shareId}/docs/${doc.id}/reactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emoji, author: username }),
    }).catch(() => toast("Could not react", true));
    router.refresh();
  }

  async function addReply() {
    if (!replyText.trim()) return;
    const res = await fetch(`/api/journals/${journal.shareId}/docs/${doc.id}/replies`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ author: username, content: replyText.trim() }),
    });
    if (!res.ok) {
      toast("Could not add comment", true);
      return;
    }
    setReplyText("");
    router.refresh();
  }

  async function deleteReply(replyId: string) {
    const res = await fetch(
      `/api/journals/${journal.shareId}/docs/${doc.id}/replies?author=${encodeURIComponent(username)}&replyId=${replyId}`,
      { method: "DELETE" }
    );
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast(data.error || "Could not delete", true);
      return;
    }
    router.refresh();
  }

  async function togglePin() {
    await fetch(`/api/journals/${journal.shareId}/docs/${doc.id}/pin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    }).catch(() => toast("Could not star", true));
    router.refresh();
  }

  async function copyLink() {
    const url = `${window.location.origin}/journal/${journal.shareId}#doc-${doc.id}`;
    try {
      await navigator.clipboard.writeText(url);
      toast("Document link copied");
    } catch {
      toast(url);
    }
  }

  function resolveWikilink(name: string): string {
    const target = journal.docs.find((d) => (d.title || "Untitled").toLowerCase() === name.toLowerCase());
    return target ? `/journal/${journal.shareId}#doc-${target.id}` : "";
  }

  return (
    <article className="doc" id={`doc-${doc.id}`}>
      <div className="doc-top">
        <div className="doc-tools">
          <span className="pop-wrap">
            <button className="icon" onClick={() => setOpenPop(openPop === "mood" ? null : "mood")} title="Mood">
              {doc.mood ?? "☺"}
            </button>
            {openPop === "mood" && (
              <span className="pop moods">
                {MOODS.map((m) => (
                  <button key={m} onClick={() => { patch({ mood: m }); setOpenPop(null); }}>
                    {m}
                  </button>
                ))}
              </span>
            )}
          </span>
          <button className={`icon${doc.pinned ? " on" : ""}`} onClick={togglePin} title={doc.pinned ? "Unstar" : "Star"}>
            {doc.pinned ? "★" : "☆"}
          </button>
          <button
            className={`icon${view === "history" ? " on" : ""}`}
            onClick={() => setView(view === "history" ? "doc" : "history")}
            title={`Version history (${doc.versions.length})`}
          >
            ⌚
          </button>
          <button className="icon" onClick={copyLink} title="Copy link to document">
            ⛓
          </button>
          {isMine && (
            <button className="icon" onClick={deleteDoc} title="Delete document">
              🗑
            </button>
          )}
        </div>
        <span className="seg">
          <button className={mode === "write" ? "on" : ""} onClick={() => setMode("write")}>
            Edit
          </button>
          <button className={mode === "preview" ? "on" : ""} onClick={() => setMode("preview")}>
            Read
          </button>
        </span>
      </div>

      {view === "history" ? (
        <DocHistory doc={doc} onRestore={restoreVersion} busyVersionId={busyVersionId} />
      ) : (
        <>
          <input
            className="doc-title"
            value={title}
            maxLength={120}
            placeholder="Untitled"
            onChange={(e) => edit("title", e.target.value)}
          />

          <div className="doc-meta">
            <span>
              {doc.updatedBy ? `last edited by ${doc.updatedBy}` : `created by ${doc.createdBy || "someone"}`} · {timeAgo(doc.updatedAt)}
            </span>
            <span className={`save-state ${saving}`}>
              {saving === "saving" ? "saving…" : saving === "saved" ? "saved" : busy ? "…" : ""}
            </span>
          </div>

          {mode === "write" ? (
            <div className="editor-wrap">
              <FormatToolbar onFormat={applyFormat} />
              <textarea
                ref={textareaRef}
                className="doc-editor"
                value={content}
                placeholder={"Start writing… type / for blocks, wrap text with the toolbar, link docs with [[their title]]."}
                onChange={(e) => onEditorChange(e.target.value)}
                onKeyDown={onEditorKeyDown}
              />
              {slash && (
                <SlashMenu
                  top={slash.top}
                  left={slash.left}
                  onPick={runSlashAction}
                  onClose={() => setSlash(null)}
                />
              )}
            </div>
          ) : (
            <div className="doc-read">
              {content.trim() ? (
                <Markdown content={content} resolveWikilink={resolveWikilink} />
              ) : (
                <span className="empty">This document is empty.</span>
              )}
            </div>
          )}

          <div className="doc-foot">
            <span>{wordCount(content)} words</span>
            <span className="dotsep">·</span>
            <span>autosaves</span>
            {allTags.length > 0 && (
              <>
                <span className="dotsep">·</span>
                <span className="row" style={{ gap: 2, flexWrap: "wrap" }}>
                  {allTags.map((t) => (
                    <span key={t} className="tag plain" title={doc.tags.includes(t) ? "added tag" : "from #hashtag"}>
                      #{t}
                    </span>
                  ))}
                </span>
              </>
            )}
          </div>

          <div className="react-row">
            {doc.reactions.map((r) => (
              <button
                key={r.emoji}
                className={`react${r.users.includes(username) ? " mine" : ""}`}
                onClick={() => toggleReaction(r.emoji)}
                title={r.users.join(", ")}
              >
                <span>{r.emoji}</span>
                <span>{r.users.length}</span>
              </button>
            ))}
            <span className="pop-wrap react-add">
              <button className="react add" onClick={() => setShowReactions((s) => !s)} title="React">
                ☺+
              </button>
              {showReactions && (
                <span className="react-menu">
                  {QUICK_REACTIONS.map((e) => (
                    <button key={e} onClick={() => toggleReaction(e)}>
                      {e}
                    </button>
                  ))}
                </span>
              )}
            </span>
            <div className="grow" />
            <button className="reply-btn" onClick={() => setShowReplies((s) => !s)}>
              {doc.replies.length > 0 ? `${doc.replies.length} ${doc.replies.length === 1 ? "comment" : "comments"}` : "Comment"}
            </button>
          </div>

          {showReplies && (
            <div className="replies">
              {doc.replies.map((r) => (
                <div className="reply" key={r.id}>
                  <span className="avatar">{initials(r.author)}</span>
                  <div className="body">
                    <span className="who">{r.author}</span>
                    <span className="when">{timeAgo(r.createdAt)}</span>
                    <div className="txt">{r.content}</div>
                  </div>
                  {r.author === username && (
                    <button className="icon" onClick={() => deleteReply(r.id)} title="Delete comment">
                      ×
                    </button>
                  )}
                </div>
              ))}
              <div className="reply-form">
                <input
                  placeholder={`Comment as ${username}…`}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addReply()}
                />
                <button className="small" onClick={addReply} disabled={!replyText.trim() || busy}>
                  Comment
                </button>
              </div>
            </div>
          )}

          <DocOutline doc={doc} />

          {backlinks.length > 0 && (
            <section className="section backlinks">
              <div className="section-head">
                <h2>Linked mentions</h2>
              </div>
              {backlinks.map((d) => (
                <a
                  key={d.id}
                  className="backlink"
                  href={`/journal/${journal.shareId}#doc-${d.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    window.location.hash = `#doc-${d.id}`;
                  }}
                >
                  <span className="bl-t">{d.title || "Untitled"}</span>
                  <span className="bl-s">{timeAgo(d.updatedAt)}</span>
                </a>
              ))}
            </section>
          )}
        </>
      )}
    </article>
  );
}
