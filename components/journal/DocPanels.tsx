"use client";

import { useMemo } from "react";
import { timeAgo } from "@/lib/format";
import type { Doc } from "@/lib/types";

/* ---------- outline (table of contents) ---------- */
export function DocOutline({ doc }: { doc: Doc }) {
  const headings = useMemo(() => {
    const lines = doc.content.split("\n");
    const out: { level: number; text: string; line: number }[] = [];
    lines.forEach((l, i) => {
      const m = l.match(/^(#{1,4})\s+(.*)$/);
      if (m) out.push({ level: m[1].length, text: m[2].replace(/[*`]/g, ""), line: i });
    });
    return out;
  }, [doc.content]);

  if (headings.length === 0) return null;

  function scrollTo(line: number) {
    const textarea = document.querySelector<HTMLTextAreaElement>(".doc-editor");
    if (textarea) {
      const lines = textarea.value.split("\n");
      const pos = lines.slice(0, line).join("\n").length + (line > 0 ? 1 : 0);
      textarea.focus();
      textarea.setSelectionRange(pos, pos);
      const { top } = caretCoordsSafe(textarea, pos);
      textarea.scrollTop = Math.max(0, top - 40);
    }
  }

  return (
    <nav className="outline" aria-label="Outline">
      <div className="outline-label">On this page</div>
      {headings.map((h, i) => (
        <button key={i} className={`outline-item l${h.level}`} onClick={() => scrollTo(h.line)} title={h.text}>
          {h.text}
        </button>
      ))}
    </nav>
  );
}

function caretCoordsSafe(textarea: HTMLTextAreaElement, pos: number) {
  const lines = textarea.value.split("\n");
  let lineIdx = 0;
  let acc = 0;
  for (const l of lines) {
    if (acc + l.length >= pos) break;
    acc += l.length + 1;
    lineIdx++;
  }
  const style = getComputedStyle(textarea);
  const lh = parseFloat(style.lineHeight) || 24;
  return { top: lineIdx * lh };
}

/* ---------- version history ---------- */
export function DocHistory({
  doc,
  onRestore,
  busyVersionId,
}: {
  doc: Doc;
  onRestore: (versionId: string) => void;
  busyVersionId: string | null;
}) {
  const versions = [...doc.versions].reverse();

  return (
    <div className="history">
      <div className="history-head">
        <h2>Version history</h2>
        <span className="muted">{versions.length} saved {versions.length === 1 ? "version" : "versions"}</span>
      </div>
      {versions.length === 0 ? (
        <div className="empty-state">Every save snapshots the previous text. Edit this document and its earlier versions will appear here.</div>
      ) : (
        <div className="history-list">
          {versions.map((v) => (
            <article className="history-item" key={v.id}>
              <header>
                <span className="avatar">{v.author.slice(0, 1).toUpperCase() || "?"}</span>
                <div>
                  <b>{v.author || "someone"}</b>
                  <span className="muted"> · {timeAgo(v.createdAt)}</span>
                </div>
                <div className="grow" />
                <button
                  className="ghost small"
                  onClick={() => onRestore(v.id)}
                  disabled={busyVersionId === v.id}
                  title="Restore this version"
                >
                  {busyVersionId === v.id ? "…" : "Restore"}
                </button>
              </header>
              <div className="history-title">{v.title}</div>
              <pre className="history-preview">{v.content || "(empty)"}</pre>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
