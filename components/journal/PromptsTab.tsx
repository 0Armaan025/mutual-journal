"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/Toaster";
import { initials, timeAgo } from "@/lib/format";
import Icon from "@/components/Icons";
import type { JournalData } from "@/lib/types";

export default function PromptsTab({ journal, username }: { journal: JournalData; username: string }) {
  const router = useRouter();
  const toast = useToast();
  const [question, setQuestion] = useState("");
  const [asking, setAsking] = useState(false);

  const prompts = [...journal.prompts].reverse();

  async function ask() {
    if (!question.trim() || asking) return;
    setAsking(true);
    try {
      const res = await fetch(`/api/journals/${journal.shareId}/prompts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ author: username, question: question.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not post prompt");
      setQuestion("");
      router.refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Something went wrong", true);
    } finally {
      setAsking(false);
    }
  }

  return (
    <>
      <section className="composer">
        <div className="composer-top">
          <span className="as">Ask the journal — everyone with the link can answer</span>
        </div>
        <div className="row" style={{ alignItems: "flex-end", gap: 10 }}>
          <input
            placeholder="What's one small thing that made you smile this week?"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && ask()}
            maxLength={200}
          />
          <button onClick={ask} disabled={asking || !question.trim()}>
            {asking ? "Asking…" : "Ask"}
          </button>
        </div>
      </section>

      {prompts.length === 0 ? (
        <div className="empty-state">
          <div className="big">No prompts yet</div>
          Prompts are shared questions — one asks, everyone answers. Good for the evenings you both go quiet.
        </div>
      ) : (
        <div>
          {prompts.map((p) => (
            <PromptCard key={p.id} journal={journal} prompt={p} username={username} />
          ))}
        </div>
      )}
    </>
  );
}

function PromptCard({
  journal,
  prompt,
  username,
}: {
  journal: JournalData;
  prompt: JournalData["prompts"][number];
  username: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const [answer, setAnswer] = useState("");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const mine = prompt.answers.find((a) => a.author === username);
  const theirs = prompt.answers.filter((a) => a.author !== username);
  const showForm = !mine || (editing && answer !== mine.content);

  async function saveAnswer() {
    if (!answer.trim() || saving) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/journals/${journal.shareId}/prompts/${prompt.id}/answers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ author: username, content: answer.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save answer");
      setAnswer("");
      setEditing(false);
      router.refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Something went wrong", true);
    } finally {
      setSaving(false);
    }
  }

  async function deleteAnswer() {
    const res = await fetch(
      `/api/journals/${journal.shareId}/prompts/${prompt.id}/answers?author=${encodeURIComponent(username)}`,
      { method: "DELETE" }
    );
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast(data.error || "Could not delete", true);
      return;
    }
    router.refresh();
  }

  async function deletePrompt() {
    if (!window.confirm("Delete this prompt and all answers?")) return;
    const res = await fetch(
      `/api/journals/${journal.shareId}/prompts/${prompt.id}?author=${encodeURIComponent(username)}`,
      { method: "DELETE" }
    );
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast(data.error || "Could not delete", true);
      return;
    }
    router.refresh();
  }

  return (
    <article className="prompt">
      <div className="prompt-head-row">
        <span className="avatar">{initials(prompt.author)}</span>
        <div className="grow">
          <div className="q">{prompt.question}</div>
          <div className="by">
            {prompt.author} · {timeAgo(prompt.createdAt)} · {prompt.answers.length} {prompt.answers.length === 1 ? "answer" : "answers"}
          </div>
        </div>
        {prompt.author === username && (
          <button className="icon" onClick={deletePrompt} title="Delete prompt" aria-label="Delete prompt" style={{ opacity: 0.6 }}>
            <Icon name="trash" size={14} />
          </button>
        )}
      </div>

      <div className="answers">
        {mine && !editing && (
          <div className="answer">
            <div className="who">
              <span className="avatar">{initials(mine.author)}</span>
              <b>you</b>
              <span className="when">{timeAgo(mine.createdAt)}</span>
            </div>
            <div className="txt">{mine.content}</div>
            <div className="acts">
              <button className="subtle small" onClick={() => { setAnswer(mine.content); setEditing(true); }}>
                Edit
              </button>
              <button className="subtle small" onClick={deleteAnswer} style={{ color: "var(--danger)" }}>
                Delete
              </button>
            </div>
          </div>
        )}

        {theirs.map((a, i) => (
          <div className="answer" key={`${a.author}-${i}`}>
            <div className="who">
              <span className="avatar">{initials(a.author)}</span>
              <b>{a.author}</b>
              <span className="when">{timeAgo(a.createdAt)}</span>
            </div>
            <div className="txt">{a.content}</div>
          </div>
        ))}

        {showForm && (
          <div className="answer-form">
            <textarea
              placeholder="Your answer (markdown ok)…"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
            />
            <div className="row" style={{ gap: 6 }}>
              <button className="small" onClick={saveAnswer} disabled={saving || !answer.trim()}>
                {saving ? "Saving…" : mine ? "Update" : "Answer"}
              </button>
              {editing && (
                <button className="ghost small" onClick={() => { setEditing(false); setAnswer(""); }}>
                  Cancel
                </button>
              )}
            </div>
          </div>
        )}

        {!mine && !showForm && null}
      </div>
    </article>
  );
}
