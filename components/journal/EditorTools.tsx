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

export function SlashMenu({ top, left, onPick, onClose }: { top: number; left: number; onPick: (a: SlashAction) => void; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [sel, setSel] = useState(0);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSel((s) => Math.min(s + 1, ACTIONS.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSel((s) => Math.max(s - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        onPick(ACTIONS[sel]);
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    }
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [onPick, onClose, sel]);

  return (
    <div className="slash-menu" ref={ref} style={{ top, left }}>
      {ACTIONS.map((a, i) => (
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
      ))}
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
