"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import CommandPalette from "./CommandPalette";
import Icon from "./Icons";
import LayoutPanel from "./LayoutPanel";
import { loadPrefs, applyPrefs } from "@/lib/prefs";

const SIDEBAR_EVENT = "mj:layout-change";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [drawer, setDrawer] = useState(false);
  const [palette, setPalette] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const activeShareId = pathname?.startsWith("/journal/") ? pathname.split("/")[2] : undefined;

  useEffect(() => {
    const prefs = loadPrefs();
    applyPrefs(prefs);
    setSidebarOpen(prefs.sidebar === "open");
  }, []);

  useEffect(() => {
    function onLayoutChange() {
      setSidebarOpen(loadPrefs().sidebar === "open");
    }
    window.addEventListener(SIDEBAR_EVENT, onLayoutChange);
    return () => window.removeEventListener(SIDEBAR_EVENT, onLayoutChange);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPalette((p) => !p);
      }
      if (e.key === "Escape") setPalette(false);
      if ((e.metaKey || e.ctrlKey) && e.key === "b") {
        e.preventDefault();
        const next = loadPrefs();
        const merged = { ...next, sidebar: sidebarOpen ? "closed" as const : "open" as const };
        applyPrefs(merged);
        localStorage.setItem("mj:layout", JSON.stringify(merged));
        setSidebarOpen(!sidebarOpen);
        window.dispatchEvent(new Event(SIDEBAR_EVENT));
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sidebarOpen]);

  return (
    <div className="shell">
      <Sidebar open={drawer} activeShareId={activeShareId} onNavigate={() => setDrawer(false)} />

      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <header className="topbar">
          <button className="icon" onClick={() => setDrawer((d) => !d)} aria-label="Menu" title="Menu">
            <Icon name="sort" size={16} />
          </button>
          <a href="/" className="brand" onClick={(e) => { e.preventDefault(); router.push("/"); }}>
            <span className="mark">M</span>
            Mutual <span className="amp">Journal</span>
          </a>
          <div className="grow" />
          <LayoutPanel trigger="gear" />
          <button className="icon" onClick={() => setPalette(true)} aria-label="Search" title="Search">
            <Icon name="search" size={16} />
          </button>
        </header>

        <div className={`drawer-backdrop${drawer ? " show" : ""}`} onClick={() => setDrawer(false)} />

        {!sidebarOpen && (
          <button className="sidebar-expand" onClick={() => {
            const merged = { ...loadPrefs(), sidebar: "open" as const };
            applyPrefs(merged);
            localStorage.setItem("mj:layout", JSON.stringify(merged));
            setSidebarOpen(true);
            window.dispatchEvent(new Event(SIDEBAR_EVENT));
          }} title="Show sidebar (⌘B)">
            <Icon name="sort" size={15} />
          </button>
        )}

        <main className="main">{children}</main>
      </div>

      <CommandPalette open={palette} onClose={() => setPalette(false)} />
    </div>
  );
}
