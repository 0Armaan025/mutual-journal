"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import CommandPalette from "./CommandPalette";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [drawer, setDrawer] = useState(false);
  const [palette, setPalette] = useState(false);

  const activeShareId = pathname?.startsWith("/journal/") ? pathname.split("/")[2] : undefined;

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPalette((p) => !p);
      }
      if (e.key === "Escape") setPalette(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="shell">
      <Sidebar open={drawer} activeShareId={activeShareId} onNavigate={() => setDrawer(false)} />

      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <header className="topbar">
          <button className="icon" onClick={() => setDrawer((d) => !d)} aria-label="Menu">
            ☰
          </button>
          <a href="/" className="brand" onClick={(e) => { e.preventDefault(); router.push("/"); }}>
            <span className="mark">M</span>
            Mutual <span className="amp">Journal</span>
          </a>
          <div className="grow" />
          <button className="icon" onClick={() => setPalette(true)} aria-label="Search">
            ⌕
          </button>
        </header>
        <div className={`drawer-backdrop${drawer ? " show" : ""}`} onClick={() => setDrawer(false)} />
        <main className="main">{children}</main>
      </div>

      <CommandPalette open={palette} onClose={() => setPalette(false)} />
    </div>
  );
}
