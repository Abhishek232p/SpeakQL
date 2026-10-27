"use client";

import React, { useState } from "react";
import { submitPartnershipInquiry } from "@/app/actions/partner-inquiry";
import { sound } from "@/src/client/sound/synthesizer";

export interface OpportunityCard {
  id: string;
  title: string;
  category: string;
  description: string;
  icon: string;
  ctaText: string;
  pathwayKey: string;
}

const SCALE_CARDS: OpportunityCard[] = [
  {
    id: "card-capital",
    category: "CAPITAL & INVESTMENT",
    title: "Capital & Investment",
    description: "Build the platform, develop AI capabilities, and expand into new markets.",
    icon: "💼",
    ctaText: "Explore Investment Opportunities",
    pathwayKey: "Investment & Funding",
  },
  {
    id: "card-tech",
    category: "TECHNOLOGY & AI",
    title: "Technology & AI",
    description: "Advance adaptive assessment, personalized learning, and multilingual capabilities.",
    icon: "⚡",
    ctaText: "Explore Technology Collaboration",
    pathwayKey: "Technology & AI Partnerships",
  },
  {
    id: "card-global",
    category: "GLOBAL EXPANSION",
    title: "Global Expansion",
    description: "Reach new learners, language communities, and international markets.",
    icon: "🌍",
    ctaText: "Become a Global Partner",
    pathwayKey: "Global Expansion Partners",
  },
  {
    id: "card-partnerships",
    category: "STRATEGIC PARTNERSHIPS",
    title: "Strategic Partnerships",
    description: "Develop distribution channels and relationships with relevant organizations.",
    icon: "🤝",
    ctaText: "Partner With Us",
    pathwayKey: "College & University Partnerships",
  },
];

const COLLABORATION_PATHWAYS = [
  { label: "Investment & Funding", group: "Investor Track" },
  { label: "College & University Partnerships", group: "Academic Track" },
  { label: "School Partnerships", group: "Academic Track" },
  { label: "Strategic EdTech Collaborations", group: "Industry Track" },
  { label: "Corporate & Industry Training", group: "Industry Track" },
  { label: "Technology & AI Partnerships", group: "Technology Track" },
  { label: "Global Expansion Partners", group: "Growth Track" },
  { label: "Community, Creators & Educators", group: "Community Track" },
  { label: "Research & Academic Collaboration", group: "Research Track" },
  { label: "Distribution & Strategic Alliances", group: "Growth Track" },
  { label: "Other Strategic Collaboration", group: "General Track" },
];

const AREAS_OF_INTEREST = [
  "Adaptive Pedagogy",
  "Speech Recognition & Audio",
  "Campus Curriculum Integration",
  "Enterprise & Workforce Training",
  "Localization & New Languages",
  "Seed / Growth Capital",
  "Linguistic Evaluation Research",
];

