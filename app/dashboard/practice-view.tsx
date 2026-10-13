"use client";

import React, { useState, useRef } from "react";
import type { DashboardEvaluationRecord, DashboardExerciseRecord } from "@/src/server/goals/repository";
import { parseStoredEvaluationFeedback } from "@/src/server/evaluation/boundary";
import { parseExerciseDetails } from "@/src/server/goals/curriculum";
import { sound } from "@/src/client/sound/synthesizer";
import { DigitalPracticeWhiteboard } from "@/src/client/components/digital-practice-whiteboard";

interface PracticeViewProps {
  evaluations: readonly DashboardEvaluationRecord[];
  exercises: readonly DashboardExerciseRecord[];
  hearts: number;
  onRestoreHeart: () => void;
  onLaunchExercise: (exerciseId: string) => void;
}

export type ScenarioCategory =
  | "job_interviews"
  | "workplace_meetings"
  | "college_presentations"
  | "everyday_conversations"
  | "customer_communication"
  | "public_speaking";

export type InputMethod = "type" | "whiteboard" | "speak";

interface SimulatorScenario {
  id: string;
  category: ScenarioCategory;
  categoryLabel: string;
  categoryIcon: string;
  title: string;
  role: string;
  context: string;
  objective: string;
  partnerPrompt: string;
  partnerName: string;
  suggestedOpening: string;
  variationTitle?: string;
  variationPrompt?: string;
}

const SIMULATOR_SCENARIOS: SimulatorScenario[] = [
  {
    id: "sim_workplace",
    category: "workplace_meetings",
    categoryLabel: "Workplace Meetings",
    categoryIcon: "🤝",
    title: "Engineering Standup Status & Blocker",
    role: "Full-Stack Software Engineer",
    context: "Daily morning standup sync with cross-functional product and infrastructure teams.",
    objective: "Give a concise 30-45s update covering yesterday's completed work, today's focus, and the staging credential blocker.",
    partnerName: "Mateo (Tech Lead)",
    partnerPrompt: "Next up on the board is the core API caching service. What's your status and do you need anything from the team?",
    suggestedOpening: "Ayer terminé de optimizar el servicio de API. Hoy me enfoco en desarrollar la capa de caché. Tengo un bloqueo con las credenciales de staging...",
    variationTitle: "Unexpected Constraint: Mobile Client Backwards-Compatibility",
    variationPrompt: "Mateo interjects: 'Will the new caching layer break existing v1 mobile clients in production? How are we verifying schema compatibility?'",
  },
  {
    id: "sim_interview",
    category: "job_interviews",
    categoryLabel: "Job Interviews",
    categoryIcon: "💼",
    title: "Explaining a Technical Trade-Off Under Pressure",
    role: "Senior Engineering Candidate",
    context: "Final-round system architecture interview with VP of Engineering.",
    objective: "Articulate why you chose an eventual-consistency caching model over strict distributed locking, acknowledging the trade-offs.",
    partnerName: "Sarah (VP of Engineering)",
    partnerPrompt: "Can you walk me through a time you had to sacrifice strict data consistency for high availability? What went wrong and how did you mitigate it?",
    suggestedOpening: "In our payment notifications pipeline, we chose eventual consistency using an idempotent event bus...",
    variationTitle: "Pushback on Failure Modes: High-Contention Edge Cases",
    variationPrompt: "Sarah asks: 'What happens during a network partition when customers retry transactions three times within 500ms?'",
  },
  {
    id: "sim_college",
    category: "college_presentations",
    categoryLabel: "College Presentations",
    categoryIcon: "🎓",
    title: "Defending Research Methodology & Data Limitations",
    role: "Graduate Researcher",
    context: "Thesis committee symposium and peer review presentation.",
    objective: "Explain your dataset selection, openly acknowledge sample limitations, and defend statistical validity with composure.",
    partnerName: "Prof. Henderson (Faculty Advisor)",
    partnerPrompt: "Your sample size in cohort B looks significantly smaller than cohort A. How do you defend that this wasn't selective sampling bias?",
    suggestedOpening: "Thank you for highlighting that, Professor. Cohort B was constrained to participants with complete longitudinal telemetry...",
    variationTitle: "Follow-up Inquiry: Generalizability to Broader Demographics",
    variationPrompt: "A visiting faculty member asks: 'If you replicated this study across non-English speakers, what confounding variables would you anticipate?'",
  },
  {
    id: "sim_everyday",
    category: "everyday_conversations",
    categoryLabel: "Everyday Conversations",
    categoryIcon: "☕",
    title: "Casual Networking & Explaining Complex Work Simply",
    role: "Professional at an International Tech Meetup",
    context: "Coffee break networking mixer with designers, founders, and students.",
    objective: "Explain your work without excessive jargon in 2-3 friendly sentences, and ask an engaging open question in return.",
    partnerName: "Elena (Product Designer)",
    partnerPrompt: "Hi there! I overheard you talking about AI and language. What kind of problems are you actually working on day to day?",
    suggestedOpening: "Hi Elena! Basically, we build tools that help people practice real high-stakes conversations before having to do them live...",
    variationTitle: "Recovering from Ambiguity & Deepening Dialogue",
    variationPrompt: "Elena smiles: 'Oh interesting! How is that different from just talking to a standard ChatGPT bot on your phone?'",
  },
  {
    id: "sim_customer",
    category: "customer_communication",
    categoryLabel: "Customer Communication",
    categoryIcon: "📞",
    title: "De-Escalating an Enterprise Outage Inquiry",
    role: "Technical Customer Success Lead",
    context: "High-priority video call with a frustrated enterprise account director during partial system degradation.",
    objective: "Validate their frustration with empathy, communicate the immediate engineering mitigation, and commit to an explicit follow-up timeline.",
    partnerName: "Marcus (Enterprise Account Director)",
    partnerPrompt: "Our regional sales reps couldn't submit quotes for two hours during end-of-quarter closing. This is costing us deals. What is going on?",
    suggestedOpening: "Marcus, I completely understand the impact this has during your quarter close, and you have every right to be frustrated...",
    variationTitle: "Demanding Immediate Root Cause & SLA Credits",
    variationPrompt: "Marcus presses: 'I need a written RCA on my desk by 3 PM and confirmation of SLA credit refunds before our CFO calls.'",
  },
  {
    id: "sim_public",
    category: "public_speaking",
    categoryLabel: "Public Speaking",
    categoryIcon: "🎙️",
    title: "Executive Keynote Hook: The Cost of Miscommunication",
    role: "Keynote Speaker",
    context: "Annual tech leadership conference opening plenary in front of 400 attendees.",
    objective: "Deliver a memorable 60-second opening hook with vocal control, contrasting knowledge with usability under pressure.",
    partnerName: "Conference Emcee",
    partnerPrompt: "Please welcome our next speaker to share insights on the future of human communication intelligence!",
    suggestedOpening: "Most professionals don't fail because they lack knowledge. They fail because knowing what to say and having the composure to say it under pressure are two completely different skills...",
    variationTitle: "Impromptu Audience Q&A Transition",
    variationPrompt: "An attendee raises their hand: 'If confidence under pressure is the bottleneck, why don't traditional language apps solve this?'",
  },
];

