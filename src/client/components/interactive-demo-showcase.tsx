"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { WhaleMascot } from "./whale-mascot";
import { sound } from "@/src/client/sound/synthesizer";

interface Scenario {
  id: string;
  category: string;
  title: string;
  coachIntro: string;
  contextPrompt: string;
  targetTokens: string[];
  distractorTokens: string[];
  modelAnswer: string;
  evaluation: {
    score: number;
    clarityScore: number;
    nuanceScore: number;
    assertivenessScore: number;
    feedbackHeadline: string;
    actionableTip: string;
  };
}

const SCENARIOS: Scenario[] = [
  {
    id: "standup-blocker",
    category: "ENGINEERING STANDUP",
    title: "Articulating an Unexpected API Blocker",
    coachIntro: "Deliver a clear, professional update about a database latency blocker without sounding defensive.",
    contextPrompt: "You are in daily standup. A downstream query latency is blocking your deployment. How do you articulate this to the team?",
    targetTokens: ["I need to flag", "a blocking latency issue", "in the auth query", "which is delaying release"],
    distractorTokens: ["we messed up", "it is not my fault", "maybe tomorrow"],
    modelAnswer: "I need to flag a blocking latency issue in the auth query which is delaying release.",
    evaluation: {
      score: 96,
      clarityScore: 98,
      nuanceScore: 94,
      assertivenessScore: 96,
      feedbackHeadline: "Superb executive clarity and accountability.",
      actionableTip: "You precisely identified the technical bottleneck while maintaining a solutions-oriented professional tone.",
    },
  },
  {
    id: "executive-negotiation",
    category: "STAKEHOLDER SYNC",
    title: "Negotiating Timeline Extensions with Confidence",
    coachIntro: "Explain why quality and security require 48 additional hours before general launch.",
    contextPrompt: "The product manager wants to cut security validation to hit Friday. Propose the revised schedule with calm authority.",
    targetTokens: ["To ensure zero data regressions", "I strongly advise", "holding launch until Tuesday", "after full pen-testing"],
    distractorTokens: ["we are too tired", "rules are rules", "cancel the project"],
    modelAnswer: "To ensure zero data regressions I strongly advise holding launch until Tuesday after full pen-testing.",
    evaluation: {
      score: 94,
      clarityScore: 95,
      nuanceScore: 92,
      assertivenessScore: 95,
      feedbackHeadline: "Exemplary technical leadership and diplomatic firmness.",
      actionableTip: "Framing the timeline extension in terms of data integrity immediately anchors stakeholder trust.",
    },
  },
  {
    id: "cross-cultural-sync",
    category: "GLOBAL TEAMWORK",
    title: "Clarifying Ambiguous Requirements Tactfully",
    coachIntro: "Ask a partner team across timezones for architectural clarity without causing friction.",
    contextPrompt: "The API payload specification from Tokyo has two conflicting ID fields. Request clarification with warmth and precision.",
    targetTokens: ["Could you please clarify", "the expected schema", "between accountId and customerId", "before we finalize"],
    distractorTokens: ["this makes no sense", "your team broke it", "fix this ASAP"],
    modelAnswer: "Could you please clarify the expected schema between accountId and customerId before we finalize.",
    evaluation: {
      score: 98,
      clarityScore: 99,
      nuanceScore: 97,
      assertivenessScore: 98,
      feedbackHeadline: "Flawless cross-cultural precision.",
      actionableTip: "Specific field references paired with polite inquiry prevent defensive team responses.",
    },
  },
];

