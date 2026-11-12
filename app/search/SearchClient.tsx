"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/Toaster";
import { timeAgo } from "@/lib/format";
import type { SearchHit } from "@/lib/types";

export default function SearchClient({ query }: { query: string }) {
  const router = useRouter();
  const toast = useToast();
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query.trim().length < 2) {
      setHits([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetch(`/api/search?q=${encodeURIComponent(query.trim())}`)
      .then((r) => r.json())
      .then((data: { hits: SearchHit[] }) => !cancelled && setHits(data.hits ?? []))
      .catch(() => toast("Search failed", true))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [query, toast]);

  if (query.trim().length < 2) {
    return (
      <section className="section">
        <div className="muted">Start typing above to search entries, prompts, and journals.</div>
      </section>
    );
  }

  return (
    <section className="section">
      <div className="section-head">
        <h2>Results</h2>
        <span className="sub">{loading ? "searching…" : `${hits.length} found`}</span>
      </div>
      {hits.length === 0 && !loading ? (
        <div className="muted">No matches for “{query}”.</div>
      ) : (
        <div>
          {hits.map((hit, i) => (
            <a
              key={`${hit.kind}-${hit.id}-${i}`}
              className="hit"
              href={`/journal/${hit.journal.shareId}${hit.kind === "doc" ? `#doc-${hit.id}` : ""}`}
              onClick={(e) => {
                e.preventDefault();
                router.push(`/journal/${hit.journal.shareId}${hit.kind === "doc" ? `#doc-${hit.id}` : ""}`);
              }}
            >
              <div className="where">
                <span className="k">{hit.kind}</span>
                <span>{hit.journal.title}</span>
                {hit.author && (
                  <>
                    <span>·</span>
                    <span>{hit.author}</span>
                  </>
                )}
                <span>·</span>
                <span>{timeAgo(hit.createdAt)}</span>
              </div>
              <div className="txt">{hit.text.replace(/[#*`>]/g, "").slice(0, 220)}</div>
            </a>
          ))}
        </div>
      )}
    </section>
  );
}
