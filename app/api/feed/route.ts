import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Journal } from "@/lib/models";
import { serializeDoc } from "@/lib/serialize";
import { wordCount } from "@/lib/format";
import type { FeedItem } from "@/lib/types";

export async function GET(request: Request) {
  const idsParam = new URL(request.url).searchParams.get("ids") ?? "";
  const ids = idsParam.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 50);

  if (ids.length === 0) {
    return NextResponse.json({ items: [], totals: { journals: 0, docs: 0, words: 0, activeThisWeek: 0 } });
  }

  await connectToDatabase();
  const journals = await Journal.find({ shareId: { $in: ids } }).lean();

  const items: FeedItem[] = [];
  let docs = 0;
  let words = 0;
  let activeThisWeek = 0;
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

  for (const j of journals) {
    const base = { shareId: String(j.shareId), title: String(j.title), color: String(j.color ?? "amber") };
    const raw = ((j.docs as never[]) ?? []).length > 0 || !((j.entries as never[]) ?? []).length
      ? (j.docs as never[])
      : (j.entries as never[]);
    for (const d of raw) {
      const doc = serializeDoc(d as never);
      docs += 1;
      words += wordCount(doc.content);
      if (new Date(doc.updatedAt).getTime() >= weekAgo) activeThisWeek += 1;
      items.push({ journal: base, doc });
    }
  }
  items.sort((a, b) => (a.doc.updatedAt < b.doc.updatedAt ? 1 : -1));

  return NextResponse.json({
    items: items.slice(0, 20),
    totals: { journals: journals.length, docs, words, activeThisWeek },
  });
}
