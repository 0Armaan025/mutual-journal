import { Suspense } from "react";
import SearchClient from "./SearchClient";

export const dynamic = "force-dynamic";

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  return (
    <div className="page">
      <div className="page-head">
        <h1>Search</h1>
        <p>Across every journal on this device. {q ? `Results for “${q}”.` : "Type at least two characters."}</p>
      </div>
      <Suspense fallback={<div className="panel"><div className="panel-body skeleton" style={{ height: 120 }} /></div>}>
        <SearchClient query={q} />
      </Suspense>
    </div>
  );
}
