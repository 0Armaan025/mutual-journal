import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Journal } from "@/lib/models";
import { serializeDoc } from "@/lib/serialize";

// fold legacy entries into docs on first write so old journals keep their history
async function ensureDocs(journal: Awaited<ReturnType<typeof Journal.findOne>>, username: string) {
  if (journal.docs.length === 0 && journal.entries.length > 0) {
    for (let i = 0; i < journal.entries.length; i++) {
      const e = journal.entries[i];
      const firstLine = e.content.split("\n").find((l: string) => l.trim()) ?? "";
      const heading = firstLine.replace(/^#{1,6}\s*/, "").trim();
      journal.docs.push({
        title: heading.slice(0, 80) || `Note ${i + 1}`,
        content: e.content,
        mood: e.mood ?? null,
        tags: e.tags ?? [],
        pinned: e.pinned ?? false,
        reactions: e.reactions ?? [],
        replies: e.replies ?? [],
        createdBy: e.author,
        updatedBy: e.author,
      } as never);
    }
    journal.entries = [];
    journal.markModified("docs");
    journal.markModified("entries");
    await journal.save();
  } else if (journal.docs.length === 0) {
    journal.docs.push({ title: "Untitled", content: "", createdBy: username, updatedBy: username } as never);
    journal.markModified("docs");
    await journal.save();
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ shareId: string }> }
) {
  const { shareId } = await params;
  const body = await request.json().catch(() => ({}));
  const author = typeof body.author === "string" ? body.author.trim() : "";
  const title = typeof body.title === "string" && body.title.trim() ? body.title.trim().slice(0, 120) : "Untitled";
  const content = typeof body.content === "string" ? body.content : "";

  if (!author) {
    return NextResponse.json({ error: "Pick a username first" }, { status: 400 });
  }

  await connectToDatabase();
  const journal = await Journal.findOne({ shareId });
  if (!journal) {
    return NextResponse.json({ error: "Journal not found" }, { status: 404 });
  }

  await ensureDocs(journal, author);
  journal.docs.push({ title, content, createdBy: author, updatedBy: author } as never);
  journal.markModified("docs");
  await journal.save();

  return NextResponse.json(serializeDoc(journal.docs[journal.docs.length - 1] as never));
}
