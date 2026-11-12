"use client";

import { useMemo } from "react";
import { dayKey, wordCount, extractTags, timeAgo } from "@/lib/format";
import { moodDef, moodLabel } from "@/lib/moods";
import Icon from "@/components/Icons";
import type { JournalData } from "@/lib/types";

const DAYS = 91;

export default function StatsTab({ journal }: { journal: JournalData }) {
  const stats = useMemo(() => {
    const docs = journal.docs;
    const words = docs.reduce((sum, d) => sum + wordCount(d.content), 0);
    const promptAnswers = journal.prompts.reduce((sum, p) => sum + p.answers.length, 0);

    const perDay = new Map<string, number>();
    const perWriter = new Map<string, { docs: number; words: number }>();
    const tagCounts = new Map<string, number>();
    const moodCounts = new Map<string, number>();

    const bumpWriter = (name: string, w: number) => {
      if (!name) return;
      const cur = perWriter.get(name) ?? { docs: 0, words: 0 };
      cur.docs += 1;
      cur.words += w;
      perWriter.set(name, cur);
    };

    for (const d of docs) {
      perDay.set(dayKey(d.updatedAt), (perDay.get(dayKey(d.updatedAt)) ?? 0) + 1);
      const w = wordCount(d.content);
      bumpWriter(d.createdBy, w);
      if (d.updatedBy && d.updatedBy !== d.createdBy) bumpWriter(d.updatedBy, w);
      for (const t of [...d.tags, ...extractTags(d.content)]) tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1);
      if (d.mood) moodCounts.set(d.mood, (moodCounts.get(d.mood) ?? 0) + 1);
    }

    let streak = 0;
    const cursor = new Date();
    if (!perDay.get(dayKey(cursor.toISOString()))) cursor.setDate(cursor.getDate() - 1);
    while (perDay.get(dayKey(cursor.toISOString()))) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }

    const cells: { key: string; count: number }[] = [];
    const start = new Date();
    start.setDate(start.getDate() - (DAYS - 1));
    for (let i = 0; i < DAYS; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const k = dayKey(d.toISOString());
      cells.push({ key: k, count: perDay.get(k) ?? 0 });
    }

    const maxDayCount = Math.max(1, ...cells.map((c) => c.count));
    const maxWriter = Math.max(1, ...[...perWriter.values()].map((v) => v.docs));

    return {
      docs: docs.length,
      words,
      prompts: journal.prompts.length,
      promptAnswers,
      streak,
      activeDays: perDay.size,
      cells,
      maxDayCount,
      perWriter: [...perWriter.entries()].sort((a, b) => b[1].docs - a[1].docs),
      maxWriter,
      tagCounts: [...tagCounts.entries()].sort((a, b) => b[1] - a[1]),
      moodCounts: [...moodCounts.entries()].sort((a, b) => b[1] - a[1]),
      moodMax: Math.max(1, ...[...moodCounts.values()]),
      docRows: [...docs].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    };
  }, [journal]);

  const pct = (n: number, max: number) => `${Math.max(4, Math.round((n / max) * 100))}%`;

  return (
    <>
      <div className="stat-row" style={{ marginBottom: 24 }}>
        <div className="stat">
          <div className="v">{stats.docs}</div>
          <div className="k">documents</div>
        </div>
        <div className="stat">
          <div className="v">{stats.words.toLocaleString()}</div>
          <div className="k">words</div>
        </div>
        <div className="stat">
          <div className="v">{stats.streak}</div>
          <div className="k">day streak</div>
        </div>
        <div className="stat">
          <div className="v">{stats.activeDays}</div>
          <div className="k">active days</div>
        </div>
      </div>

      <div className="stats-grid">
        <div>
          <section className="section">
            <div className="section-head">
              <h2>Activity</h2>
              <span className="sub">last {DAYS} days</span>
            </div>
            <div className="heat">
              {stats.cells.map((c) => (
                <span
                  key={c.key}
                  className="cell"
                  data-l={c.count === 0 ? 0 : Math.min(4, Math.ceil((c.count / stats.maxDayCount) * 4))}
                  title={`${c.key}: ${c.count} edit${c.count === 1 ? "" : "s"}`}
                />
              ))}
            </div>
            <div className="legend">
              <span>less</span>
              <span className="cell" data-l="0" />
              <span className="cell" data-l="2" style={{ background: "color-mix(in srgb, var(--accent) 32%, var(--bg))" }} />
              <span className="cell" data-l="3" style={{ background: "color-mix(in srgb, var(--accent) 55%, var(--bg))" }} />
              <span className="cell" data-l="4" style={{ background: "var(--accent)" }} />
              <span>more</span>
            </div>
          </section>

          <section className="section">
            <div className="section-head">
              <h2>Writers</h2>
              <span className="sub">documents per person</span>
            </div>
            {stats.perWriter.length === 0 ? (
              <div className="muted">No documents yet.</div>
            ) : (
              <table className="ntable">
                <thead>
                  <tr>
                    <th>Writer</th>
                    <th style={{ width: "55%" }}>Docs</th>
                    <th style={{ textAlign: "right" }}>Words</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.perWriter.map(([author, v]) => (
                    <tr key={author}>
                      <td>{author}</td>
                      <td>
                        <span className="bar" style={{ width: pct(v.docs, stats.maxWriter) }} />
                        <span className="num">{v.docs}</span>
                      </td>
                      <td className="num" style={{ textAlign: "right" }}>{v.words.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          <section className="section">
            <div className="section-head">
              <h2>Documents</h2>
              <span className="sub">newest edits first</span>
            </div>
            {stats.docRows.length === 0 ? (
              <div className="muted">Nothing written yet.</div>
            ) : (
              <table className="ntable">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th style={{ textAlign: "right" }}>Words</th>
                    <th style={{ textAlign: "right" }}>Edited</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.docRows.map((d) => (
                    <tr key={d.id}>
                      <td>
                        {d.pinned && <Icon name="star" size={12} />} {d.title || "Untitled"}
                      </td>
                      <td className="num" style={{ textAlign: "right" }}>{wordCount(d.content)}</td>
                      <td className="num muted" style={{ textAlign: "right" }}>{timeAgo(d.updatedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          <section className="section">
            <div className="section-head">
              <h2>Prompts</h2>
            </div>
            <table className="ntable">
              <tbody>
                <tr>
                  <td>Questions asked</td>
                  <td className="num" style={{ textAlign: "right" }}>{stats.prompts}</td>
                </tr>
                <tr>
                  <td>Answers given</td>
                  <td className="num" style={{ textAlign: "right" }}>{stats.promptAnswers}</td>
                </tr>
              </tbody>
            </table>
          </section>
        </div>

        <div>
          <section className="section">
            <div className="section-head">
              <h2>Tags</h2>
              <span className="sub">incl. #hashtags</span>
            </div>
            {stats.tagCounts.length === 0 ? (
              <div className="muted">No tags used yet.</div>
            ) : (
              <table className="ntable">
                <tbody>
                  {stats.tagCounts.map(([t, n]) => (
                    <tr key={t}>
                      <td>#{t}</td>
                      <td className="num" style={{ textAlign: "right" }}>{n}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          <section className="section">
            <div className="section-head">
              <h2>Moods</h2>
              <span className="sub">how it felt</span>
            </div>
            {stats.moodCounts.length === 0 ? (
              <div className="muted">No moods logged yet.</div>
            ) : (
              <table className="ntable">
                <tbody>
                  {stats.moodCounts.map(([m, n]) => (
                    <tr key={m}>
                      <td>
                        <span className="mood-pill">
                          <Icon name={moodDef(m)?.icon ?? "moodHappy"} size={13} />
                          {moodLabel(m)}
                        </span>
                      </td>
                      <td>
                        <span className="bar" style={{ width: pct(n, stats.moodMax) }} />
                        <span className="num">{n}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
