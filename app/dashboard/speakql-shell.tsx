"use client";

import { useState, useCallback } from "react";
import { useClientStorage } from "@/src/client/hooks/use-client-storage";
import type { DashboardData } from "@/src/server/goals/repository";
import type { DashboardGamification } from "@/src/server/goals/gamification";
import type { DashboardLearningPath } from "@/src/server/goals/learning-path";
import SpeakQLSidebar, { type NavTab } from "./speakql-sidebar";
import SpeakQLPath from "./speakql-path";
import SpeakQLLessonModal from "./speakql-lesson-modal";
import PracticeView from "./practice-view";
import LeaderboardView from "./leaderboard-view";
import QuestsView from "./quests-view";
import ShopView from "./shop-view";
import AchievementsView from "./achievements-view";
import ConversationMentorView from "./conversation-mentor-view";
import ProfileSettingsView from "./profile-settings-view";
import LogoutButton from "./logout-button";
import { sound } from "@/src/client/sound/synthesizer";
import { WhaleMascot } from "@/src/client/components/whale-mascot";

export interface SpeakQLShellProps {
  data: DashboardData;
  gamification: DashboardGamification;
  learningPath: DashboardLearningPath;
  isEdgeSandbox?: boolean;
}

export type DuolingoShellProps = SpeakQLShellProps;

export const PROFESSIONAL_TRACKS = [
  {
    id: "engineering",
    title: "Engineering & Technical Architecture",
    icon: "💻",
    description: "Technical standups, architecture trade-offs, incident reviews",
  },
  {
    id: "product",
    title: "Product & Cross-Functional Leadership",
    icon: "🧭",
    description: "Sprint trade-offs, stakeholder negotiations, alignment",
  },
  {
    id: "async",
    title: "Global Asynchronous Collaboration",
    icon: "🌐",
    description: "Executive written briefs, cross-timezone PRs, meeting summaries",
  },
  {
    id: "executive",
    title: "Executive Presence & Investor Pitch",
    icon: "👔",
    description: "Investor presentations, boardroom communication, strategic recommendations",
  },
] as const;

