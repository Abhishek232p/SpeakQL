import React from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { SpeakQLLogo, WhaleMascot } from "@/src/client/components/whale-mascot";

export const metadata: Metadata = {
  title: "The Human Brain & Communication Philosophy · Manifesto | SpeakQL",
  description:
    "Why language is personal sovereignty, presence, and relationship—not cartoon trivia. Read the human philosophy behind SpeakQL.",
};

export default function ManifestoPage() {
  const startLearningHref = "/login";

  return (
    <main style={{ minHeight: "100vh", position: "relative", overflowX: "hidden" }}>
      {/* 1. Header Navigation */}
      <nav className="nav shell" aria-label="Primary navigation">
        <Link className="wordmark" href="/" aria-label="SpeakQL home">
          <SpeakQLLogo size={38} showText={true} />
        </Link>
        <div className="nav-links">
          <Link href="/world">World</Link>
          <Link href="/method">Method</Link>
          <Link href="/manifesto" style={{ color: "#ffffff", borderBottom: "2px solid #c084fc", paddingBottom: "2px" }}>
            Philosophy
          </Link>
          <Link href="/scale">Scale &amp; Partners</Link>
          <Link className="nav-cta" href={startLearningHref}>
            Start Learning →
          </Link>
        </div>
      </nav>

      {/* 2. Hero Section */}
      <section className="shell" style={{ padding: "70px 0 40px", maxWidth: "860px" }}>
        <p className="eyebrow" style={{ color: "#c084fc" }}>
          <span>🐋</span> A HUMAN PHILOSOPHY OF COMMUNICATION
        </p>

        <h1
          style={{
            fontSize: "clamp(2.75rem, 6vw, 4.75rem)",
            fontWeight: 800,
            letterSpacing: "-0.035em",
            lineHeight: 1.05,
            margin: "0 0 32px",
          }}
        >
          Language is not a game of cartoon points.<br />
          <em style={{ color: "#c084fc", fontStyle: "normal", textShadow: "0 0 24px rgba(192, 132, 252, 0.5)" }}>
            It is personal sovereignty.
          </em>
        </h1>

        <p style={{ fontSize: "20px", lineHeight: 1.7, color: "var(--muted)", margin: 0 }}>
          Every day, millions of extraordinarily talented engineers, researchers, founders, and professionals
          find themselves silenced in high-stakes meetings—not because their thoughts lack genius, but because
          the cognitive friction of spontaneous articulation traps them behind an invisible wall of hesitation.
        </p>
      </section>

      {/* 3. The Manifesto Body */}
      <section className="shell" style={{ padding: "40px 0 100px", maxWidth: "860px" }}>
        <div
          style={{
            background: "rgba(14, 20, 52, 0.8)",
            backdropFilter: "blur(24px)",
            border: "1px solid rgba(139, 92, 246, 0.3)",
            borderRadius: "28px",
            padding: "48px 44px",
            boxShadow: "0 20px 60px rgba(0, 0, 0, 0.4)",
            display: "flex",
            flexDirection: "column",
            gap: "36px",
            fontSize: "16px",
            lineHeight: 1.85,
            color: "#e2e8f0",
          }}
        >
          {/* Section 1: The Tragedy of Modern EdTech */}
          <div>
            <h2 style={{ fontSize: "24px", fontWeight: 800, color: "#ffffff", margin: "0 0 16px", letterSpacing: "-0.02em" }}>
              1. The Tragedy of Modern Language Apps
            </h2>
            <p style={{ margin: "0 0 16px" }}>
              For over a decade, consumer language software treated human beings like laboratory animals in a Skinner box.
              They rewarded people with flashing bells for identifying pictures of apples and cows, while completely
              ignoring the terrifying reality of human social interaction:
            </p>
            <blockquote
              style={{
                margin: "20px 0",
                padding: "16px 24px",
                background: "rgba(88, 28, 135, 0.2)",
                borderLeft: "4px solid #c084fc",
                borderRadius: "0 12px 12px 0",
                fontStyle: "italic",
                color: "#f1f5f9",
              }}
            >
              &ldquo;You can have a 500-day streak translating &apos;the bear drinks milk&apos; and still freeze when an
              engineering director asks you: &apos;What is your architectural blocker on the auth service?&apos;&rdquo;
            </blockquote>
            <p style={{ margin: 0 }}>
              The brain does not store vocabulary in isolation. When adrenaline surges in a real meeting, working memory
              contracts. If you have only practiced passive matching, your prefrontal cortex cannot assemble spontaneous
              speech under social observation.
            </p>
          </div>

          <hr style={{ border: "none", borderTop: "1px solid rgba(139, 92, 246, 0.2)", margin: 0 }} />

          {/* Section 2: Emotional Safety & The Ocean Sanctuary */}
          <div>
            <h2 style={{ fontSize: "24px", fontWeight: 800, color: "#ffffff", margin: "0 0 16px", letterSpacing: "-0.02em" }}>
              2. The Ocean Sanctuary: Why Psychological Safety Precedes Fluency
            </h2>
            <p style={{ margin: "0 0 16px" }}>
              Linguist Stephen Krashen proved decades ago that human beings cannot acquire communicative fluency when their
              internal <em>affective filter</em> is raised by fear, judgment, or social insecurity. When you are terrified
              of sounding foolish to native speakers, your vocal tract tenses and your thoughts stall.
            </p>
            <p style={{ margin: 0 }}>
              We created SpeakQL as a living ocean world—a sanctuary guarded by our friendly whale coach—where you can
              experiment freely without fear of human judgment. You can make twenty grammatical mistakes in private,
              receive transparent diagnostic rubric analysis, re-speak your answer, and develop the unshakeable vocal
              conviction needed before you ever step onto the live stage.
            </p>
          </div>

          <hr style={{ border: "none", borderTop: "1px solid rgba(139, 92, 246, 0.2)", margin: 0 }} />

          {/* Section 3: The Architecture of Human Presence */}
          <div>
            <h2 style={{ fontSize: "24px", fontWeight: 800, color: "#ffffff", margin: "0 0 16px", letterSpacing: "-0.02em" }}>
              3. Communication Is Presence, Presence Is Impact
            </h2>
            <p style={{ margin: "0 0 16px" }}>
              To speak with clarity is not to sound like a textbook. It is the ability to transmit what is inside your
              mind into the minds of others with fidelity, dignity, and warmth. It is knowing how to disagree without
              arousing defensiveness. It is knowing how to state a boundary with calm authority. It is knowing how to
              invite collaboration across oceans and cultures.
            </p>
            <p style={{ margin: 0 }}>
              This is what we build every day at SpeakQL. Not sterile algorithms or corporate checklists, but a deep,
              human-centered instrument of personal liberation.
            </p>
          </div>

          {/* Call to Action Box */}
          <div
            style={{
              marginTop: "20px",
              padding: "32px",
              background: "linear-gradient(135deg, rgba(88, 28, 135, 0.4), rgba(15, 23, 58, 0.9))",
              border: "1.5px solid rgba(168, 85, 247, 0.4)",
              borderRadius: "20px",
              textAlign: "center",
            }}
          >
            <WhaleMascot mood="happy" size={72} animated={true} style={{ margin: "0 auto 16px" }} />
            <h3 style={{ fontSize: "22px", fontWeight: 800, color: "#ffffff", margin: "0 0 8px" }}>
              Your voice matters. Let&apos;s build it together.
            </h3>
            <p style={{ color: "#c4b5fd", fontSize: "14px", margin: "0 auto 24px", maxWidth: "560px", lineHeight: 1.6 }}>
              Whether you are preparing for your first international standup, pitching an investor syndicate, or
              navigating cross-cultural leadership, your journey starts here.
            </p>
            <div style={{ display: "flex", justifyContent: "center", gap: "14px" }}>
              <Link className="button button-primary" href={startLearningHref}>
                Begin Your Journey <span>▶</span>
              </Link>
              <Link className="button button-secondary" href="/world">
                Explore The World <span>🗺️</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Footer */}
      <footer className="footer shell">
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <SpeakQLLogo size={28} showText={true} />
        </div>
        <p>A human philosophy of presence, fluency, and vocal sovereignty.</p>
        <p>© {new Date().getFullYear()} SpeakQL. All rights reserved.</p>
      </footer>
    </main>
  );
}
