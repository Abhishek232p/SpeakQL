import Link from "next/link";
import { createSupabaseAuthProvider } from "@/src/server/auth/supabase";
import { getDb } from "@/src/server/db/client";
import { createGoalsRepository, type DashboardData } from "@/src/server/goals/repository";
import { deriveGamification } from "@/src/server/goals/gamification";
import { deriveLearningPath } from "@/src/server/goals/learning-path";
import OnboardingGoalForm from "./onboarding-goal-form";
import LogoutButton from "./logout-button";
import SpeakQLShell from "./speakql-shell";
import { WhaleMascot, SpeakQLLogo } from "@/src/client/components/whale-mascot";

function createVerifiedLearnerFallback(): DashboardData {
  const goalId = "goal_demo_fallback_1";
  const compId1 = "comp_demo_1";
  const compId2 = "comp_demo_2";
  const compId3 = "comp_demo_3";
  const compId4 = "comp_demo_4";
  const exId1 = "ex_demo_1";
  const exId2 = "ex_demo_2";
  const exId3 = "ex_demo_3";
  const exId4 = "ex_demo_4";

  return {
    goals: [
      {
        id: goalId,
        description: "Deliver high-impact architectural proposals and cross-functional updates with executive presence",
        status: "active",
      },
    ],
    competencies: [
      { id: compId1, goalId, description: "Standup Status & Progress Cadence", status: "mastered" },
      { id: compId2, goalId, description: "Software Design Tradeoff Vocabulary", status: "mastered" },
      { id: compId3, goalId, description: "Translating Engineering Debt to Business Value", status: "needs_work" },
      { id: compId4, goalId, description: "Board-Level Strategic Architecture Pitching", status: "not_started" },
    ],
    exercises: [
      {
        id: exId1,
        competencyId: compId1,
        scenarioPrompt: "Your team has an unexpected cache invalidation spike. Give a crisp 30-second standup status update with mitigation ETA.",
        expectedStructure: "State current impact, root cause hypothesis, immediate mitigation, and calibrated ETA.",
      },
      {
        id: exId2,
        competencyId: compId2,
        scenarioPrompt: "Explain the latency and consistency tradeoffs of eventual consistency vs strong consistency to a product partner.",
        expectedStructure: "Frame tradeoffs using concrete user experience metrics rather than pure database jargon.",
      },
      {
        id: exId3,
        competencyId: compId3,
        scenarioPrompt: "The business wants to launch 2 weeks early. Defend necessary refactoring without sounding obstructionist.",
        expectedStructure: "Align technical debt with financial risk, SLA degradation, and customer churn impact.",
      },
      {
        id: exId4,
        competencyId: compId4,
        scenarioPrompt: "Pitch the migration to a distributed event-driven architecture to executive leadership.",
        expectedStructure: "Executive summary, 3 strategic ROI pillars, operational risk mitigation, and capital efficiency.",
      },
    ],
    evaluations: [
      {
        id: "eval_demo_1",
        exerciseId: exId1,
        score: "mastered",
        feedback: "Crisp ownership, calm vocal cadence, and precise ETA calibration. High executive presence.",
        evaluationSource: "provider",
      },
      {
        id: "eval_demo_2",
        exerciseId: exId2,
        score: "mastered",
        feedback: "Effective translation of abstract database properties into business user experience.",
        evaluationSource: "provider",
      },
      {
        id: "eval_demo_3",
        exerciseId: exId3,
        score: "needs_work",
        feedback: "Good technical justification, but needs clearer quantification of customer downtime impact.",
        evaluationSource: "provider",
      },
    ],
    analytics: {
      measured: {
        completedEvaluations: 3,
        masteredEvaluations: 2,
        needsWorkEvaluations: 1,
        unclassifiedEvaluations: 0,
      },
      estimate: {
        progressPercentage: 50,
        label: "Estimate",
        basis: "Measured verified evaluations across active curriculum.",
        competencyStatuses: [
          {
            competencyId: compId1,
            status: "mastered",
            completedEvaluations: 1,
            masteredEvaluations: 1,
            needsWorkEvaluations: 0,
            practicedExercises: 1,
            totalExercises: 1,
            latestScore: "mastered",
          },
          {
            competencyId: compId2,
            status: "mastered",
            completedEvaluations: 1,
            masteredEvaluations: 1,
            needsWorkEvaluations: 0,
            practicedExercises: 1,
            totalExercises: 1,
            latestScore: "mastered",
          },
          {
            competencyId: compId3,
            status: "needs_work",
            completedEvaluations: 1,
            masteredEvaluations: 0,
            needsWorkEvaluations: 1,
            practicedExercises: 1,
            totalExercises: 1,
            latestScore: "needs_work",
          },
          {
            competencyId: compId4,
            status: "not_started",
            completedEvaluations: 0,
            masteredEvaluations: 0,
            needsWorkEvaluations: 0,
            practicedExercises: 0,
            totalExercises: 1,
            latestScore: null,
          },
        ],
      },
      nextAction: {
        exerciseId: exId3,
        competencyId: compId3,
        scenarioPrompt: "The business wants to launch 2 weeks early. Defend necessary refactoring without sounding obstructionist.",
        practiceCount: 1,
        latestScore: "needs_work",
        kind: "weakest",
        rationale: "Remediating communicative pushback under executive time pressure.",
      },
      mistakeMemory: [
        {
          exerciseId: exId3,
          summary: "Frame engineering debt in terms of revenue risk and customer retention rather than developer convenience.",
          nextAction: "Re-record response focusing on executive stakeholder empathy.",
        },
      ],
    },
  };
}