export default function ScaleWithUsSection() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    organization: "",
    role: "",
    interest: "Investment & Funding",
    stageOrScale: "Seed / Series A",
    areasOfInterest: ["Adaptive Pedagogy", "Global Markets"],
    message: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSelectPathway = (pathway: string) => {
    sound.playPop();
    setFormData((prev) => ({
      ...prev,
      interest: pathway,
      stageOrScale: pathway.includes("Investment") ? "Seed / Series A" : "Campus / Organization Wide",
    }));
    const el = document.getElementById("partner-inquiry-form");
    el?.scrollIntoView({ behavior: "smooth" });
  };

  const toggleAreaInterest = (area: string) => {
    sound.playPop();
    setFormData((prev) => {
      const exists = prev.areasOfInterest.includes(area);
      const updated = exists
        ? prev.areasOfInterest.filter((a) => a !== area)
        : [...prev.areasOfInterest, area];
      return { ...prev, areasOfInterest: updated };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    sound.playPop();
    setErrorMessage(null);

    // Client-side validation
    if (!formData.name.trim() || !formData.email.trim() || !formData.organization.trim() || !formData.role.trim()) {
      setErrorMessage("Please complete all required fields: Name, Email, Organization, and Role.");
      return;
    }

    if (!formData.email.includes("@") || !formData.email.includes(".")) {
      setErrorMessage("Please provide a valid work or institutional email address.");
      return;
    }

    if (!formData.message.trim() || formData.message.trim().length < 5) {
      setErrorMessage("Please share a brief note regarding your proposed collaboration or investment scope.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await submitPartnershipInquiry(formData);
      if (result.success) {
        sound.playFanfare();
        setSubmitSuccess(result.message);
      } else {
        sound.playIncorrect();
        setErrorMessage(result.error);
      }
    } catch {
      sound.playIncorrect();
      setErrorMessage("Network error connecting to the inquiry service. Please email Abhishek@speakql.tech directly.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section
      id="scale-with-us"
      className="shell"
      style={{
        paddingTop: "5rem",
        paddingBottom: "6rem",
        position: "relative",
      }}
    >
      {/* 1. Header & Hero Copy */}
      <div style={{ maxWidth: "860px", margin: "0 auto", textAlign: "center" }}>
        <p
          style={{
            fontSize: "12px",
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: "0.12em",
            color: "#38bdf8",
            marginBottom: "12px",
            display: "inline-block",
            padding: "4px 14px",
            background: "rgba(56, 189, 248, 0.12)",
            border: "1px solid rgba(56, 189, 248, 0.3)",
            borderRadius: "99px",
          }}
        >
          BUILDING THE FUTURE OF GLOBAL COMMUNICATION
        </p>

        <h2
          style={{
            fontSize: "clamp(2rem, 4.5vw, 3.2rem)",
            fontWeight: 800,
            lineHeight: 1.15,
            letterSpacing: "-0.03em",
            color: "#ffffff",
            margin: "0 0 20px",
          }}
        >
          Help Us Scale a World Without Language Barriers.
        </h2>

        <p
          style={{
            fontSize: "16px",
            lineHeight: 1.7,
            color: "#94a3b8",
            marginBottom: "32px",
          }}
        >
          We&apos;re building an AI-powered language-learning platform designed to help people learn supported
          languages through personalized education, practical experiences, and adaptive learning.
          <br />
          We&apos;re looking to connect with investors and strategic partners who share our ambition to make
          language learning more accessible, effective, and global.
        </p>

        <div style={{ display: "flex", justifyContent: "center", gap: "16px", flexWrap: "wrap", marginBottom: "48px" }}>
          <button
            type="button"
            onClick={() => handleSelectPathway("Investment & Funding")}
            className="button button-primary"
            style={{ padding: "14px 28px", fontSize: "15px" }}
          >
            Explore Investment Opportunities <span>→</span>
          </button>
          <button
            type="button"
            onClick={() => handleSelectPathway("College & University Partnerships")}
            className="button button-secondary"
            style={{ padding: "14px 28px", fontSize: "15px" }}
          >
            Partner With Us <span>↓</span>
          </button>
        </div>
      </div>

      {/* 2. Four Concise Scale Opportunity Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "20px",
          marginBottom: "40px",
        }}
      >
        {SCALE_CARDS.map((card) => (
          <div
            key={card.id}
            style={{
              background: "rgba(18, 24, 62, 0.75)",
              backdropFilter: "blur(16px)",
              border: "1px solid rgba(139, 92, 246, 0.3)",
              borderRadius: "18px",
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
              transition: "transform 0.2s ease, border-color 0.2s ease",
            }}
          >
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <span style={{ fontSize: "28px" }}>{card.icon}</span>
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: 800,
                    letterSpacing: "0.08em",
                    color: "#c084fc",
                    background: "rgba(192, 132, 252, 0.1)",
                    border: "1px solid rgba(192, 132, 252, 0.25)",
                    padding: "3px 8px",
                    borderRadius: "99px",
                  }}
                >
                  {card.category}
                </span>
              </div>
              <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#ffffff", margin: "0 0 8px" }}>
                {card.title}
              </h3>
              <p style={{ fontSize: "14px", lineHeight: 1.6, color: "#94a3b8", margin: 0 }}>
                {card.description}
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleSelectPathway(card.pathwayKey)}
              style={{
                marginTop: "20px",
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                borderRadius: "10px",
                padding: "8px 14px",
                color: "#38bdf8",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                textAlign: "left",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                transition: "background 0.2s ease",
              }}
            >
              <span>{card.ctaText}</span>
              <span>→</span>
            </button>
          </div>
        ))}
      </div>

      {/* 3. Open Collaboration Secondary Callout */}
      <div
        style={{
          background: "linear-gradient(135deg, rgba(30, 27, 75, 0.6), rgba(15, 23, 42, 0.8))",
          border: "1px solid rgba(56, 189, 248, 0.25)",
          borderRadius: "16px",
          padding: "24px 32px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
          marginBottom: "60px",
        }}
      >
        <div>
          <h4 style={{ margin: "0 0 6px", fontSize: "17px", fontWeight: 700, color: "#ffffff" }}>
            Have a Different Partnership Idea?
          </h4>
          <p style={{ margin: 0, fontSize: "14px", color: "#94a3b8", maxWidth: "620px" }}>
            We&apos;re open to conversations with organizations and individuals who can help advance accessible, personalized language learning.
          </p>
        </div>

        <button
          type="button"
          onClick={() => handleSelectPathway("Other Strategic Collaboration")}
          style={{
            background: "linear-gradient(135deg, #38bdf8 0%, #818cf8 100%)",
            color: "#030712",
            border: "none",
            borderRadius: "12px",
            padding: "10px 20px",
            fontSize: "13px",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Propose a Collaboration ↗
        </button>
      </div>

      {/* 4. Adaptive Partner & Investor Inquiry Form */}
      <div
        id="partner-inquiry-form"
        style={{
          maxWidth: "760px",
          margin: "0 auto",
          background: "rgba(18, 24, 62, 0.85)",
          backdropFilter: "blur(20px)",
          border: "1.5px solid rgba(139, 92, 246, 0.35)",
          borderRadius: "24px",
          padding: "36px 32px",
          boxShadow: "0 24px 48px -12px rgba(0, 0, 0, 0.6)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <span
            style={{
              fontSize: "11px",
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: "#c084fc",
            }}
          >
            Direct Executive Channel
          </span>
          <h3 style={{ fontSize: "24px", fontWeight: 800, color: "#ffffff", margin: "6px 0 8px" }}>
            Let&apos;s Build What&apos;s Next.
          </h3>
          <p style={{ margin: 0, fontSize: "14px", color: "#94a3b8" }}>
            Inquiries are reviewed directly by SpeakQL leadership. We follow up within 2 business days.
          </p>
        </div>

        {submitSuccess ? (
          <div
            style={{
              textAlign: "center",
              padding: "32px 24px",
              background: "rgba(34, 197, 94, 0.12)",
              border: "1px solid rgba(34, 197, 94, 0.4)",
              borderRadius: "16px",
            }}
          >
            <span style={{ fontSize: "36px", display: "block", marginBottom: "12px" }}>✉️</span>
            <h4 style={{ margin: "0 0 8px", fontSize: "18px", fontWeight: 700, color: "#ffffff" }}>
              Inquiry Logged Successfully
            </h4>
            <p style={{ margin: "0 0 16px", color: "#cbd5e1", fontSize: "14px", lineHeight: 1.6 }}>
              {submitSuccess}
            </p>
            <div style={{ fontSize: "13px", color: "#94a3b8" }}>
              Official contact:{" "}
              <a href="mailto:Abhishek@speakql.tech" style={{ color: "#38bdf8", textDecoration: "underline" }}>
                Abhishek@speakql.tech
              </a>
            </div>
            <button
              type="button"
              onClick={() => {
                setSubmitSuccess(null);
                setFormData((prev) => ({ ...prev, message: "" }));
              }}
              style={{
                marginTop: "20px",
                background: "transparent",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                color: "#cbd5e1",
                padding: "8px 16px",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "12px",
              }}
            >
              Submit Another Inquiry
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            {errorMessage && (
              <div
                style={{
                  background: "rgba(239, 68, 68, 0.15)",
                  border: "1px solid #ef4444",
                  borderRadius: "10px",
                  padding: "12px 14px",
                  color: "#fca5a5",
                  fontSize: "13px",
                }}
              >
                ⚠️ {errorMessage}
              </div>
            )}

            {/* Row 1: Name and Email */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
              <div>
                <label
                  htmlFor="inquiry-name"
                  style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#ffffff", marginBottom: "6px" }}
                >
                  Full Name *
                </label>
                <input
                  id="inquiry-name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Alex Chen / Dr. Elena Rostova"
                  style={{
                    width: "100%",
                    padding: "11px 14px",
                    borderRadius: "10px",
                    border: "1px solid rgba(139, 92, 246, 0.3)",
                    background: "rgba(24, 32, 75, 0.7)",
                    color: "#ffffff",
                    fontSize: "14px",
                    outline: "none",
                  }}
                />
              </div>

              <div>
                <label
                  htmlFor="inquiry-email"
                  style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#ffffff", marginBottom: "6px" }}
                >
                  Work / Institutional Email *
                </label>
                <input
                  id="inquiry-email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="alex@firm.vc or dr@university.edu"
                  style={{
                    width: "100%",
                    padding: "11px 14px",
                    borderRadius: "10px",
                    border: "1px solid rgba(139, 92, 246, 0.3)",
                    background: "rgba(24, 32, 75, 0.7)",
                    color: "#ffffff",
                    fontSize: "14px",
                    outline: "none",
                  }}
                />
              </div>
            </div>

            {/* Row 2: Organization and Role */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
              <div>
                <label
                  htmlFor="inquiry-org"
                  style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#ffffff", marginBottom: "6px" }}
                >
                  Organization / Investment Firm *
                </label>
                <input
                  id="inquiry-org"
                  type="text"
                  required
                  value={formData.organization}
                  onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                  placeholder="e.g. Horizon Ventures / Tokyo Institute"
                  style={{
                    width: "100%",
                    padding: "11px 14px",
                    borderRadius: "10px",
                    border: "1px solid rgba(139, 92, 246, 0.3)",
                    background: "rgba(24, 32, 75, 0.7)",
                    color: "#ffffff",
                    fontSize: "14px",
                    outline: "none",
                  }}
                />
              </div>

              <div>
                <label
                  htmlFor="inquiry-role"
                  style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#ffffff", marginBottom: "6px" }}
                >
                  Role / Title *
                </label>
                <input
                  id="inquiry-role"
                  type="text"
                  required
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  placeholder="e.g. Partner, Director, Department Chair"
                  style={{
                    width: "100%",
                    padding: "11px 14px",
                    borderRadius: "10px",
                    border: "1px solid rgba(139, 92, 246, 0.3)",
                    background: "rgba(24, 32, 75, 0.7)",
                    color: "#ffffff",
                    fontSize: "14px",
                    outline: "none",
                  }}
                />
              </div>
            </div>

            {/* Row 3: Pathway and Adaptive Stage/Scale */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
              <div>
                <label
                  htmlFor="inquiry-interest"
                  style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#ffffff", marginBottom: "6px" }}
                >
                  Investment or Partnership Interest *
                </label>
                <select
                  id="inquiry-interest"
                  value={formData.interest}
                  onChange={(e) => setFormData({ ...formData, interest: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "11px 14px",
                    borderRadius: "10px",
                    border: "1px solid rgba(139, 92, 246, 0.3)",
                    background: "rgba(24, 32, 75, 0.95)",
                    color: "#ffffff",
                    fontSize: "14px",
                    outline: "none",
                  }}
                >
                  {COLLABORATION_PATHWAYS.map((p) => (
                    <option key={p.label} value={p.label}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="inquiry-stage"
                  style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#ffffff", marginBottom: "6px" }}
                >
                  {formData.interest.includes("Investment")
                    ? "Investment Stage of Interest *"
                    : "Intended Scale / Scope *"}
                </label>
                <input
                  id="inquiry-stage"
                  type="text"
                  value={formData.stageOrScale}
                  onChange={(e) => setFormData({ ...formData, stageOrScale: e.target.value })}
                  placeholder={
                    formData.interest.includes("Investment")
                      ? "e.g. Pre-Seed, Seed, Series A, Strategic"
                      : "e.g. 500+ students, Department-wide, Pilot"
                  }
                  style={{
                    width: "100%",
                    padding: "11px 14px",
                    borderRadius: "10px",
                    border: "1px solid rgba(139, 92, 246, 0.3)",
                    background: "rgba(24, 32, 75, 0.7)",
                    color: "#ffffff",
                    fontSize: "14px",
                    outline: "none",
                  }}
                />
              </div>
            </div>

            {/* Row 4: Areas of Interest Multi-Pills */}
            <div>
              <span id="areas-of-focus-label" style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#ffffff", marginBottom: "6px" }}>
                Key Areas of Focus (Select all that apply)
              </span>
              <div role="group" aria-labelledby="areas-of-focus-label" style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {AREAS_OF_INTEREST.map((area) => {
                  const isSelected = formData.areasOfInterest.includes(area);
                  return (
                    <button
                      key={area}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => toggleAreaInterest(area)}
                      style={{
                        background: isSelected ? "rgba(56, 189, 248, 0.18)" : "rgba(255, 255, 255, 0.05)",
                        border: isSelected ? "1.5px solid #38bdf8" : "1px solid rgba(255, 255, 255, 0.15)",
                        borderRadius: "8px",
                        padding: "6px 12px",
                        fontSize: "12px",
                        color: isSelected ? "#38bdf8" : "#cbd5e1",
                        cursor: "pointer",
                        fontWeight: 600,
                        transition: "all 0.15s ease",
                      }}
                    >
                      {isSelected ? "✓ " : "+ "}
                      {area}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Row 5: Message */}
            <div>
              <label
                htmlFor="inquiry-message"
                style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#ffffff", marginBottom: "6px" }}
              >
                Message &amp; Collaboration Overview *
              </label>
              <textarea
                id="inquiry-message"
                rows={4}
                required
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Briefly describe your objectives, student cohort scale, investment horizon, or technology capability..."
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: "10px",
                  border: "1px solid rgba(139, 92, 246, 0.3)",
                  background: "rgba(24, 32, 75, 0.7)",
                  color: "#ffffff",
                  fontSize: "14px",
                  lineHeight: 1.5,
                  outline: "none",
                  resize: "vertical",
                }}
              />
            </div>

            {/* Submit & Privacy Note */}
            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="button button-primary"
                style={{
                  width: "100%",
                  justifyContent: "center",
                  padding: "14px",
                  borderRadius: "12px",
                  fontSize: "15px",
                  fontWeight: 700,
                  opacity: isSubmitting ? 0.7 : 1,
                }}
              >
                {isSubmitting ? "Transmitting Inquiry..." : "Start a Conversation 🚀"}
              </button>

              <p style={{ margin: "12px 0 0", fontSize: "11px", color: "#64748b", textAlign: "center", lineHeight: 1.5 }}>
                🔒 Inquiries are reviewed directly by SpeakQL executive leadership. Data is never sold or shared.
                <br />
                Official contact:{" "}
                <a href="mailto:Abhishek@speakql.tech" style={{ color: "#38bdf8", textDecoration: "none" }}>
                  <strong>Abhishek@speakql.tech</strong>
                </a>
              </p>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
