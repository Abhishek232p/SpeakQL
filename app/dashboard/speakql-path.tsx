"use client";

import { useState } from "react";
import type { DashboardLearningPath, PathModule, PathLessonNode } from "@/src/server/goals/learning-path";
import { sound } from "@/src/client/sound/synthesizer";
import { WhaleMascot } from "@/src/client/components/whale-mascot";

export interface SpeakQLPathProps {
  learningPath: DashboardLearningPath;
  onStartLesson: (exerciseId: string) => void;
}

export type DuolingoPathProps = SpeakQLPathProps;

const islandThemes = [
  { name: "Foundational Lagoon", tag: "BEGINNER", icon: "🏝️" },
  { name: "Vocabulary Reef", tag: "VOCABULARY", icon: "🪸" },
  { name: "Conversation Cove", tag: "CONVERSATION", icon: "🌊" },
  { name: "Mastery Deep", tag: "ADVANCED", icon: "💎" },
];

export default function SpeakQLPath({ learningPath, onStartLesson }: SpeakQLPathProps) {
  const { modules, activeLessonId } = learningPath;
  const [activeGuidebookUnit, setActiveGuidebookUnit] = useState<number | null>(null);

  // Winding serpentine lateral shifts for stepping stone nodes
  const getOffsetClass = (index: number) => {
    const cycle = index % 6;
    switch (cycle) {
      case 0:
        return "node-center";
      case 1:
        return "node-right-1";
      case 2:
        return "node-right-2";
      case 3:
        return "node-center";
      case 4:
        return "node-left-1";
      case 5:
        return "node-left-2";
      default:
        return "node-center";
    }
  };

  const handleNodeClick = (lesson: PathLessonNode) => {
    if (lesson.state === "locked") {
      sound.playIncorrect();
      return;
    }
    sound.playPop();
    onStartLesson(lesson.id);
  };

  return (
    <div className="duo-path-container" aria-label="Ocean Learning Path">
      {modules.map((module: PathModule, moduleIdx: number) => {
        const isGuidebookOpen = activeGuidebookUnit === module.moduleNumber;
        const islandTheme = islandThemes[moduleIdx % islandThemes.length];

        return (
          <section
            key={module.competencyId}
            className="duo-unit-section"
            aria-labelledby={`unit-heading-${module.moduleNumber}`}
          >
            {/* Island Unit Header Banner */}
            <div className={`duo-unit-banner unit-theme-${(moduleIdx % 3) + 1}`}>
              <div className="duo-unit-banner-left">
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                  <span style={{ fontSize: "20px" }}>{islandTheme.icon}</span>
                  <span className="duo-unit-kicker">
                    UNIT {module.moduleNumber} · {islandTheme.tag}
                  </span>
                </div>
                <h3 id={`unit-heading-${module.moduleNumber}`} className="duo-unit-title">
                  {module.title || module.description}
                </h3>
                <p className="duo-unit-subtitle">{module.description}</p>
              </div>

              <div className="duo-unit-banner-right">
                <button
                  type="button"
                  className="duo-guidebook-btn"
                  onClick={() => {
                    sound.playPop();
                    setActiveGuidebookUnit(isGuidebookOpen ? null : module.moduleNumber);
                  }}
                  aria-expanded={isGuidebookOpen}
                  aria-label={`Guidebook for Unit ${module.moduleNumber}`}
                >
                  <span aria-hidden="true">📖</span> GUIDEBOOK
                </button>
              </div>
            </div>

            {/* Guidebook Drawer */}
            {isGuidebookOpen && (
              <div
                className="duo-guidebook-drawer"
                role="region"
                aria-label={`Unit ${module.moduleNumber} Guidebook`}
              >
                <div className="duo-guidebook-header">
                  <h4>
                    Unit {module.moduleNumber}: {islandTheme.name} Guidebook
                  </h4>
                  <button
                    type="button"
                    className="duo-guidebook-close"
                    onClick={() => setActiveGuidebookUnit(null)}
                    aria-label="Close guidebook"
                  >
                    ✕
                  </button>
                </div>
                <div className="duo-guidebook-content">
                  <p style={{ color: "#ffffff", margin: "0 0 12px" }}>
                    <strong>Core Focus:</strong> Master real-world context for <em>{module.description}</em>.
                  </p>
                  <ul className="duo-guidebook-tips">
                    <li>
                      💡 <strong>Direct Clarity:</strong> Focus on concise, active phrasing rather than filler words.
                    </li>
                    <li>
                      💡 <strong>Collaborative Tone:</strong> Maintain professional presence while remaining engaging and authentic.
                    </li>
                    <li>
                      💡 <strong>Pronunciation &amp; Cadence:</strong> Speak steadily, articulating blockers and technical terms clearly.
                    </li>
                  </ul>
                </div>
              </div>
            )}

            {/* Structured, Accessible Lesson Cards */}
            <div
              className="duo-lesson-list"
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "14px",
                padding: "8px 0",
              }}
            >
              {module.lessons.map((lesson: PathLessonNode, lessonIdx: number) => {
                const isActive = lesson.id === activeLessonId;
                const isCompleted = lesson.state === "completed";
                const isLocked = lesson.state === "locked";

                return (
                  <div
                    key={lesson.id}
                    className={`duo-lesson-card ${
                      isActive
                        ? "lesson-card-active"
                        : isCompleted
                        ? "lesson-card-completed"
                        : isLocked
                        ? "lesson-card-locked"
                        : "lesson-card-available"
                    }`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      flexWrap: "wrap",
                      gap: "16px",
                      background: isActive
                        ? "linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.98))"
                        : isCompleted
                        ? "rgba(15, 23, 42, 0.75)"
                        : isLocked
                        ? "rgba(15, 23, 42, 0.4)"
                        : "rgba(15, 23, 42, 0.6)",
                      border: isActive
                        ? "2px solid #38bdf8"
                        : isCompleted
                        ? "1px solid rgba(74, 222, 128, 0.35)"
                        : isLocked
                        ? "1px solid rgba(255, 255, 255, 0.05)"
                        : "1px solid rgba(255, 255, 255, 0.12)",
                      borderRadius: "16px",
                      padding: "18px 22px",
                      transition: "all 0.15s ease",
                      boxShadow: isActive ? "0 8px 24px -4px rgba(56, 189, 248, 0.2)" : "none",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "16px", flex: "1 1 340px" }}>
                      {/* Backward-compatible .duo-stone-button selector for testing & keyboard accessibility */}
                      <button
                        type="button"
                        className={`duo-stone-button ${
                          isCompleted
                            ? "stone-completed"
                            : isActive
                            ? "stone-active"
                            : isLocked
                            ? "stone-locked"
                            : "stone-available"
                        }`}
                        onClick={() => handleNodeClick(lesson)}
                        disabled={isLocked}
                        aria-label={`${lesson.title} - ${
                          isCompleted ? "Completed" : isActive ? "Current lesson" : isLocked ? "Locked" : "Available"
                        }`}
                        title={isLocked ? "Complete previous lesson to unlock" : lesson.title}
                        style={{
                          width: "50px",
                          height: "50px",
                          borderRadius: "14px",
                          flexShrink: 0,
                          border: "none",
                          cursor: isLocked ? "not-allowed" : "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "20px",
                          background: isCompleted
                            ? "linear-gradient(135deg, #22c55e, #16a34a)"
                            : isActive
                            ? "linear-gradient(135deg, #38bdf8, #6366f1)"
                            : isLocked
                            ? "#1e293b"
                            : "#334155",
                          color: isLocked ? "#64748b" : "#ffffff",
                          boxShadow: isCompleted
                            ? "0 4px 12px rgba(34, 197, 94, 0.3)"
                            : isActive
                            ? "0 4px 14px rgba(56, 189, 248, 0.35)"
                            : "none",
                          opacity: isLocked ? 0.6 : 1,
                        }}
                      >
                        <div className="stone-inner-face">
                          {isCompleted ? "✓" : isActive ? "⭐" : isLocked ? "🔒" : "▶"}
                        </div>
                      </button>

                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "4px" }}>
                          <span
                            style={{
                              fontSize: "11px",
                              fontWeight: 800,
                              letterSpacing: "0.06em",
                              textTransform: "uppercase",
                              color: isCompleted ? "#4ade80" : isActive ? "#38bdf8" : isLocked ? "#64748b" : "#94a3b8",
                            }}
                          >
                            {isCompleted ? "MASTERED ✓" : isActive ? "CURRENT LESSON" : isLocked ? "LOCKED 🔒" : "AVAILABLE"}
                          </span>
                          <span style={{ fontSize: "12px", color: "#64748b" }}>·</span>
                          <span style={{ fontSize: "12px", color: "#94a3b8" }}>
                            ⏱️ {lesson.estimatedMinutes || 3} min · {lesson.difficulty}
                          </span>
                        </div>

                        <h4 style={{ margin: "0 0 4px 0", fontSize: "17px", fontWeight: 700, color: isLocked ? "#94a3b8" : "#ffffff" }}>
                          Lesson {lesson.order || (lessonIdx + 1)} — {lesson.title}
                        </h4>

                        <p style={{ margin: 0, fontSize: "14px", color: isLocked ? "#64748b" : "#cbd5e1", lineHeight: 1.45 }}>
                          {lesson.objective}
                        </p>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      {isLocked ? (
                        <span
                          style={{
                            fontSize: "12px",
                            color: "#64748b",
                            fontWeight: 600,
                            background: "rgba(255, 255, 255, 0.03)",
                            padding: "8px 14px",
                            borderRadius: "10px",
                            border: "1px solid rgba(255, 255, 255, 0.06)",
                          }}
                        >
                          Complete Lesson {lesson.order > 1 ? lesson.order - 1 : 1} to unlock
                        </span>
                      ) : (
                        <button
                          type="button"
                          className="button button-primary"
                          onClick={() => handleNodeClick(lesson)}
                          style={{
                            padding: "10px 20px",
                            fontSize: "13px",
                            fontWeight: 800,
                            borderRadius: "12px",
                            background: isActive
                              ? "linear-gradient(135deg, #38bdf8, #6366f1)"
                              : "rgba(30, 41, 59, 0.8)",
                            color: isActive ? "#0f172a" : "#f8fafc",
                            border: isActive ? "none" : "1px solid rgba(255, 255, 255, 0.15)",
                            cursor: "pointer",
                          }}
                        >
                          {isCompleted ? "PRACTICE AGAIN ↺" : "START LESSON ▶"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Unit Milestone Status Card */}
            <div
              className="duo-milestone-footer"
              role="status"
              aria-label={`${islandTheme.name} milestone: ${module.completed ? "Unlocked and mastered" : "In progress"}`}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "12px",
                padding: "14px 20px",
                background: "rgba(15, 23, 42, 0.5)",
                border: "1px solid rgba(255, 255, 255, 0.06)",
                borderRadius: "14px",
                marginTop: "8px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "20px" }}>{module.completed ? "🏆" : "🎁"}</span>
                <div>
                  <span style={{ fontSize: "13px", fontWeight: 700, color: module.completed ? "#4ade80" : "#f8fafc" }}>
                    {module.completed ? `Unit ${module.moduleNumber} Mastered!` : `Unit ${module.moduleNumber} Milestone: ${islandTheme.name}`}
                  </span>
                  <span style={{ fontSize: "12px", color: "#94a3b8", display: "block" }}>
                    {module.completed ? "All foundational lessons completed." : "Complete all unit lessons to unlock unit completion."}
                  </span>
                </div>
              </div>
              <span style={{ fontSize: "12px", fontWeight: 700, color: module.completed ? "#4ade80" : "#94a3b8" }}>
                {module.lessons.filter((l) => l.state === "completed").length} of {module.lessons.length} Lessons Completed
              </span>
            </div>
          </section>
        );
      })}
    </div>
  );
}

export { SpeakQLPath as DuolingoPath };
