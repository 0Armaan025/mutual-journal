import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Journal } from "@/lib/models";
import { serializeDoc } from "@/lib/serialize";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ shareId: string; docId: string }> }
) {
  const { shareId, docId } = await params;
  const body = await request.json().catch(() => ({}));
  const author = typeof body.author === "string" ? body.author.trim() : "";
  const emoji = typeof body.emoji === "string" ? body.emoji : "";

  if (!author || !emoji) {
    return NextResponse.json({ error: "Author and emoji are required" }, { status: 400 });
  }

  await connectToDatabase();
  const journal = await Journal.findOne({ shareId });
  if (!journal) {
    return NextResponse.json({ error: "Journal not found" }, { status: 404 });
  }
  const doc = journal.docs.id(docId);
  if (!doc) {
    return NextResponse.json({ error: "Doc not found" }, { status: 404 });
  }

  const reactions = doc.reactions as unknown as { emoji: string; users: string[] }[];
  const existing = reactions.find((r) => r.emoji === emoji);
  if (!existing) {
    doc.reactions.push({ emoji, users: [author] });
  } else if (existing.users.includes(author)) {
    existing.users = existing.users.filter((u) => u !== author);
    if (existing.users.length === 0) {
      doc.reactions = (reactions.filter((r) => r.emoji !== emoji)) as never;
    }
  } else {
    existing.users.push(author);
  }
  journal.markModified("docs");
  await journal.save();

  return NextResponse.json(serializeDoc(doc as never));
}
