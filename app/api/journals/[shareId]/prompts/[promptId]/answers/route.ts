import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Journal } from "@/lib/models";
import { serializePrompt } from "@/lib/serialize";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ shareId: string; promptId: string }> }
) {
  const { shareId, promptId } = await params;
  const body = await request.json().catch(() => ({}));
  const author = typeof body.author === "string" ? body.author.trim() : "";
  const content = typeof body.content === "string" ? body.content.trim() : "";

  if (!author || !content) {
    return NextResponse.json({ error: "Author and answer are required" }, { status: 400 });
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

  const answers = prompt.answers as unknown as { author: string; content: string }[];
  const mine = answers.find((a) => a.author === author);
  if (mine) {
    mine.content = content;
  } else {
    prompt.answers.push({ author, content });
  }
  journal.markModified("prompts");
  await journal.save();

  return NextResponse.json(serializePrompt(prompt as never));
}

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

  const answers = prompt.answers as unknown as { author: string; content: string; deleteOne: () => void }[];
  const answer = answers.find((a) => a.author === author);
  if (!answer) {
    return NextResponse.json({ error: "You have no answer here" }, { status: 404 });
  }
  answer.deleteOne();
  journal.markModified("prompts");
  await journal.save();

  return NextResponse.json(serializePrompt(prompt as never));
}
