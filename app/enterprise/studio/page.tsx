"use client";

import { useState } from "react";
import Link from "next/link";
import { SpeakQLLogo } from "@/src/client/components/whale-mascot";
import { sound } from "@/src/client/sound/synthesizer";

export type ScenarioStatus = "draft" | "reviewed" | "published" | "archived";

export interface StudioScenario {
  id: string;
  title: string;
  version: string;
  status: ScenarioStatus;
  track: string;
  role: string;
  context: string;
  objective: string;
  instructions: string;
  evaluationRubric: {
    clarityWeight: number;
    technicalAccuracyWeight: number;
    businessImpactWeight: number;
    professionalToneWeight: number;
  };
  samplePrompt: string;
  lastUpdated: string;
}

const INITIAL_SCENARIOS: StudioScenario[] = [
  {
    id: "scen_eng_standup_blocker",
    title: "Engineering Standup Blocker & Trade-off Defense",
    version: "v2.1",
    status: "published",
    track: "Engineering & Technical Architecture",
    role: "Senior Distributed Systems Engineer",
    context: "Cross-functional morning standup during high-throughput Redis cluster migration.",
    objective: "Clearly articulate why the cache invalidation layer failed, the immediate mitigation deployed, and the timeline to restore 99.99% availability.",
    instructions: "Respond in 2-3 concise spoken or written sentences without vague hand-waving.",
    evaluationRubric: {
      clarityWeight: 30,
      technicalAccuracyWeight: 30,
      businessImpactWeight: 20,
      professionalToneWeight: 20,
    },
    samplePrompt: "Mateo (Tech Lead): 'The latency graph spiked to 450ms at 08:30 UTC. What broke and when are we stable?'",
    lastUpdated: "2026-10-14",
  },
  {
    id: "scen_prod_tradeoff_negotiation",
    title: "Product Scope Renegotiation with Executive Stakeholders",
    version: "v1.4",
    status: "published",
    track: "Product & Cross-Functional Leadership",
    role: "Lead Technical Product Manager",
    context: "Executive steering committee requesting unbudgeted enterprise SSO 3 weeks before launch.",
    objective: "De-escalate tension, explain delivery risks with high data fidelity, and propose a phased v1.1 delivery path.",
    instructions: "Acknowledge the stakeholder's strategic intent before reframing the trade-off around reliability.",
    evaluationRubric: {
      clarityWeight: 25,
      technicalAccuracyWeight: 20,
      businessImpactWeight: 35,
      professionalToneWeight: 20,
    },
    samplePrompt: "EVP of Sales: 'If SSO is not in the GA drop, 3 major enterprise contracts will stall. How do we ship it?'",
    lastUpdated: "2026-10-11",
  },
  {
    id: "scen_investor_seed_pitch",
    title: "Series A Diligence: Defending Defensibility & Unit Economics",
    version: "v3.0",
    status: "draft",
    track: "Executive Presence & Investor Pitch",
    role: "Founding CEO",
    context: "Partner meeting with Tier-1 Silicon Valley VC fund evaluating AI defensibility.",
    objective: "Articulate how SpeakQL's proprietary cognitive memory graph prevents commoditization compared to raw LLM wrappers.",
    instructions: "Lead with the structural retention flywheel and proprietary dataset moat.",
    evaluationRubric: {
      clarityWeight: 35,
      technicalAccuracyWeight: 25,
      businessImpactWeight: 25,
      professionalToneWeight: 15,
    },
    samplePrompt: "General Partner: 'Why can't OpenAI or Duolingo copy this exact workflow in a single sprint?'",
    lastUpdated: "2026-10-16",
  },
];

