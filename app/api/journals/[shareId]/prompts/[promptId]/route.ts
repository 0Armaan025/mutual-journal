import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Journal } from "@/lib/models";
import { serializePrompt } from "@/lib/serialize";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ shareId: string; promptId: string }> }
) {
  const { shareId, promptId } = await params;
  const author = new URL(request.url).searchParams.get("author") ?? "";

  if (!author) {
    return NextResponse.json({ error: "Author is required" }, { status: 400 });
  }

  await connectToDatabase();
  const journal = await Journal.findOne({ shareId });
  if (!journal) {
    return NextResponse.json({ error: "Journal not found" }, { status: 404 });
  }
  const prompt = journal.prompts.id(promptId);
  if (!prompt) {
    return NextResponse.json({ error: "Prompt not found" }, { status: 404 });
  }
  if (prompt.author !== author) {
    return NextResponse.json({ error: "Only the author can delete this prompt" }, { status: 403 });
  }

  prompt.deleteOne();
  await journal.save();

  return NextResponse.json({ ok: true, id: promptId });
}
