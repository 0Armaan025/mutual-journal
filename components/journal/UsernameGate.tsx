"use client";

import { useState } from "react";
import type { JournalData } from "@/lib/types";

export default function UsernameGate({
  journal,
  onDone,
}: {
  journal: JournalData;
  onDone: (username: string) => void;
}) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  function submit() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Pick something — it signs your entries.");
      return;
    }
    onDone(trimmed);
  }

  return (
    <div className="gate-wrap">
      <div className="gate">
        <h2>Who's writing?</h2>
        <p>
          No accounts here — just a name for <b>{journal.title}</b>. Everyone with the link uses their own.
        </p>
        <input
          autoFocus
          placeholder="Your name"
          maxLength={30}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
        />
        {error && <p style={{ color: "var(--danger)", fontSize: 13, margin: "0 0 12px" }}>{error}</p>}
        <button onClick={submit} disabled={!name.trim()} style={{ width: "100%" }}>
          Start journaling
        </button>
        <div className="for">#{journal.shareId}</div>
      </div>
    </div>
  );
}
