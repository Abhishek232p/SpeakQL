"use client";

import { useState } from "react";
import type { DashboardData } from "@/src/server/goals/repository";
import type { DashboardGamification } from "@/src/server/goals/gamification";
import type { DashboardLearningPath } from "@/src/server/goals/learning-path";
import DuolingoSidebar, { type NavTab } from "./duolingo-sidebar";
import DuolingoPath from "./duolingo-path";
import DuolingoLessonModal from "./duolingo-lesson-modal";
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
import { RoamingWhaleGuide } from "@/src/client/components/roaming-whale-guide";

interface DuolingoShellProps {
  data: DashboardData;
  gamification: DashboardGamification;
  learningPath: DashboardLearningPath;
}

export default function DuolingoShell({
  data,
  gamification,
  learningPath,
}: DuolingoShellProps) {
  const [currentTab, setCurrentTab] = useState<NavTab>("learn");
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);

  // Gamified persistent client balances (Hearts & Gems)
  const [hearts, setHearts] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const savedHearts = localStorage.getItem("speakql_hearts");
      if (savedHearts !== null) return Number(savedHearts);
    }
    return 5;
  });

  const [gems, setGems] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const savedGems = localStorage.getItem("speakql_gems");
      if (savedGems !== null) return Number(savedGems);
    }
    return 450;
  });

  const updateHearts = (newHearts: number) => {
    const clamped = Math.max(0, Math.min(5, newHearts));
    setHearts(clamped);
    if (typeof window !== "undefined") {
      localStorage.setItem("speakql_hearts", String(clamped));
    }
  };

  const updateGems = (newGems: number) => {
    setGems(newGems);
    if (typeof window !== "undefined") {
      localStorage.setItem("speakql_gems", String(newGems));
    }
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

  return (
    <div className="duo-app-wrapper">
      {/* 1. Left Sidebar Navigation */}
      <DuolingoSidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        unreviewedMistakesCount={unreviewedMistakes}
      />

      {/* 2. Main Content Canvas */}
      <div className="duo-main-canvas">
        {/* Top Floating Stats Bar */}
        <header className="duo-topbar" role="banner" aria-label="Learning stats">
          <div className="duo-topbar-left">
            <div className="duo-goal-pill" title={`Active Goal: ${currentGoalDescription}`}>
              <span className="goal-flag" aria-hidden="true">🌐</span>
              <span className="goal-name">{currentGoalDescription}</span>
            </div>
          </div>

          <div className="duo-topbar-right">
            {/* Streak Counter */}
            <div className={`duo-stat-pill duo-streak-pill ${gamification.streakActiveToday ? "streak-live" : ""}`}>
              <span className="stat-emoji" aria-hidden="true">🔥</span>
              <span className="stat-number">{gamification.streakDays}</span>
            </div>

            {/* Gems Counter */}
            <div className="duo-stat-pill duo-gems-pill">
              <span className="stat-emoji" aria-hidden="true">💎</span>
              <span className="stat-number">{gems}</span>
            </div>

            {/* Hearts Counter */}
            <button
              type="button"
              className="duo-stat-pill duo-hearts-pill"
              onClick={() => setCurrentTab("shop")}
              title="Click to view hearts in shop"
              aria-label={`${hearts} of 5 hearts remaining`}
            >
              <span className="stat-emoji" aria-hidden="true">❤️</span>
              <span className="stat-number">{hearts}</span>
            </button>

            {/* Logout Control */}
            <LogoutButton />
          </div>
        </header>

        {/* Dynamic Tab Body */}
        <main className="duo-tab-content">
          {currentTab === "learn" && (
            <div className="duo-learn-stage">
              {/* Recommended Next Action Banner */}
              {learningPath.activeLessonId && (
                <div className="duo-next-action-hero">
                  <div className="hero-left-col" style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                    <WhaleMascot mood="happy" size={72} animated={true} />
                    <div>
                      <span className="hero-kicker">NEXT DESTINATION</span>
                      <h2 className="hero-title">Keep up the ocean momentum!</h2>
                      <p className="hero-desc">
                        Step into your next island scenario to advance your communicative fluency.
                      </p>
                    </div>
                  </div>
                  <div className="hero-right-col">
                    <button
                      type="button"
                      className="duo-btn-large duo-btn-primary"
                      onClick={() => {
                        sound.playPop();
                        setActiveLessonId(learningPath.activeLessonId);
                      }}
                    >
                      CONTINUE PATH ▶
                    </button>
                  </div>
                </div>
              )}

              {/* The Winding Stepping Stone Path */}
              <DuolingoPath
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
            />
          )}
        </main>
      </div>

      {/* 3. Interactive Full-Screen Lesson Modal */}
      {activeLessonId && (
        <DuolingoLessonModal
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

      {/* 4. Living Companion Whale Guide */}
      <RoamingWhaleGuide
        activeGoal={currentGoalDescription}
        currentTab={currentTab}
        eventTrigger={
          activeLessonId
            ? "practice_started"
            : unreviewedMistakes > 0
            ? "mistake_support"
            : "welcome"
        }
      />
    </div>
  );
}
