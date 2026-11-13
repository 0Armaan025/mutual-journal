import type { Doc, JournalData, Prompt } from "./types";

type Lean = { _id: unknown } & Record<string, unknown>;

function iso(v: unknown): string {
  if (v instanceof Date) return v.toISOString();
  const d = new Date(String(v));
  return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

function maybeIso(v: unknown): string | null {
  return v ? iso(v) : null;
}

export function serializeDoc(d: Lean): Doc {
  const reactions = Array.isArray(d.reactions)
    ? d.reactions.map((r: Lean) => ({ emoji: String(r.emoji), users: (r.users as string[]) ?? [] }))
    : [];
  const replies = Array.isArray(d.replies)
    ? d.replies.map((r: Lean) => ({
        id: String(r._id),
        author: String(r.author),
        content: String(r.content),
        createdAt: iso(r.createdAt),
      }))
    : [];
  const versions = Array.isArray(d.versions)
    ? d.versions.map((v: Lean) => ({
        id: String(v._id),
        author: String(v.author ?? ""),
        title: String(v.title ?? "Untitled"),
        content: String(v.content ?? ""),
        createdAt: iso(v.createdAt),
      }))
    : [];
  return {
    id: String(d._id),
    title: String(d.title ?? "Untitled"),
    content: String(d.content ?? ""),
    mood: d.mood ? String(d.mood) : null,
    tags: (d.tags as string[]) ?? [],
    pinned: Boolean(d.pinned),
    deleted: Boolean(d.deleted),
    reactions,
    replies,
    versions,
    createdBy: String(d.createdBy ?? ""),
    updatedBy: String(d.updatedBy ?? d.createdBy ?? ""),
    createdAt: iso(d.createdAt),
    updatedAt: iso(d.updatedAt ?? d.createdAt),
  };
}

export function serializePrompt(p: Lean): Prompt {
  const answers = Array.isArray(p.answers)
    ? p.answers.map((a: Lean) => ({
        author: String(a.author),
        content: String(a.content),
        createdAt: iso(a.createdAt),
      }))
    : [];
  return {
    id: String(p._id),
    question: String(p.question),
    author: String(p.author),
    answers,
    createdAt: iso(p.createdAt),
  };
}

// pull a doc title out of an entry's markdown: first heading, else first line, else "Untitled"
function titleFromContent(content: string, fallbackIndex: number): string {
  const firstLine = content.split("\n").find((l) => l.trim()) ?? "";
  const heading = firstLine.replace(/^#{1,6}\s*/, "").trim();
  return heading.slice(0, 80) || `Note ${fallbackIndex}`;
}

export function serializeJournal(j: Lean): JournalData {
  const rawEntries = (j.entries as Lean[]) ?? [];
  const rawDocs = (j.docs as Lean[]) ?? [];

  // legacy migration: journals that only have entries get them folded into docs
  const needsMigration = rawDocs.length === 0 && rawEntries.length > 0;
  const all: Doc[] = needsMigration
    ? rawEntries.map((e, i) => ({
        id: String(e._id),
        title: titleFromContent(String(e.content ?? ""), i + 1),
        content: String(e.content ?? ""),
        mood: e.mood ? String(e.mood) : null,
        tags: (e.tags as string[]) ?? [],
        pinned: Boolean(e.pinned),
        reactions: Array.isArray(e.reactions)
          ? e.reactions.map((r: Lean) => ({ emoji: String(r.emoji), users: (r.users as string[]) ?? [] }))
          : [],
        replies: Array.isArray(e.replies)
          ? e.replies.map((r: Lean) => ({
              id: String(r._id),
              author: String(r.author),
              content: String(r.content),
              createdAt: iso(r.createdAt),
            }))
          : [],
        createdBy: String(e.author ?? ""),
        updatedBy: String(e.author ?? ""),
        createdAt: iso(e.createdAt),
        updatedAt: iso(e.createdAt),
        versions: [],
        deleted: false,
      }))
    : rawDocs.map(serializeDoc);

  return {
    shareId: String(j.shareId),
    title: String(j.title),
    color: String(j.color ?? "amber"),
    createdAt: iso(j.createdAt),
    docs: all.filter((d) => !d.deleted),
    trash: all.filter((d) => d.deleted),
    prompts: ((j.prompts as Lean[]) ?? []).map(serializePrompt),
    presence: ((j.presence as Lean[]) ?? []).map((p) => ({ name: String(p.name), at: iso(p.at) })),
    migrated: needsMigration,
  };
}
