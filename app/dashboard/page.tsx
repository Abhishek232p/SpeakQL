import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseAuthProvider } from "@/src/server/auth/supabase";
import { getDb } from "@/src/server/db/client";
import { parseStoredEvaluationFeedback } from "@/src/server/evaluation/boundary";
import { createGoalsRepository, type DashboardData, type CompetencyProgressStatus } from "@/src/server/goals/repository";
import { createLearningGoal, submitPracticeEvaluation } from "./actions";
import LogoutButton from "./logout-button";

function statusLabel(status: CompetencyProgressStatus): string {
  if (status === "not_started") return "Not started";
  if (status === "needs_work") return "Needs work";
  return "Mastered";
}

function scoreLabel(score: string): string {
  return score.replaceAll("_", " ");
}

function scoreStatus(score: string): "mastered" | "needs_work" | "unclassified" {
  const normalized = score.trim().toLowerCase();
  if (normalized === "mastered") return "mastered";
  if (normalized === "needs_work") return "needs_work";
  return "unclassified";
}

function evaluationSourceLabel(source: "provider" | "fallback" | "unknown" | undefined): string {
  if (source === "fallback") return "Deterministic fallback · non-AI";
  if (source === "provider") return "Configured provider";
  return "Source not recorded";
}

function EvaluationEvidence({ data }: { data: DashboardData }) {
  const { measured } = data.analytics;

  return (
    <section className="dashboard-section" aria-labelledby="evidence-heading">
      <div className="dashboard-section-heading">
        <div>
          <p className="section-kicker">Raw measured evidence</p>
          <h2 id="evidence-heading">What you have recorded</h2>
        </div>
        <p className="dashboard-section-note">Counts come directly from saved evaluations.</p>
      </div>
      <div className="metric-grid" aria-label="Evaluation evidence summary">
        <div className="metric-card">
          <span>Completed evaluations</span>
          <strong>{measured.completedEvaluations}</strong>
          <p>Responses stored for this goal.</p>
        </div>
        <div className="metric-card metric-card-positive">
          <span>Mastered</span>
          <strong>{measured.masteredEvaluations}</strong>
          <p>Evaluations with a mastered result.</p>
        </div>
        <div className="metric-card metric-card-caution">
          <span>Needs work</span>
          <strong>{measured.needsWorkEvaluations}</strong>
          <p>Evaluations that call for another pass.</p>
        </div>
        {measured.unclassifiedEvaluations > 0 && (
          <div className="metric-card">
            <span>Other results</span>
            <strong>{measured.unclassifiedEvaluations}</strong>
            <p>Stored scores not classified as mastered or needs work.</p>
          </div>
        )}
      </div>
    </section>
  );
}

