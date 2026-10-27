import Link from "next/link";
import { WhaleMascot, SpeakQLLogo } from "@/src/client/components/whale-mascot";
import ScaleWithUsSection from "@/src/client/components/scale-with-us-section";
import InteractiveDemoShowcase from "@/src/client/components/interactive-demo-showcase";

const capabilities = [
  {
    number: "01",
    title: "Define Real-World Context",
    text: "Start with your genuine professional role, high-stakes scenarios, and everyday communication goals—not sterile textbook grammar.",
    href: "/method",
  },
  {
    number: "02",
    title: "Navigate The Island World",
    text: "Journey across luminous ocean islands with step-by-step interactive lessons, word-bank token builders, and spoken practice drills.",
    href: "/world",
  },
  {
    number: "03",
    title: "Practice With Immediate Feedback",
    text: "Receive instant linguistic evaluation on every response, review mistakes to earn back hearts, and watch your fluency surge.",
    href: "/method",
  },
];

const islandDestinations = [
  {
    name: "Foundational Lagoon",
    tag: "BEGINNER",
    desc: "Status reporting, essential syntax, and blocker articulation.",
    icon: "🏝️",
    accent: "#38bdf8",
  },
  {
    name: "Vocabulary Reef",
    tag: "VOCABULARY",
    desc: "Idiomatic expressions, technical vocabulary, and workplace phrasing.",
    icon: "🪸",
    accent: "#a855f7",
  },
  {
    name: "Conversation Cove",
    tag: "CONVERSATION",
    desc: "Spontaneous dialogue, cross-functional syncs, and stakeholder negotiation.",
    icon: "🌊",
    accent: "#ec4899",
  },
  {
    name: "Mastery Deep",
    tag: "ADVANCED",
    desc: "High-stakes communication, nuanced presentation, and natural debate.",
    icon: "💎",
    accent: "#fbbf24",
  },
];

