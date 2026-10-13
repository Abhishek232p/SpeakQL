import Link from "next/link";
import type { DashboardData } from "@/src/server/goals/repository";
import { parseExerciseDetails } from "@/src/server/goals/curriculum";

export default function MistakeReviewQueue({ data }: { data: DashboardData }) {
  const mistakes = data.analytics.mistakeMemory;
  const exercisesById = new Map(data.exercises.map((exercise) => [exercise.id, exercise]));

  return (
    <section className="dashboard-section mistake-review-section" id="mistake-review-queue" aria-labelledby="mistake-memory-heading">
      <div className="dashboard-section-heading">
        <div>
          <p className="section-kicker">Adaptive Practice Queue</p>
          <h2 id="mistake-memory-heading">Mistake Review &amp; Targeted Revision</h2>
        </div>
        <span className="mistake-count-pill" aria-label={`${mistakes.length} exercises requiring review`}>
          {mistakes.length} {mistakes.length === 1 ? "Item" : "Items"} to Revise
        </span>
      </div>

      <p className="dashboard-section-note">
        SpeakQL automatically logs communicative challenges identified in your evaluated responses so you can revisit, revise, and turn weaknesses into demonstrated strengths.
      </p>

      {mistakes.length === 0 ? (
        <div className="mistake-empty-card">
          <span className="empty-icon" aria-hidden="true">🎉</span>
          <div className="empty-content">
            <h3>No mistakes pending review!</h3>
            <p>
              All attempted exercises have met baseline communicative criteria. Continue along your learning path below or revisit earlier scenarios to refine conversational speed and nuance.
            </p>
          </div>
        </div>
      ) : (
        <div className="memory-list" role="feed" aria-label="Exercises needing review">
          {mistakes.map((mistake) => {
            const ex = exercisesById.get(mistake.exerciseId);
            const details = ex ? parseExerciseDetails(ex.scenarioPrompt, ex.expectedStructure) : null;
            const prompt = details ? details.objective : "Practice scenario";

            return (
              <article className="memory-card" key={mistake.exerciseId}>
                <div className="memory-card-header">
                  <span className="section-kicker">Review Needed</span>
                  <span className="memory-badge-caution">Needs Work</span>
                </div>
                <h4 className="memory-exercise-title">{prompt}</h4>
                <div className="memory-summary-box">
                  <strong>Identified Challenge:</strong>
                  <p>{mistake.summary}</p>
                </div>
                {mistake.nextAction && (
                  <p className="memory-next-action">
                    <strong>Recommended revision:</strong> {mistake.nextAction}
                  </p>
                )}
                <div className="memory-actions">
                  <Link className="button button-primary" href={`#exercise-${mistake.exerciseId}`}>
                    Revisit &amp; Retry Exercise &darr;
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