function ProgressEstimate({ data }: { data: DashboardData }) {
  const { estimate } = data.analytics;
  const statusesById = new Map(estimate.competencyStatuses.map((status) => [status.competencyId, status]));

  return (
    <section className="dashboard-section dashboard-estimate" aria-labelledby="estimate-heading">
      <div className="dashboard-section-heading">
        <div>
          <p className="section-kicker">Derived view</p>
          <h2 id="estimate-heading">Progress estimate</h2>
        </div>
        <span className="estimate-badge">{estimate.label}</span>
      </div>
      <div className="progress-summary">
        <div>
          <strong className="progress-number">{estimate.progressPercentage}%</strong>
          <p>{estimate.basis}</p>
        </div>
        <div
          className="progress-track"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={estimate.progressPercentage}
          aria-label={`Estimated progress: ${estimate.progressPercentage}%`}
        >
          <span style={{ width: `${estimate.progressPercentage}%` }} />
        </div>
      </div>

      <div className="competency-heading">
        <h3>Competency status</h3>
        <p>Each status uses the latest result for every exercise in that competency.</p>
      </div>
      {data.competencies.length === 0 ? (
        <p className="empty-message">Competency detail will appear after you save a learning goal.</p>
      ) : (
        <ul className="competency-grid" aria-label="Competency status list">
          {data.competencies.map((competency) => {
            const status = statusesById.get(competency.id);
            const derivedStatus = status?.status ?? "not_started";
            return (
              <li className="competency-card" key={competency.id}>
                <div className="competency-card-heading">
                  <h3>{competency.description}</h3>
                  <span className={`status-pill status-${derivedStatus}`}>{statusLabel(derivedStatus)}</span>
                </div>
                <p>
                  {status?.practicedExercises ?? 0} of {status?.totalExercises ?? 0} exercises practised · {status?.completedEvaluations ?? 0} recorded {status?.completedEvaluations === 1 ? "evaluation" : "evaluations"}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function NextAction({ data }: { data: DashboardData }) {
  const recommendation = data.analytics.nextAction;

  return (
    <section className="next-action dashboard-card" aria-labelledby="next-action-heading">
      <p className="section-kicker">Recommendation</p>
      <h2 id="next-action-heading">Recommended next action</h2>
      {recommendation ? (
        <>
          <p className="next-action-title">Practice this exercise next</p>
          <p className="next-action-prompt">{recommendation.scenarioPrompt}</p>
          <p className="next-action-rationale">{recommendation.rationale}</p>
          <Link className="button button-secondary" href={`#exercise-${recommendation.exerciseId}`}>
            Open recommended exercise <span aria-hidden="true">↓</span>
          </Link>
        </>
      ) : (
        <p className="empty-message">No exercises are available yet. Save a goal to create your first practice plan.</p>
      )}
    </section>
  );
}

function MistakeMemory({ data }: { data: DashboardData }) {
  const mistakes = data.analytics.mistakeMemory;
  const exercisesById = new Map(data.exercises.map((exercise) => [exercise.id, exercise]));

  return (
    <section className="dashboard-section" aria-labelledby="mistake-memory-heading">
      <div className="dashboard-section-heading">
        <div>
          <p className="section-kicker">Stored learning memory</p>
          <h2 id="mistake-memory-heading">What to revisit</h2>
        </div>
        <p className="dashboard-section-note">Derived from the latest saved needs-work evaluations.</p>
      </div>
      {mistakes.length === 0 ? (
        <p className="empty-message">No mistake memory is recorded yet. A needs-work result will appear here with its next action.</p>
      ) : (
        <ul className="memory-list" aria-label="Stored mistake memory">
          {mistakes.map((mistake) => (
            <li className="memory-card" key={mistake.exerciseId}>
              <p className="section-kicker">{exercisesById.get(mistake.exerciseId)?.scenarioPrompt ?? "Practice exercise"}</p>
              <p>{mistake.summary}</p>
              {mistake.nextAction && <p className="memory-next-action"><strong>Next action:</strong> {mistake.nextAction}</p>}
              <Link className="button button-secondary" href={`#exercise-${mistake.exerciseId}`}>Revisit exercise <span aria-hidden="true">↓</span></Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function PracticeExercises({ data }: { data: DashboardData }) {
  return (
    <section className="dashboard-section" aria-labelledby="practice-heading">
      <div className="dashboard-section-heading">
        <div>
          <p className="section-kicker">Practice engine</p>
          <h2 id="practice-heading">Turn the next action into evidence</h2>
        </div>
        <p className="dashboard-section-note">Submit a response to add a new measured evaluation.</p>
      </div>
      {data.exercises.length === 0 ? (
        <p className="empty-message">Exercises will appear after your goal is converted into a competency plan.</p>
      ) : (
        <div className="exercise-grid">
          {data.exercises.map((exercise) => {
            const submitEvaluationWithId = submitPracticeEvaluation.bind(null, exercise.id);
            const evaluations = data.evaluations.filter((evaluation) => evaluation.exerciseId === exercise.id);

            return (
              <article className="dashboard-card exercise-card" id={`exercise-${exercise.id}`} key={exercise.id}>
                <p className="section-kicker">Scenario</p>
                <h3>{exercise.scenarioPrompt}</h3>
                <p className="exercise-expected"><strong>Expected structure:</strong> {exercise.expectedStructure}</p>
                <form action={submitEvaluationWithId} className="practice-form">
                  <label htmlFor={`response-${exercise.id}`}>Your response</label>
                  <textarea
                    id={`response-${exercise.id}`}
                    name="response"
                    required
                    rows={4}
                    placeholder="Type your response..."
                  />
                  <button type="submit" className="button button-primary">
                    Submit for evaluation
                  </button>
                </form>

                <div className="recorded-evaluations" aria-live="polite">
                  <h4>Recorded evaluations ({evaluations.length})</h4>
                  {evaluations.length === 0 ? (
                    <p className="empty-message">No evaluation recorded yet. Your first submission establishes a baseline.</p>
                  ) : (
                    <div className="evaluation-list">
                      {evaluations.map((evaluation) => (
                        <div className="evaluation-card" key={evaluation.id}>
                          <p className="evaluation-response">&quot;{evaluation.userResponse}&quot;</p>
                          <div className="evaluation-result">
                            <div>
                              <span className={`status-pill status-${scoreStatus(evaluation.score)}`}>
                                {scoreLabel(evaluation.score)}
                              </span>
                              <p className="evaluation-source">
                                {evaluationSourceLabel(evaluation.evaluationSource ?? parseStoredEvaluationFeedback(evaluation.feedback).source)}
                              </p>
                            </div>
                            <p>{evaluation.feedback}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default async function DashboardPage() {
  const authProvider = createSupabaseAuthProvider();
  const identity = await authProvider.getIdentity();

  if (!identity) redirect("/login");

  const db = getDb();
  const repo = createGoalsRepository(db);
  const data = await repo.getDashboardData(identity) as DashboardData;

  return (
    <main className="dashboard-page">
      <nav className="nav shell" aria-label="Primary navigation">
        <Link className="wordmark" href="/" aria-label="SpeakQL home"><span>Speak</span>QL</Link>
        <div className="nav-links dashboard-nav-links">
          <span className="identity-label">Logged in as {identity.subject.slice(0, 8)}…</span>
          <LogoutButton />
        </div>
      </nav>

      <header className="dashboard-hero shell">
        <div>
          <p className="eyebrow"><span className="pulse" /> Your learning plan</p>
          <h1>Make progress visible.</h1>
          <p className="hero-lede">Use saved evaluations to see what is measured, what is estimated, and what to practise next.</p>
        </div>
      </header>

      {data.goals.length === 0 ? (
        <section className="dashboard-empty shell" aria-labelledby="empty-dashboard-heading">
          <p className="section-kicker">Start with an outcome</p>
          <h2 id="empty-dashboard-heading">Define your first learning goal.</h2>
          <p>Describe the real-world capability you want to build. We&apos;ll create a small competency map and practice set so your first response can become evidence.</p>
          <form action={createLearningGoal} className="goal-form">
            <label htmlFor="goal-description">Learning goal</label>
            <textarea
              id="goal-description"
              name="description"
              required
              rows={5}
              placeholder="For example: Lead engineering standups in Spanish."
            />
            <button type="submit" className="button button-primary">Save goal</button>
          </form>
        </section>
      ) : (
        <div className="dashboard-content shell">
          <section className="goal-summary" aria-labelledby="goal-heading">
            <p className="section-kicker">Active goal</p>
            <h2 id="goal-heading">{data.goals[0].description}</h2>
          </section>
          <EvaluationEvidence data={data} />
          <ProgressEstimate data={data} />
          <NextAction data={data} />
          <MistakeMemory data={data} />
          <PracticeExercises data={data} />
        </div>
      )}
    </main>
  );
}
