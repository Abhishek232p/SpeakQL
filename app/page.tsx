import { createSupabaseAuthProvider } from "@/src/server/auth/supabase";

const capabilities = [
  { number: "01", title: "Define the outcome", text: "Start with the role, environment, and real-world performance you want to unlock." },
  { number: "02", title: "Build the capability map", text: "Separate language, domain knowledge, communication, judgment, and practical performance." },
  { number: "03", title: "Practice with evidence", text: "Turn lessons and simulations into observable evidence, useful feedback, and a next action." },
];

export default async function Home() {
  const authProvider = createSupabaseAuthProvider();
  const identity = await authProvider.getIdentity();

  return (
    <main>
      <nav className="nav shell" aria-label="Primary navigation">
        <a className="wordmark" href="#top" aria-label="SpeakQL home"><span>Speak</span>QL</a>
        <div className="nav-links">
          <a href="#method">Method</a>
          <a href="#status">Status</a>
          {identity ? (
            <a className="nav-cta" href="/dashboard">Go to Dashboard</a>
          ) : (
            <a className="nav-cta" href="/login">Sign In</a>
          )}
        </div>
      </nav>

      <section className="hero shell" id="top">
        <div className="hero-copy">
          <p className="eyebrow"><span className="pulse" /> Professional capability, in context</p>
          <h1>Become capable of performing in the <em>world</em> you choose.</h1>
          <p className="hero-lede">SpeakQL helps people move from a goal to measurable real-world competence across language, profession, culture, and environment.</p>
          <div className="hero-actions"><a className="button button-primary" href="#method">Explore the approach <span>↗</span></a><a className="text-link" href="#status">See what is real today <span>↓</span></a></div>
        </div>
        <div className="hero-orbit" aria-hidden="true"><div className="orbit-ring ring-one" /><div className="orbit-ring ring-two" /><div className="orbit-core"><span>goal</span><strong>→</strong><span>capability</span></div><span className="orbit-label label-one">language</span><span className="orbit-label label-two">judgment</span><span className="orbit-label label-three">performance</span></div>
      </section>

      <section className="statement shell"><p className="section-kicker">The premise</p><h2>Learning a language is a start.<br /><span>Performing in a world is the work.</span></h2><div className="statement-grid"><p>Whether you are preparing for a new profession, a new country, or a high-stakes conversation, capability is more than knowing the words.</p><p>SpeakQL is being built to connect what you need to know with what you need to do — then make progress visible.</p></div></section>

      <section className="method shell" id="method"><div className="section-heading"><p className="section-kicker">A connected practice system</p><h2>From intention<br /><span>to performance.</span></h2></div><div className="capability-list">{capabilities.map((capability) => <article className="capability" key={capability.number}><span className="capability-number">{capability.number}</span><div><h3>{capability.title}</h3><p>{capability.text}</p></div><span className="arrow">↗</span></article>)}</div></section>

      <section className="status shell" id="status"><div className="status-card"><p className="section-kicker">Foundation status · v0.1.0</p><h2>A clear beginning,<br /><span>not a false promise.</span></h2><p>SpeakQL is in its infrastructure foundation phase. The product direction is defined; coaching, voice conversations, simulations, evaluation, and mastery intelligence are planned capabilities—not available features yet.</p><a className="button button-secondary" href="#top" aria-label="Return to the SpeakQL project overview">Read the project notes <span>↗</span></a></div></section>

      <footer className="footer shell"><a className="wordmark" href="#top"><span>Speak</span>QL</a><p>Capability, practiced in context.</p><p>© 2026 SpeakQL · Foundation build</p></footer>
    </main>
  );
}
