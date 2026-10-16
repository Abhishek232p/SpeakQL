import React from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { SpeakQLLogo } from "@/src/client/components/whale-mascot";
import { createSupabaseAuthProvider } from "@/src/server/auth/supabase";

export const metadata: Metadata = {
  title: "The Cognitive Learning Architecture · Methodology | SpeakQL",
  description:
    "Discover the cognitive science behind SpeakQL. Learn how embodied vocal retrieval, immediate calibration, and mistake reframing build unshakeable communication fluency.",
};

const COMPARISONS = [
  {
    dimension: "Core Mechanism",
    traditional: "Passive multiple-choice matching of isolated nouns ('The apple is red').",
    speakql: "Active cognitive token assembly & motor-vocal articulation in authentic workplace context.",
  },
  {
    dimension: "Feedback Loop",
    traditional: "Binary right/wrong ding with zero diagnostic nuance or linguistic reasoning.",
    speakql: "Multi-dimensional rubric (Clarity, Tone Nuance, Assertiveness) with actionable coaching.",
  },
  {
    dimension: "Psychological Safety",
    traditional: "Punitive penalty systems that induce test anxiety and avoidance behavior.",
    speakql: "Affectionate whale coaching; mistakes are diagnostic stepping stones you review to reclaim hearts.",
  },
  {
    dimension: "Memory Model",
    traditional: "Short-term rote repetition that evaporates during high-stakes spontaneous conversations.",
    speakql: "Dual-coding spatial mapping (Method of Loci) + spaced error retrieval for lasting fluency.",
  },
  {
    dimension: "Target Outcome",
    traditional: "Tourist phrases and arbitrary cartoon gamification scores.",
    speakql: "Professional authority, meeting composure, and real career mobility.",
  },
];

