import React from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { SpeakQLLogo, WhaleMascot } from "@/src/client/components/whale-mascot";

export const metadata: Metadata = {
  title: "The Living Ocean World · Islands of Fluency | SpeakQL",
  description:
    "Explore the spatial cognitive architecture of SpeakQL. Four living islands mapped to real-world communication mastery, connected by glowing neural pathways.",
};

interface IslandDetail {
  id: string;
  name: string;
  tag: string;
  accent: string;
  accentRgb: string;
  icon: string;
  headline: string;
  description: string;
  competencies: string[];
  psychologicalFocus: string;
}

const ISLANDS: IslandDetail[] = [
  {
    id: "lagoon",
    name: "Foundational Lagoon",
    tag: "TIER 01 · FOUNDATION",
    accent: "#38bdf8",
    accentRgb: "56, 189, 248",
    icon: "🏝️",
    headline: "Clarity Under Pressure: Syntax, Status, & Blockers",
    description:
      "The starting shallows where learners conquer communicative inertia. Here, we dismantle the anxiety of daily workplace check-ins, technical status updates, and clear dependency flags. No sterile grammar drills—only direct, accountable articulation.",
    competencies: [
      "Standup Status & Progress Cadence",
      "Articulating Unexpected API Blockers",
      "Requesting Architectural Peer Reviews",
      "Accurate ETA Calibration & Delivery Framing",
    ],
    psychologicalFocus:
      "Lowering the affective filter. Transforming the freeze response in meetings into structured, repeatable vocal patterns.",
  },
  {
    id: "reef",
    name: "Vocabulary Reef",
    tag: "TIER 02 · IDIOMATIC REPERTOIRE",
    accent: "#a855f7",
    accentRgb: "168, 85, 247",
    icon: "🪸",
    headline: "Domain Repertoire, Idioms, & Natural Phrasing",
    description:
      "A rich coral ecosystem where conversational naturalness takes root. Move beyond textbook literalism to embrace idiomatic expressions, technical jargon in context, and nuanced transitions that make you sound like an insider in any room.",
    competencies: [
      "Cross-Border Asynchronous Clarifications",
      "Software Design Tradeoff Vocabulary",
      "Diplomatic Disagreement & Counter-Proposals",
      "Executive Summary & High-Level Framing",
    ],
    psychologicalFocus:
      "Semantic resonance. Moving from mental translation to instinctive conceptual retrieval through contextual association.",
  },
  {
    id: "cove",
    name: "Conversation Cove",
    tag: "TIER 03 · SPONTANEOUS AGILITY",
    accent: "#ec4899",
    accentRgb: "236, 72, 153",
    icon: "🌊",
    headline: "Spontaneous Dialogue, Cross-Functional Syncs, & Debate",
    description:
      "Tide pools where unscripted scenarios unfold. Practice thinking on your feet during rapid fire product reviews, handling sudden roadmap changes, and holding your ground when cross-functional partners push back on engineering priorities.",
    competencies: [
      "Handling Interruptions & Reclaiming the Floor",
      "Translating Engineering Debt to Business Value",
      "Live Q&A After Technical Demos",
      "Navigating Cross-Functional Tensions Gracefully",
    ],
    psychologicalFocus:
      "Working memory agility. Conditioning the prefrontal cortex to maintain composure and coherent reasoning under cognitive load.",
  },
  {
    id: "deep",
    name: "Mastery Deep",
    tag: "TIER 04 · HIGH-STAKES INFLUENCE",
    accent: "#fbbf24",
    accentRgb: "251, 191, 36",
    icon: "💎",
    headline: "Executive Presence, Strategic Pitching, & Negotiation",
    description:
      "The oceanic trenches where leaders are forged. Hone the gravitas, vocal cadence, and strategic rhetoric required to present to board members, pitch high-value investors, and negotiate multi-year partnerships with calm conviction.",
    competencies: [
      "Board-Level Strategic Architecture Pitching",
      "Crisis Communication During Major Outages",
      "High-Stakes Contract & Compensation Negotiation",
      "Inspiring Visionary Keynotes & Town Halls",
    ],
    psychologicalFocus:
      "Executive embodiment. Aligning breath, pacing, rhetorical framing, and cognitive authority to inspire collective action.",
  },
];

