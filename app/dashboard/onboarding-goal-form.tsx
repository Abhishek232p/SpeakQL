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

const EXPERIENCE_LEVELS = [
  { id: "beginner", label: "Complete beginner", desc: "Start with the target language's script, characters, and sounds." },
  { id: "basic", label: "I know a few words", desc: "The placement check will verify reading and writing before advancing." },
  { id: "intermediate", label: "I can form sentences", desc: "The placement check still verifies each foundation; self-report never skips mastery gates." },
  { id: "advanced", label: "I can already communicate", desc: "A short diagnostic can identify demonstrated skills; locked stages stay locked until verified." },
];

const PROFESSIONAL_TRACKS = [
  { id: "engineering", label: "Software Engineering & Standups", icon: "💻", defaultGoal: "Lead daily engineering standups and explain architecture dependencies" },
  { id: "business", label: "Client Negotiation & Leadership", icon: "🤝", defaultGoal: "Negotiate client contract scope and handle spontaneous stakeholder feedback" },
  { id: "academic", label: "Research & Presentations", icon: "🎓", defaultGoal: "Defend research methodology and data trade-offs in front of peer review committees" },
  { id: "networking", label: "Everyday Networking & Culture", icon: "☕", defaultGoal: "Participate in casual networking mixers and explain complex work simply" },
  { id: "law", label: "Law & Legal Practice", icon: "⚖️", defaultGoal: "Communicate with clients, explain legal concepts, and discuss documents in a legal workplace" },
  { id: "healthcare", label: "Healthcare & Clinical Communication", icon: "🩺", defaultGoal: "Communicate clearly with patients and colleagues in a healthcare setting" },
];

export default function OnboardingGoalForm() {
  const [selectedLang, setSelectedLang] = useState<string>("Japanese");
  const [selectedExperience, setSelectedExperience] = useState<string>("beginner");
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
          // Self-reported experience personalizes the diagnostic only; it cannot bypass the foundation mastery gate.
          const enriched = new FormData(formData);
          enriched.set(
            "description",
            `${String(formData.get("description") ?? "").trim()} | Self-reported level: ${selectedExperience}. Begin with foundational diagnostic; unlock later stages only after mastery.`
          );
          await createLearningGoal(enriched);
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

      {/* STEP 2: SELF-REPORTED EXPERIENCE — NEVER A BYPASS */}
      {step === 2 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <label style={{ fontSize: "14px", fontWeight: 700, color: "#ffffff" }}>
            2. How comfortable are you with {selectedLang} today?
          </label>
          <p style={{ margin: 0, color: "#94a3b8", fontSize: "12px", lineHeight: 1.5 }}>
            This helps tailor the first diagnostic. It does not unlock advanced lessons. SpeakQL verifies demonstrated skills before each new stage.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {EXPERIENCE_LEVELS.map((level) => {
              const isSelected = selectedExperience === level.id;
              return (
                <button
                  key={level.id}
                  type="button"
                  onClick={() => setSelectedExperience(level.id)}
                  aria-pressed={isSelected}
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
                  }}
                >
                  <span style={{ fontSize: "14px", fontWeight: 700, color: isSelected ? "#38bdf8" : "#ffffff" }}>
                    {level.label}
                  </span>
                  <span style={{ fontSize: "12px", color: "#94a3b8", marginTop: "2px" }}>
                    {level.desc}
                  </span>
                </button>
              );
            })}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "12px" }}>
            <button type="button" onClick={() => setStep(1)} style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "13px" }}>
              ← Back
            </button>
            <button type="button" onClick={() => setStep(3)} className="button button-primary" style={{ padding: "10px 20px" }}>
              Next: Goal &amp; Profession →
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
              Target: <strong>{selectedLang}</strong> · Start: <strong>Foundations + mastery check</strong>
            </span>
            <span style={{ fontSize: "12px", color: "#94a3b8" }}>
              Initial access: character-by-character whiteboard and typing practice. Voice, paragraphs, and professional simulations unlock only after their prerequisite stages are mastered.
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
