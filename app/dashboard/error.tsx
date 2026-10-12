'use client';

export default function DashboardError({ reset }: { reset: () => void }) {
  return (
    <main className="dashboard-page" role="alert">
      <section className="dashboard-error shell" aria-labelledby="dashboard-error-heading">
        <p className="section-kicker">Dashboard unavailable</p>
        <h1 id="dashboard-error-heading">We couldn&apos;t load your learning plan.</h1>
        <p>Your saved work is unchanged. Try loading the dashboard again.</p>
        <button type="button" className="button button-primary" onClick={reset}>Try again</button>
      </section>
    </main>
  );
}
