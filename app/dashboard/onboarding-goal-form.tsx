"use client";

import { useState } from "react";
import { createLearningGoal } from "./actions";

interface LanguageOption {
  code: string;
  name: string;
  flag: string;
  scriptNote: string;
}

const LANGUAGES: LanguageOption[] = [
  { code: "ja", name: "Japanese", flag: "🇯🇵", scriptNote: "Hiragana, Katakana & Keigo" },
  { code: "hi", name: "Hindi", flag: "🇮🇳", scriptNote: "Devanagari script & formal registers" },
  { code: "es", name: "Spanish", flag: "🇪🇸", scriptNote: "Latin script & workplace phrasing" },
  { code: "en", name: "English", flag: "🇬🇧", scriptNote: "Executive & technical communication" },
  { code: "de", name: "German", flag: "🇩🇪", scriptNote: "Grammar structure & formal business" },
  { code: "fr", name: "French", flag: "🇫🇷", scriptNote: "Nuanced dialogue & diplomacy" },
];

const STARTING_POINTS = [
  { id: "foundation", label: "Script Foundations", desc: "Start with letters, characters, stroke orders, and sounds" },
  { id: "words", label: "Core Vocabulary", desc: "Build essential high-frequency words and basic phrases" },
  { id: "sentences", label: "Sentence Construction", desc: "Form coherent ideas and participate in daily syncs" },
  { id: "professional", label: "Professional Fluency", desc: "Practice high-stakes trade-offs, negotiations, and presentations" },
];

const PROFESSIONAL_TRACKS = [
  { id: "engineering", label: "Software Engineering & Standups", icon: "💻", defaultGoal: "Lead daily engineering standups and explain architecture dependencies" },
  { id: "business", label: "Client Negotiation & Leadership", icon: "🤝", defaultGoal: "Negotiate client contract scope and handle spontaneous stakeholder feedback" },
  { id: "academic", label: "Research & Presentations", icon: "🎓", defaultGoal: "Defend research methodology and data trade-offs in front of peer review committees" },
  { id: "networking", label: "Everyday Networking & Culture", icon: "☕", defaultGoal: "Participate in casual networking mixers and explain complex work simply" },
];

