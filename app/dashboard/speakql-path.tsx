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

            {/* Glowing Stepping Stone Pathway ("The Ocean Current") */}
            <div className="duo-stepping-track">
              {module.lessons.map((lesson: PathLessonNode, lessonIdx: number) => {
                const isActive = lesson.id === activeLessonId;
                const isCompleted = lesson.state === "completed";
                const isLocked = lesson.state === "locked";
                const offsetClass = getOffsetClass(lessonIdx);

                return (
                  <div key={lesson.id} className={`duo-node-row ${offsetClass}`}>
                    {/* Active Floating Beacon Tooltip with Mascot */}
                    {isActive && (
                      <div className="duo-beacon-tooltip" aria-hidden="true">
                        <WhaleMascot mood="happy" size={20} animated={true} />
                        <span>START LESSON ▶</span>
                        <div className="beacon-arrow" />
                      </div>
                    )}

                    {/* Stepping Stone 3D Glowing Button */}
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
                    >
                      <div className="stone-inner-face">
                        {isCompleted ? (
                          <span className="stone-icon crown-icon" aria-hidden="true">
                            👑
                          </span>
                        ) : isActive ? (
                          <span className="stone-icon star-icon" aria-hidden="true">
                            ⭐
                          </span>
                        ) : isLocked ? (
                          <span className="stone-icon lock-icon" aria-hidden="true">
                            🔒
                          </span>
                        ) : (
                          <span className="stone-icon book-icon" aria-hidden="true">
                            🌊
                          </span>
                        )}
                      </div>
                    </button>

                    <div className="duo-node-caption">
                      <span className="caption-title">{lesson.title}</span>
                    </div>
                  </div>
                );
              })}

              {/* Unit Milestone Trophy / Ocean Chest */}
              <div className="duo-node-row node-center duo-trophy-row">
                <div
                  className={`duo-milestone-chest ${module.completed ? "chest-unlocked" : "chest-locked"}`}
                  title={
                    module.completed
                      ? "Unit Mastered! Milestone Unlocked."
                      : "Complete all unit lessons to open milestone chest"
                  }
                >
                  <span className="chest-emoji" aria-hidden="true">
                    {module.completed ? "🏆" : "🎁"}
                  </span>
                  <span className="chest-label">
                    {islandTheme.name} Milestone
                  </span>
                </div>
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}

export { SpeakQLPath as DuolingoPath };
