import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Journal } from "@/lib/models";
import { serializeDoc } from "@/lib/serialize";

type Ctx = { params: Promise<{ shareId: string; docId: string }> };

async function findJournalWithDoc(shareId: string, docId: string) {
  const journal = await Journal.findOne({ shareId });
  if (!journal) return { journal: null, doc: null };
  const doc = journal.docs.id(docId);
  return { journal, doc: doc ?? null };
}

export async function PATCH(request: Request, { params }: Ctx) {
  const { shareId, docId } = await params;
  const body = await request.json().catch(() => ({}));
  const author = typeof body.author === "string" ? body.author.trim() : "";

  if (!author) {
    return NextResponse.json({ error: "Author is required" }, { status: 400 });
  }

  const update: Record<string, unknown> = {};
  if (typeof body.content === "string") update.content = body.content;
  if (typeof body.title === "string") update.title = body.title.trim().slice(0, 120) || "Untitled";
  if (typeof body.mood === "string") update.mood = body.mood || null;
  if (body.mood === null) update.mood = null;
  if (Array.isArray(body.tags)) update.tags = body.tags.filter((t: unknown) => typeof t === "string");

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  await connectToDatabase();
  const { journal, doc } = await findJournalWithDoc(shareId, docId);
  if (!journal || !doc) {
    return NextResponse.json({ error: "Doc not found" }, { status: 404 });
  }

  // snapshot the previous state before overwriting (version history)
  const changingText = update.content !== undefined || update.title !== undefined;
  const snapshotContent = String(doc.content ?? "");
  const snapshotTitle = String(doc.title ?? "Untitled");
  if (changingText && (snapshotContent || snapshotTitle !== "Untitled")) {
    doc.versions.push({ author: doc.updatedBy || doc.createdBy || "someone", title: snapshotTitle, content: snapshotContent } as never);
    if (doc.versions.length > 20) {
      doc.versions = doc.versions.slice(doc.versions.length - 20) as never;
    }
  }

  Object.assign(doc, update);
  doc.updatedBy = author;
  journal.markModified("docs");
  await journal.save();

  return NextResponse.json(serializeDoc(doc as never));
}

export async function DELETE(request: Request, { params }: Ctx) {
  const { shareId, docId } = await params;
  const author = new URL(request.url).searchParams.get("author") ?? "";
  const forever = new URL(request.url).searchParams.get("forever") === "1";

  if (!author) {
    return NextResponse.json({ error: "Author is required" }, { status: 400 });
  }

  await connectToDatabase();
  const { journal, doc } = await findJournalWithDoc(shareId, docId);
  if (!journal || !doc) {
    return NextResponse.json({ error: "Doc not found" }, { status: 404 });
  }
  if (doc.createdBy && doc.createdBy !== author) {
    return NextResponse.json({ error: "Only the document's creator can delete it" }, { status: 403 });
  }

  if (forever) {
    doc.deleteOne();
    journal.markModified("docs");
    await journal.save();
    return NextResponse.json({ ok: true, id: docId });
  }

  // default: soft delete to trash
  doc.deleted = true;
  doc.deletedAt = new Date();
  doc.pinned = false;
  journal.markModified("docs");
  await journal.save();

  return NextResponse.json({ ok: true, id: docId, trashed: true });
}
