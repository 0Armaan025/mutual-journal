import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Journal } from "@/lib/models";
import { serializeDoc } from "@/lib/serialize";
import type { SearchHit } from "@/lib/types";

export async function GET(request: Request) {
  const q = (new URL(request.url).searchParams.get("q") ?? "").trim();

  if (q.length < 2) {
    return NextResponse.json({ hits: [] as SearchHit[] });
  }

  const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");

  await connectToDatabase();
  const journals = await Journal.find({
    $or: [{ title: rx }, { "docs.content": rx }, { "docs.title": rx }, { "docs.tags": rx }, { "entries.content": rx }, { "prompts.question": rx }],
  })
    .lean()
    .limit(100);

  const hits: SearchHit[] = [];
  for (const j of journals) {
    const base = { shareId: String(j.shareId), title: String(j.title), color: String(j.color ?? "amber") };
    if (rx.test(String(j.title))) {
      hits.push({ kind: "journal", journal: base, author: "", text: j.title, createdAt: j.createdAt.toISOString(), id: String(j.shareId) });
    }
    for (const d of (j.docs as never[]) ?? []) {
      const doc = serializeDoc(d as never);
      if (rx.test(doc.content) || rx.test(doc.title) || doc.tags.some((t) => rx.test(t))) {
        hits.push({ kind: "doc", journal: base, author: doc.updatedBy || doc.createdBy, text: doc.content || doc.title, createdAt: doc.updatedAt, id: doc.id });
      }
    }
    for (const p of (j.prompts as never[]) ?? []) {
      if (rx.test(String((p as { question: string }).question))) {
        hits.push({
          kind: "prompt",
          journal: base,
          author: String((p as { author: string }).author),
          text: String((p as { question: string }).question),
          createdAt: new Date((p as { createdAt: Date }).createdAt).toISOString(),
          id: String((p as { _id: unknown })._id),
        });
      }
    }
  }
  hits.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  return NextResponse.json({ hits: hits.slice(0, 40) });
}