interface Flashcard {
  id: string;
  front: string;
  back: string;
  context: string;
}

const FLASHCARDS: Flashcard[] = [
  {
    id: "fc_1",
    front: "¿Cuáles son los bloqueos actuales?",
    back: "What are the current blockers?",
    context: "Daily Engineering Standup",
  },
  {
    id: "fc_2",
    front: "Podemos coordinar los detalles fuera de la reunión.",
    back: "We can take the details offline / coordinate after the sync.",
    context: "Timeboxing Discussions",
  },
  {
    id: "fc_3",
    front: "El despliegue está programado para esta tarde.",
    back: "The deployment is scheduled for this afternoon.",
    context: "Sprint Status Updates",
  },
  {
    id: "fc_4",
    front: "Necesito apoyo con la revisión del código de la API.",
    back: "I need support with the API pull request review.",
    context: "Team Collaboration",
  },
];

interface EvaluationResultDisplay {
  score: "mastered" | "needs_work";
  feedback: string;
  strengths: string;
  areasToRefine: string;
  nextAction: string;
}

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onstart: (() => void) | null;
  onresult: ((event: unknown) => void) | null;
  onerror: ((event: unknown) => void) | null;
  onend: (() => void) | null;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

interface SpeechWindow {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
}

export default function PracticeView({
  evaluations,
  exercises,
  hearts,
  onRestoreHeart,
  onLaunchExercise,
}: PracticeViewProps) {
  // Active Simulator State
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>("sim_workplace");
  const [isVariationActive, setIsVariationActive] = useState<boolean>(false);
  const [activeInputMethod, setActiveInputMethod] = useState<InputMethod>("type");

  // User input states (preserved when switching methods)
  const [typedResponse, setTypedResponse] = useState<string>("");
  const [spokenTranscript, setSpokenTranscript] = useState<string>("");
  const [isListening, setIsListening] = useState<boolean>(false);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  // Simulator evaluation states
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [evalResult, setEvalResult] = useState<EvaluationResultDisplay | null>(null);
  const [previousAttemptsCount, setPreviousAttemptsCount] = useState<number>(0);

  // Flashcards state
  const [activeFlippedCard, setActiveFlippedCard] = useState<string | null>(null);

  const activeScenario = SIMULATOR_SCENARIOS.find((s) => s.id === selectedScenarioId) || SIMULATOR_SCENARIOS[0];

  // Filter evaluations that scored "needs_work"
  const mistakeEvaluations = evaluations.filter((ev) => {
    const s = ev.score.trim().toLowerCase();
    return s === "needs_work";
  });

  // Switch scenarios
  const handleSelectScenario = (scenarioId: string) => {
    sound.playPop();
    setSelectedScenarioId(scenarioId);
    setIsVariationActive(false);
    setEvalResult(null);
  };

  // Toggle scenario variation (Retry with challenge)
  const handleToggleVariation = () => {
    sound.playPop();
    setIsVariationActive((prev) => !prev);
    setEvalResult(null);
  };

  // Toggle speech recording
  const handleToggleSpeech = () => {
    if (typeof window === "undefined") return;
    const speechWin = window as unknown as SpeechWindow;
    const SpeechConstructor = speechWin.SpeechRecognition || speechWin.webkitSpeechRecognition;

    if (!SpeechConstructor) {
      alert("Web Speech API is not supported in this browser. Please use typed input or whiteboard.");
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechConstructor();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = activeScenario.category === "workplace_meetings" ? "es-ES" : "en-US";

      recognition.onstart = () => {
        sound.playPop();
        setIsListening(true);
      };

      recognition.onresult = (event: unknown) => {
        const speechEvent = event as {
          results: Array<{
            [index: number]: { transcript: string };
            isFinal?: boolean;
          }>;
        };
        let transcript = "";
        for (let i = 0; i < speechEvent.results.length; i++) {
          transcript += speechEvent.results[i][0].transcript + " ";
        }
        const cleaned = transcript.trim();
        setSpokenTranscript(cleaned);
        // Also sync to typedResponse so learner has continuity across input modes!
        setTypedResponse(cleaned);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error("Speech recognition error:", err);
      setIsListening(false);
    }
  };

  // Run contextual evaluation against current scenario objective
  const handleEvaluateResponse = () => {
    sound.playPop();
    const responseToEvaluate = (activeInputMethod === "speak" && spokenTranscript)
      ? spokenTranscript
      : typedResponse.trim();

    if (!responseToEvaluate) {
      alert("Please provide a response via typing, speaking, or transcribe your whiteboard notes before evaluating.");
      return;
    }

    setIsEvaluating(true);

    // Evaluate response based on communicative heuristics & scenario objective
    setTimeout(() => {
      const wordCount = responseToEvaluate.split(/\s+/).filter(Boolean).length;
      const lower = responseToEvaluate.toLowerCase();

      let isMastered = false;
      let strengths = "";
      let areasToRefine = "";
      let nextAction = "";

      if (activeScenario.category === "workplace_meetings") {
        const hasPastWork = lower.includes("terminé") || lower.includes("ayer") || lower.includes("finished");
        const hasFocus = lower.includes("enfoco") || lower.includes("hoy") || lower.includes("focus");
        const hasBlocker = lower.includes("bloqueo") || lower.includes("credenciales") || lower.includes("block");

        if (hasPastWork && (hasFocus || hasBlocker) && wordCount >= 10) {
          isMastered = true;
          strengths = "Excellent technical clarity: You structured your update across completed work and current blockers with natural workplace pacing.";
          areasToRefine = "To refine further, verify that the timeline for unblocking is explicitly agreed upon before concluding.";
          nextAction = "Advance to the constraint variation: Explain backwards-compatibility to Mateo.";
        } else {
          isMastered = false;
          strengths = "Good communicative attempt: You initiated your standup response directly.";
          areasToRefine = "Ensure you explicitly cover all three standup pillars: Completed progress, today's immediate priorities, and specific blockers requiring team support.";
          nextAction = "Revise your update ensuring you state: 'Ayer terminé...', 'Hoy me enfoco en...', and 'Tengo un bloqueo con...'.";
        }
      } else {
        // General professional communication rubric
        if (wordCount >= 15 && (lower.includes("because") || lower.includes("however") || lower.includes("specifically") || lower.includes("impact") || lower.includes("understand"))) {
          isMastered = true;
          strengths = "High communicative composure: Your response addresses the core prompt with professional framing, substantive evidence, and appropriate register.";
          areasToRefine = "Keep answers concise: Aim to deliver your core point in the first sentence before elaborating.";
          nextAction = "Test your composure with an impromptu variation or increased time constraint.";
        } else {
          isMastered = false;
          strengths = "Relevant focus: Your response engages the situational scenario.";
          areasToRefine = "Provide substantive detail: Ground your explanation in concrete trade-offs, rationale, or actionable next steps rather than high-level assertions.";
          nextAction = "Expand your response with specific rationale addressing the partner's core concern.";
        }
      }

      setEvalResult({
        score: isMastered ? "mastered" : "needs_work",
        feedback: isMastered ? "Mastered communicative baseline for this scenario." : "Needs refinement to meet professional communicative criteria.",
        strengths,
        areasToRefine,
        nextAction,
      });

      setPreviousAttemptsCount((prev) => prev + 1);
      setIsEvaluating(false);

      if (isMastered) {
        sound.playFanfare();
        onRestoreHeart();
      }
    }, 600);
  };

  const handleCardFlip = (id: string) => {
    sound.playPop();
    setActiveFlippedCard((prev) => (prev === id ? null : id));
  };

  const handlePracticeMistake = (exerciseId: string) => {
    sound.playPop();
    onRestoreHeart();
    onLaunchExercise(exerciseId);
  };

  return (
    <div className="duo-tab-view" aria-label="Communication Simulator and Practice Hub">
      {/* 1. Real-World Communication Simulator Section */}
      <div
        className="speakql-simulator-hero"
        style={{
          background: "linear-gradient(135deg, rgba(30, 27, 75, 0.7), rgba(15, 23, 42, 0.95))",
          border: "2px solid rgba(168, 85, 247, 0.35)",
          borderRadius: "1.5rem",
          padding: "1.75rem",
          boxShadow: "0 20px 40px -8px rgba(0, 0, 0, 0.4)",
          marginBottom: "2.5rem",
        }}
      >
        {/* Top Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem", marginBottom: "1.5rem" }}>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", background: "rgba(168, 85, 247, 0.15)", border: "1px solid rgba(168, 85, 247, 0.3)", borderRadius: "9999px", padding: "0.3rem 0.8rem", marginBottom: "0.5rem" }}>
              <span style={{ fontSize: "0.85rem" }}>🎙️</span>
              <span style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#c084fc" }}>
                Real-World Communication Simulator
              </span>
            </div>
            <h2 style={{ margin: "0 0 0.25rem", fontSize: "1.6rem", fontWeight: 800, color: "#f8fafc" }}>
              Practice for Real Situations
            </h2>
            <p style={{ margin: 0, fontSize: "0.95rem", color: "#94a3b8", maxWidth: "680px" }}>
              Step into high-stakes workplace and life scenarios. Respond naturally via typing, digital whiteboard handwriting, or speech.
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <span style={{ fontSize: "0.85rem", color: "#94a3b8" }}>Lives Available:</span>
            <span style={{ fontSize: "1rem", fontWeight: 700, color: "#f43f5e" }}>❤️ {hearts}/5</span>
          </div>
        </div>

        {/* Category Selector Pills */}
        <div
          role="tablist"
          aria-label="Scenario categories"
          style={{
            display: "flex",
            gap: "0.5rem",
            overflowX: "auto",
            paddingBottom: "0.5rem",
            marginBottom: "1.5rem",
          }}
        >
          {SIMULATOR_SCENARIOS.map((scenario) => {
            const isSelected = scenario.id === selectedScenarioId;
            return (
              <button
                key={scenario.id}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => handleSelectScenario(scenario.id)}
                style={{
                  background: isSelected ? "linear-gradient(135deg, #8b5cf6, #d946ef)" : "rgba(30, 41, 59, 0.8)",
                  border: isSelected ? "1.5px solid #ffffff" : "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "9999px",
                  padding: "0.5rem 1rem",
                  color: isSelected ? "#ffffff" : "#cbd5e1",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  whiteSpace: "nowrap",
                  transition: "all 0.15s ease",
                  boxShadow: isSelected ? "0 4px 14px rgba(168, 85, 247, 0.4)" : "none",
                }}
              >
                <span>{scenario.categoryIcon}</span>
                <span>{scenario.categoryLabel}</span>
              </button>
            );
          })}
        </div>

        {/* Active Scenario Brief Card */}
        <div
          style={{
            background: "rgba(15, 23, 42, 0.85)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "1rem",
            padding: "1.25rem 1.5rem",
            marginBottom: "1.5rem",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.75rem", marginBottom: "0.75rem" }}>
            <div>
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#38bdf8", textTransform: "uppercase" }}>
                Role: {activeScenario.role}
              </span>
              <h3 style={{ margin: "0.2rem 0", fontSize: "1.2rem", fontWeight: 700, color: "#f8fafc" }}>
                {isVariationActive && activeScenario.variationTitle
                  ? `[Variation] ${activeScenario.variationTitle}`
                  : activeScenario.title}
              </h3>
            </div>

            {activeScenario.variationPrompt && (
              <button
                type="button"
                onClick={handleToggleVariation}
                style={{
                  background: isVariationActive ? "rgba(244, 63, 94, 0.2)" : "rgba(56, 189, 248, 0.15)",
                  border: isVariationActive ? "1px solid #f43f5e" : "1px solid #38bdf8",
                  borderRadius: "0.5rem",
                  padding: "0.35rem 0.75rem",
                  color: isVariationActive ? "#fda4af" : "#38bdf8",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {isVariationActive ? "↺ Reset to Baseline" : "⚡ Challenge with Variation"}
              </button>
            )}
          </div>

          <p style={{ margin: "0 0 0.75rem", fontSize: "0.9rem", color: "#94a3b8", lineHeight: 1.5 }}>
            <strong style={{ color: "#cbd5e1" }}>Context:</strong> {activeScenario.context}
          </p>

          <p style={{ margin: "0 0 1rem", fontSize: "0.9rem", color: "#cbd5e1", lineHeight: 1.5 }}>
            <strong style={{ color: "#a855f7" }}>Communication Objective:</strong> {activeScenario.objective}
          </p>

          {/* Conversation Partner Bubble */}
          <div
            style={{
              background: "rgba(30, 41, 59, 0.9)",
              borderLeft: "4px solid #a855f7",
              borderRadius: "0.5rem",
              padding: "0.75rem 1rem",
              display: "flex",
              alignItems: "flex-start",
              gap: "0.75rem",
            }}
          >
            <span style={{ fontSize: "1.4rem" }}>👤</span>
            <div>
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#c084fc" }}>
                {activeScenario.partnerName}:
              </span>
              <p style={{ margin: "0.2rem 0 0", fontSize: "0.95rem", color: "#f8fafc", fontStyle: "italic", lineHeight: 1.4 }}>
                &ldquo;{isVariationActive && activeScenario.variationPrompt ? activeScenario.variationPrompt : activeScenario.partnerPrompt}&rdquo;
              </p>
            </div>
          </div>
        </div>

        {/* 3 Input Methods Switcher */}
        <div style={{ marginBottom: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
            <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#94a3b8" }}>
              Input Method:
            </span>
            <div style={{ display: "flex", background: "rgba(15, 23, 42, 0.8)", padding: "0.25rem", borderRadius: "0.75rem", border: "1px solid rgba(255, 255, 255, 0.08)" }}>
              <button
                type="button"
                onClick={() => {
                  sound.playPop();
                  setActiveInputMethod("type");
                }}
                style={{
                  background: activeInputMethod === "type" ? "rgba(168, 85, 247, 0.3)" : "transparent",
                  border: activeInputMethod === "type" ? "1px solid #a855f7" : "none",
                  borderRadius: "0.5rem",
                  padding: "0.35rem 0.85rem",
                  color: activeInputMethod === "type" ? "#ffffff" : "#94a3b8",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                ⌨️ Type Answer
              </button>

              <button
                type="button"
                onClick={() => {
                  sound.playPop();
                  setActiveInputMethod("whiteboard");
                }}
                style={{
                  background: activeInputMethod === "whiteboard" ? "rgba(168, 85, 247, 0.3)" : "transparent",
                  border: activeInputMethod === "whiteboard" ? "1px solid #a855f7" : "none",
                  borderRadius: "0.5rem",
                  padding: "0.35rem 0.85rem",
                  color: activeInputMethod === "whiteboard" ? "#ffffff" : "#94a3b8",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                ✍️ Digital Whiteboard
              </button>

              <button
                type="button"
                onClick={() => {
                  sound.playPop();
                  setActiveInputMethod("speak");
                }}
                style={{
                  background: activeInputMethod === "speak" ? "rgba(168, 85, 247, 0.3)" : "transparent",
                  border: activeInputMethod === "speak" ? "1px solid #a855f7" : "none",
                  borderRadius: "0.5rem",
                  padding: "0.35rem 0.85rem",
                  color: activeInputMethod === "speak" ? "#ffffff" : "#94a3b8",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                🎙️ Speak Aloud
              </button>
            </div>
          </div>

          {/* Method 1: Type Answer */}
          {activeInputMethod === "type" && (
            <div>
              <textarea
                rows={4}
                value={typedResponse}
                onChange={(e) => setTypedResponse(e.target.value)}
                placeholder={`Type your response here... (e.g. "${activeScenario.suggestedOpening}")`}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  background: "rgba(15, 23, 42, 0.9)",
                  border: "1.5px solid rgba(255, 255, 255, 0.15)",
                  borderRadius: "0.75rem",
                  padding: "0.9rem",
                  color: "#ffffff",
                  fontSize: "0.95rem",
                  fontFamily: "inherit",
                  lineHeight: 1.5,
                }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.4rem", fontSize: "0.75rem", color: "#64748b" }}>
                <span>Suggested opening: &ldquo;{activeScenario.suggestedOpening.slice(0, 50)}...&rdquo;</span>
                <span>{typedResponse.length} characters</span>
              </div>
            </div>
          )}

          {/* Method 2: Digital Practice Whiteboard */}
          {activeInputMethod === "whiteboard" && (
            <div style={{ marginBottom: "1rem" }}>
              <DigitalPracticeWhiteboard
                scenarioTitle={`Whiteboard Notes: ${activeScenario.title}`}
                promptText="Sketch, mind-map, or handwrite key phrases before delivering your message."
              />
              <div style={{ marginTop: "0.75rem" }}>
                <label
                  htmlFor="whiteboard-transcript-input"
                  style={{ display: "block", fontSize: "0.8rem", color: "#94a3b8", marginBottom: "0.25rem" }}
                >
                  Optional: Transcribe your handwritten message here to evaluate against the objective:
                </label>
                <input
                  id="whiteboard-transcript-input"
                  type="text"
                  value={typedResponse}
                  onChange={(e) => setTypedResponse(e.target.value)}
                  placeholder="e.g. Ayer terminé el servicio de API. Hoy desarrollo la caché..."
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    background: "rgba(15, 23, 42, 0.9)",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    borderRadius: "0.5rem",
                    padding: "0.6rem 0.8rem",
                    color: "#ffffff",
                    fontSize: "0.9rem",
                  }}
                />
              </div>
            </div>
          )}

          {/* Method 3: Speak Aloud */}
          {activeInputMethod === "speak" && (
            <div
              style={{
                background: "rgba(15, 23, 42, 0.9)",
                border: "1.5px solid rgba(255, 255, 255, 0.15)",
                borderRadius: "0.75rem",
                padding: "1.25rem",
                textAlign: "center",
              }}
            >
              <button
                type="button"
                onClick={handleToggleSpeech}
                style={{
                  background: isListening ? "#ef4444" : "linear-gradient(135deg, #a855f7, #6366f1)",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "9999px",
                  padding: "0.75rem 1.75rem",
                  fontSize: "1rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  boxShadow: isListening ? "0 0 20px rgba(239, 68, 68, 0.6)" : "0 4px 16px rgba(168, 85, 247, 0.4)",
                }}
              >
                <span>{isListening ? "⏹️ Stop Recording" : "🎙️ Start Speaking"}</span>
              </button>

              <p style={{ margin: "0.75rem 0 0", fontSize: "0.85rem", color: isListening ? "#f43f5e" : "#94a3b8" }}>
                {isListening ? "● Listening live... Speak naturally into your microphone." : "Tap to record your response. Target language handles Spanish / English automatically."}
              </p>

              {spokenTranscript && (
                <div
                  style={{
                    marginTop: "1rem",
                    background: "rgba(30, 41, 59, 0.8)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    borderRadius: "0.5rem",
                    padding: "0.75rem",
                    textAlign: "left",
                  }}
                >
                  <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#38bdf8" }}>
                    Captured Speech Transcript:
                  </span>
                  <p style={{ margin: "0.25rem 0 0", fontSize: "0.95rem", color: "#f8fafc" }}>
                    &ldquo;{spokenTranscript}&rdquo;
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Evaluate Action Button */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1rem" }}>
          <button
            type="button"
            onClick={handleEvaluateResponse}
            disabled={isEvaluating}
            style={{
              background: "linear-gradient(135deg, #22c55e, #16a34a)",
              color: "#ffffff",
              border: "none",
              borderRadius: "0.75rem",
              padding: "0.8rem 1.75rem",
              fontSize: "0.95rem",
              fontWeight: 700,
              cursor: isEvaluating ? "not-allowed" : "pointer",
              boxShadow: "0 6px 18px rgba(34, 197, 94, 0.35)",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <span>{isEvaluating ? "Analyzing Communication..." : "Evaluate Communicative Response 🎯"}</span>
          </button>
        </div>

        {/* Evaluation Feedback Drawer */}
        {evalResult && (
          <div
            style={{
              marginTop: "1.5rem",
              background: evalResult.score === "mastered" ? "rgba(22, 101, 52, 0.25)" : "rgba(153, 27, 27, 0.25)",
              border: evalResult.score === "mastered" ? "1.5px solid #22c55e" : "1.5px solid #ef4444",
              borderRadius: "1rem",
              padding: "1.25rem 1.5rem",
              animation: "fadeIn 0.2s ease",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
              <span style={{ fontSize: "1.2rem" }}>
                {evalResult.score === "mastered" ? "🌟" : "💡"}
              </span>
              <h4 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "#ffffff" }}>
                {evalResult.score === "mastered" ? "Mastered Scenario Criteria (+1 Heart ❤️)" : "Needs Work: Review Refinements"}
              </h4>
            </div>

            <p style={{ margin: "0 0 0.75rem", fontSize: "0.9rem", color: "#cbd5e1" }}>
              {evalResult.feedback}
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: "0.75rem", marginBottom: "0.75rem" }}>
              <div style={{ background: "rgba(15, 23, 42, 0.6)", padding: "0.75rem", borderRadius: "0.5rem" }}>
                <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#4ade80", textTransform: "uppercase" }}>
                  Strengths
                </span>
                <p style={{ margin: "0.25rem 0 0", fontSize: "0.85rem", color: "#e2e8f0", lineHeight: 1.4 }}>
                  {evalResult.strengths}
                </p>
              </div>

              <div style={{ background: "rgba(15, 23, 42, 0.6)", padding: "0.75rem", borderRadius: "0.5rem" }}>
                <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#fca5a5", textTransform: "uppercase" }}>
                  Areas to Refine
                </span>
                <p style={{ margin: "0.25rem 0 0", fontSize: "0.85rem", color: "#e2e8f0", lineHeight: 1.4 }}>
                  {evalResult.areasToRefine}
                </p>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px solid rgba(255, 255, 255, 0.08)" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>
                  <strong>Recommended Next Action:</strong> {evalResult.nextAction}
                </span>
                <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
                  Attempts Evaluated: {previousAttemptsCount}
                </span>
              </div>

              {activeScenario.variationPrompt && !isVariationActive && (
                <button
                  type="button"
                  onClick={handleToggleVariation}
                  style={{
                    background: "rgba(168, 85, 247, 0.25)",
                    border: "1px solid #a855f7",
                    borderRadius: "0.5rem",
                    padding: "0.4rem 0.8rem",
                    color: "#f3e8ff",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Attempt Scenario Variation →
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 2. Earn Hearts Banner & Targeted Mistake Reviews Section */}
      <div className="duo-practice-banner">
        <div className="practice-banner-left">
          <span className="practice-kicker">MISTAKES RECOVERY HUB</span>
          <h2>Practice to Earn Hearts</h2>
          <p>Review and revise previous mistakes to reinforce memory and restore your hearts without waiting!</p>
        </div>
        <div className="practice-heart-display">
          <span className="practice-heart-icon" aria-hidden="true">❤️</span>
          <span className="practice-heart-count">{hearts} / 5</span>
          <span className="practice-heart-label">Active Lives</span>
        </div>
      </div>

      {/* Mistakes Queue Section */}
      <div className="duo-mistakes-section">
        <div className="mistakes-section-header">
          <h3>Targeted Mistake Reviews ({mistakeEvaluations.length})</h3>
          <p>Each resolved mistake earns +1 Heart ❤️ and +15 XP.</p>
        </div>

        {mistakeEvaluations.length === 0 ? (
          <div className="duo-empty-mistakes">
            <span className="empty-trophy" aria-hidden="true">✨</span>
            <h4>No Mistakes to Review!</h4>
            <p>You&apos;ve mastered your exercises or haven&apos;t accumulated review items yet. Great job!</p>
          </div>
        ) : (
          <div className="duo-mistakes-grid">
            {mistakeEvaluations.map((ev) => {
              const feedback = parseStoredEvaluationFeedback(ev.feedback);

              return (
                <div key={ev.id} className="duo-mistake-card">
                  <div className="mistake-card-top">
                    <span className="mistake-badge">Needs Revision</span>
                    <span className="mistake-date">
                      {ev.createdAt ? new Date(ev.createdAt).toLocaleDateString() : "Recent"}
                    </span>
                  </div>

                  <p className="mistake-response-text">
                    &ldquo;{ev.userResponse || "Previous practice attempt"}&rdquo;
                  </p>

                  <div className="mistake-guidance-box">
                    <span className="guidance-label">Coach Feedback:</span>
                    <p>{feedback.summaryFeedback || "Consider expanding on your main point with clearer vocabulary."}</p>
                  </div>

                  <button
                    type="button"
                    className="duo-revise-btn"
                    onClick={() => handlePracticeMistake(ev.exerciseId)}
                  >
                    REVISE &amp; RESTORE HEART +❤️
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. Key Expressions Vault Flashcards Section */}
      <div className="duo-flashcards-section">
        <div className="flashcards-section-header">
          <h3>Key Expressions Vault</h3>
          <p>Tap a flashcard to flip between target phrasing and translations.</p>
        </div>

        <div className="duo-flashcards-grid">
          {FLASHCARDS.map((fc) => {
            const isFlipped = activeFlippedCard === fc.id;

            return (
              <div
                key={fc.id}
                className={`duo-flashcard ${isFlipped ? "card-flipped" : ""}`}
                onClick={() => handleCardFlip(fc.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleCardFlip(fc.id);
                  }
                }}
                aria-label={`Flashcard: ${fc.front}`}
              >
                <div className="flashcard-inner">
                  <div className="flashcard-front">
                    <span className="flashcard-context">{fc.context}</span>
                    <h4 className="flashcard-phrase">{fc.front}</h4>
                    <span className="flashcard-tap-hint">Tap to flip ↺</span>
                  </div>
                  <div className="flashcard-back">
                    <span className="flashcard-context">{fc.context}</span>
                    <h4 className="flashcard-phrase">{fc.back}</h4>
                    <span className="flashcard-tap-hint">Tap to flip ↺</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Targeted Competency Drills Section */}
      {exercises && exercises.length > 0 && (
        <div className="duo-drills-section" style={{ marginTop: "2rem" }}>
          <div className="flashcards-section-header">
            <h3>Targeted Competency Drills</h3>
            <p>Practice specific communication scenarios anytime to reinforce muscle memory.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem", marginTop: "1rem" }}>
            {exercises.map((ex) => {
              const details = parseExerciseDetails(ex.scenarioPrompt, ex.expectedStructure);
              return (
                <div
                  key={ex.id}
                  style={{
                    background: "var(--color-duo-card-bg, #1e293b)",
                    border: "2px solid var(--color-duo-border, #334155)",
                    borderRadius: "1rem",
                    padding: "1rem",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    gap: "0.75rem",
                  }}
                >
                  <div>
                    <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--color-duo-green, #58cc02)", textTransform: "uppercase" }}>
                      Communication Drill
                    </span>
                    <h4 style={{ margin: "0.25rem 0", fontSize: "1rem", fontWeight: 700 }}>
                      {details.objective || ex.expectedStructure || "Interactive Dialogue"}
                    </h4>
                    <p style={{ margin: 0, fontSize: "0.85rem", opacity: 0.85, lineHeight: 1.5 }}>
                      {details.scenario || details.instructions}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="duo-btn-subtle"
                    style={{ width: "100%", padding: "0.5rem" }}
                    onClick={() => onLaunchExercise(ex.id)}
                  >
                    PRACTICE DRILL 🎯
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
