export default function JournalLoading() {
  return (
    <div className="page">
      <div className="jhead">
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <div className="skeleton" style={{ width: 30, height: 30, borderRadius: 6 }} />
          <div className="skeleton" style={{ height: 36, width: 220 }} />
        </div>
      </div>
      <div className="skeleton" style={{ height: 14, width: 340, margin: "8px 0 16px" }} />

      <div className="tabs" aria-hidden>
        {[80, 76, 40, 62].map((w, i) => (
          <div key={i} className="skeleton" style={{ height: 14, width: w }} />
        ))}
      </div>

      <div className="doctabs" aria-hidden>
        {[180, 120, 96].map((w, i) => (
          <div key={i} className="skeleton" style={{ height: 26, width: w, borderRadius: 6 }} />
        ))}
      </div>

      <div className="skeleton" style={{ height: 34, width: 260, margin: "14px 0 10px" }} />
      <div className="skeleton" style={{ height: 13, width: 300, marginBottom: 20 }} />

      <div className="skeleton" style={{ height: 120, borderRadius: "0 0 6px 6px", marginBottom: 26 }} />

      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {[0, 1].map((i) => (
          <div key={i} style={{ borderTop: "1px solid var(--border)", paddingTop: 18 }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
              <div className="skeleton" style={{ width: 22, height: 22, borderRadius: "50%" }} />
              <div className="skeleton" style={{ height: 13, width: 64 }} />
              <div className="skeleton" style={{ height: 12, width: 48, marginLeft: "auto" }} />
            </div>
            <div className="skeleton" style={{ height: 14, width: `${92 - i * 10}%`, marginBottom: 7 }} />
            <div className="skeleton" style={{ height: 14, width: `${84 - i * 8}%`, marginBottom: 7 }} />
            <div className="skeleton" style={{ height: 14, width: `${46 + i * 6}%` }} />
          </div>
        ))}
      </div>
    </div>
  );
}