export default function Home() {
  const startLearningHref = "/login";

  return (
    <main style={{ minHeight: "100vh", position: "relative", overflowX: "hidden" }}>
      {/* 1. Global Ocean Navigation Bar */}
      <nav className="nav shell" aria-label="Primary navigation">
        <Link className="wordmark" href="/" aria-label="SpeakQL home">
          <SpeakQLLogo size={38} showText={true} />
        </Link>
        <div className="nav-links">
          <Link href="/world">World</Link>
          <Link href="/method">Method</Link>
          <Link href="/manifesto">Philosophy</Link>
          <Link href="/scale">Scale &amp; Partners</Link>
          <Link className="nav-cta" href="/login">
            Start Learning <span>→</span>
          </Link>
        </div>
      </nav>

      {/* 2. Striking Ocean-World Hero Section with Purple Whale Mascot */}
      <section className="hero shell" id="top">
        <div className="hero-copy">
          <p className="eyebrow">
            <span className="pulse" /> Natural Language &amp; Real Communication
          </p>
          <h1>
            Become capable in the <em>world</em> you choose.
          </h1>
          <p className="hero-lede">
            Step into SpeakQL&apos;s living ocean world of personalized language learning.
            Build genuine confidence through interactive scenario lessons, instant evaluation feedback,
            and real communicative mastery.
          </p>
          <div className="hero-actions">
            <Link className="button button-primary" href={startLearningHref}>
              Start Learning <span>▶</span>
            </Link>
            <a className="button button-secondary" href="#live-demo">
              Experience Interactive Demo <span>↓</span>
            </a>
          </div>
        </div>

        {/* Hero Ocean Mascot Sphere */}
        <div className="hero-orbit" aria-hidden="true" style={{ position: "relative" }}>
          <div className="orbit-ring ring-one" />
          <div className="orbit-ring ring-two" />
          <div
            className="orbit-core"
            style={{
              width: "220px",
              height: "220px",
              background: "radial-gradient(circle at 35% 35%, #2e1065 0%, #111438 65%, #060919 100%)",
              border: "2px solid rgba(168, 85, 247, 0.6)",
              boxShadow: "0 0 45px rgba(168, 85, 247, 0.4), 0 0 80px rgba(56, 189, 248, 0.25) inset",
            }}
          >
            <WhaleMascot mood="happy" size={140} animated={true} />
          </div>
          <span className="orbit-label label-one">🗣️ Real Dialogue</span>
          <span className="orbit-label label-two">⚡ Instant Feedback</span>
          <span className="orbit-label label-three">💎 Fluency Gems</span>
        </div>
      </section>

      {/* 3. Live Interactive Product Simulator & Video Showcase */}
      <InteractiveDemoShowcase />

      {/* 4. The Islands of Fluency - Signature Ocean World Preview */}
      <section className="statement shell" id="islands">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "20px" }}>
          <div>
            <p className="section-kicker">THE ISLANDS OF FLUENCY</p>
            <h2>
              A living ocean journey.<br />
              <span>Connected by glowing pathways.</span>
            </h2>
          </div>
          <Link
            href="/world"
            style={{
              color: "#38bdf8",
              fontSize: "14px",
              fontWeight: 700,
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            Explore all 4 islands in detail →
          </Link>
        </div>

        <div style={{ marginTop: "40px" }}>
          <p style={{ color: "var(--muted)", maxWidth: "700px", fontSize: "16px", lineHeight: "1.7", margin: "0 0 32px" }}>
            Progression in SpeakQL is not a boring checklist. It is an adventurous path through
            interconnected islands where every lesson stone unlocks genuine communicative capability.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: "20px",
            }}
          >
            {islandDestinations.map((island) => (
              <Link
                key={island.name}
                href="/world"
                style={{
                  background: "rgba(18, 24, 62, 0.75)",
                  backdropFilter: "blur(16px)",
                  border: `1px solid rgba(139, 92, 246, 0.35)`,
                  borderRadius: "20px",
                  padding: "24px",
                  boxShadow: "0 8px 30px rgba(0, 0, 0, 0.35)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                  textDecoration: "none",
                  transition: "transform 0.2s ease, border-color 0.2s ease",
                }}
                className="island-preview-card"
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "32px" }}>{island.icon}</span>
                  <span
                    style={{
                      fontSize: "10px",
                      fontWeight: 800,
                      letterSpacing: "0.08em",
                      padding: "4px 10px",
                      borderRadius: "99px",
                      background: "rgba(255, 255, 255, 0.1)",
                      color: island.accent,
                      border: `1px solid ${island.accent}40`,
                    }}
                  >
                    {island.tag}
                  </span>
                </div>
                <h3 style={{ margin: "4px 0", fontSize: "18px", fontWeight: 800, color: "#ffffff" }}>
                  {island.name}
                </h3>
                <p style={{ margin: 0, fontSize: "13px", color: "var(--muted)", lineHeight: "1.6" }}>
                  {island.desc}
                </p>
                <span style={{ fontSize: "11px", fontWeight: 700, color: island.accent, marginTop: "auto", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                  View curriculum <span>→</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Connected Practice Method */}
      <section className="method shell" id="method">
        <div className="section-heading">
          <p className="section-kicker">A connected practice system</p>
          <h2>
            From intention<br />
            <span>to performance.</span>
          </h2>
        </div>
        <div className="capability-list">
          {capabilities.map((capability) => (
            <Link
              href={capability.href}
              className="capability"
              key={capability.number}
              style={{ textDecoration: "none" }}
            >
              <span className="capability-number">{capability.number}</span>
              <div>
                <h3>{capability.title}</h3>
                <p>{capability.text}</p>
              </div>
              <span className="arrow">↗</span>
            </Link>
          ))}
        </div>

        <div style={{ textAlign: "center", marginTop: "32px" }}>
          <Link
            href="/method"
            style={{
              color: "#c084fc",
              fontSize: "14px",
              fontWeight: 700,
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            Learn about our 4 Cognitive Pillars of Fluency →
          </Link>
        </div>
      </section>

      {/* 6. Human Philosophy Teaser */}
      <section
        className="shell"
        style={{
          margin: "40px auto 80px",
          padding: "40px",
          background: "linear-gradient(135deg, rgba(88, 28, 135, 0.25), rgba(15, 23, 58, 0.85))",
          border: "1.5px solid rgba(168, 85, 247, 0.35)",
          borderRadius: "24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "32px",
          flexWrap: "wrap",
        }}
      >
        <div style={{ maxWidth: "600px" }}>
          <span style={{ fontSize: "11px", fontWeight: 800, color: "#38bdf8", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            HUMAN BRAIN PHILOSOPHY
          </span>
          <h2 style={{ fontSize: "28px", fontWeight: 800, margin: "8px 0 12px", color: "#ffffff" }}>
            Why language is presence, not cartoon points.
          </h2>
          <p style={{ margin: 0, fontSize: "15px", color: "#cbd5e1", lineHeight: 1.6 }}>
            Discover why sterile flashcards fail under real conversational pressure, and how our psychological
            sanctuary model liberates people to speak with authentic authority.
          </p>
        </div>
        <Link className="button button-primary" href="/manifesto">
          Read The Philosophy <span>→</span>
        </Link>
      </section>

      {/* 7. Scale With Us & Partnerships Section */}
      <ScaleWithUsSection />

      {/* 8. Platform Status & Foundation Assurance */}
      <section className="status shell" id="status">
        <div className="status-card">
          <p className="section-kicker">Platform status · Active Learning System</p>
          <h2>
            A clear journey,<br />
            <span>built on observable evidence.</span>
          </h2>
          <p>
            SpeakQL pairs real communicative scenarios with transparent linguistic evaluation.
            Practice your target language using word-bank chip assemblers or spoken voice audio,
            earn streaks and XP, and preserve your progress in a secure learning environment.
          </p>
          <Link
            className="button button-primary"
            href={startLearningHref}
            aria-label="Start learning with SpeakQL"
            style={{ alignSelf: "flex-start", marginTop: "16px" }}
          >
            Start Your Journey <span>▶</span>
          </Link>
        </div>
      </section>

      {/* 9. Ocean Footer with Links */}
      <footer className="footer shell">
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <SpeakQLLogo size={28} showText={true} />
        </div>
        <div style={{ display: "flex", gap: "24px", flexWrap: "wrap", fontSize: "13px" }}>
          <Link href="/world" style={{ color: "#c4b5fd" }}>Living Ocean World</Link>
          <Link href="/method" style={{ color: "#c4b5fd" }}>Cognitive Method</Link>
          <Link href="/manifesto" style={{ color: "#c4b5fd" }}>Human Philosophy</Link>
          <Link href="/scale" style={{ color: "#c4b5fd" }}>Institutions &amp; Scale</Link>
          <Link href={startLearningHref} style={{ color: "#38bdf8" }}>Learner Platform</Link>
        </div>
        <p style={{ margin: "0.4rem 0", color: "#cbd5e1", fontSize: "13px" }}>
          Founder: <strong>Abhishek</strong> · Official Contact:{" "}
          <a href="mailto:Abhishek@speakql.tech" style={{ color: "#38bdf8", textDecoration: "none" }}>
            Abhishek@speakql.tech
          </a>
        </p>
        <p>Natural language &amp; capability, practiced in context.</p>
        <p>© {new Date().getFullYear()} SpeakQL · Ocean World</p>
      </footer>
    </main>
  );
}
