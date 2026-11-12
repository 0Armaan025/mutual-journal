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
  const pinned = typeof body.pinned === "boolean" ? body.pinned : undefined;

  await connectToDatabase();
  const journal = await Journal.findOne({ shareId });
  if (!journal) {
    return NextResponse.json({ error: "Journal not found" }, { status: 404 });
  }
  const doc = journal.docs.id(docId);
  if (!doc) {
    return NextResponse.json({ error: "Doc not found" }, { status: 404 });
  }

  doc.pinned = pinned ?? !doc.pinned;
  journal.markModified("docs");
  await journal.save();

  return NextResponse.json(serializeDoc(doc as never));
}
