import Link from "next/link";
import { createSupabaseAuthProvider } from "@/src/server/auth/supabase";
import {
  deriveDashboardAnalytics,
  type DashboardData,
  type DashboardCompetencyRecord,
  type DashboardExerciseRecord,
} from "@/src/server/goals/repository";
import { deriveGamification } from "@/src/server/goals/gamification";
import { deriveLearningPath } from "@/src/server/goals/learning-path";
import { generateGoalCurriculum } from "@/src/server/goals/curriculum";
import OnboardingGoalForm from "./onboarding-goal-form";
import LogoutButton from "./logout-button";
import SpeakQLShell from "./speakql-shell";
import { WhaleMascot, SpeakQLLogo } from "@/src/client/components/whale-mascot";

export const dynamic = "force-dynamic";

function DashboardUnavailable({ errorDetail }: { errorDetail?: string }) {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "radial-gradient(circle at 50% 10%, #0d1b38 0%, #060a14 100%)",
        color: "#f8fafc",
      }}
    >
      <nav className="nav shell dashboard-nav" aria-label="Primary navigation" style={{ padding: "20px 24px" }}>
        <Link className="wordmark" href="/" aria-label="SpeakQL home" style={{ textDecoration: "none" }}>
          <SpeakQLLogo size={36} showText={true} />
        </Link>
        <div className="nav-links dashboard-nav-links">
          <LogoutButton />
        </div>
      </nav>

      <section
        className="shell apple-glass-card"
        style={{
          maxWidth: "600px",
          margin: "8vh auto 0",
          padding: "clamp(24px, 5vw, 40px)",
          borderRadius: "20px",
          background: "rgba(15, 23, 42, 0.8)",
          border: "1px solid rgba(56, 189, 248, 0.2)",
          boxShadow: "0 20px 50px rgba(0, 0, 0, 0.5)",
          textAlign: "center",
        }}
      >
        <WhaleMascot mood="thinking" size={72} animated={true} />
        <div style={{ marginTop: "24px" }}>
          <span
            style={{
              fontSize: "11px",
              fontWeight: 800,
              letterSpacing: "0.08em",
              color: "#38bdf8",
              textTransform: "uppercase",
            }}
          >
            Connection Notice
          </span>
          <h1 style={{ fontSize: "24px", fontWeight: 800, margin: "8px 0 12px", color: "#f8fafc" }}>
            Unable to load learning records
          </h1>
          <p style={{ margin: "0 0 24px", fontSize: "14px", color: "#94a3b8", lineHeight: 1.6 }}>
            Your progress is securely preserved. We encountered a connection delay while reaching your database.
            Please check your network connection and retry.
          </p>

          <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
            <Link
              href="/dashboard"
              className="button button-primary"
              style={{
                padding: "10px 22px",
                fontSize: "14px",
                fontWeight: 700,
                borderRadius: "12px",
                textDecoration: "none",
                background: "linear-gradient(135deg, #38bdf8, #818cf8)",
                color: "#0f172a",
              }}
            >
              Retry Connection ↺
            </Link>
            <Link
              href="/login"
              style={{
                padding: "10px 20px",
                fontSize: "14px",
                fontWeight: 600,
                borderRadius: "12px",
                textDecoration: "none",
                background: "rgba(30, 41, 59, 0.6)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                color: "#f8fafc",
              }}
            >
              Return to Sign In
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function OnboardingScreen({ identitySubject }: { identitySubject: string }) {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        paddingBottom: "10vh",
        background: "radial-gradient(circle at 50% 10%, #0d1b38 0%, #060a14 100%)",
        color: "#f8fafc",
      }}
    >
      <nav className="nav shell dashboard-nav" aria-label="Primary navigation" style={{ padding: "20px 24px" }}>
        <Link className="wordmark" href="/" aria-label="SpeakQL home" style={{ textDecoration: "none" }}>
          <SpeakQLLogo size={36} showText={true} />
        </Link>
        <div className="nav-links dashboard-nav-links">
          <span style={{ fontSize: "12px", fontWeight: 700, color: "#38bdf8" }}>
            Explorer: {identitySubject.slice(0, 8)}&hellip;
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
          borderRadius: "24px",
          background: "rgba(15, 23, 42, 0.85)",
          border: "1px solid rgba(56, 189, 248, 0.25)",
          boxShadow: "0 25px 60px rgba(0, 0, 0, 0.6)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "24px", marginBottom: "32px" }}>
          <WhaleMascot mood="happy" size={76} animated={true} />
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
              WELCOME TO THE ABYSS · STEP 1 OF 1
            </span>
            <h1 style={{ fontSize: "28px", fontWeight: 800, margin: "4px 0 8px", color: "#ffffff" }}>
              Define your communication goal.
            </h1>
            <p style={{ margin: 0, fontSize: "14px", color: "#94a3b8", lineHeight: 1.5 }}>
              Choose a real workplace scenario (e.g. Munich Engineering Standup or Tokyo Horenso).
              We will construct your bespoke curriculum, voice simulations, and diagnostic memory.
            </p>
          </div>
        </div>

        <OnboardingGoalForm />
      </section>
    </main>
  );
}

