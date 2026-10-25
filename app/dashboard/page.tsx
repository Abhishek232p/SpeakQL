"import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseAuthProvider } from "@/src/server/auth/supabase";
import { deriveGamification } from "@/src/server/goals/gamification";
import { deriveLearningPath } from "@/src/server/goals/learning-path";
import OnboardingGoalForm from "./onboarding-goal-form";
import LogoutButton from "./logout-button";
import SpeakQLShell from "./speakql-shell";
import { WhaleMascot, SpeakQLLogo } from "@/src/client/components/whale-mascot";

function DashboardUnavailable() {
  return (
    <main className="dashboard-page" role="alert">
      <section className="dashboard-error shell" aria-labelledby="dashboard-error-heading">
        <p className="section-kicker">Learning plan unavailable</p>
        <h1 id="dashboard-error-heading">We couldn’t load your learning plan.</h1>
        <p>Your saved progress has not been changed. Check your connection and try again.</p>
        <Link className="button button-secondary" href="/dashboard">Try again</Link>
      </section>
    </main>
  );
}

function OnboardingScreen({ subject }: { subject: string }) {
  return (
    <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column", paddingBottom: "10vh" }}>
      <nav className="nav shell dashboard-nav" aria-label="Primary navigation">
        <Link className="wordmark" href="/" aria-label="SpeakQL home">
          <SpeakQLLogo size={36} showText />
        </Link>
        <div className="nav-links dashboard-nav-links">
          <span className="identity-label">Your learning account</span>
          <LogoutButton />
        </div>
      </nav>
      <section className="shell apple-glass-card onboarding-card" style={{ maxWidth: "680px", margin: "4vh auto 0", padding: "clamp(24px, 5vw, 40px)" }}>
        <div className="onboarding-welcome">
          <WhaleMascot mood="happy" size={64} animated />
          <div>
            <span className="section-kicker">Your first step</span>
            <h1 className="onboarding-heading">What would you like to communicate better?</h1>
            <p className="onboarding-copy">Choose a language, your starting level, and a real-life situation. We’ll guide you from there.</p>
          </div>
        </div>
        <OnboardingGoalForm />
      </section>
    </main>
  );
}

export default async function DashboardPage() {
  let identity = null;
  try {
    identity = await createSupabaseAuthProvider().getIdentity();
  } catch {
    identity = null;
  }

  // Never substitute a demo identity. Every learner must see only their own saved data.
  if (!identity) redirect("/login");

  let data;
  try {
    const { getDb } = await import("@/src/server/db/client");
    const { createGoalsRepository } = await import("@/src/server/goals/repository");
    data = await createGoalsRepository(getDb()).getDashboardData(identity);
  } catch (error) {
    console.error("[Dashboard] Could not load the authenticated learner data.", error);
    return <DashboardUnavailable />;
  }

  if (!data || !Array.isArray(data.goals)) return <DashboardUnavailable />;
  if (data.goals.length === 0) return <OnboardingScreen subject={identity.subject} />;

  try {
    const gamification = deriveGamification(data.evaluations, data.exercises, data.competencies);
    const learningPath = deriveLearningPath(
      data.competencies,
      data.exercises,
      data.evaluations,
      data.analytics?.nextAction?.exerciseId,
      { goalDescription: data.goals[0]?.description },
    );
    return <SpeakQLShell data={data} gamification={gamification} learningPath={learningPath} />;
  } catch (error) {
    console.error("[Dashboard] Could not derive the learner's next step.", error);
    return <DashboardUnavailable />;
  }
}
