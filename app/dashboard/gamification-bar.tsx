"use client";

import { useState } from "react";
import type { DashboardGamification } from "@/src/server/goals/gamification";

export default function GamificationBar({ gamification }: { gamification: DashboardGamification }) {
  const [showAchievements, setShowAchievements] = useState(false);
  const { totalXp, streakDays, streakActiveToday, dailyGoal, achievements } = gamification;
  const unlockedAchievementsCount = achievements.filter((a) => a.unlocked).length;

  return (
    <div className="gamification-bar-container">
      <div className="gamification-bar" role="region" aria-label="Learning progress and streaks">
        {/* Streak Counter */}
        <div className={`gamification-stat streak-stat ${streakActiveToday ? "streak-active" : ""}`} title={streakActiveToday ? "Streak active today!" : "Practice today to maintain your streak!"}>
          <span className="stat-icon" aria-hidden="true">🔥</span>
          <div className="stat-info">
            <strong className="stat-value">{streakDays} {streakDays === 1 ? "Day" : "Days"}</strong>
            <span className="stat-label">{streakActiveToday ? "Streak Active" : "Practice Today"}</span>
          </div>
        </div>

        {/* XP Counter */}
        <div className="gamification-stat xp-stat" title="Total experience points earned from evaluated practice">
          <span className="stat-icon" aria-hidden="true">⚡</span>
          <div className="stat-info">
            <strong className="stat-value">{totalXp} XP</strong>
            <span className="stat-label">Total Points</span>
          </div>
        </div>

        {/* Daily Goal */}
        <div className="gamification-stat daily-stat" title={`Daily goal: ${dailyGoal.currentXp} of ${dailyGoal.targetXp} XP earned today`}>
          <span className="stat-icon" aria-hidden="true">🎯</span>
          <div className="stat-info">
            <div className="stat-header-row">
              <strong className="stat-value">{dailyGoal.currentXp} / {dailyGoal.targetXp} XP</strong>
              {dailyGoal.achieved && <span className="daily-badge">Goal Met!</span>}
            </div>
            <div className="daily-progress-bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={dailyGoal.percentage} aria-label={`Daily goal progress: ${dailyGoal.percentage}%`}>
              <div className="daily-progress-fill" style={{ width: `${dailyGoal.percentage}%` }} />
            </div>
          </div>
        </div>

        {/* Achievements Trigger */}
        <button
          type="button"
          className="gamification-stat achievement-stat-button"
          onClick={() => setShowAchievements(!showAchievements)}
          aria-expanded={showAchievements}
          aria-label={`View achievements: ${unlockedAchievementsCount} of ${achievements.length} unlocked`}
        >
          <span className="stat-icon" aria-hidden="true">🏆</span>
          <div className="stat-info">
            <strong className="stat-value">{unlockedAchievementsCount} / {achievements.length}</strong>
            <span className="stat-label">Badges Unlocked</span>
          </div>
        </button>
      </div>

      {/* Achievements Dropdown / Modal */}
      {showAchievements && (
        <div className="achievements-modal" role="dialog" aria-modal="true" aria-labelledby="achievements-heading">
          <div className="achievements-header">
            <h3 id="achievements-heading">Learning Achievements</h3>
            <button
              type="button"
              className="close-button"
              onClick={() => setShowAchievements(false)}
              aria-label="Close achievements modal"
            >
              &times;
            </button>
          </div>
          <p className="achievements-subheading">
            Badges are earned exclusively from genuine, persisted learning evidence.
          </p>
          <ul className="achievements-list" aria-label="List of achievements">
            {achievements.map((item) => (
              <li key={item.id} className={`achievement-item ${item.unlocked ? "achievement-unlocked" : "achievement-locked"}`}>
                <span className="achievement-item-icon" aria-hidden="true">{item.icon}</span>
                <div className="achievement-item-body">
                  <div className="achievement-item-title-row">
                    <strong>{item.title}</strong>
                    <span className="achievement-status-tag">
                      {item.unlocked ? "Unlocked" : "Locked"}
                    </span>
                  </div>
                  <p>{item.description}</p>
                  {item.unlockedAt && (
                    <span className="achievement-unlocked-date">Earned on {item.unlockedAt}</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