export default function ScenarioAuthoringStudioPage() {
  const [scenarios, setScenarios] = useState<StudioScenario[]>(INITIAL_SCENARIOS);
  const [selectedId, setSelectedId] = useState<string>(INITIAL_SCENARIOS[0].id);
  const [activeTab, setActiveTab] = useState<"metadata" | "rubric" | "preview">("metadata");
  const [previewInput, setPreviewInput] = useState<string>("");
  const [simulatedScore, setSimulatedScore] = useState<{
    clarity: number;
    technical: number;
    impact: number;
    tone: number;
    overall: number;
    feedback: string;
  } | null>(null);

  const activeScenario = scenarios.find((s) => s.id === selectedId) || scenarios[0];

  const handleStatusChange = (newStatus: ScenarioStatus) => {
    sound.playPop();
    setScenarios((prev) =>
      prev.map((s) => (s.id === activeScenario.id ? { ...s, status: newStatus } : s))
    );
  };

  const handleTestEvaluation = () => {
    sound.playCorrect();
    const wordCount = previewInput.trim().split(/\s+/).filter(Boolean).length;
    const hasTechnicalKeywords = /cache|latency|trade-off|architecture|timeline|risk|metric|moat/i.test(previewInput);

    const clarity = Math.min(95, Math.max(50, wordCount > 8 ? 85 : 55));
    const technical = hasTechnicalKeywords ? 92 : 60;
    const impact = wordCount > 15 ? 88 : 65;
    const tone = previewInput.length > 25 ? 90 : 70;
    const overall = Math.round(
      (clarity * activeScenario.evaluationRubric.clarityWeight +
        technical * activeScenario.evaluationRubric.technicalAccuracyWeight +
        impact * activeScenario.evaluationRubric.businessImpactWeight +
        tone * activeScenario.evaluationRubric.professionalToneWeight) / 100
    );

    setSimulatedScore({
      clarity,
      technical,
      impact,
      tone,
      overall,
      feedback:
        overall >= 85
          ? "Demonstrated high professional poise, crisp causation, and clear ownership of outcomes."
          : "Response communicated core idea but lacked specific operational impact metrics and technical clarity.",
    });
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#080c16",
        color: "#f8fafc",
        fontFamily: "var(--font-sans, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Studio Header */}
      <header
        style={{
          borderBottom: "1px solid rgba(148, 163, 184, 0.12)",
          background: "rgba(11, 15, 25, 0.95)",
          backdropFilter: "blur(12px)",
          padding: "16px 32px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          position: "sticky",
          top: 0,
          zIndex: 40,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <Link href="/dashboard" style={{ textDecoration: "none" }}>
            <SpeakQLLogo size={28} showText={true} />
          </Link>
          <div style={{ height: "20px", width: "1px", background: "rgba(148, 163, 184, 0.2)" }} />
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "12px", fontWeight: 800, color: "#a855f7", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                ENTERPRISE SCENARIO STUDIO
              </span>
              <span
                style={{
                  fontSize: "11px",
                  background: "rgba(56, 189, 248, 0.15)",
                  color: "#38bdf8",
                  padding: "2px 8px",
                  borderRadius: "99px",
                  fontWeight: 700,
                }}
              >
                ASD-STE100 CONTROLLED
              </span>
            </div>
            <h1 style={{ fontSize: "16px", fontWeight: 700, margin: 0, color: "#f8fafc" }}>
              Professional Simulation & Rubric Authoring
            </h1>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Link
            href="/dashboard"
            style={{
              color: "#94a3b8",
              textDecoration: "none",
              fontSize: "13px",
              fontWeight: 600,
              padding: "8px 14px",
              borderRadius: "10px",
              border: "1px solid rgba(148, 163, 184, 0.2)",
            }}
          >
            ← Back to Dashboard
          </Link>
          <div
            style={{
              background:
                activeScenario.status === "published"
                  ? "rgba(34, 197, 94, 0.15)"
                  : activeScenario.status === "reviewed"
                  ? "rgba(56, 189, 248, 0.15)"
                  : "rgba(234, 179, 8, 0.15)",
              color:
                activeScenario.status === "published"
                  ? "#4ade80"
                  : activeScenario.status === "reviewed"
                  ? "#38bdf8"
                  : "#fde047",
              border: "1px solid currentColor",
              padding: "6px 14px",
              borderRadius: "99px",
              fontSize: "12px",
              fontWeight: 800,
              textTransform: "uppercase",
            }}
          >
            ● {activeScenario.status} ({activeScenario.version})
          </div>
        </div>
      </header>

      {/* Main Studio Workspace */}
      <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", flex: 1 }}>
        {/* Left Column: Scenario Registry */}
        <aside
          style={{
            borderRight: "1px solid rgba(148, 163, 184, 0.12)",
            background: "rgba(15, 23, 42, 0.6)",
            padding: "24px 20px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "11px", fontWeight: 800, color: "#94a3b8", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              SCENARIOS ({scenarios.length})
            </span>
            <button
              type="button"
              onClick={() => {
                sound.playPop();
                const newId = `scen_custom_${Date.now()}`;
                const newScen: StudioScenario = {
                  id: newId,
                  title: "New Professional Scenario",
                  version: "v1.0",
                  status: "draft",
                  track: "Engineering & Technical Architecture",
                  role: "Lead Architect",
                  context: "Production incident response.",
                  objective: "State mitigation clearly.",
                  instructions: "Deliver a 30s status brief.",
                  evaluationRubric: {
                    clarityWeight: 25,
                    technicalAccuracyWeight: 25,
                    businessImpactWeight: 25,
                    professionalToneWeight: 25,
                  },
                  samplePrompt: "What is your recommended mitigation path?",
                  lastUpdated: new Date().toISOString().slice(0, 10),
                };
                setScenarios([newScen, ...scenarios]);
                setSelectedId(newId);
              }}
              style={{
                background: "rgba(168, 85, 247, 0.2)",
                border: "1px solid rgba(168, 85, 247, 0.4)",
                color: "#d8b4fe",
                padding: "4px 10px",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              + Create Scenario
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {scenarios.map((scen) => {
              const isSelected = scen.id === selectedId;
              return (
                <button
                  key={scen.id}
                  type="button"
                  onClick={() => {
                    sound.playPop();
                    setSelectedId(scen.id);
                    setSimulatedScore(null);
                    setPreviewInput("");
                  }}
                  style={{
                    textAlign: "left",
                    background: isSelected ? "rgba(168, 85, 247, 0.15)" : "rgba(30, 41, 59, 0.5)",
                    border: isSelected ? "1px solid #a855f7" : "1px solid rgba(148, 163, 184, 0.1)",
                    borderRadius: "14px",
                    padding: "14px 16px",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                    <span style={{ fontSize: "11px", color: "#a855f7", fontWeight: 700 }}>{scen.version}</span>
                    <span style={{ fontSize: "10px", color: "#94a3b8", textTransform: "uppercase" }}>{scen.status}</span>
                  </div>
                  <strong style={{ display: "block", fontSize: "14px", color: "#f8fafc", lineHeight: 1.3, marginBottom: "4px" }}>
                    {scen.title}
                  </strong>
                  <span style={{ fontSize: "12px", color: "#94a3b8" }}>{scen.track}</span>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Right Column: Scenario Editor & Live Preview */}
        <main style={{ padding: "32px 40px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "28px" }}>
          {/* Action Ribbon */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "16px",
              borderBottom: "1px solid rgba(148, 163, 184, 0.12)",
              paddingBottom: "16px",
            }}
          >
            {/* Tab switchers */}
            <div style={{ display: "flex", gap: "8px" }}>
              {(["metadata", "rubric", "preview"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => {
                    sound.playPop();
                    setActiveTab(tab);
                  }}
                  style={{
                    padding: "8px 18px",
                    borderRadius: "10px",
                    fontSize: "13px",
                    fontWeight: 700,
                    cursor: "pointer",
                    background: activeTab === tab ? "#a855f7" : "rgba(30, 41, 59, 0.6)",
                    color: activeTab === tab ? "#ffffff" : "#cbd5e1",
                    border: "none",
                  }}
                >
                  {tab === "metadata" && "1. Scenario Metadata"}
                  {tab === "rubric" && "2. Evaluation Rubric"}
                  {tab === "preview" && "3. Simulation Testbed"}
                </button>
              ))}
            </div>

            {/* Publishing Controls */}
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                type="button"
                onClick={() => handleStatusChange("draft")}
                style={{
                  background: "transparent",
                  border: "1px solid rgba(148, 163, 184, 0.3)",
                  color: "#cbd5e1",
                  padding: "6px 14px",
                  borderRadius: "8px",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Set Draft
              </button>
              <button
                type="button"
                onClick={() => handleStatusChange("reviewed")}
                style={{
                  background: "transparent",
                  border: "1px solid rgba(56, 189, 248, 0.5)",
                  color: "#38bdf8",
                  padding: "6px 14px",
                  borderRadius: "8px",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Mark Reviewed
              </button>
              <button
                type="button"
                onClick={() => handleStatusChange("published")}
                style={{
                  background: "linear-gradient(135deg, #22c55e, #16a34a)",
                  border: "none",
                  color: "#ffffff",
                  padding: "6px 16px",
                  borderRadius: "8px",
                  fontSize: "12px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Publish Version
              </button>
            </div>
          </div>

          {/* TAB 1: Metadata */}
          {activeTab === "metadata" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 700, color: "#94a3b8", display: "block", marginBottom: "6px" }}>
                    SCENARIO TITLE
                  </label>
                  <input
                    type="text"
                    value={activeScenario.title}
                    onChange={(e) => {
                      const val = e.target.value;
                      setScenarios((prev) =>
                        prev.map((s) => (s.id === activeScenario.id ? { ...s, title: val } : s))
                      );
                    }}
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      borderRadius: "10px",
                      background: "rgba(15, 23, 42, 0.8)",
                      border: "1px solid rgba(148, 163, 184, 0.2)",
                      color: "#f8fafc",
                      fontSize: "14px",
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "12px", fontWeight: 700, color: "#94a3b8", display: "block", marginBottom: "6px" }}>
                    PROFESSIONAL TRACK
                  </label>
                  <input
                    type="text"
                    value={activeScenario.track}
                    disabled
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      borderRadius: "10px",
                      background: "rgba(15, 23, 42, 0.4)",
                      border: "1px solid rgba(148, 163, 184, 0.1)",
                      color: "#94a3b8",
                      fontSize: "14px",
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "12px", fontWeight: 700, color: "#94a3b8", display: "block", marginBottom: "6px" }}>
                    LEARNER ASSUMED ROLE
                  </label>
                  <input
                    type="text"
                    value={activeScenario.role}
                    onChange={(e) => {
                      const val = e.target.value;
                      setScenarios((prev) =>
                        prev.map((s) => (s.id === activeScenario.id ? { ...s, role: val } : s))
                      );
                    }}
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      borderRadius: "10px",
                      background: "rgba(15, 23, 42, 0.8)",
                      border: "1px solid rgba(148, 163, 184, 0.2)",
                      color: "#f8fafc",
                      fontSize: "14px",
                    }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 700, color: "#94a3b8", display: "block", marginBottom: "6px" }}>
                    WORKPLACE CONTEXT & SETTING
                  </label>
                  <textarea
                    rows={3}
                    value={activeScenario.context}
                    onChange={(e) => {
                      const val = e.target.value;
                      setScenarios((prev) =>
                        prev.map((s) => (s.id === activeScenario.id ? { ...s, context: val } : s))
                      );
                    }}
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      borderRadius: "10px",
                      background: "rgba(15, 23, 42, 0.8)",
                      border: "1px solid rgba(148, 163, 184, 0.2)",
                      color: "#f8fafc",
                      fontSize: "14px",
                      resize: "vertical",
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "12px", fontWeight: 700, color: "#94a3b8", display: "block", marginBottom: "6px" }}>
                    COMMUNICATIVE OBJECTIVE
                  </label>
                  <textarea
                    rows={3}
                    value={activeScenario.objective}
                    onChange={(e) => {
                      const val = e.target.value;
                      setScenarios((prev) =>
                        prev.map((s) => (s.id === activeScenario.id ? { ...s, objective: val } : s))
                      );
                    }}
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      borderRadius: "10px",
                      background: "rgba(15, 23, 42, 0.8)",
                      border: "1px solid rgba(148, 163, 184, 0.2)",
                      color: "#f8fafc",
                      fontSize: "14px",
                      resize: "vertical",
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Rubric */}
          {activeTab === "rubric" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div
                style={{
                  background: "rgba(15, 23, 42, 0.8)",
                  borderRadius: "18px",
                  border: "1px solid rgba(148, 163, 184, 0.15)",
                  padding: "24px",
                }}
              >
                <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "8px", color: "#f8fafc" }}>
                  Diagnostic Rubric Weighting (ASD-STE100 Calibrated)
                </h3>
                <p style={{ fontSize: "13px", color: "#94a3b8", marginBottom: "24px" }}>
                  Define the proportional weight of each cognitive dimension. Total weights must sum to 100%.
                </p>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px" }}>
                  {[
                    { label: "Clarity & Conciseness", key: "clarityWeight" as const },
                    { label: "Technical Accuracy", key: "technicalAccuracyWeight" as const },
                    { label: "Business Impact", key: "businessImpactWeight" as const },
                    { label: "Professional Tone", key: "professionalToneWeight" as const },
                  ].map((dim) => (
                    <div
                      key={dim.key}
                      style={{
                        background: "rgba(30, 41, 59, 0.6)",
                        padding: "18px",
                        borderRadius: "14px",
                        border: "1px solid rgba(148, 163, 184, 0.15)",
                      }}
                    >
                      <strong style={{ display: "block", fontSize: "13px", color: "#e2e8f0", marginBottom: "8px" }}>
                        {dim.label}
                      </strong>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={activeScenario.evaluationRubric[dim.key]}
                          onChange={(e) => {
                            const val = Number(e.target.value) || 0;
                            setScenarios((prev) =>
                              prev.map((s) =>
                                s.id === activeScenario.id
                                  ? {
                                      ...s,
                                      evaluationRubric: {
                                        ...s.evaluationRubric,
                                        [dim.key]: val,
                                      },
                                    }
                                  : s
                              )
                            );
                          }}
                          style={{
                            width: "70px",
                            padding: "8px 10px",
                            borderRadius: "8px",
                            background: "rgba(15, 23, 42, 0.9)",
                            border: "1px solid rgba(168, 85, 247, 0.3)",
                            color: "#a855f7",
                            fontWeight: 800,
                            fontSize: "16px",
                          }}
                        />
                        <span style={{ color: "#94a3b8", fontWeight: 700 }}>%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Preview Simulation */}
          {activeTab === "preview" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              <div
                style={{
                  background: "linear-gradient(135deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.95))",
                  border: "1px solid rgba(168, 85, 247, 0.3)",
                  borderRadius: "20px",
                  padding: "24px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                  <span style={{ fontSize: "20px" }}>🎙️</span>
                  <strong style={{ fontSize: "15px", color: "#f8fafc" }}>Simulation Scenario Prompt:</strong>
                </div>
                <p style={{ margin: "0 0 20px", fontSize: "15px", color: "#e2e8f0", lineHeight: 1.5 }}>
                  {activeScenario.samplePrompt}
                </p>

                <label style={{ fontSize: "12px", fontWeight: 700, color: "#94a3b8", display: "block", marginBottom: "8px" }}>
                  TEST SUBMISSION RESPONSE
                </label>
                <textarea
                  rows={4}
                  value={previewInput}
                  placeholder="Type sample learner response to test rubric evaluation..."
                  onChange={(e) => setPreviewInput(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "14px 16px",
                    borderRadius: "12px",
                    background: "rgba(15, 23, 42, 0.9)",
                    border: "1px solid rgba(148, 163, 184, 0.25)",
                    color: "#f8fafc",
                    fontSize: "14px",
                    marginBottom: "16px",
                  }}
                />

                <button
                  type="button"
                  disabled={!previewInput.trim()}
                  onClick={handleTestEvaluation}
                  style={{
                    background: previewInput.trim() ? "linear-gradient(135deg, #a855f7, #7c3aed)" : "rgba(148, 163, 184, 0.2)",
                    color: "#ffffff",
                    border: "none",
                    padding: "12px 24px",
                    borderRadius: "12px",
                    fontWeight: 800,
                    fontSize: "14px",
                    cursor: previewInput.trim() ? "pointer" : "not-allowed",
                  }}
                >
                  RUN RUBRIC EVALUATION TEST ▶
                </button>
              </div>

              {simulatedScore && (
                <div
                  style={{
                    background: "rgba(15, 23, 42, 0.9)",
                    border: "2px solid rgba(56, 189, 248, 0.4)",
                    borderRadius: "20px",
                    padding: "24px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                    <h4 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "#38bdf8" }}>
                      Diagnostic Rubric Output
                    </h4>
                    <span style={{ fontSize: "20px", fontWeight: 900, color: "#38bdf8" }}>
                      {simulatedScore.overall} / 100 Overall Score
                    </span>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "16px" }}>
                    <div style={{ background: "rgba(30, 41, 59, 0.6)", padding: "12px", borderRadius: "10px" }}>
                      <span style={{ fontSize: "11px", color: "#94a3b8" }}>Clarity</span>
                      <strong style={{ display: "block", fontSize: "16px", color: "#f8fafc" }}>{simulatedScore.clarity}%</strong>
                    </div>
                    <div style={{ background: "rgba(30, 41, 59, 0.6)", padding: "12px", borderRadius: "10px" }}>
                      <span style={{ fontSize: "11px", color: "#94a3b8" }}>Technical</span>
                      <strong style={{ display: "block", fontSize: "16px", color: "#f8fafc" }}>{simulatedScore.technical}%</strong>
                    </div>
                    <div style={{ background: "rgba(30, 41, 59, 0.6)", padding: "12px", borderRadius: "10px" }}>
                      <span style={{ fontSize: "11px", color: "#94a3b8" }}>Impact</span>
                      <strong style={{ display: "block", fontSize: "16px", color: "#f8fafc" }}>{simulatedScore.impact}%</strong>
                    </div>
                    <div style={{ background: "rgba(30, 41, 59, 0.6)", padding: "12px", borderRadius: "10px" }}>
                      <span style={{ fontSize: "11px", color: "#94a3b8" }}>Tone</span>
                      <strong style={{ display: "block", fontSize: "16px", color: "#f8fafc" }}>{simulatedScore.tone}%</strong>
                    </div>
                  </div>

                  <p style={{ margin: 0, fontSize: "14px", color: "#cbd5e1", lineHeight: 1.5 }}>
                    <strong>System Diagnostic Explanation:</strong> {simulatedScore.feedback}
                  </p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
