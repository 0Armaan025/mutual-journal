import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Journal } from "@/lib/models";
import { serializePrompt } from "@/lib/serialize";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ shareId: string }> }
) {
  const { shareId } = await params;
  const body = await request.json().catch(() => ({}));
  const question = typeof body.question === "string" ? body.question.trim() : "";
  const author = typeof body.author === "string" ? body.author.trim() : "";

  if (!author) {
    return NextResponse.json({ error: "Pick a username first" }, { status: 400 });
  }
  if (!question) {
    return NextResponse.json({ error: "Question is required" }, { status: 400 });
  }

  await connectToDatabase();
  const journal = await Journal.findOne({ shareId });
  if (!journal) {
    return NextResponse.json({ error: "Journal not found" }, { status: 404 });
  }

  journal.prompts.push({ question, author, answers: [] });
  await journal.save();

  return NextResponse.json(serializePrompt(journal.prompts[journal.prompts.length - 1] as never));
}