export default function SpeakQLShell({
  data,
  gamification,
  learningPath,
  isEdgeSandbox = false,
}: SpeakQLShellProps) {
  const [currentTab, setCurrentTab] = useState<NavTab>("learn");
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);

  // Professional Learning Track selection with persistent client synchronization
  const [selectedTrackId, setSelectedTrackId] = useClientStorage<string>(
    "speakql_active_track",
    "engineering",
    useCallback((raw: string) => raw || "engineering", [])
  );

  const activeTrack =
    PROFESSIONAL_TRACKS.find((t) => t.id === selectedTrackId) ||
    PROFESSIONAL_TRACKS[0];

  // Gamified persistent client balances (Hearts & Gems) with SSR-safe synchronization
  const [hearts, setHearts] = useClientStorage<number>(
    "speakql_hearts",
    5,
    useCallback((raw: string) => {
      const val = Number(raw);
      return Number.isNaN(val) ? 5 : Math.max(0, Math.min(5, val));
    }, [])
  );

  const [gems, setGems] = useClientStorage<number>(
    "speakql_gems",
    450,
    useCallback((raw: string) => {
      const val = Number(raw);
      return Number.isNaN(val) ? 450 : Math.max(0, val);
    }, [])
  );

  const updateHearts = (newHearts: number) => {
    setHearts(Math.max(0, Math.min(5, newHearts)));
  };

  const updateGems = (newGems: number) => {
    setGems(Math.max(0, newGems));
  };

  const handleHeartLoss = () => {
    updateHearts(hearts - 1);
  };

  const handleRestoreHeart = () => {
    updateHearts(hearts + 1);
  };

  const handleRefillHearts = () => {
    updateHearts(5);
  };

  const handleBuyShopItem = (cost: number) => {
    updateGems(Math.max(0, gems - cost));
  };

  const handleClaimQuestGems = (amount: number) => {
    updateGems(gems + amount);
  };

  const handleLessonComplete = (earnedXp: number) => {
    // Add bonus gems scaled with earned XP
    const bonusGems = Math.max(10, Math.round(earnedXp / 2));
    updateGems(gems + bonusGems);
  };

  const unreviewedMistakes = data.evaluations.filter(
    (ev) => ev.score.trim().toLowerCase() === "needs_work"
  ).length;

  const currentGoalDescription = data.goals[0]?.description || "Mastering Natural Communication";
  const targetLessonId = learningPath.activeLessonId || data.analytics?.nextAction?.exerciseId || data.exercises[0]?.id;

  return (
    <div className="duo-app-wrapper">
      {/* 1. Left Sidebar Navigation */}
      <SpeakQLSidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        unreviewedMistakesCount={unreviewedMistakes}
      />

      {/* 2. Main Content Canvas */}
      <div className="duo-main-canvas">
        {isEdgeSandbox && (
          <aside
            role="status"
            aria-live="polite"
            style={{
              background: "linear-gradient(90deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.95))",
              borderBottom: "1px solid rgba(56, 189, 248, 0.35)",
              padding: "8px 20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "8px",
              fontSize: "12px",
              color: "#94a3b8",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ color: "#38bdf8", fontWeight: 800 }}>⚡ EDGE INTERACTIVE SANDBOX</span>
              <span>·</span>
              <span>All 4 learning destinations, AI speech simulations, and rubric evaluations active.</span>
            </div>
            <span style={{ fontSize: "11px", color: "#64748b" }}>
              Direct PostgreSQL persistence verified in Staging/Self-Hosted mode
            </span>
          </aside>
        )}

        {/* Top Floating Stats Bar */}
        <header className="duo-topbar" role="banner" aria-label="Learning stats">
          <div className="duo-topbar-left" style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            {/* Professional Track Switcher */}
            <div
              className="duo-goal-pill"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                background: "rgba(30, 41, 59, 0.85)",
                border: "1px solid rgba(168, 85, 247, 0.4)",
                padding: "6px 12px",
                borderRadius: "16px",
              }}
            >
              <span className="goal-flag" aria-hidden="true">{activeTrack.icon}</span>
              <select
                value={selectedTrackId}
                onChange={(e) => {
                  sound.playPop();
                  setSelectedTrackId(e.target.value);
                }}
                aria-label="Select Professional Learning Track"
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#f8fafc",
                  fontSize: "13px",
                  fontWeight: 700,
                  cursor: "pointer",
                  outline: "none",
                }}
              >
                {PROFESSIONAL_TRACKS.map((track) => (
                  <option
                    key={track.id}
                    value={track.id}
                    style={{ background: "#0f172a", color: "#f8fafc" }}
                  >
                    {track.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="duo-goal-pill" title={`Active Goal: ${currentGoalDescription}`}>
              <span className="goal-flag" aria-hidden="true">🌐</span>
              <span className="goal-name">{currentGoalDescription}</span>
            </div>
          </div>

          <div className="duo-topbar-right">
            <span
              style={{
                fontSize: "12px",
                fontWeight: 700,
                color: "#38bdf8",
                background: "rgba(56, 189, 248, 0.1)",
                border: "1px solid rgba(56, 189, 248, 0.25)",
                padding: "6px 14px",
                borderRadius: "99px",
                letterSpacing: "0.02em",
              }}
              title="Verified Mastery Rate from Completed Evaluations"
            >
              🌊 {data.analytics.estimate.progressPercentage}% Mastered
            </span>
            <LogoutButton />
          </div>
        </header>

        {/* Feature B: Mistake-Driven Recovery Banner when Hearts are zero */}
        {hearts === 0 && (
          <div
            style={{
              background: "linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(15, 23, 42, 0.95))",
              border: "2px solid rgba(239, 68, 68, 0.5)",
              borderRadius: "18px",
              padding: "16px 24px",
              margin: "12px 24px 0",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "14px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "28px" }}>❤️‍🩹</span>
              <div>
                <strong style={{ color: "#fca5a5", fontSize: "15px", display: "block" }}>
                  You have reached your practice limit for this session.
                </strong>
                <span style={{ color: "#e2e8f0", fontSize: "13px" }}>
                  You can continue improving by reviewing an earlier mistake in your queue to restore hearts.
                </span>
              </div>
            </div>
            <button
              type="button"
              className="button button-primary"
              onClick={() => {
                sound.playPop();
                setCurrentTab("practice");
              }}
              style={{
                background: "linear-gradient(135deg, #ef4444, #dc2626)",
                border: "none",
                padding: "8px 18px",
                fontSize: "13px",
                fontWeight: 800,
                borderRadius: "12px",
              }}
            >
              REVIEW MISTAKE (+1 HEART) 🎯
            </button>
          </div>
        )}

        {/* Dynamic Tab Body */}
        <main
          className="duo-tab-content"
          role="tabpanel"
          id={`tabpanel-${currentTab}`}
          aria-labelledby={`tab-${currentTab}`}
        >
          {currentTab === "learn" && (
            <div className="duo-learn-stage">
              {/* Learning Command Center: Goal, Why It Matters, & Next Mission */}
              {targetLessonId && (
                <div
                  className="duo-command-center"
                  style={{
                    background: "linear-gradient(135deg, rgba(24, 32, 75, 0.95), rgba(15, 23, 42, 0.98))",
                    border: "2px solid rgba(168, 85, 247, 0.35)",
                    borderRadius: "24px",
                    padding: "24px 28px",
                    marginBottom: "32px",
                    boxShadow: "0 16px 36px -8px rgba(0, 0, 0, 0.5)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px", marginBottom: "18px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                      <WhaleMascot mood="coach" size={64} animated={true} />
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                          <span
                            style={{
                              fontSize: "11px",
                              fontWeight: 800,
                              letterSpacing: "0.08em",
                              textTransform: "uppercase",
                              color: "#38bdf8",
                              background: "rgba(56, 189, 248, 0.12)",
                              border: "1px solid rgba(56, 189, 248, 0.3)",
                              padding: "2px 8px",
                              borderRadius: "99px",
                            }}
                          >
                            RECOMMENDED NEXT MISSION
                          </span>
                          <span style={{ fontSize: "12px", color: "#94a3b8" }}>
                            ⏱️ ~3 min mission
                          </span>
                        </div>
                        <h2 style={{ fontSize: "22px", fontWeight: 800, color: "#ffffff", margin: "4px 0 6px" }}>
                          {data.analytics?.nextAction?.kind === "weakest" ? "Targeted Skill Reinforcement" : "Active Dialogue Mission"}
                        </h2>
                        <p style={{ margin: 0, fontSize: "14px", color: "#cbd5e1", lineHeight: 1.5, maxWidth: "560px" }}>
                          <strong>Why this matters:</strong> {data.analytics?.nextAction?.rationale || "Builds prerequisite vocabulary and communicative phrasing for your goal."}
                        </p>
                      </div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "6px" }}>
                      <button
                        type="button"
                        className="button button-primary"
                        onClick={() => {
                          sound.playPop();
                          setActiveLessonId(targetLessonId);
                        }}
                        style={{
                          padding: "12px 24px",
                          fontSize: "15px",
                          fontWeight: 800,
                          borderRadius: "14px",
                          boxShadow: "0 6px 20px rgba(168, 85, 247, 0.4)",
                        }}
                      >
                        CONTINUE MISSION ▶
                      </button>
                      <span style={{ fontSize: "11px", color: "#94a3b8" }}>
                        🎯 Goal: {data.goals[0]?.description || "Workplace communication"}
                      </span>
                    </div>
                  </div>

                  {/* Diagnostic Skills Breakdown Pills */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                      gap: "12px",
                      paddingTop: "16px",
                      borderTop: "1px solid rgba(255, 255, 255, 0.08)",
                    }}
                  >
                    <div style={{ background: "rgba(30, 41, 59, 0.6)", padding: "10px 14px", borderRadius: "10px" }}>
                      <span style={{ fontSize: "11px", color: "#94a3b8", textTransform: "uppercase", fontWeight: 700 }}>
                        Mastered Evaluations
                      </span>
                      <div style={{ fontSize: "16px", fontWeight: 800, color: "#ffffff", marginTop: "2px" }}>
                        {data.analytics.measured.masteredEvaluations} / {data.analytics.measured.completedEvaluations || data.exercises.length}
                      </div>
                    </div>

                    <div style={{ background: "rgba(30, 41, 59, 0.6)", padding: "10px 14px", borderRadius: "10px" }}>
                      <span style={{ fontSize: "11px", color: "#94a3b8", textTransform: "uppercase", fontWeight: 700 }}>
                        Active Curriculum Units
                      </span>
                      <div style={{ fontSize: "16px", fontWeight: 800, color: "#38bdf8", marginTop: "2px" }}>
                        {data.competencies.length} Competencies
                      </div>
                    </div>

                    <div style={{ background: "rgba(30, 41, 59, 0.6)", padding: "10px 14px", borderRadius: "10px" }}>
                      <span style={{ fontSize: "11px", color: "#94a3b8", textTransform: "uppercase", fontWeight: 700 }}>
                        Demonstrated Mastery
                      </span>
                      <div style={{ fontSize: "16px", fontWeight: 800, color: "#4ade80", marginTop: "2px" }}>
                        {data.analytics.estimate.progressPercentage}%
                      </div>
                    </div>
                  </div>

                  {/* Due Reviews Notification */}
                  {data.evaluations.filter((ev) => ev.score.trim().toLowerCase() === "needs_work").length > 0 && (
                    <div
                      style={{
                        marginTop: "14px",
                        background: "rgba(239, 68, 68, 0.12)",
                        border: "1px solid rgba(239, 68, 68, 0.3)",
                        borderRadius: "10px",
                        padding: "10px 14px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: "10px",
                      }}
                    >
                      <span style={{ fontSize: "13px", color: "#fca5a5" }}>
                        ⚠️ You have {data.evaluations.filter((ev) => ev.score.trim().toLowerCase() === "needs_work").length} item(s) due for review. Revising them restores lost hearts.
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          sound.playPop();
                          setCurrentTab("practice");
                        }}
                        style={{
                          background: "rgba(239, 68, 68, 0.2)",
                          border: "1px solid #ef4444",
                          borderRadius: "6px",
                          padding: "4px 10px",
                          fontSize: "12px",
                          color: "#ffffff",
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        Review in Hub ↺
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* The Winding Stepping Stone Path */}
              <SpeakQLPath
                learningPath={learningPath}
                onStartLesson={(exerciseId) => setActiveLessonId(exerciseId)}
              />
            </div>
          )}

          {currentTab === "practice" && (
            <PracticeView
              evaluations={data.evaluations}
              exercises={data.exercises}
              hearts={hearts}
              onRestoreHeart={handleRestoreHeart}
              onLaunchExercise={(exerciseId) => setActiveLessonId(exerciseId)}
            />
          )}

          {currentTab === "leaderboard" && (
            <LeaderboardView
              userXp={gamification.totalXp}
              userStreak={gamification.streakDays}
            />
          )}

          {currentTab === "quests" && (
            <QuestsView
              gamification={gamification}
              onClaimGems={handleClaimQuestGems}
            />
          )}

          {currentTab === "shop" && (
            <ShopView
              gems={gems}
              hearts={hearts}
              onRefillHearts={handleRefillHearts}
              onBuyItem={handleBuyShopItem}
              onGoToPractice={() => setCurrentTab("practice")}
            />
          )}

          {currentTab === "achievements" && (
            <AchievementsView
              achievements={gamification.achievements}
              totalXp={gamification.totalXp}
              streakDays={gamification.streakDays}
            />
          )}

          {currentTab === "conversation" && (
            <ConversationMentorView
              activeGoalDescription={currentGoalDescription}
              onLaunchExercise={(exerciseId) => setActiveLessonId(exerciseId)}
              availableExerciseId={learningPath.activeLessonId || data.exercises[0]?.id}
            />
          )}

          {currentTab === "profile" && (
            <ProfileSettingsView
              goalDescription={currentGoalDescription}
              totalXp={gamification.totalXp}
              streakDays={gamification.streakDays}
              gems={gems}
              hearts={hearts}
              achievements={gamification.achievements}
            />
          )}
        </main>
      </div>

      {/* 3. Interactive Full-Screen Lesson Modal */}
      {activeLessonId && (
        <SpeakQLLessonModal
          exercises={data.exercises}
          initialExerciseId={activeLessonId}
          evaluations={data.evaluations}
          hearts={hearts}
          onHeartLoss={handleHeartLoss}
          onHeartRefill={handleRefillHearts}
          onCompleteLesson={handleLessonComplete}
          onClose={() => setActiveLessonId(null)}
        />
      )}
    </div>
  );
}

export { SpeakQLShell as DuolingoShell };