export default function WorldPage() {
  const startLearningHref = "/login";

  return (
    <main style={{ minHeight: "100vh", position: "relative", overflowX: "hidden" }}>
      {/* 1. Global Navigation */}
      <nav className="nav shell" aria-label="Primary navigation">
        <Link className="wordmark" href="/" aria-label="SpeakQL home">
          <SpeakQLLogo size={38} showText={true} />
        </Link>
        <div className="nav-links">
          <Link href="/world" style={{ color: "#ffffff", borderBottom: "2px solid #c084fc", paddingBottom: "2px" }}>
            World
          </Link>
          <Link href="/method">Method</Link>
          <Link href="/manifesto">Philosophy</Link>
          <Link href="/scale">Scale &amp; Partners</Link>
          <Link className="nav-cta" href={startLearningHref}>
            Start Learning →
          </Link>
        </div>
      </nav>

      {/* 2. Page Hero */}
      <section className="shell" style={{ padding: "60px 0 40px", textAlign: "center" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "6px 14px",
            borderRadius: "99px",
            background: "rgba(56, 189, 248, 0.12)",
            border: "1px solid rgba(56, 189, 248, 0.35)",
            color: "#38bdf8",
            fontSize: "11px",
            fontWeight: 800,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            marginBottom: "20px",
          }}
        >
          <span>🗺️</span>
          <span>SPATIAL COGNITIVE TOPOGRAPHY · THE LIVING OCEAN</span>
        </div>

        <h1
          style={{
            fontSize: "clamp(2.75rem, 6vw, 4.5rem)",
            fontWeight: 800,
            letterSpacing: "-0.03em",
            lineHeight: 1.05,
            margin: "0 auto 24px",
            maxWidth: "920px",
          }}
        >
          A living ocean world designed for the{" "}
          <em style={{ color: "#38bdf8", fontStyle: "normal", textShadow: "0 0 30px rgba(56, 189, 248, 0.5)" }}>
            human brain.
          </em>
        </h1>

        <p
          style={{
            maxWidth: "740px",
            margin: "0 auto 36px",
            fontSize: "18px",
            lineHeight: 1.7,
            color: "var(--muted)",
          }}
        >
          The human brain evolved to navigate physical spaces, remember landmarks, and traverse territories—not
          memorize sterile vertical lists. SpeakQL organizes communicative capability into an interconnected ocean
          archipelago where every island anchors a distinct psychological domain of real-world human interaction.
        </p>

        <div style={{ display: "flex", justifyContent: "center", gap: "16px", flexWrap: "wrap" }}>
          <Link className="button button-primary" href={startLearningHref}>
            Begin The Ocean Journey <span>▶</span>
          </Link>
          <Link className="button button-secondary" href="/method">
            Read The Cognitive Method <span>→</span>
          </Link>
        </div>
      </section>

      {/* 3. The Cognitive Spatial Map Explanation */}
      <section
        className="shell"
        style={{
          margin: "40px auto",
          padding: "40px",
          background: "rgba(16, 22, 58, 0.75)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(139, 92, 246, 0.3)",
          borderRadius: "24px",
        }}
      >
        <div className="spatial-neuro-grid">
          <div>
            <span style={{ fontSize: "11px", fontWeight: 800, color: "#c084fc", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              NEURO-GEOGRAPHY &amp; RETENTION
            </span>
            <h2 style={{ fontSize: "clamp(24px, 4vw, 32px)", fontWeight: 800, margin: "8px 0 16px", color: "#ffffff", letterSpacing: "-0.02em" }}>
              Why spatial islands outlast abstract flashcards.
            </h2>
            <p style={{ color: "var(--muted)", fontSize: "15px", lineHeight: 1.7, margin: "0 0 16px" }}>
              In cognitive neuroscience, the <em>Method of Loci</em> proves that episodic memory and motor speech
              activate the hippocampus far more vividly when bound to spatial coordinates.
            </p>
            <p style={{ color: "var(--muted)", fontSize: "15px", lineHeight: 1.7, margin: 0 }}>
              When you voyage between the Foundational Lagoon and Conversation Cove, your brain encodes the linguistic
              skills not as abstract vocabulary, but as contextual landmarks that surge into working memory when you
              step into real meetings.
            </p>
          </div>

          <div
            style={{
              background: "rgba(6, 9, 25, 0.8)",
              border: "1px solid rgba(139, 92, 246, 0.35)",
              borderRadius: "20px",
              padding: "28px",
              textAlign: "center",
            }}
          >
            <WhaleMascot mood="happy" size={110} animated={true} />
            <div style={{ marginTop: "16px" }}>
              <span style={{ fontSize: "12px", fontWeight: 800, color: "#38bdf8", letterSpacing: "0.08em" }}>
                COGNITIVE PATHWAY LIGHTHOUSE
              </span>
              <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#c4b5fd" }}>
                Stepping stones unlock progressively. Mastered stones radiate golden luminescent rings that recharge
                your fluency momentum.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Island By Island In-Depth Exploration */}
      <section className="shell" style={{ padding: "60px 0 80px" }}>
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <p className="section-kicker">THE ARCHIPELAGO OF CAPABILITY</p>
          <h2 style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 800, letterSpacing: "-0.02em", margin: 0 }}>
            Four realms of conversational mastery.
          </h2>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "36px" }}>
          {ISLANDS.map((island, index) => (
            <div
              key={island.id}
              className="island-showcase-grid apple-glass-card"
              style={{
                border: `1.5px solid rgba(${island.accentRgb}, 0.35)`,
                boxShadow: `0 12px 40px rgba(0, 0, 0, 0.4), 0 0 30px rgba(${island.accentRgb}, 0.12)`,
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                  <span style={{ fontSize: "36px" }}>{island.icon}</span>
                  <div>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 800,
                        letterSpacing: "0.1em",
                        color: island.accent,
                      }}
                    >
                      {island.tag}
                    </span>
                    <h3 style={{ margin: "2px 0 0", fontSize: "26px", fontWeight: 800, color: "#ffffff" }}>
                      {island.name}
                    </h3>
                  </div>
                </div>

                <h4 style={{ margin: "16px 0 8px", fontSize: "17px", fontWeight: 700, color: island.accent }}>
                  {island.headline}
                </h4>

                <p style={{ margin: "0 0 20px", color: "var(--muted)", fontSize: "14px", lineHeight: 1.7 }}>
                  {island.description}
                </p>

                <div
                  style={{
                    background: "rgba(6, 9, 25, 0.6)",
                    borderLeft: `3px solid ${island.accent}`,
                    borderRadius: "0 10px 10px 0",
                    padding: "12px 16px",
                  }}
                >
                  <span style={{ fontSize: "10px", fontWeight: 800, color: island.accent, textTransform: "uppercase" }}>
                    Psychological Shift
                  </span>
                  <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#e2e8f0", lineHeight: 1.5 }}>
                    {island.psychologicalFocus}
                  </p>
                </div>
              </div>

              {/* Right: Concrete Competencies */}
              <div
                style={{
                  background: "rgba(6, 9, 25, 0.5)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: "16px",
                  padding: "24px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 800,
                      color: "#94a3b8",
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      display: "block",
                      marginBottom: "16px",
                    }}
                  >
                    Target Capability Scenarios
                  </span>
                  <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "10px" }}>
                    {island.competencies.map((comp) => (
                      <li
                        key={comp}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          fontSize: "13px",
                          color: "#f1f5f9",
                        }}
                      >
                        <span style={{ color: island.accent, fontWeight: 800 }}>✓</span>
                        <span>{comp}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div style={{ marginTop: "24px" }}>
                  <Link
                    href={startLearningHref}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                      background: `rgba(${island.accentRgb}, 0.15)`,
                      border: `1px solid rgba(${island.accentRgb}, 0.4)`,
                      color: island.accent,
                      borderRadius: "99px",
                      padding: "8px 16px",
                      fontSize: "12px",
                      fontWeight: 700,
                      textDecoration: "none",
                      transition: "transform 0.15s ease",
                    }}
                  >
                    <span>Practice Island {index + 1}</span>
                    <span>→</span>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Footer */}
      <footer className="footer shell">
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <SpeakQLLogo size={28} showText={true} />
        </div>
        <p style={{ margin: "0.4rem 0", color: "#cbd5e1", fontSize: "13px" }}>
          Founder: <strong>Abhishek</strong> · Official Contact:{" "}
          <a href="mailto:Abhishek@speakql.tech" style={{ color: "#38bdf8", textDecoration: "none" }}>
            Abhishek@speakql.tech
          </a>
        </p>
        <p>The Living Ocean World · Grounded in human cognitive architecture.</p>
        <p>© {new Date().getFullYear()} SpeakQL. All rights reserved.</p>
      </footer>
    </main>
  );
}
