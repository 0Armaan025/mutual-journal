"use client";

import { useEffect } from "react";
import Icon from "./Icons";
import type { JournalRef } from "@/lib/types";

export type JournalMenuPos = { x: number; y: number; journal: JournalRef };

export default function JournalContextMenu({
  pos,
  isPinned,
  onOpen,
  onTogglePin,
  onDelete,
  onClose,
}: {
  pos: JournalMenuPos;
  isPinned: boolean;
  onOpen: () => void;
  onTogglePin: () => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  useEffect(() => {
    function close() {
      onClose();
    }
    window.addEventListener("click", close);
    window.addEventListener("resize", close);
    window.addEventListener("scroll", close, true);
    window.addEventListener("keydown", (e) => e.key === "Escape" && onClose());
    return () => {
      window.removeEventListener("click", close);
      window.removeEventListener("resize", close);
      window.removeEventListener("scroll", close, true);
    };
  }, [onClose]);

  // keep the menu on-screen
  const style = {
    top: Math.min(pos.y, window.innerHeight - 170),
    left: Math.min(pos.x, window.innerWidth - 210),
  };

  return (
    <div className="ctx-menu" style={style} onMouseDown={(e) => e.stopPropagation()}>
      <button className="ctx-item" onClick={() => { onOpen(); onClose(); }}>
        <Icon name="arrow" size={14} />
        Open journal
      </button>
      <button className="ctx-item" onClick={() => { onTogglePin(); onClose(); }}>
        <Icon name="star" size={14} />
        {isPinned ? "Unpin from sidebar" : "Pin to sidebar"}
      </button>
      <div className="ctx-sep" />
      <button className="ctx-item danger" onClick={() => { onDelete(); onClose(); }}>
        <Icon name="trash" size={14} />
        Delete journal…
      </button>
    </div>
  );
}
