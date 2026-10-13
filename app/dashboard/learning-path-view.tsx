import Link from "next/link";
import type { DashboardLearningPath, PathLessonNode, PathLessonState } from "@/src/server/goals/learning-path";

function stateBadge(state: PathLessonState, isActive: boolean) {
  if (state === "completed") {
    return { text: "Completed", className: "badge-completed", icon: "✓" };
  }
  if (state === "review_recommended") {
    return { text: "Review Recommended", className: "badge-review", icon: "↺" };
  }
  if (isActive) {
    return { text: "Next Best Action", className: "badge-active", icon: "▶" };
  }
  if (state === "in_progress") {
    return { text: "In Progress", className: "badge-progress", icon: "◐" };
  }
  if (state === "locked") {
    return { text: "Locked", className: "badge-locked", icon: "🔒" };
  }
  return { text: "Available", className: "badge-available", icon: "○" };
}

function exerciseTypeLabel(type: string): string {
  switch (type) {
    case "contextual_response":
      return "Contextual Response";
    case "comprehension":
      return "Comprehension & Intent";
    case "sentence_construction":
      return "Sentence Construction";
    case "vocabulary_in_context":
      return "Vocabulary in Context";
    case "communication_refinement":
      return "Communication Refinement";
    case "conversation_practice":
      return "Live Dialogue";
    case "error_correction":
      return "Error Correction";
    case "speaking_practice":
      return "Speaking Practice";
    default:
      return "Practice Scenario";
  }
}

export default function LearningPathView({ learningPath }: { learningPath: DashboardLearningPath }) {
  const { modules, totalLessons, completedLessons, activeLessonId } = learningPath;
  const overallPercentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  return (
    <section className="learning-path-section dashboard-card" aria-labelledby="learning-path-heading">
      <div className="learning-path-header">
        <div>
          <p className="section-kicker">Interactive Pathway</p>
          <h2 id="learning-path-heading">Personalized Learning Journey</h2>
        </div>
        <div className="learning-path-progress-pill" aria-label={`Pathway completion: ${completedLessons} of ${totalLessons} lessons completed`}>
          <span>{completedLessons} / {totalLessons} Lessons Mastered</span>
          <div className="path-progress-mini-bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={overallPercentage}>
            <div className="path-progress-mini-fill" style={{ width: `${overallPercentage}%` }} />
          </div>
        </div>
      </div>

      <p className="learning-path-description">
        Progressive, context-rich lessons designed to build natural communicative fluency step by step. Complete lessons to unlock checkpoints and advance your competency.
      </p>

      <div className="learning-path-tree">
        {modules.map((module) => (
          <div key={module.competencyId} className="path-module-container">
            {/* Module Milestone Header */}
            <div className={`module-milestone-banner ${module.completed ? "module-completed" : ""}`}>
              <div className="milestone-badge" aria-hidden="true">
                {module.completed ? "⭐" : "📖"}
              </div>
              <div className="milestone-info">
                <span className="milestone-unit-label">Unit {module.moduleNumber}</span>
                <h3 className="milestone-title">{module.description}</h3>
              </div>
              {module.completed && <span className="milestone-status-pill">Unit Mastered</span>}
            </div>

            {/* Stepping Path Nodes */}
            <div className="path-node-track">
              {module.lessons.map((lesson: PathLessonNode, index: number) => {
                const isActive = lesson.id === activeLessonId;
                const badge = stateBadge(lesson.state, isActive);
                const isLocked = lesson.state === "locked";

                return (
                  <div key={lesson.id} className="path-node-wrapper">
                    {/* Vertical Connector Line */}
                    {index < module.lessons.length && <div className="path-node-connector" aria-hidden="true" />}

                    <div
                      className={`path-node-card ${lesson.state} ${isActive ? "node-active" : ""}`}
                      id={`path-node-${lesson.id}`}
                    >
                      <div className="path-node-marker" aria-hidden="true">
                        <span className="node-icon">{badge.icon}</span>
                      </div>

                      <div className="path-node-content">
                        <div className="path-node-meta-row">
                          <span className="node-lesson-tag">Lesson {lesson.lessonNumber}</span>
                          <span className="node-type-tag">{exerciseTypeLabel(lesson.exerciseType)}</span>
                          <span className="node-duration-tag">{lesson.estimatedMinutes} min &middot; {lesson.difficulty}</span>
                          <span className={`node-state-pill ${badge.className}`}>{badge.text}</span>
                        </div>

                        <h4 className="path-node-title">{lesson.title}</h4>

                        {isLocked ? (
                          <p className="path-locked-hint">
                            Complete the preceding lesson to unlock this practice activity.
                          </p>
                        ) : (
                          <div className="path-node-action-row">
                            <Link
                              href={`#exercise-${lesson.id}`}
                              className={`button ${isActive ? "button-primary" : "button-secondary"} node-action-button`}
                            >
                              {lesson.state === "completed"
                                ? "Review Practice"
                                : lesson.state === "review_recommended"
                                ? "Revise Mistakes"
                                : "Start Lesson"} &darr;
                            </Link>
                            {lesson.checkpoint && (
                              <span className="checkpoint-label" title="End of unit milestone activity">
                                🏁 Unit Milestone
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
