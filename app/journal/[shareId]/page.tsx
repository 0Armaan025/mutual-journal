import { notFound } from "next/navigation";
import { connectToDatabase } from "@/lib/mongodb";
import { Journal } from "@/lib/models";
import { serializeJournal } from "@/lib/serialize";
import JournalClient from "@/components/journal/JournalClient";
import type { JournalData } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function JournalPage({ params }: { params: Promise<{ shareId: string }> }) {
  const { shareId } = await params;
  await connectToDatabase();
  const journal = await Journal.findOne({ shareId }).lean();
  if (!journal) notFound();

  const data: JournalData = serializeJournal(journal as never);

  return <JournalClient journal={data} />;
}