export default async function MethodPage() {
  const authProvider = createSupabaseAuthProvider();
  const identity = await authProvider.getIdentity();
  const startLearningHref = identity ? "/dashboard" : "/login";

  return (
    <main style={{ minHeight: "100vh", position: "relative", overflowX: "hidden" }}>
      {/* 1. Header Navigation */}
      <nav className="nav shell" aria-label="Primary navigation">
        <Link className="wordmark" href="/" aria-label="SpeakQL home">
          <SpeakQLLogo size={38} showText={true} />
        </Link>
        <div className="nav-links">
          <Link href="/world">World</Link>
          <Link href="/method" style={{ color: "#ffffff", borderBottom: "2px solid #c084fc", paddingBottom: "2px" }}>
            Method
          </Link>
          <Link href="/manifesto">Philosophy</Link>
          <Link href="/scale">Scale &amp; Partners</Link>
          <Link className="nav-cta" href={startLearningHref}>
            {identity ? "Open Dashboard →" : "Start Learning →"}
          </Link>
        </div>
      </nav>

      {/* 2. Hero Section */}
      <section className="shell" style={{ padding: "60px 0 40px", textAlign: "center" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "6px 14px",
            borderRadius: "99px",
            background: "rgba(168, 85, 247, 0.12)",
            border: "1px solid rgba(168, 85, 247, 0.35)",
            color: "#c084fc",
            fontSize: "11px",
            fontWeight: 800,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            marginBottom: "20px",
          }}
        >
          <span>🧠</span>
          <span>THE COGNITIVE LEARNING ARCHITECTURE</span>
        </div>

        <h1
          style={{
            fontSize: "clamp(2.5rem, 5.5vw, 4.25rem)",
            fontWeight: 800,
            letterSpacing: "-0.03em",
            lineHeight: 1.08,
            margin: "0 auto 24px",
            maxWidth: "900px",
          }}
        >
          How the human brain acquires{" "}
          <em style={{ color: "#c084fc", fontStyle: "normal", textShadow: "0 0 24px rgba(192, 132, 252, 0.5)" }}>
            genuine fluency.
          </em>
        </h1>

        <p
          style={{
            maxWidth: "720px",
            margin: "0 auto 36px",
            fontSize: "18px",
            lineHeight: 1.7,
            color: "var(--muted)",
          }}
        >
          True communication fluency is not vocabulary storage—it is neural coordination under social load.
          Discover the four cognitive pillars that separate SpeakQL from sterile trivia apps.
        </p>

        <div style={{ display: "flex", justifyContent: "center", gap: "16px", flexWrap: "wrap" }}>
          <Link className="button button-primary" href={startLearningHref}>
            Experience The Method <span>▶</span>
          </Link>
          <Link className="button button-secondary" href="/world">
            Explore Ocean World <span>🗺️</span>
          </Link>
        </div>
      </section>

      {/* 3. The 4 Cognitive Pillars */}
      <section className="shell" style={{ padding: "40px 0 80px" }}>
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <p className="section-kicker">FOUR COGNITIVE PILLARS</p>
          <h2 style={{ fontSize: "clamp(2rem, 3.5vw, 2.75rem)", fontWeight: 800, letterSpacing: "-0.02em", margin: 0 }}>
            Rooted in psychology, verified by evidence.
          </h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "28px" }}>
          {/* Pillar 1 */}
          <div
            style={{
              background: "rgba(18, 24, 62, 0.75)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(56, 189, 248, 0.35)",
              borderRadius: "20px",
              padding: "32px",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "32px" }}>🗣️</span>
              <span style={{ fontSize: "11px", fontWeight: 800, color: "#38bdf8", letterSpacing: "0.1em" }}>
                PILLAR 01 · MOTOR-VOCAL EMBODIMENT
              </span>
            </div>
            <h3 style={{ margin: "4px 0", fontSize: "20px", fontWeight: 800, color: "#ffffff" }}>
              Active Retrieval, Not Passive Recognition
            </h3>
            <p style={{ margin: 0, fontSize: "14px", color: "var(--muted)", lineHeight: 1.7 }}>
              Reading a phrase or tapping a multiple-choice button exercises the visual cortex, but leaves the motor
              speech circuits in Broca&apos;s area untouched. SpeakQL requires learners to actively sequence tokens or
              articulate responses out loud, forming strong vocal muscle memory that holds under real pressure.
            </p>
          </div>

          {/* Pillar 2 */}
          <div
            style={{
              background: "rgba(18, 24, 62, 0.75)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(168, 85, 247, 0.35)",
              borderRadius: "20px",
              padding: "32px",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "32px" }}>🛡️</span>
              <span style={{ fontSize: "11px", fontWeight: 800, color: "#c084fc", letterSpacing: "0.1em" }}>
                PILLAR 02 · LOW-ANXIETY CALIBRATION
              </span>
            </div>
            <h3 style={{ margin: "4px 0", fontSize: "20px", fontWeight: 800, color: "#ffffff" }}>
              Zero-Shame Evaluative Safety
            </h3>
            <p style={{ margin: 0, fontSize: "14px", color: "var(--muted)", lineHeight: 1.7 }}>
              The &ldquo;affective filter&rdquo; hypothesis demonstrates that social embarrassment shuts down language
              acquisition. SpeakQL creates an ocean sanctuary where you can make imperfect attempts, receive precise
              rubric calibration without native-speaker judgment, and iterate until confidence becomes second nature.
            </p>
          </div>

          {/* Pillar 3 */}
          <div
            style={{
              background: "rgba(18, 24, 62, 0.75)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(236, 72, 153, 0.35)",
              borderRadius: "20px",
              padding: "32px",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "32px" }}>❤️</span>
              <span style={{ fontSize: "11px", fontWeight: 800, color: "#ec4899", letterSpacing: "0.1em" }}>
                PILLAR 03 · DIAGNOSTIC RECOVERY
              </span>
            </div>
            <h3 style={{ margin: "4px 0", fontSize: "20px", fontWeight: 800, color: "#ffffff" }}>
              Mistake Reframing &amp; Spaced Review
            </h3>
            <p style={{ margin: 0, fontSize: "14px", color: "var(--muted)", lineHeight: 1.7 }}>
              In SpeakQL, losing a heart is not a punitive dead end—it is an invitation to diagnose. Every imperfect
              exercise feeds directly into your personal Mistake Review Queue. Re-practicing your specific past stumble
              earns your heart back, creating an empowering positive feedback loop.
            </p>
          </div>

          {/* Pillar 4 */}
          <div
            style={{
              background: "rgba(18, 24, 62, 0.75)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(251, 191, 36, 0.35)",
              borderRadius: "20px",
              padding: "32px",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "32px" }}>⚡</span>
              <span style={{ fontSize: "11px", fontWeight: 800, color: "#fbbf24", letterSpacing: "0.1em" }}>
                PILLAR 04 · INTRINSIC MOMENTUM
              </span>
            </div>
            <h3 style={{ margin: "4px 0", fontSize: "20px", fontWeight: 800, color: "#ffffff" }}>
              Habit Loops Anchored in Identity
            </h3>
            <p style={{ margin: 0, fontSize: "14px", color: "var(--muted)", lineHeight: 1.7 }}>
              External streak threats induce fatigue. SpeakQL replaces guilt with the intrinsic dopamine of capability:
              every exercise is tied to the real-world communication identity you declared on day one (e.g. &ldquo;Lead
              engineering standups in Spanish&rdquo;), making every completed milestone feel genuinely meaningful.
            </p>
          </div>
        </div>
      </section>

      {/* 4. Comparison Matrix: Traditional Apps vs SpeakQL */}
      <section className="shell" style={{ padding: "0 0 100px" }}>
        <div
          style={{
            background: "rgba(14, 20, 52, 0.8)",
            backdropFilter: "blur(24px)",
            border: "1px solid rgba(139, 92, 246, 0.3)",
            borderRadius: "24px",
            padding: "40px 32px",
            boxShadow: "0 16px 48px rgba(0, 0, 0, 0.4)",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: "36px" }}>
            <span style={{ fontSize: "11px", fontWeight: 800, color: "#38bdf8", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              PARADIGM SHIFT
            </span>
            <h2 style={{ fontSize: "clamp(1.75rem, 3vw, 2.5rem)", fontWeight: 800, margin: "6px 0 0", color: "#ffffff" }}>
              Sterile Gamification vs. Deep Cognitive Fluency
            </h2>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "640px" }}>
              <thead>
                <tr style={{ borderBottom: "1.5px solid rgba(139, 92, 246, 0.35)", textAlign: "left" }}>
                  <th style={{ padding: "14px 16px", color: "#94a3b8", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.08em", width: "22%" }}>
                    Dimension
                  </th>
                  <th style={{ padding: "14px 16px", color: "#f87171", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.08em", width: "39%" }}>
                    Traditional Language Apps
                  </th>
                  <th style={{ padding: "14px 16px", color: "#34d399", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.08em", width: "39%" }}>
                    SpeakQL Ocean World
                  </th>
                </tr>
              </thead>
              <tbody>
                {COMPARISONS.map((row) => (
                  <tr key={row.dimension} style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.06)" }}>
                    <td style={{ padding: "18px 16px", fontWeight: 700, fontSize: "13px", color: "#e2e8f0" }}>
                      {row.dimension}
                    </td>
                    <td style={{ padding: "18px 16px", fontSize: "13px", color: "#94a3b8", lineHeight: 1.6 }}>
                      {row.traditional}
                    </td>
                    <td style={{ padding: "18px 16px", fontSize: "13px", color: "#e0e7ff", fontWeight: 500, lineHeight: 1.6, background: "rgba(139, 92, 246, 0.08)" }}>
                      {row.speakql}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ textAlign: "center", marginTop: "40px" }}>
            <Link className="button button-primary" href={startLearningHref}>
              Start Your First Practice Session <span>▶</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 5. Footer */}
      <footer className="footer shell">
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <SpeakQLLogo size={28} showText={true} />
        </div>
        <p>Evidence-grounded learning. Practiced in real context.</p>
        <p>© {new Date().getFullYear()} SpeakQL. All rights reserved.</p>
      </footer>
    </main>
  );
}
