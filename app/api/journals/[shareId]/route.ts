import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Journal } from "@/lib/models";
import { serializeDoc, serializeJournal } from "@/lib/serialize";
import { ACCENTS } from "@/lib/storage";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ shareId: string }> }
) {
  const { shareId } = await params;
  await connectToDatabase();

  const journal = await Journal.findOne({ shareId }).lean();
  if (!journal) {
    return NextResponse.json({ error: "Journal not found" }, { status: 404 });
  }

  return NextResponse.json(serializeJournal(journal as never));
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ shareId: string }> }
) {
  const { shareId } = await params;
  const body = await request.json().catch(() => ({}));

  const update: Record<string, unknown> = {};
  if (typeof body.title === "string" && body.title.trim()) update.title = body.title.trim();
  if (typeof body.color === "string" && (ACCENTS as readonly string[]).includes(body.color)) update.color = body.color;

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  await connectToDatabase();
  const journal = await Journal.findOneAndUpdate({ shareId }, update, { new: true }).lean();
  if (!journal) {
    return NextResponse.json({ error: "Journal not found" }, { status: 404 });
  }

  return NextResponse.json(serializeJournal(journal as never));
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ shareId: string }> }
) {
  const { shareId } = await params;
  await connectToDatabase();
  const result = await Journal.deleteOne({ shareId });
  if (result.deletedCount === 0) {
    return NextResponse.json({ error: "Journal not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
