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
  const content = typeof body.content === "string" ? body.content.trim() : "";

  if (!author || !content) {
    return NextResponse.json({ error: "Author and reply content are required" }, { status: 400 });
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

  doc.replies.push({ author, content });
  journal.markModified("docs");
  await journal.save();

  return NextResponse.json(serializeDoc(doc as never));
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ shareId: string; docId: string }> }
) {
  const { shareId, docId } = await params;
  const url = new URL(request.url);
  const author = url.searchParams.get("author") ?? "";
  const replyId = url.searchParams.get("replyId") ?? "";

  if (!author || !replyId) {
    return NextResponse.json({ error: "Author and replyId are required" }, { status: 400 });
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
  const reply = doc.replies.id(replyId);
  if (!reply) {
    return NextResponse.json({ error: "Reply not found" }, { status: 404 });
  }
  if (reply.author !== author) {
    return NextResponse.json({ error: "Only the author can delete this reply" }, { status: 403 });
  }

  reply.deleteOne();
  journal.markModified("docs");
  await journal.save();

  return NextResponse.json(serializeDoc(doc as never));
}
