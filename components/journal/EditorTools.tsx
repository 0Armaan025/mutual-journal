"use client";

import { useEffect, useRef, useState } from "react";

/* ---------- caret coordinates via mirror div ---------- */
export function caretCoords(textarea: HTMLTextAreaElement, pos: number) {
  const style = getComputedStyle(textarea);
  const mirror = document.createElement("div");
  const props = ["fontFamily", "fontSize", "fontWeight", "lineHeight", "letterSpacing", "padding", "border", "boxSizing", "whiteSpace", "wordWrap", "tabSize"] as const;
  for (const p of props) mirror.style[p as any] = style[p as any];
  mirror.style.position = "absolute";
  mirror.style.visibility = "hidden";
  mirror.style.width = `${textarea.clientWidth}px`;
  mirror.style.whiteSpace = "pre-wrap";
  mirror.style.wordWrap = "break-word";

  const before = document.createTextNode(textarea.value.slice(0, pos));
  const marker = document.createElement("span");
  marker.textContent = "\u200b";
  mirror.append(before, marker);
  document.body.appendChild(mirror);
  const top = marker.offsetTop - textarea.scrollTop;
  const left = marker.offsetLeft;
  mirror.remove();
  return { top, left };
}

/* ---------- slash menu ---------- */
export type SlashAction = { key: string; label: string; hint: string; icon: string };

export function SlashMenu({
  top,
  left,
  actions,
  query,
  onPick,
  onClose,
}: {
  top: number;
  left: number;
  actions: SlashAction[];
  query: string;
  onPick: (a: SlashAction) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [sel, setSel] = useState(0);

  useEffect(() => {
    setSel(0);
  }, [query]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSel((s) => Math.min(s + 1, actions.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSel((s) => Math.max(s - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (actions[sel]) onPick(actions[sel]);
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    }
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [onPick, onClose, sel, actions]);

  return (
    <div className="slash-menu" ref={ref} style={{ top, left }}>
      {actions.length === 0 ? (
        <div className="palette-empty">No blocks match “{query}”</div>
      ) : (
        actions.map((a, i) => (
          <button
            key={a.key}
            className={`slash-item${i === sel ? " sel" : ""}`}
            onMouseEnter={() => setSel(i)}
            onMouseDown={(e) => {
              e.preventDefault();
              onPick(a);
            }}
          >
            <span className="si">{a.icon}</span>
            <span className="sl">{a.label}</span>
            <span className="sh">{a.hint}</span>
          </button>
        ))
      )}
    </div>
  );
}

const ACTIONS: { key: string; label: string; hint: string; icon: string }[] = [
  { key: "h1", label: "Heading 1", hint: "big section title", icon: "H₁" },
  { key: "h2", label: "Heading 2", hint: "section title", icon: "H₂" },
  { key: "h3", label: "Heading 3", hint: "subsection", icon: "H₃" },
  { key: "bold", label: "Bold", hint: "**text**", icon: "B" },
  { key: "italic", label: "Italic", hint: "*text*", icon: "I" },
  { key: "list", label: "Bullet list", hint: "- item", icon: "•" },
  { key: "check", label: "To-do list", hint: "- [ ] item", icon: "☑" },
  { key: "quote", label: "Quote", hint: "> text", icon: "❝" },
  { key: "code", label: "Code block", hint: "```lang", icon: "{}" },
  { key: "divider", label: "Divider", hint: "---", icon: "―" },
  { key: "link", label: "Link document", hint: "[[title]]", icon: "[[" },
  { key: "table", label: "Table", hint: "2×2", icon: "▦" },
];

export { ACTIONS as SLASH_ACTIONS };

/* ---------- smart enter: continue lists, exit on empty, dashes to dividers ---------- */
export function smartEnter(content: string, caret: number): { content: string; caret: number } {
  const before = content.slice(0, caret);
  const lineStart = before.lastIndexOf("\n") + 1;
  const currentLine = before.slice(lineStart);
  const after = content.slice(caret);

  // typed "---" on its own line → real divider
  if (/^\s*---\s*$/.test(before.slice(lineStart) + "")) {
    return { content: before + "\n---\n" + after, caret: caret + 5 };
  }

  // empty list / todo / quote item → remove marker and exit block
  const emptyItem = currentLine.match(/^(\s*)([-*+]\s\[[ x]\]|[-*+]\s|>\s|\d+\.\s)$/);
  if (emptyItem) {
    const cleaned = before.slice(0, lineStart);
    return { content: cleaned + after, caret: cleaned.length };
  }

  // continue the same kind of block
  const todo = currentLine.match(/^(\s*)([-*+]\s)\[[ x]\]\s/);
  if (todo) return { content: `${before}\n${todo[1]}${todo[2]}[ ] ${after}`, caret: caret + todo[1].length + todo[2].length + 4 };

  const bullet = currentLine.match(/^(\s*)([-*+]\s)/);
  if (bullet) return { content: `${before}\n${bullet[1]}${bullet[2]}${after}`, caret: caret + bullet[1].length + bullet[2].length };

  const quote = currentLine.match(/^(\s*)(>\s?)/);
  if (quote && currentLine.replace(/^(\s*)(>\s?)/, "").trim()) {
    return { content: `${before}\n${quote[1]}> ${after}`, caret: caret + quote[1].length + 2 };
  }

  const numbered = currentLine.match(/^(\s*)(\d+)(\.\s)/);
  if (numbered) {
    const next = Number(numbered[2]) + 1;
    return { content: `${before}\n${numbered[1]}${next}${numbered[3]}${after}`, caret: caret + numbered[1].length + String(next).length + numbered[3].length };
  }

  return { content: `${before}\n${after}`, caret: caret + 1 };
}

/* ---------- filter slash actions by typed text ---------- */
export function filterSlashActions(query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return ACTIONS;
  return ACTIONS.filter(
    (a) => a.label.toLowerCase().includes(q) || a.key.toLowerCase().includes(q) || a.hint.toLowerCase().includes(q)
  );
}

/* ---------- format toolbar ---------- */
export type FormatKey = "bold" | "italic" | "h1" | "h2" | "h3" | "ul" | "check" | "quote" | "code" | "link" | "divider";

const BUTTONS: { key: FormatKey; icon: string; title: string }[] = [
  { key: "bold", icon: "B", title: "Bold (⌘B)" },
  { key: "italic", icon: "I", title: "Italic (⌘I)" },
  { key: "h1", icon: "H₁", title: "Heading 1" },
  { key: "h2", icon: "H₂", title: "Heading 2" },
  { key: "h3", icon: "H₃", title: "Heading 3" },
  { key: "ul", icon: "•", title: "Bullet list" },
  { key: "check", icon: "☑", title: "To-do list" },
  { key: "quote", icon: "❝", title: "Quote" },
  { key: "code", icon: "{ }", title: "Code" },
  { key: "link", icon: "[ ]", title: "Wikilink" },
  { key: "divider", icon: "―", title: "Divider" },
];

export function FormatToolbar({ onFormat }: { onFormat: (key: FormatKey) => void }) {
  return (
    <span className="fmt-bar" onMouseDown={(e) => e.preventDefault()}>
      {BUTTONS.map((b) => (
        <button key={b.key} className="fmt-btn" title={b.title} onClick={() => onFormat(b.key)}>
          {b.icon}
        </button>
      ))}
    </span>
  );
}
