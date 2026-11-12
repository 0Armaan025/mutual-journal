import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Journal } from "@/lib/models";
import { serializeJournal } from "@/lib/serialize";

// lightweight presence: clients heartbeat every ~15s; entries older than 60s are pruned
export async function POST(
  request: Request,
  { params }: { params: Promise<{ shareId: string }> }
) {
  const { shareId } = await params;
  const body = await request.json().catch(() => ({}));
  const name = typeof body.name === "string" ? body.name.trim() : "";

  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  await connectToDatabase();
  const journal = await Journal.findOne({ shareId });
  if (!journal) {
    return NextResponse.json({ error: "Journal not found" }, { status: 404 });
  }

  const cutoff = new Date(Date.now() - 60_000);
  type P = { name: string; at: Date };
  const presence = journal.presence as unknown as P[];
  const kept = presence.filter((p) => p.name === name || p.at >= cutoff);
  const mine = kept.find((p) => p.name === name);
  if (mine) mine.at = new Date();
  else kept.push({ name, at: new Date() });
  journal.presence = kept as never;
  journal.markModified("presence");
  await journal.save();

  return NextResponse.json(serializeJournal(journal as never));
}
