"use client";

import React, { useState } from "react";
import Link from "next/link";
import { SpeakQLLogo, WhaleMascot } from "@/src/client/components/whale-mascot";
import { sound } from "@/src/client/sound/synthesizer";
import { submitPartnershipInquiry } from "@/app/actions/partner-inquiry";

interface PathwayCard {
  number: string;
  title: string;
  description: string;
  focus: string[];
}

const PATHWAYS: PathwayCard[] = [
  {
    number: "01",
    title: "College & University Partnerships",
    description:
      "Partner with colleges, universities, and educational institutions to help students strengthen communication skills, improve career readiness, and prepare for high-stakes professional opportunities.",
    focus: ["Campus Curriculum Integration", "Career Services & Mock Interviews", "Student Fluency Cohorts"],
  },
  {
    number: "02",
    title: "Strategic Collaborations & Tie-Ups",
    description:
      "Collaborate with edtech innovators, specialized training academies, language educators, and ecosystem organizations to create meaningful, evidence-grounded learning experiences.",
    focus: ["Content & Domain Co-Creation", "Pedagogical Research Alliances", "Ecosystem Integrations"],
  },
  {
    number: "03",
    title: "Corporate & Industry Partnerships",
    description:
      "Work with engineering companies, international enterprises, and employers to support high-impact workplace communication, leadership agility, and continuous team development.",
    focus: ["Engineering Standup Mastery", "Executive Pitch Simulations", "Cross-Border Team Syncs"],
  },
  {
    number: "04",
    title: "Investors & Strategic Advisors",
    description:
      "Connect with investors, operators, and advisors who share our thesis that the future of learning belongs to adaptive, evidence-based communication intelligence rather than passive flashcards.",
    focus: ["Seed & Strategic Expansion", "Global Go-to-Market", "Applied AI Alignment"],
  },
  {
    number: "05",
    title: "Community, Creators & Educators",
    description:
      "Join our open network of instructional designers, linguists, and professional mentors to craft authentic situational scenarios and make communicative excellence widely accessible.",
    focus: ["Scenario Authoring", "Linguistic Rubric Advisory", "Global Community Chapters"],
  },
];

