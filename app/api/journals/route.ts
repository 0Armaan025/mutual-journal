import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { connectToDatabase } from "@/lib/mongodb";
import { Journal } from "@/lib/models";
import { ACCENTS } from "@/lib/storage";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const color = typeof body.color === "string" && (ACCENTS as readonly string[]).includes(body.color) ? body.color : "amber";

  if (!title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  await connectToDatabase();

  const shareId = randomBytes(5).toString("base64url").slice(0, 10);
  const journal = await Journal.create({
    title,
    shareId,
    color,
    entries: [],
    prompts: [],
    docs: [{ title, content: "", createdBy: "", updatedBy: "" }],
  });

  return NextResponse.json({ shareId: journal.shareId, title: journal.title, color: journal.color });
}