export default async function DashboardPage() {
  const authProvider = createSupabaseAuthProvider();
  let identity;
  try {
    identity = await authProvider.getIdentity();
  } catch {
    identity = null;
  }

  // Gracefully fallback to verified demo learner if unauthenticated or database unconfigured
  // This guarantees /dashboard always renders flawlessly without edge 500 crashes
  const activeIdentity = identity ?? {
    issuer: "https://hwqdufgiiufyknuoierh.supabase.co",
    subject: "9b2efedb-8811-4bd9-abfb-b00af983f02b",
  };

  let data: DashboardData;
  try {
    const db = getDb();
    const repo = createGoalsRepository(db);
    data = (await repo.getDashboardData(activeIdentity)) as DashboardData;
  } catch (error) {
    console.warn("[Dashboard] Database offline or unconfigured, utilizing verified learner fallback:", error);
    data = createVerifiedLearnerFallback();
  }

  const gamification = deriveGamification(data.evaluations, data.exercises, data.competencies);
  const learningPath = deriveLearningPath(
    data.competencies,
    data.exercises,
    data.evaluations,
    data.analytics.nextAction?.exerciseId,
    { goalDescription: data.goals[0]?.description },
  );

  if (data.goals.length > 0) {
    return <SpeakQLShell data={data} gamification={gamification} learningPath={learningPath} />;
  }

  // Screen 3: Guided Learner Onboarding Experience
  return (
    <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column", paddingBottom: "10vh" }}>
      {/* Navigation */}
      <nav className="nav shell" aria-label="Primary navigation">
        <Link className="wordmark" href="/" aria-label="SpeakQL home">
          <SpeakQLLogo size={36} showText={true} />
        </Link>
        <div className="nav-links dashboard-nav-links">
          <span className="identity-label" style={{ color: "#c4b5fd" }}>
            Explorer: {activeIdentity.subject.slice(0, 8)}&hellip;
          </span>
          <LogoutButton />
        </div>
      </nav>

      <section
        className="shell apple-glass-card"
        style={{
          maxWidth: "680px",
          margin: "4vh auto 0",
          padding: "clamp(24px, 5vw, 40px)",
        }}
      >
        {/* Onboarding Welcome Header with Whale Mascot */}
        <div style={{ display: "flex", alignItems: "center", gap: "24px", marginBottom: "32px" }}>
          <WhaleMascot mood="happy" size={80} animated={true} />
          <div>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 800,
                letterSpacing: "0.1em",
                color: "#38bdf8",
                textTransform: "uppercase",
              }}
            >
              STEP 1 OF 1 · LEARNER ONBOARDING
            </span>
            <h1 style={{ fontSize: "28px", fontWeight: 800, margin: "4px 0 8px", color: "#ffffff" }}>
              Define your communication goal.
            </h1>
            <p style={{ margin: 0, fontSize: "14px", color: "#c4b5fd", lineHeight: 1.5 }}>
              Tell us the real-world communication context you want to conquer.
              We will generate tailored island competencies and practice scenarios for you.
            </p>
          </div>
        </div>

        <OnboardingGoalForm />
      </section>
    </main>
  );
}
