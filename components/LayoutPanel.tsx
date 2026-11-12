"use client";

import { useEffect, useRef, useState } from "react";
import Icon from "./Icons";
import {
  loadPrefs,
  savePrefs,
  applyPrefs,
  DEFAULT_PREFS,
  type LayoutPrefs,
} from "@/lib/prefs";

function Seg<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="pref-row">
      <span className="pref-label">{label}</span>
      <span className="seg">
        {options.map((o) => (
          <button key={o.value} className={value === o.value ? "on" : ""} onClick={() => onChange(o.value)}>
            {o.label}
          </button>
        ))}
      </span>
    </div>
  );
}

export default function LayoutPanel({ trigger, align = "auto" }: { trigger: "gear" | "text"; align?: "auto" | "left" | "right" }) {
  const [open, setOpen] = useState(false);
  const [prefs, setPrefs] = useState<LayoutPrefs>(DEFAULT_PREFS);
  const [pos, setPos] = useState<{ top?: number | string; bottom?: number; left?: number; right?: number }>({});
  const wrap = useRef<HTMLSpanElement>(null);
  const btn = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) setPrefs(loadPrefs());
  }, [open]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  function openPanel() {
    const r = btn.current?.getBoundingClientRect();
    if (r) {
      const below = r.bottom + 210 < window.innerHeight;
      const style: { top?: number | string; bottom?: number; left?: number; right?: number } = {};
      if (below) style.top = r.bottom + 6;
      else {
        style.top = "auto";
        style.bottom = window.innerHeight - r.top + 6;
      }
      if (align === "right" || (align === "auto" && r.left > window.innerWidth - 300)) {
        style.right = 0;
      } else {
        style.left = Math.max(8, Math.min(r.left, window.innerWidth - 268));
      }
      setPos(style);
    }
    setOpen((o) => !o);
  }

  function update(next: Partial<LayoutPrefs>) {
    const merged = { ...prefs, ...next };
    setPrefs(merged);
    savePrefs(merged);
    applyPrefs(merged);
    window.dispatchEvent(new Event("mj:layout-change"));
  }

  const collapsed = prefs.sidebar === "closed";

  return (
    <span className="pop-wrap" ref={wrap}>
      <button
        ref={btn}
        className={trigger === "gear" ? "icon-btn" : "side-action"}
        onClick={openPanel}
        title="Layout options"
        aria-label="Layout options"
      >
        {trigger === "gear" ? <Icon name="sort" size={15} /> : "Layout options"}
      </button>

      {open && (
        <span className="pop prefs-pop" style={pos}>
          <div className="pref-row">
            <span className="pref-label">Content width</span>
            <span className="seg">
              {(["comfortable", "wide", "full"] as const).map((o) => (
                <button key={o} className={prefs.width === o ? "on" : ""} onClick={() => update({ width: o })}>
                  {o === "comfortable" ? "Comfortable" : o === "wide" ? "Wide" : "Full"}
                </button>
              ))}
            </span>
          </div>
          <div className="pref-row">
            <span className="pref-label">Reading size</span>
            <span className="seg">
              {(["sm", "md", "lg"] as const).map((o) => (
                <button key={o} className={prefs.fontSize === o ? "on" : ""} onClick={() => update({ fontSize: o })}>
                  {o.toUpperCase()}
                </button>
              ))}
            </span>
          </div>
          <div className="pref-row">
            <span className="pref-label">Spacing</span>
            <span className="seg">
              {(["airy", "cozy"] as const).map((o) => (
                <button key={o} className={prefs.density === o ? "on" : ""} onClick={() => update({ density: o })}>
                  {o === "airy" ? "Airy" : "Cozy"}
                </button>
              ))}
            </span>
          </div>
          <div className="pref-row">
            <span className="pref-label">Documents view</span>
            <span className="seg">
              {(["strip", "grid"] as const).map((o) => (
                <button key={o} className={prefs.docsLayout === o ? "on" : ""} onClick={() => update({ docsLayout: o })}>
                  {o === "strip" ? "Tabs" : "Cards"}
                </button>
              ))}
            </span>
          </div>
          <div className="pref-row">
            <span className="pref-label">Sidebar</span>
            <button className="ghost small" onClick={() => update({ sidebar: collapsed ? "open" : "closed" })}>
              {collapsed ? "Show" : "Hide"}
            </button>
          </div>
          <p className="pref-note">Preferences save to this browser automatically.</p>
        </span>
      )}
    </span>
  );
}
