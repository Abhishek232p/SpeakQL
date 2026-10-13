"use client";

import { useState } from "react";
import type { DashboardGamification } from "@/src/server/goals/gamification";
import { sound } from "@/src/client/sound/synthesizer";

interface QuestsViewProps {
  gamification: DashboardGamification;
  onClaimGems: (amount: number) => void;
}

export default function QuestsView({ gamification, onClaimGems }: QuestsViewProps) {
  const { dailyGoal, totalXp } = gamification;
  const [claimedQuests, setClaimedQuests] = useState<Record<string, boolean>>({});

  const quests = [
    {
      id: "quest_daily_xp",
      title: "Earn 30 XP Today",
      description: "Gain experience by submitting answers in interactive lessons.",
      current: Math.min(30, dailyGoal.currentXp),
      target: 30,
      rewardGems: 20,
      icon: "⚡",
    },
    {
      id: "quest_accuracy",
      title: "Score Mastered in a Lesson",
      description: "Submit a complete, fluent communication response.",
      current: totalXp > 0 ? 1 : 0,
      target: 1,
      rewardGems: 15,
      icon: "🎯",
    },
    {
      id: "quest_voice_practice",
      title: "Practice Speaking Dialogue",
      description: "Record audio or practice pronunciation for your goal.",
      current: dailyGoal.completedActivities > 0 ? 1 : 0,
      target: 1,
      rewardGems: 25,
      icon: "🎙️",
    },
  ];

  const handleClaim = (questId: string, gems: number) => {
    sound.playCorrect();
    setClaimedQuests((prev) => ({ ...prev, [questId]: true }));
    onClaimGems(gems);
  };

  return (
    <div className="duo-tab-view" aria-label="Daily Quests">
      {/* Monthly Challenge Banner */}
      <div className="duo-monthly-challenge-card">
        <div className="monthly-badge-graphic" aria-hidden="true">
          🏆
        </div>
        <div className="monthly-challenge-info">
          <span className="monthly-kicker">OCTOBER BADGE CHALLENGE</span>
          <h3>Autumn Fluency Expedition</h3>
          <p>Complete 15 daily quests this month to earn the limited-edition Communicator Badge.</p>
          <div className="monthly-progress-row">
            <div className="monthly-progress-bar" role="progressbar" aria-valuenow={7} aria-valuemin={0} aria-valuemax={15}>
              <div className="monthly-progress-fill" style={{ width: "46%" }} />
            </div>
            <span className="monthly-progress-text">7 / 15 Quests</span>
          </div>
        </div>
      </div>

      {/* Daily Quests List */}
      <div className="duo-quests-section">
        <div className="quests-section-header">
          <h2>Daily Quests</h2>
          <span className="quests-reset-pill">Resets every 24 hours</span>
        </div>

        <ul className="duo-quests-list">
          {quests.map((q) => {
            const isCompleted = q.current >= q.target;
            const isClaimed = claimedQuests[q.id];
            const pct = Math.min(100, Math.round((q.current / q.target) * 100));

            return (
              <li key={q.id} className={`duo-quest-card ${isCompleted ? "quest-completed" : ""}`}>
                <div className="quest-icon-col" aria-hidden="true">
                  <span className="quest-icon-badge">{q.icon}</span>
                </div>

                <div className="quest-details-col">
                  <h4 className="quest-title">{q.title}</h4>
                  <p className="quest-desc">{q.description}</p>
                  <div className="quest-progress-track">
                    <div className="quest-progress-fill" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="quest-count-label">
                    {q.current} / {q.target}
                  </span>
                </div>

                <div className="quest-action-col">
                  {isClaimed ? (
                    <span className="quest-claimed-tag">✓ Claimed</span>
                  ) : isCompleted ? (
                    <button
                      type="button"
                      className="duo-claim-btn"
                      onClick={() => handleClaim(q.id, q.rewardGems)}
                    >
                      CLAIM +{q.rewardGems} 💎
                    </button>
                  ) : (
                    <div className="quest-chest-locked" title="Reward chest locked">
                      <span>🎁</span>
                      <small>+{q.rewardGems} 💎</small>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
