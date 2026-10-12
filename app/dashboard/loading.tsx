export default function DashboardLoading() {
  return (
    <main className="dashboard-page" aria-busy="true" aria-live="polite">
      <nav className="nav shell" aria-label="Primary navigation">
        <span className="wordmark"><span>Speak</span>QL</span>
        <span className="loading-label">Loading your learning plan…</span>
      </nav>
      <section className="dashboard-loading shell" aria-label="Loading dashboard content">
        <div className="loading-line loading-line-short" />
        <div className="loading-line loading-line-title" />
        <div className="loading-grid">
          <div className="loading-card" />
          <div className="loading-card" />
          <div className="loading-card" />
        </div>
        <div className="loading-card loading-card-large" />
      </section>
    </main>
  );
}