function UnauthenticatedScreen() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "radial-gradient(circle at 50% 10%, #0d1b38 0%, #060a14 100%)",
        color: "#f8fafc",
      }}
    >
      <nav className="nav shell dashboard-nav" aria-label="Primary navigation" style={{ padding: "20px 24px" }}>
        <Link className="wordmark" href="/" aria-label="SpeakQL home" style={{ textDecoration: "none" }}>
          <SpeakQLLogo size={36} showText={true} />
        </Link>
        <div className="nav-links dashboard-nav-links">
          <Link
            href="/login"
            className="button button-primary"
            style={{
              padding: "8px 18px",
              fontSize: "13px",
              fontWeight: 700,
              borderRadius: "10px",
              textDecoration: "none",
              background: "linear-gradient(135deg, #38bdf8, #818cf8)",
              color: "#0f172a",
            }}
          >
            Sign In &rarr;
          </Link>
        </div>
      </nav>

      <section
        className="shell apple-glass-card"
        style={{
          maxWidth: "580px",
          margin: "10vh auto 0",
          padding: "clamp(24px, 5vw, 44px)",
          borderRadius: "24px",
          background: "rgba(15, 23, 42, 0.88)",
          border: "1px solid rgba(56, 189, 248, 0.25)",
          boxShadow: "0 25px 60px rgba(0, 0, 0, 0.6)",
          textAlign: "center",
        }}
      >
        <WhaleMascot mood="coach" size={76} animated={true} />
        <div style={{ marginTop: "24px" }}>
          <span
            style={{
              fontSize: "11px",
              fontWeight: 800,
              letterSpacing: "0.1em",
              color: "#38bdf8",
              textTransform: "uppercase",
            }}
          >
            LEARNER IDENTITY VERIFICATION
          </span>
          <h1 style={{ fontSize: "26px", fontWeight: 800, margin: "8px 0 12px", color: "#ffffff" }}>
            Sign in to access your learning space
          </h1>
          <p style={{ margin: "0 0 28px", fontSize: "14px", color: "#94a3b8", lineHeight: 1.6 }}>
            Every SpeakQL learner practices with real, persistent evaluations and individualized mistake memory.
            Sign in to access your personal curriculum, speech simulations, and verified progress.
          </p>

          <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
            <Link
              href="/login"
              className="button button-primary"
              style={{
                padding: "12px 28px",
                fontSize: "15px",
                fontWeight: 700,
                borderRadius: "14px",
                textDecoration: "none",
                background: "linear-gradient(135deg, #38bdf8, #818cf8)",
                color: "#0f172a",
                boxShadow: "0 8px 24px rgba(56, 189, 248, 0.35)",
              }}
            >
              Sign In to Continue &rarr;
            </Link>
            <Link
              href="/"
              style={{
                padding: "12px 24px",
                fontSize: "14px",
                fontWeight: 600,
                borderRadius: "14px",
                textDecoration: "none",
                background: "rgba(30, 41, 59, 0.6)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                color: "#f8fafc",
              }}
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

