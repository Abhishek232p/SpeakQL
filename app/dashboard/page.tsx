import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseAuthProvider } from "@/src/server/auth/supabase";
import { getDb } from "@/src/server/db/client";
import { createGoalsRepository, type DashboardData } from "@/src/server/goals/repository";
import { deriveGamification } from "@/src/server/goals/gamification";
import { deriveLearningPath } from "@/src/server/goals/learning-path";
import { createLearningGoal } from "./actions";
import LogoutButton from "./logout-button";
import DuolingoShell from "./duolingo-shell";
import { WhaleMascot, SpeakQLLogo } from "@/src/client/components/whale-mascot";

export default async function DashboardPage() {
  const authProvider = createSupabaseAuthProvider();
  const identity = await authProvider.getIdentity();

  if (!identity) redirect("/login");

  const db = getDb();
  const repo = createGoalsRepository(db);
  const data = (await repo.getDashboardData(identity)) as DashboardData;

  const gamification = deriveGamification(data.evaluations, data.exercises, data.competencies);
  const learningPath = deriveLearningPath(
    data.competencies,
    data.exercises,
    data.evaluations,
    data.analytics.nextAction?.exerciseId,
  );

  if (data.goals.length > 0) {
    return <DuolingoShell data={data} gamification={gamification} learningPath={learningPath} />;
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
            Explorer: {identity.subject.slice(0, 8)}&hellip;
          </span>
          <LogoutButton />
        </div>
      </nav>

      <section
        className="shell"
        style={{
          maxWidth: "680px",
          margin: "4vh auto 0",
          background: "rgba(16, 22, 58, 0.85)",
          backdropFilter: "blur(24px)",
          border: "1px solid rgba(139, 92, 246, 0.35)",
          borderRadius: "24px",
          padding: "40px",
          boxShadow: "0 12px 40px rgba(0, 0, 0, 0.5), 0 0 30px rgba(139, 92, 246, 0.15)",
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

        <form action={createLearningGoal} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div>
            <label
              htmlFor="goal-description"
              style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "#ffffff", marginBottom: "8px" }}
            >
              Target capability outcome
            </label>
            <textarea
              id="goal-description"
              name="description"
              required
              rows={4}
              placeholder="e.g. Lead daily engineering standups in Spanish, or Negotiate client contract scope."
              style={{
                width: "100%",
                padding: "1rem",
                borderRadius: "14px",
                border: "1px solid rgba(139, 92, 246, 0.35)",
                background: "rgba(24, 32, 75, 0.7)",
                color: "#ffffff",
                fontSize: "15px",
                lineHeight: 1.5,
                outline: "none",
                resize: "vertical",
              }}
            />
          </div>

          {/* Quick-Pick Inspiration Pills */}
          <div>
            <span style={{ fontSize: "12px", color: "#94a3b8", display: "block", marginBottom: "8px" }}>
              Suggested high-impact communication goals:
            </span>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {[
                "Lead daily engineering standups in Spanish",
                "Present quarterly product architecture to international partners",
                "Handle spontaneous customer negotiation and feedback in Spanish",
              ].map((example) => (
                <button
                  key={example}
                  type="button"
                  onClick={() => {
                    const el = document.getElementById("goal-description") as HTMLTextAreaElement | null;
                    if (el) el.value = example;
                  }}
                  style={{
                    textAlign: "left",
                    padding: "8px 14px",
                    borderRadius: "10px",
                    border: "1px solid rgba(139, 92, 246, 0.25)",
                    background: "rgba(22, 28, 70, 0.5)",
                    color: "#c4b5fd",
                    fontSize: "13px",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  💡 &ldquo;{example}&rdquo;
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="button button-primary"
            style={{
              marginTop: "12px",
              justifyContent: "center",
              padding: "14px",
              borderRadius: "14px",
              fontSize: "15px",
            }}
          >
            Chart Course &amp; Generate Islands ▶
          </button>
        </form>
      </section>
    </main>
  );
}
