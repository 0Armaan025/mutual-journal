"use client";

import { useEffect, useState } from "react";
import Icon from "./Icons";
import { useToast } from "./Toaster";

export default function OnboardingCard({ shareId }: { shareId: string }) {
  const [dismissed, setDismissed] = useState(true);
  const toast = useToast();

  useEffect(() => {
    setDismissed(localStorage.getItem(`mj:onboarded:${shareId}`) === "1");
  }, [shareId]);

  if (dismissed) return null;

  function dismiss() {
    localStorage.setItem(`mj:onboarded:${shareId}`, "1");
    setDismissed(true);
  }

  return (
    <div className="onboard">
      <button className="icon onboard-x" onClick={dismiss} aria-label="Dismiss" title="Dismiss">
        <Icon name="close" size={13} />
      </button>
      <h3>This is your shared vault</h3>
      <ol>
        <li>
          <span className="n">1</span>
          <span>
            <b>Write anything.</b> It's one markdown document everyone with the link can edit — type <kbd>/</kbd> for blocks.
          </span>
        </li>
        <li>
          <span className="n">2</span>
          <span>
            <b>Share the link.</b>{" "}
            <button
              className="linklike"
              onClick={async () => {
                await navigator.clipboard.writeText(`${window.location.origin}/journal/${shareId}`);
                toast("Invite link copied");
              }}
            >
              Copy the invite link
            </button>{" "}
            — no accounts needed.
          </span>
        </li>
        <li>
          <span className="n">3</span>
          <span>
            <b>Journal together.</b> Pick a name when they open it; edits, comments, and versions all sync live.
          </span>
        </li>
      </ol>
    </div>
  );
}