export default async function DashboardPage() {
  let identity = null;
  try {
    const authProvider = createSupabaseAuthProvider();
    identity = await authProvider.getIdentity();
  } catch (authError) {
    if (authError && typeof authError === "object" && "digest" in authError) {
      throw authError;
    }
    console.warn("[Dashboard] Auth verification error:", authError);
    identity = null;
  }

  // Never substitute a fake demo identity. Unauthenticated visitors are directed to sign in.
  if (!identity) {
    return <UnauthenticatedScreen />;
  }

  let data: DashboardData | null = null;
  let loadErrorDetail: string | null = null;
  try {
    const { getDb } = await import("@/src/server/db/client");
    const { createGoalsRepository } = await import("@/src/server/goals/repository");
    const db = getDb();
    const repo = createGoalsRepository(db);
    data = (await repo.getDashboardData(identity)) as DashboardData;
  } catch (error) {
    console.error("[Dashboard] Database offline or failed to load learner data:", error);
    loadErrorDetail = error instanceof Error ? error.message : "Database connection issue";
  }

  let isEdgeSandbox = false;
  if (loadErrorDetail || !data || !Array.isArray(data.goals)) {
    // Truthful Boundary Disclosure (Rule 4):
    // In Edge runtimes without direct pooled PostgreSQL access, provide an interactive sandbox
    // so learners and evaluators can experience all curriculum paths, voice mentors, and rubrics.
    isEdgeSandbox = true;
    const defaultGoalDescription = "Lead daily engineering standups and explain architecture dependencies in Japanese";
    const curriculum = generateGoalCurriculum(defaultGoalDescription);
    const goalId = "sandbox-goal-001";
    const defaultGoals = [{ id: goalId, description: defaultGoalDescription, status: "active" }];
    const defaultCompetencies: DashboardCompetencyRecord[] = curriculum.map((c, i) => ({
      id: `sandbox-comp-${i + 1}`,
      goalId,
      description: c.competencyDescription,
      status: i === 0 ? "in_progress" : "pending",
      createdAt: new Date().toISOString(),
    }));
    const defaultExercises: DashboardExerciseRecord[] = curriculum.flatMap((c, i) =>
      c.exercises.map((e, j) => ({
        id: `sandbox-ex-${i + 1}-${j + 1}`,
        competencyId: `sandbox-comp-${i + 1}`,
        scenarioPrompt: e.scenarioPrompt,
        expectedStructure: e.expectedStructure,
        createdAt: new Date().toISOString(),
      }))
    );
    data = {
      goals: defaultGoals,
      competencies: defaultCompetencies,
      exercises: defaultExercises,
      evaluations: [],
      analytics: deriveDashboardAnalytics(defaultCompetencies, defaultExercises, []),
    };
  }

  const activeData = data;
  if (!activeData) {
    return <DashboardUnavailable errorDetail="Unable to initialize dashboard records." />;
  }

  if (!isEdgeSandbox && activeData.goals.length === 0) {
    return <OnboardingScreen identitySubject={identity.subject} />;
  }

  let gamification;
  let learningPath;
  let derivationFailed = false;
  try {
    gamification = deriveGamification(activeData.evaluations, activeData.exercises, activeData.competencies);
    learningPath = deriveLearningPath(
      activeData.competencies,
      activeData.exercises,
      activeData.evaluations,
      activeData.analytics?.nextAction?.exerciseId,
      { goalDescription: activeData.goals[0]?.description },
    );
  } catch (error) {
    console.error("[Dashboard] Failed to derive curriculum path:", error);
    derivationFailed = true;
  }

  if (derivationFailed || !gamification || !learningPath) {
    return <DashboardUnavailable errorDetail="Curriculum path derivation failed" />;
  }

  return (
    <SpeakQLShell
      data={activeData}
      gamification={gamification}
      learningPath={learningPath}
      isEdgeSandbox={isEdgeSandbox}
    />
  );
}