export default function ScaleWithUsPage() {
  const [formData, setFormData] = useState({
    name: "",
    organization: "",
    email: "",
    interest: "College & University Partnerships",
    message: "",
  });

  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    sound.playPop();

    if (!formData.name.trim() || !formData.email.trim() || !formData.organization.trim()) {
      setValidationError("Please fill in your name, organization, and a valid email address.");
      return;
    }

    if (!formData.email.includes("@") || !formData.email.includes(".")) {
      setValidationError("Please provide a valid work or institutional email address.");
      return;
    }

    setValidationError(null);
    setIsSubmitting(true);
    try {
      const res = await submitPartnershipInquiry({
        name: formData.name,
        email: formData.email,
        organization: formData.organization,
        role: "Partner / Institutional Lead",
        interest: formData.interest,
        message: formData.message.trim() || "General partnership inquiry from scale page.",
      });

      if (res.success) {
        sound.playFanfare();
        setIsSubmitted(true);
      } else {
        sound.playIncorrect();
        setValidationError(res.error);
      }
    } catch {
      sound.playIncorrect();
      setValidationError("Failed to submit inquiry. Please reach out to Abhishek@speakql.tech directly.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const scrollToContact = () => {
    sound.playPop();
    const el = document.getElementById("partnership-contact");
    el?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #090d16 0%, #0d1322 50%, #0a0e1a 100%)",
        color: "#f8fafc",
        fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      {/* 1. Header Navigation */}
      <header
        style={{
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          backdropFilter: "blur(16px)",
          position: "sticky",
          top: 0,
          zIndex: 100,
          background: "rgba(9, 13, 22, 0.8)",
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "1rem 1.5rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Link href="/" style={{ textDecoration: "none" }}>
            <SpeakQLLogo size={32} showText={true} />
          </Link>

          <nav style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
            <Link
              href="/"
              style={{
                color: "#94a3b8",
                textDecoration: "none",
                fontSize: "0.9rem",
                fontWeight: 500,
                transition: "color 0.2s",
              }}
            >
              Overview
            </Link>
            <Link
              href="/dashboard"
              style={{
                color: "#94a3b8",
                textDecoration: "none",
                fontSize: "0.9rem",
                fontWeight: 500,
                transition: "color 0.2s",
              }}
            >
              App Platform
            </Link>
            <button
              type="button"
              onClick={scrollToContact}
              style={{
                background: "linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)",
                color: "#ffffff",
                border: "none",
                borderRadius: "9999px",
                padding: "0.5rem 1.25rem",
                fontSize: "0.85rem",
                fontWeight: 600,
                cursor: "pointer",
                boxShadow: "0 4px 16px rgba(168, 85, 247, 0.3)",
              }}
            >
              Initiate Dialogue
            </button>
          </nav>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          padding: "5rem 1.5rem 4rem",
          textAlign: "center",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.6rem",
            background: "rgba(168, 85, 247, 0.12)",
            border: "1px solid rgba(168, 85, 247, 0.3)",
            borderRadius: "9999px",
            padding: "0.4rem 1rem",
            marginBottom: "2rem",
          }}
        >
          <span style={{ fontSize: "0.9rem" }}>🐋</span>
          <span
            style={{
              fontSize: "0.8rem",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "#c084fc",
            }}
          >
            Scale With Us • Strategic Alliances
          </span>
        </div>

        <h1
          style={{
            fontSize: "clamp(2.5rem, 5vw, 4.2rem)",
            fontWeight: 800,
            lineHeight: 1.12,
            letterSpacing: "-0.03em",
            margin: "0 0 1.5rem",
            background: "linear-gradient(135deg, #ffffff 40%, #c084fc 80%, #38bdf8 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          The future of communication is personal.
        </h1>

        <p
          style={{
            maxWidth: "760px",
            margin: "0 auto 2.5rem",
            fontSize: "clamp(1.05rem, 2vw, 1.3rem)",
            lineHeight: 1.6,
            color: "#94a3b8",
            fontWeight: 400,
          }}
        >
          We&apos;re building SpeakQL, an AI-powered communication and learning platform designed to help
          people develop real-world communication skills through personalized, adaptive learning.
          <br />
          <strong style={{ color: "#e2e8f0", fontWeight: 600 }}>
            We believe the next generation of communication intelligence will be built together.
          </strong>
        </p>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "1rem",
            flexWrap: "wrap",
          }}
        >
          <button
            type="button"
            onClick={scrollToContact}
            style={{
              background: "linear-gradient(135deg, #a855f7 0%, #6366f1 100%)",
              color: "#ffffff",
              border: "none",
              borderRadius: "0.75rem",
              padding: "0.9rem 2rem",
              fontSize: "1rem",
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 8px 24px rgba(168, 85, 247, 0.4)",
              transition: "transform 0.15s ease",
            }}
          >
            Partner With SpeakQL →
          </button>

          <a
            href="#partnership-contact"
            style={{
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              color: "#e2e8f0",
              borderRadius: "0.75rem",
              padding: "0.9rem 2rem",
              fontSize: "1rem",
              fontWeight: 600,
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            Explore Investment ↗
          </a>
        </div>
      </section>

      {/* 3. Let's Build Together — 5 Pathways Section */}
      <section
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "4rem 1.5rem",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
          <span
            style={{
              fontSize: "0.8rem",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: "#38bdf8",
            }}
          >
            Institutional &amp; Ecosystem Alliances
          </span>
          <h2
            style={{
              fontSize: "clamp(2rem, 3.5vw, 2.75rem)",
              fontWeight: 800,
              letterSpacing: "-0.02em",
              margin: "0.5rem 0 0",
              color: "#f8fafc",
            }}
          >
            Let&apos;s Build Together
          </h2>
          <p style={{ color: "#94a3b8", maxWidth: "600px", margin: "0.75rem auto 0", fontSize: "1rem" }}>
            Five collaborative pathways to expand practical communication mastery worldwide.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "1.75rem",
          }}
        >
          {PATHWAYS.map((p) => (
            <div
              key={p.number}
              style={{
                background: "linear-gradient(180deg, rgba(30, 41, 59, 0.5) 0%, rgba(15, 23, 42, 0.7) 100%)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "1.25rem",
                padding: "2rem",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                boxShadow: "0 12px 30px rgba(0, 0, 0, 0.25)",
                transition: "border-color 0.2s, transform 0.2s",
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: "0.9rem",
                    fontWeight: 800,
                    color: "#a855f7",
                    letterSpacing: "0.05em",
                  }}
                >
                  {p.number}
                </span>
                <h3
                  style={{
                    fontSize: "1.35rem",
                    fontWeight: 700,
                    margin: "0.5rem 0 1rem",
                    color: "#ffffff",
                    letterSpacing: "-0.01em",
                  }}
                >
                  {p.title}
                </h3>
                <p style={{ fontSize: "0.95rem", lineHeight: 1.6, color: "#94a3b8", margin: 0 }}>
                  {p.description}
                </p>
              </div>

              <div
                style={{
                  marginTop: "1.75rem",
                  paddingTop: "1.25rem",
                  borderTop: "1px solid rgba(255, 255, 255, 0.06)",
                }}
              >
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                  {p.focus.map((tag) => (
                    <span
                      key={tag}
                      style={{
                        background: "rgba(168, 85, 247, 0.1)",
                        border: "1px solid rgba(168, 85, 247, 0.25)",
                        borderRadius: "9999px",
                        padding: "0.2rem 0.6rem",
                        fontSize: "0.75rem",
                        color: "#d8b4fe",
                        fontWeight: 500,
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. One Vision. Multiple Possibilities. */}
      <section
        style={{
          maxWidth: "1000px",
          margin: "2rem auto",
          padding: "3.5rem 2rem",
          background: "linear-gradient(135deg, rgba(88, 28, 135, 0.2), rgba(15, 23, 42, 0.8))",
          border: "1.5px solid rgba(168, 85, 247, 0.3)",
          borderRadius: "1.75rem",
          textAlign: "center",
        }}
      >
        <WhaleMascot mood="coach" size={80} animated={true} style={{ margin: "0 auto 1.5rem" }} />
        <h2
          style={{
            fontSize: "clamp(1.75rem, 3vw, 2.5rem)",
            fontWeight: 800,
            margin: "0 0 1rem",
            color: "#ffffff",
          }}
        >
          One Vision. Multiple Possibilities.
        </h2>
        <p
          style={{
            maxWidth: "680px",
            margin: "0 auto 2rem",
            fontSize: "1.05rem",
            lineHeight: 1.6,
            color: "#cbd5e1",
          }}
        >
          Whether you&apos;re an educational institution looking to empower thousands of aspiring graduates, an
          enterprise aiming to sharpen technical leadership, or an investor passionate about human agency in the AI
          era, we invite you to build with us.
        </p>
        <p style={{ fontStyle: "italic", color: "#a855f7", fontWeight: 600, fontSize: "1.1rem" }}>
          Let&apos;s create something meaningful together.
        </p>
      </section>

      {/* 5. Partnership Inquiry Form */}
      <section
        id="partnership-contact"
        style={{
          maxWidth: "800px",
          margin: "4rem auto 6rem",
          padding: "0 1.5rem",
        }}
      >
        <div
          style={{
            background: "rgba(15, 23, 42, 0.85)",
            border: "1.5px solid rgba(255, 255, 255, 0.12)",
            borderRadius: "1.5rem",
            padding: "2.5rem 2rem",
            boxShadow: "0 24px 48px -12px rgba(0, 0, 0, 0.5)",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            <span
              style={{
                fontSize: "0.8rem",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "#38bdf8",
              }}
            >
              Direct Connection
            </span>
            <h3 style={{ fontSize: "1.75rem", fontWeight: 700, margin: "0.4rem 0 0.5rem" }}>
              Start a Partnership Dialogue
            </h3>
            <p style={{ color: "#94a3b8", fontSize: "0.95rem", margin: 0 }}>
              Tell us about your organization or investment thesis. Our leadership team responds within 2 business days.
            </p>
          </div>

          {isSubmitted ? (
            <div
              style={{
                textAlign: "center",
                padding: "2rem",
                background: "rgba(168, 85, 247, 0.1)",
                border: "1px solid rgba(168, 85, 247, 0.3)",
                borderRadius: "1rem",
              }}
            >
              <span style={{ fontSize: "2.5rem", display: "block", marginBottom: "0.75rem" }}>✉️</span>
              <h4 style={{ margin: "0 0 0.5rem", fontSize: "1.25rem", color: "#f8fafc" }}>
                Inquiry Logged Successfully
              </h4>
              <p style={{ margin: 0, color: "#cbd5e1", lineHeight: 1.6 }}>
                Thank you, <strong>{formData.name}</strong>. Your partnership inquiry for{" "}
                <strong>{formData.organization}</strong> ({formData.interest}) has been registered.
                <br />
                Our partnership team will follow up at <strong>{formData.email}</strong>.
              </p>
              <div style={{ marginTop: "1.5rem" }}>
                <a
                  href="mailto:Abhishek@speakql.tech"
                  style={{
                    color: "#38bdf8",
                    fontSize: "0.95rem",
                    fontWeight: 700,
                    textDecoration: "underline",
                  }}
                >
                  Official Contact: Abhishek@speakql.tech
                </a>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {validationError && (
                <div
                  style={{
                    background: "rgba(239, 68, 68, 0.15)",
                    border: "1px solid #ef4444",
                    borderRadius: "0.5rem",
                    padding: "0.75rem",
                    color: "#fca5a5",
                    fontSize: "0.85rem",
                  }}
                >
                  {validationError}
                </div>
              )}

              <div className="form-row-2col">
                <div>
                  <label
                    htmlFor="contact-name"
                    style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.4rem", color: "#cbd5e1" }}
                  >
                    Your Name *
                  </label>
                  <input
                    id="contact-name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Dr. Jane Smith / Alex Rivera"
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      background: "rgba(30, 41, 59, 0.7)",
                      border: "1px solid rgba(255, 255, 255, 0.15)",
                      borderRadius: "0.5rem",
                      padding: "0.75rem",
                      color: "#ffffff",
                      fontSize: "0.95rem",
                    }}
                  />
                </div>

                <div>
                  <label
                    htmlFor="contact-org"
                    style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.4rem", color: "#cbd5e1" }}
                  >
                    Organization / University *
                  </label>
                  <input
                    id="contact-org"
                    type="text"
                    required
                    value={formData.organization}
                    onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                    placeholder="e.g. Stanford University / Tech Corp"
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      background: "rgba(30, 41, 59, 0.7)",
                      border: "1px solid rgba(255, 255, 255, 0.15)",
                      borderRadius: "0.5rem",
                      padding: "0.75rem",
                      color: "#ffffff",
                      fontSize: "0.95rem",
                    }}
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="contact-email"
                  style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.4rem", color: "#cbd5e1" }}
                >
                  Work / Institutional Email *
                </label>
                <input
                  id="contact-email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="alex@organization.edu or .com"
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    background: "rgba(30, 41, 59, 0.7)",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    borderRadius: "0.5rem",
                    padding: "0.75rem",
                    color: "#ffffff",
                    fontSize: "0.95rem",
                  }}
                />
              </div>

              <div>
                <label
                  htmlFor="contact-interest"
                  style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.4rem", color: "#cbd5e1" }}
                >
                  Partnership Pathway *
                </label>
                <select
                  id="contact-interest"
                  value={formData.interest}
                  onChange={(e) => setFormData({ ...formData, interest: e.target.value })}
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    background: "rgba(30, 41, 59, 0.9)",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    borderRadius: "0.5rem",
                    padding: "0.75rem",
                    color: "#ffffff",
                    fontSize: "0.95rem",
                  }}
                >
                  {PATHWAYS.map((p) => (
                    <option key={p.number} value={p.title}>
                      {p.number} — {p.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="contact-message"
                  style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.4rem", color: "#cbd5e1" }}
                >
                  Overview &amp; Scope of Collaboration
                </label>
                <textarea
                  id="contact-message"
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Briefly describe your objectives, student/learner scale, or investment timeline..."
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    background: "rgba(30, 41, 59, 0.7)",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    borderRadius: "0.5rem",
                    padding: "0.75rem",
                    color: "#ffffff",
                    fontSize: "0.95rem",
                    fontFamily: "inherit",
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  background: "linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "0.5rem",
                  padding: "0.9rem",
                  fontSize: "1rem",
                  fontWeight: 600,
                  cursor: isSubmitting ? "not-allowed" : "pointer",
                  opacity: isSubmitting ? 0.7 : 1,
                  marginTop: "0.5rem",
                  boxShadow: "0 8px 24px rgba(168, 85, 247, 0.35)",
                }}
              >
                {isSubmitting ? "Transmitting Inquiry..." : "Submit Partnership Inquiry →"}
              </button>
            </form>
          )}
        </div>
      </section>

      {/* 6. Footer */}
      <footer
        style={{
          borderTop: "1px solid rgba(255, 255, 255, 0.08)",
          padding: "3rem 1.5rem",
          background: "#080c14",
          textAlign: "center",
          color: "#64748b",
          fontSize: "0.85rem",
        }}
      >
        <p style={{ margin: "0 0 0.5rem", color: "#94a3b8" }}>
          SpeakQL — Better communication. Greater possibilities.
        </p>
        <p style={{ margin: "0 0 0.5rem", color: "#cbd5e1" }}>
          Founder: <strong>Abhishek</strong> · Official Contact:{" "}
          <a href="mailto:Abhishek@speakql.tech" style={{ color: "#38bdf8", textDecoration: "none" }}>
            Abhishek@speakql.tech
          </a>
        </p>
        <p style={{ margin: 0 }}>
          © {new Date().getFullYear()} SpeakQL. Adaptive Communication Intelligence. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
