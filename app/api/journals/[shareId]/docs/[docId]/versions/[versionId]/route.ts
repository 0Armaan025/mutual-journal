import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Journal } from "@/lib/models";
import { serializeDoc } from "@/lib/serialize";

type Ctx = { params: Promise<{ shareId: string; docId: string; versionId: string }> };

// restore a historic version: pushes current state as a new version, then applies the target
export async function POST(request: Request, { params }: Ctx) {
  const { shareId, docId, versionId } = await params;
  const body = await request.json().catch(() => ({}));
  const author = typeof body.author === "string" ? body.author.trim() : "";

  if (!author || !versionId) {
    return NextResponse.json({ error: "Author and versionId are required" }, { status: 400 });
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
  const target = doc.versions.id(versionId);
  if (!target) {
    return NextResponse.json({ error: "Version not found" }, { status: 404 });
  }

  // keep the current state restorable too
  if (doc.content || doc.title !== "Untitled") {
    doc.versions.push({
      author: doc.updatedBy || "someone",
      title: doc.title,
      content: doc.content,
    } as never);
  }
  doc.versions = (doc.versions as unknown as { _id: unknown }[]).filter((v) => String(v._id) !== versionId) as never;
  if (doc.versions.length > 20) doc.versions = doc.versions.slice(doc.versions.length - 20) as never;

  doc.title = target.title;
  doc.content = target.content;
  doc.updatedBy = author;
  journal.markModified("docs");
  await journal.save();

  return NextResponse.json(serializeDoc(doc as never));
}
