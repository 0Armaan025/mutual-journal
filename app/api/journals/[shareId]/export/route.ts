import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Journal } from "@/lib/models";
import { serializeJournal } from "@/lib/serialize";
import { fullTime } from "@/lib/format";

function toMarkdown(j: ReturnType<typeof serializeJournal>): string {
  const lines: string[] = [];
  lines.push(`# ${j.title}`, "");
  lines.push(`*A mutual vault · created ${fullTime(j.createdAt)} · ${j.docs.length} documents*`, "");
  for (const d of j.docs) {
    lines.push(`## ${d.title}`, "");
    lines.push(`*by ${d.createdBy || "someone"} · updated ${fullTime(d.updatedAt)}${d.pinned ? " · pinned" : ""}*`, "");
    lines.push(d.content || "_empty_", "");
    if (d.replies.length) {
      lines.push("**Comments**", "");
      for (const r of d.replies) lines.push(`- **${r.author}**: ${r.content}`, "");
    }
    lines.push("---", "");
  }
  if (j.prompts.length) {
    lines.push("## Prompts", "");
    for (const p of j.prompts) {
      lines.push(`### ${p.question}`, "");
      lines.push(`*asked by ${p.author} — ${fullTime(p.createdAt)}*`, "");
      for (const a of p.answers) lines.push(`**${a.author}:** ${a.content}`, "");
      lines.push("");
    }
  }
  return lines.join("\n");
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ shareId: string }> }
) {
  const { shareId } = await params;
  const format = new URL(request.url).searchParams.get("format") ?? "md";

  await connectToDatabase();
  const journal = await Journal.findOne({ shareId }).lean();
  if (!journal) {
    return NextResponse.json({ error: "Journal not found" }, { status: 404 });
  }
  const data = serializeJournal(journal as never);

  if (format === "json") {
    return new NextResponse(JSON.stringify(data, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${data.title.replace(/[^\w\- ]/g, "")}.json"`,
      },
    });
  }

  return new NextResponse(toMarkdown(data), {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="${data.title.replace(/[^\w\- ]/g, "")}.md"`,
    },
  });
}