export default function InteractiveDemoShowcase() {
  const [selectedScenarioIndex, setSelectedScenarioIndex] = useState(0);
  const scenario = SCENARIOS[selectedScenarioIndex];

  const [selectedTokens, setSelectedTokens] = useState<string[]>([]);
  const [availableTokens, setAvailableTokens] = useState<string[]>(() => [
    ...SCENARIOS[0].targetTokens,
    ...SCENARIOS[0].distractorTokens,
  ]);
  const [isPlayingAuto, setIsPlayingAuto] = useState<boolean>(false);
  const [isEvaluated, setIsEvaluated] = useState<boolean>(false);
  const [activeStep, setActiveStep] = useState<"intro" | "building" | "evaluating" | "celebrating">("intro");
  const [isAudioMuted, setIsAudioMuted] = useState(false);

  const autoPlayTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleSelectScenario = (idx: number) => {
    setSelectedScenarioIndex(idx);
    const target = SCENARIOS[idx];
    const combined = [...target.targetTokens, ...target.distractorTokens].sort(() => 0.5 - Math.random());
    setAvailableTokens(combined);
    setSelectedTokens([]);
    setIsEvaluated(false);
    setActiveStep("intro");
    if (autoPlayTimerRef.current) clearTimeout(autoPlayTimerRef.current);
    setIsPlayingAuto(false);
  };

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (autoPlayTimerRef.current) clearTimeout(autoPlayTimerRef.current);
    };
  }, []);

  const playSoundEffect = (type: "click" | "success" | "fanfare") => {
    if (isAudioMuted) return;
    try {
      if (type === "click") sound.playPop();
      else if (type === "success") sound.playCorrect();
      else if (type === "fanfare") sound.playFanfare();
    } catch {
      // Audio context might be restricted before user gesture
    }
  };

  const handleSelectToken = (token: string) => {
    if (isEvaluated) return;
    playSoundEffect("click");
    setSelectedTokens((prev) => [...prev, token]);
    setAvailableTokens((prev) => prev.filter((t) => t !== token));
    setActiveStep("building");
  };

  const handleDeselectToken = (token: string) => {
    if (isEvaluated) return;
    playSoundEffect("click");
    setSelectedTokens((prev) => prev.filter((t) => t !== token));
    setAvailableTokens((prev) => [...prev, token]);
  };

  const handleEvaluate = () => {
    setActiveStep("evaluating");
    setTimeout(() => {
      setIsEvaluated(true);
      setActiveStep("celebrating");
      playSoundEffect("fanfare");
    }, 600);
  };

  const handleReset = () => {
    const combined = [...scenario.targetTokens, ...scenario.distractorTokens].sort(() => 0.5 - Math.random());
    setAvailableTokens(combined);
    setSelectedTokens([]);
    setIsEvaluated(false);
    setActiveStep("building");
  };

  // Run guided automated demo playback
  const startGuidedDemo = () => {
    if (autoPlayTimerRef.current) clearTimeout(autoPlayTimerRef.current);
    setIsPlayingAuto(true);
    setIsEvaluated(false);
    setSelectedTokens([]);
    setActiveStep("building");

    const tokensToSelect = [...scenario.targetTokens];
    let currentIndex = 0;

    const slotNextToken = () => {
      if (currentIndex < tokensToSelect.length) {
        const next = tokensToSelect[currentIndex];
        setSelectedTokens((prev) => [...prev, next]);
        setAvailableTokens((prev) => prev.filter((t) => t !== next));
        playSoundEffect("click");
        currentIndex++;
        autoPlayTimerRef.current = setTimeout(slotNextToken, 450);
      } else {
        autoPlayTimerRef.current = setTimeout(() => {
          setActiveStep("evaluating");
          autoPlayTimerRef.current = setTimeout(() => {
            setIsEvaluated(true);
            setActiveStep("celebrating");
            playSoundEffect("fanfare");
            setIsPlayingAuto(false);
          }, 700);
        }, 500);
      }
    };

    autoPlayTimerRef.current = setTimeout(slotNextToken, 600);
  };

  return (
    <section
      id="live-demo"
      style={{
        padding: "6rem 0",
        position: "relative",
        background: "linear-gradient(180deg, rgba(6, 9, 25, 0.4) 0%, rgba(15, 23, 58, 0.6) 50%, rgba(6, 9, 25, 0.4) 100%)",
        borderTop: "1px solid rgba(139, 92, 246, 0.2)",
        borderBottom: "1px solid rgba(139, 92, 246, 0.2)",
      }}
    >
      <div className="shell" style={{ maxWidth: "1140px" }}>
        {/* Section Header */}
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "6px 14px",
              borderRadius: "99px",
              background: "rgba(168, 85, 247, 0.15)",
              border: "1px solid rgba(168, 85, 247, 0.35)",
              color: "#c084fc",
              fontSize: "11px",
              fontWeight: 800,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              marginBottom: "16px",
            }}
          >
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: "#38bdf8",
                boxShadow: "0 0 10px #38bdf8",
                display: "inline-block",
              }}
            />
            LIVE PRODUCT SIMULATOR · INTERACTIVE DEMO
          </div>

          <h2
            style={{
              fontSize: "clamp(2rem, 4.5vw, 3.25rem)",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              margin: "0 0 16px",
              lineHeight: 1.15,
            }}
          >
            Experience how the brain learns.<br />
            <span style={{ color: "#c084fc", textShadow: "0 0 24px rgba(192, 132, 252, 0.4)" }}>
              Directly in your browser.
            </span>
          </h2>
          <p
            style={{
              maxWidth: "680px",
              margin: "0 auto",
              color: "var(--muted)",
              fontSize: "16px",
              lineHeight: 1.7,
            }}
          >
            Watch or play this live simulation. See how SpeakQL decomposes high-stakes communication
            into cognitive token assembly, immediate linguistic rubric feedback, and habit-forming mastery rewards.
          </p>

          {/* Scenario Selector Pills */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "10px",
              marginTop: "24px",
              flexWrap: "wrap",
            }}
          >
            {SCENARIOS.map((sc, idx) => (
              <button
                key={sc.id}
                type="button"
                onClick={() => {
                  sound.playPop();
                  handleSelectScenario(idx);
                }}
                style={{
                  background:
                    selectedScenarioIndex === idx
                      ? "linear-gradient(135deg, rgba(168, 85, 247, 0.3), rgba(56, 189, 248, 0.2))"
                      : "rgba(18, 24, 62, 0.6)",
                  border:
                    selectedScenarioIndex === idx
                      ? "1px solid rgba(56, 189, 248, 0.6)"
                      : "1px solid rgba(139, 92, 246, 0.25)",
                  color: selectedScenarioIndex === idx ? "#ffffff" : "#c4b5fd",
                  padding: "8px 16px",
                  borderRadius: "99px",
                  fontSize: "12px",
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  boxShadow:
                    selectedScenarioIndex === idx
                      ? "0 0 16px rgba(56, 189, 248, 0.3)"
                      : "none",
                }}
              >
                {sc.category}: {sc.title.slice(0, 24)}...
              </button>
            ))}
          </div>
        </div>

        {/* Video / Simulator Player Bezel */}
        <div
          style={{
            background: "rgba(13, 18, 48, 0.95)",
            backdropFilter: "blur(28px)",
            border: "1.5px solid rgba(139, 92, 246, 0.4)",
            borderRadius: "28px",
            overflow: "hidden",
            boxShadow: "0 24px 60px rgba(0, 0, 0, 0.6), 0 0 40px rgba(139, 92, 246, 0.2)",
          }}
        >
          {/* Player Top Bar (Browser/Studio Header) */}
          <div
            style={{
              padding: "14px 24px",
              background: "rgba(8, 12, 34, 0.9)",
              borderBottom: "1px solid rgba(139, 92, 246, 0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#ef4444", display: "inline-block" }} />
              <span style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#f59e0b", display: "inline-block" }} />
              <span style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#10b981", display: "inline-block" }} />
              <span style={{ marginLeft: "12px", fontSize: "12px", color: "#94a3b8", fontFamily: "var(--font-mono, monospace)" }}>
                SpeakQL Live Engine · {scenario.category}
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              {/* Audio Toggle */}
              <button
                type="button"
                onClick={() => setIsAudioMuted(!isAudioMuted)}
                title={isAudioMuted ? "Unmute audio effects" : "Mute audio effects"}
                style={{
                  background: "transparent",
                  border: "none",
                  color: isAudioMuted ? "#64748b" : "#38bdf8",
                  cursor: "pointer",
                  fontSize: "14px",
                  padding: "4px 8px",
                  borderRadius: "6px",
                }}
              >
                {isAudioMuted ? "🔇 Sound Off" : "🔊 Sound On"}
              </button>

              {/* Guided Play / Try Buttons */}
              <button
                type="button"
                onClick={startGuidedDemo}
                disabled={isPlayingAuto}
                style={{
                  background: isPlayingAuto ? "rgba(168, 85, 247, 0.4)" : "linear-gradient(135deg, #a855f7, #6366f1)",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "99px",
                  padding: "6px 14px",
                  fontSize: "11px",
                  fontWeight: 700,
                  cursor: isPlayingAuto ? "not-allowed" : "pointer",
                  boxShadow: "0 2px 10px rgba(168, 85, 247, 0.3)",
                }}
              >
                {isPlayingAuto ? "▶ Auto-Playing..." : "▶ Watch Guided Video Demo"}
              </button>

              <button
                type="button"
                onClick={handleReset}
                style={{
                  background: "rgba(255, 255, 255, 0.08)",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  color: "#e2e8f0",
                  borderRadius: "99px",
                  padding: "6px 12px",
                  fontSize: "11px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Reset Drills
              </button>
            </div>
          </div>

          {/* Interactive Stage Canvas */}
          <div style={{ padding: "32px 28px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px" }}>
            {/* Left Column: Context, Coach & Token Builder */}
            <div>
              {/* Scenario Context Box */}
              <div
                style={{
                  background: "rgba(18, 24, 64, 0.7)",
                  border: "1px solid rgba(139, 92, 246, 0.3)",
                  borderRadius: "16px",
                  padding: "20px",
                  marginBottom: "20px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                  <WhaleMascot mood="coach" size={44} animated={true} />
                  <div>
                    <span style={{ fontSize: "10px", fontWeight: 800, color: "#38bdf8", letterSpacing: "0.08em" }}>
                      OCEAN COACH GUIDANCE
                    </span>
                    <p style={{ margin: "2px 0 0", fontSize: "13px", color: "#e2e8f0", fontWeight: 600 }}>
                      {scenario.coachIntro}
                    </p>
                  </div>
                </div>

                <div
                  style={{
                    padding: "12px 14px",
                    background: "rgba(6, 9, 25, 0.6)",
                    borderRadius: "10px",
                    borderLeft: "3px solid #c084fc",
                  }}
                >
                  <span style={{ fontSize: "10px", fontWeight: 800, color: "#c084fc", textTransform: "uppercase" }}>
                    Situation Prompt
                  </span>
                  <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#94a3b8", lineHeight: 1.5 }}>
                    &ldquo;{scenario.contextPrompt}&rdquo;
                  </p>
                </div>
              </div>

              {/* Active Sentence Assembly Dock */}
              <div style={{ marginBottom: "20px" }}>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 800,
                    color: "#38bdf8",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    display: "block",
                    marginBottom: "8px",
                  }}
                >
                  Your Spoken Articulation Dock (Click chips to add or remove)
                </span>

                <div
                  style={{
                    minHeight: "76px",
                    padding: "12px 16px",
                    background: "rgba(6, 9, 25, 0.8)",
                    border: "2px dashed rgba(139, 92, 246, 0.4)",
                    borderRadius: "14px",
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  {selectedTokens.length === 0 ? (
                    <span style={{ color: "#64748b", fontSize: "13px", fontStyle: "italic" }}>
                      Assemble response tokens from the word bank below or click &quot;Watch Guided Video Demo&quot;...
                    </span>
                  ) : (
                    selectedTokens.map((token) => (
                      <button
                        key={token}
                        type="button"
                        onClick={() => handleDeselectToken(token)}
                        style={{
                          background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
                          color: "#ffffff",
                          border: "1px solid rgba(168, 85, 247, 0.6)",
                          padding: "6px 12px",
                          borderRadius: "10px",
                          fontSize: "12px",
                          fontWeight: 700,
                          cursor: "pointer",
                          boxShadow: "0 2px 8px rgba(124, 58, 237, 0.3)",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          transform: "translateY(0)",
                          transition: "transform 0.15s ease",
                        }}
                      >
                        {token}
                        <span style={{ fontSize: "10px", opacity: 0.7 }}>✕</span>
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* Available Word Bank */}
              <div>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 800,
                    color: "#c4b5fd",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    display: "block",
                    marginBottom: "8px",
                  }}
                >
                  Cognitive Token Bank
                </span>

                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {availableTokens.map((token) => (
                    <button
                      key={token}
                      type="button"
                      onClick={() => handleSelectToken(token)}
                      style={{
                        background: "rgba(24, 32, 75, 0.7)",
                        border: "1px solid rgba(139, 92, 246, 0.35)",
                        color: "#e2e8f0",
                        padding: "7px 13px",
                        borderRadius: "10px",
                        fontSize: "12px",
                        fontWeight: 600,
                        cursor: "pointer",
                        transition: "transform 0.15s ease, background 0.15s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-2px)";
                        e.currentTarget.style.background = "rgba(40, 52, 115, 0.9)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.background = "rgba(24, 32, 75, 0.7)";
                      }}
                    >
                      {token}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ marginTop: "24px", display: "flex", gap: "12px" }}>
                <button
                  type="button"
                  disabled={selectedTokens.length === 0 || activeStep === "evaluating"}
                  onClick={handleEvaluate}
                  style={{
                    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "12px",
                    padding: "10px 20px",
                    fontSize: "13px",
                    fontWeight: 700,
                    cursor: selectedTokens.length === 0 ? "not-allowed" : "pointer",
                    opacity: selectedTokens.length === 0 ? 0.5 : 1,
                    boxShadow: "0 4px 16px rgba(16, 185, 129, 0.35)",
                    transition: "transform 0.15s ease",
                  }}
                >
                  {activeStep === "evaluating" ? "Evaluating Fluency..." : "Submit for Instant Evaluation ▶"}
                </button>
              </div>
            </div>

            {/* Right Column: Live Linguistic Evaluation & Reward Feedback */}
            <div
              style={{
                background: "rgba(10, 15, 42, 0.8)",
                border: "1px solid rgba(139, 92, 246, 0.3)",
                borderRadius: "20px",
                padding: "24px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <span style={{ fontSize: "11px", fontWeight: 800, color: "#38bdf8", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                    Linguistic Evaluation Matrix
                  </span>
                  <span
                    style={{
                      fontSize: "10px",
                      padding: "3px 8px",
                      borderRadius: "6px",
                      background: isEvaluated ? "rgba(16, 185, 129, 0.2)" : "rgba(255, 255, 255, 0.08)",
                      color: isEvaluated ? "#34d399" : "#94a3b8",
                      fontWeight: 700,
                    }}
                  >
                    {isEvaluated ? "STATUS: MASTERED" : "AWAITING RESPONSE"}
                  </span>
                </div>

                {/* Score Gauge Ring and Metrics */}
                <div style={{ display: "flex", alignItems: "center", gap: "24px", marginBottom: "24px" }}>
                  <div
                    style={{
                      width: "100px",
                      height: "100px",
                      borderRadius: "50%",
                      background: isEvaluated
                        ? "conic-gradient(#10b981 0% 96%, rgba(255, 255, 255, 0.1) 96% 100%)"
                        : "rgba(255, 255, 255, 0.05)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: "2px solid rgba(139, 92, 246, 0.4)",
                      boxShadow: isEvaluated ? "0 0 24px rgba(16, 185, 129, 0.4)" : "none",
                      transition: "all 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
                    }}
                  >
                    <div
                      style={{
                        width: "82px",
                        height: "82px",
                        borderRadius: "50%",
                        background: "#080c24",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <span style={{ fontSize: "24px", fontWeight: 800, color: isEvaluated ? "#34d399" : "#64748b" }}>
                        {isEvaluated ? `${scenario.evaluation.score}%` : "--"}
                      </span>
                      <span style={{ fontSize: "9px", color: "#94a3b8", textTransform: "uppercase" }}>
                        Fluency
                      </span>
                    </div>
                  </div>

                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginBottom: "2px" }}>
                        <span style={{ color: "#c4b5fd" }}>Clarity &amp; Directness</span>
                        <span style={{ fontWeight: 700, color: "#ffffff" }}>
                          {isEvaluated ? `${scenario.evaluation.clarityScore}%` : "0%"}
                        </span>
                      </div>
                      <div style={{ height: "6px", background: "rgba(255, 255, 255, 0.08)", borderRadius: "99px", overflow: "hidden" }}>
                        <div
                          style={{
                            height: "100%",
                            width: isEvaluated ? `${scenario.evaluation.clarityScore}%` : "0%",
                            background: "linear-gradient(90deg, #38bdf8, #818cf8)",
                            transition: "width 0.6s ease",
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginBottom: "2px" }}>
                        <span style={{ color: "#c4b5fd" }}>Workplace Nuance</span>
                        <span style={{ fontWeight: 700, color: "#ffffff" }}>
                          {isEvaluated ? `${scenario.evaluation.nuanceScore}%` : "0%"}
                        </span>
                      </div>
                      <div style={{ height: "6px", background: "rgba(255, 255, 255, 0.08)", borderRadius: "99px", overflow: "hidden" }}>
                        <div
                          style={{
                            height: "100%",
                            width: isEvaluated ? `${scenario.evaluation.nuanceScore}%` : "0%",
                            background: "linear-gradient(90deg, #a855f7, #ec4899)",
                            transition: "width 0.6s ease",
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginBottom: "2px" }}>
                        <span style={{ color: "#c4b5fd" }}>Leadership Assertiveness</span>
                        <span style={{ fontWeight: 700, color: "#ffffff" }}>
                          {isEvaluated ? `${scenario.evaluation.assertivenessScore}%` : "0%"}
                        </span>
                      </div>
                      <div style={{ height: "6px", background: "rgba(255, 255, 255, 0.08)", borderRadius: "99px", overflow: "hidden" }}>
                        <div
                          style={{
                            height: "100%",
                            width: isEvaluated ? `${scenario.evaluation.assertivenessScore}%` : "0%",
                            background: "linear-gradient(90deg, #10b981, #38bdf8)",
                            transition: "width 0.6s ease",
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Qualitative Feedback Cards */}
                {isEvaluated ? (
                  <div
                    style={{
                      background: "rgba(16, 24, 60, 0.7)",
                      border: "1px solid rgba(52, 211, 153, 0.4)",
                      borderRadius: "14px",
                      padding: "16px",
                      marginBottom: "16px",
                    }}
                  >
                    <p style={{ margin: "0 0 6px", fontSize: "13px", fontWeight: 700, color: "#34d399" }}>
                      ✓ {scenario.evaluation.feedbackHeadline}
                    </p>
                    <p style={{ margin: 0, fontSize: "12px", color: "#cbd5e1", lineHeight: 1.5 }}>
                      {scenario.evaluation.actionableTip}
                    </p>
                  </div>
                ) : (
                  <div
                    style={{
                      background: "rgba(255, 255, 255, 0.03)",
                      borderRadius: "14px",
                      padding: "16px",
                      textAlign: "center",
                      color: "#64748b",
                      fontSize: "12px",
                      marginBottom: "16px",
                    }}
                  >
                    Click the tokens to assemble your articulation, then submit to view instant AI calibration and neuro-linguistic feedback.
                  </div>
                )}

                {/* Gamified Rewards Burst */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                    gap: "8px",
                  }}
                >
                  <div
                    style={{
                      background: "rgba(245, 158, 11, 0.1)",
                      border: "1px solid rgba(245, 158, 11, 0.3)",
                      borderRadius: "10px",
                      padding: "8px",
                      textAlign: "center",
                    }}
                  >
                    <span style={{ fontSize: "14px", display: "block" }}>🔥</span>
                    <span style={{ fontSize: "11px", fontWeight: 800, color: "#fbbf24" }}>
                      {isEvaluated ? "+1 Day Streak" : "5 Day Streak"}
                    </span>
                  </div>

                  <div
                    style={{
                      background: "rgba(56, 189, 248, 0.1)",
                      border: "1px solid rgba(56, 189, 248, 0.3)",
                      borderRadius: "10px",
                      padding: "8px",
                      textAlign: "center",
                    }}
                  >
                    <span style={{ fontSize: "14px", display: "block" }}>💎</span>
                    <span style={{ fontSize: "11px", fontWeight: 800, color: "#38bdf8" }}>
                      {isEvaluated ? "+15 Fluency Gems" : "450 Gems"}
                    </span>
                  </div>

                  <div
                    style={{
                      background: "rgba(168, 85, 247, 0.1)",
                      border: "1px solid rgba(168, 85, 247, 0.3)",
                      borderRadius: "10px",
                      padding: "8px",
                      textAlign: "center",
                    }}
                  >
                    <span style={{ fontSize: "14px", display: "block" }}>⚡</span>
                    <span style={{ fontSize: "11px", fontWeight: 800, color: "#c084fc" }}>
                      {isEvaluated ? "+25 Fluency XP" : "120 XP"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom CTA to Launch Platform */}
              <div style={{ marginTop: "24px", paddingTop: "16px", borderTop: "1px solid rgba(255, 255, 255, 0.08)" }}>
                <Link
                  href="/login"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "10px",
                    background: "linear-gradient(135deg, #7c3aed 0%, #db2777 100%)",
                    color: "#ffffff",
                    borderRadius: "12px",
                    padding: "12px",
                    fontSize: "13px",
                    fontWeight: 800,
                    textDecoration: "none",
                    boxShadow: "0 4px 16px rgba(219, 39, 119, 0.4)",
                    transition: "transform 0.15s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-1px)")}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
                >
                  <span>Practice In Full Ocean World</span>
                  <span>→</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
