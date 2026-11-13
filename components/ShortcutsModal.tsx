"use client";

import { useEffect } from "react";
import Icon from "./Icons";

const ROWS: { keys: string[]; label: string }[] = [
  { keys: ["⌘", "K"], label: "Search everything, jump between journals" },
  { keys: ["⌘", "B"], label: "Show / hide the sidebar" },
  { keys: ["⌘", "B"], label: "Bold the selection (in a document)" },
  { keys: ["⌘", "I"], label: "Italic the selection (in a document)" },
  { keys: ["/"], label: "Insert blocks — headings, lists, quotes, tables, [[links]]" },
  { keys: ["[[", "]]"], label: "Link to another document" },
  { keys: ["#"], label: "Tag anything — #hashtags" },
  { keys: ["Enter"], label: "Continue lists and to-dos automatically" },
  { keys: ["Tab"], label: "New bullet" },
  { keys: ["Right click"], label: "Journals: open, pin, delete" },
  { keys: ["Esc"], label: "Close menus and dialogs" },
];

export default function ShortcutsModal({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="modal wide" onMouseDown={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="row" style={{ justifyContent: "space-between", marginBottom: 14 }}>
          <h2 style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Icon name="doc" size={16} />
            Keyboard shortcuts
          </h2>
          <button className="icon" onClick={onClose} aria-label="Close" title="Close">
            <Icon name="close" size={14} />
          </button>
        </div>
        <div className="shortcut-list">
          {ROWS.map((r, i) => (
            <div className="shortcut-row" key={i}>
              <span className="keys">
                {r.keys.map((k, j) => (
                  <kbd key={j}>{k}</kbd>
                ))}
              </span>
              <span className="sc-label">{r.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
