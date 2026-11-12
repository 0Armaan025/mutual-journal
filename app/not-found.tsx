import Link from "next/link";

export default function NotFound() {
  return (
    <div className="center-col">
      <h1>This page doesn't exist</h1>
      <p>The link may be mistyped, or the journal was never created.</p>
      <Link href="/" className="ghost" style={{ padding: "8px 16px", borderRadius: 6, border: "1px solid var(--border)", color: "var(--text-dim)", fontSize: 14 }}>
        ← Back to dashboard
      </Link>
    </div>
  );
}
