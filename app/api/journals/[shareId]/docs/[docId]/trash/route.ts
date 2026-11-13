import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Journal } from "@/lib/models";
import { serializeDoc } from "@/lib/serialize";

type Ctx = { params: Promise<{ shareId: string; docId: string }> };

// soft-delete: moves the doc to trash (restorable)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ shareId: string; docId: string }> }
) {
  const { shareId, docId } = await params;
  const author = new URL(request.url).searchParams.get("author") ?? "";
  if (!author) {
    return NextResponse.json({ error: "Author is required" }, { status: 400 });
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

  doc.deleted = true;
  doc.deletedAt = new Date();
  doc.pinned = false;
  doc.updatedBy = author;
  journal.markModified("docs");
  await journal.save();

  return NextResponse.json({ ok: true, id: docId });
}

// restore from trash
export async function POST(
  request: Request,
  { params }: { params: Promise<{ shareId: string; docId: string }> }
) {
  const { shareId, docId } = await params;
  const author = new URL(request.url).searchParams.get("author") ?? "";
  if (!author) {
    return NextResponse.json({ error: "Author is required" }, { status: 400 });
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

  doc.deleted = false;
  doc.deletedAt = null;
  doc.updatedBy = author;
  journal.markModified("docs");
  await journal.save();

  return NextResponse.json(serializeDoc(doc as never));
}
