export default function DashboardLoading() {
  return (
    <div className="page wide">
      <div className="page-head">
        <div className="skeleton" style={{ height: 34, width: 320, marginBottom: 10 }} />
        <div className="skeleton" style={{ height: 15, width: 380 }} />
      </div>

      <div className="stat-row" style={{ marginBottom: 34 }}>
        {[0, 1, 2, 3].map((i) => (
          <div key={i}>
            <div className="skeleton" style={{ height: 30, width: 52, marginBottom: 6 }} />
            <div className="skeleton" style={{ height: 12, width: 64 }} />
          </div>
        ))}
      </div>

      <section className="section">
        <div className="section-head">
          <div className="skeleton" style={{ height: 13, width: 96 }} />
          <div className="skeleton" style={{ height: 12, width: 44 }} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton" style={{ height: 38, width: `${88 - i * 12}%` }} />
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <div className="skeleton" style={{ height: 13, width: 76 }} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} style={{ display: "flex", gap: 9, alignItems: "center" }}>
              <div className="skeleton" style={{ width: 22, height: 22, borderRadius: "50%", flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div className="skeleton" style={{ height: 12, width: `${60 - i * 8}%`, marginBottom: 5 }} />
                <div className="skeleton" style={{ height: 12, width: `${80 - i * 6}%` }} />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