export default function OnboardingGoalForm() {
  const [selectedLang, setSelectedLang] = useState<string>("Japanese");
  const [selectedPoint, setSelectedPoint] = useState<string>("foundation");
  const [selectedTrack, setSelectedTrack] = useState<string>("engineering");
  const [customDescription, setCustomDescription] = useState<string>(
    "Lead daily engineering standups and explain architecture dependencies in Japanese"
  );
  const [step, setStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleLanguageChange = (lang: string) => {
    setSelectedLang(lang);
    const track = PROFESSIONAL_TRACKS.find((t) => t.id === selectedTrack);
    const base = track ? track.defaultGoal : "Lead daily engineering standups and explain architecture dependencies";
    setCustomDescription(`${base} in ${lang}`);
  };

  const handleTrackChange = (trackId: string) => {
    setSelectedTrack(trackId);
    const track = PROFESSIONAL_TRACKS.find((t) => t.id === trackId);
    if (track) {
      setCustomDescription(`${track.defaultGoal} in ${selectedLang}`);
    }
  };

  return (
    <form
      action={async (formData) => {
        setIsSubmitting(true);
        try {
          await createLearningGoal(formData);
        } finally {
          setIsSubmitting(false);
        }
      }}
      style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
    >
      {/* Step Indicator */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
        <div style={{ display: "flex", gap: "6px" }}>
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              onClick={() => setStep(s)}
              style={{
                width: s === step ? "28px" : "10px",
                height: "6px",
                borderRadius: "3px",
                background: s === step ? "#38bdf8" : s < step ? "#818cf8" : "rgba(255, 255, 255, 0.2)",
                transition: "all 0.25s ease",
                cursor: "pointer",
              }}
            />
          ))}
        </div>
        <span style={{ fontSize: "11px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>
          Step {step} of 3
        </span>
      </div>

      {/* STEP 1: TARGET LANGUAGE SELECTION */}
      {step === 1 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <label style={{ fontSize: "14px", fontWeight: 700, color: "#ffffff" }}>
            1. Select Target Language
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "10px" }}>
            {LANGUAGES.map((lang) => {
              const isSelected = selectedLang === lang.name;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => handleLanguageChange(lang.name)}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    padding: "12px 14px",
                    borderRadius: "14px",
                    border: isSelected ? "2px solid #38bdf8" : "1px solid rgba(139, 92, 246, 0.3)",
                    background: isSelected ? "rgba(56, 189, 248, 0.12)" : "rgba(22, 28, 70, 0.6)",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 0.15s ease",
                  }}
                >
                  <span style={{ fontSize: "20px", marginBottom: "4px" }}>{lang.flag}</span>
                  <span style={{ fontSize: "14px", fontWeight: 700, color: isSelected ? "#38bdf8" : "#ffffff" }}>
                    {lang.name}
                  </span>
                  <span style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>
                    {lang.scriptNote}
                  </span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => setStep(2)}
            className="button button-primary"
            style={{ marginTop: "12px", alignSelf: "flex-end", padding: "10px 20px" }}
          >
            Next: Starting Point →
          </button>
        </div>
      )}

      {/* STEP 2: STARTING POINT & PROFICIENCY */}
      {step === 2 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <label style={{ fontSize: "14px", fontWeight: 700, color: "#ffffff" }}>
            2. Choose Your Starting Point in {selectedLang}
          </label>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {STARTING_POINTS.map((pt) => {
              const isSelected = selectedPoint === pt.id;
              return (
                <button
                  key={pt.id}
                  type="button"
                  onClick={() => setSelectedPoint(pt.id)}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    padding: "12px 16px",
                    borderRadius: "12px",
                    border: isSelected ? "2px solid #38bdf8" : "1px solid rgba(139, 92, 246, 0.25)",
                    background: isSelected ? "rgba(56, 189, 248, 0.12)" : "rgba(22, 28, 70, 0.5)",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 0.15s ease",
                  }}
                >
                  <span style={{ fontSize: "14px", fontWeight: 700, color: isSelected ? "#38bdf8" : "#ffffff" }}>
                    {pt.label}
                  </span>
                  <span style={{ fontSize: "12px", color: "#94a3b8", marginTop: "2px" }}>
                    {pt.desc}
                  </span>
                </button>
              );
            })}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "12px" }}>
            <button
              type="button"
              onClick={() => setStep(1)}
              style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "13px" }}
            >
              ← Back
            </button>
            <button
              type="button"
              onClick={() => setStep(3)}
              className="button button-primary"
              style={{ padding: "10px 20px" }}
            >
              Next: Goal &amp; Scenario →
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: PROFESSIONAL FOCUS & OUTCOME DEFINITION */}
      {step === 3 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div>
            <label style={{ fontSize: "14px", fontWeight: 700, color: "#ffffff", display: "block", marginBottom: "8px" }}>
              3. Select Professional Context
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "8px" }}>
              {PROFESSIONAL_TRACKS.map((track) => {
                const isSelected = selectedTrack === track.id;
                return (
                  <button
                    key={track.id}
                    type="button"
                    onClick={() => handleTrackChange(track.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "10px 14px",
                      borderRadius: "10px",
                      border: isSelected ? "2px solid #38bdf8" : "1px solid rgba(139, 92, 246, 0.25)",
                      background: isSelected ? "rgba(56, 189, 248, 0.12)" : "rgba(22, 28, 70, 0.5)",
                      cursor: "pointer",
                      textAlign: "left",
                      color: isSelected ? "#38bdf8" : "#c4b5fd",
                      fontSize: "13px",
                      fontWeight: 600,
                    }}
                  >
                    <span>{track.icon}</span>
                    <span>{track.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label
              htmlFor="goal-description"
              style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "#ffffff", marginBottom: "6px" }}
            >
              Target Communication Outcome (Refine as needed)
            </label>
            <textarea
              id="goal-description"
              name="description"
              required
              rows={3}
              value={customDescription}
              onChange={(e) => setCustomDescription(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: "12px",
                border: "1px solid rgba(139, 92, 246, 0.35)",
                background: "rgba(24, 32, 75, 0.7)",
                color: "#ffffff",
                fontSize: "14px",
                lineHeight: 1.5,
                outline: "none",
                resize: "vertical",
              }}
            />
          </div>

          {/* Planned Island Preview */}
          <div
            style={{
              padding: "14px",
              borderRadius: "12px",
              background: "rgba(56, 189, 248, 0.08)",
              border: "1px solid rgba(56, 189, 248, 0.25)",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
            }}
          >
            <span style={{ fontSize: "11px", fontWeight: 800, color: "#38bdf8", textTransform: "uppercase" }}>
              🗺️ Personalized Island Roadmap Preview
            </span>
            <span style={{ fontSize: "13px", color: "#e2e8f0" }}>
              Target: <strong>{selectedLang}</strong> · Starting: <strong>{STARTING_POINTS.find(p => p.id === selectedPoint)?.label}</strong>
            </span>
            <span style={{ fontSize: "12px", color: "#94a3b8" }}>
              Multimodal practice active: Typing, Digital Whiteboard Script Tracing, and Spoken Communication.
            </span>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px" }}>
            <button
              type="button"
              onClick={() => setStep(2)}
              style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "13px" }}
            >
              ← Back
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !customDescription.trim()}
              className="button button-primary"
              style={{
                padding: "12px 24px",
                borderRadius: "12px",
                fontSize: "14px",
                fontWeight: 700,
                opacity: isSubmitting ? 0.7 : 1,
              }}
            >
              {isSubmitting ? "Generating Island World..." : "Chart Course & Launch Learning ▶"}
            </button>
          </div>
        </div>
      )}
    </form>
  );
}
