"use client";

import type { GamificationAchievement } from "@/src/server/goals/gamification";

interface AchievementsViewProps {
  achievements: readonly GamificationAchievement[];
  totalXp: number;
  streakDays: number;
}

export default function AchievementsView({ achievements, totalXp, streakDays }: AchievementsViewProps) {
  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  return (
    <div className="duo-tab-view" aria-label="Achievements Tab">
      {/* Achievements Header Banner */}
      <div className="duo-achievements-hero-card">
        <div className="achievements-hero-left">
          <span className="achievements-kicker">MILESTONES &amp; BADGES</span>
          <h2>Hall of Achievements</h2>
          <p>Earn badges through genuine practice. Current: <strong>{totalXp} XP</strong> &middot; <strong>{streakDays} day streak</strong>.</p>
        </div>
        <div className="achievements-counter-badge">
          <span className="counter-icon-big" aria-hidden="true">🏆</span>
          <strong className="counter-value-big">{unlockedCount} / {achievements.length}</strong>
          <span className="counter-label-big">Badges Unlocked</span>
        </div>
      </div>

      {/* Badges Grid */}
      <div className="duo-badges-grid">
        {achievements.map((item) => (
          <div
            key={item.id}
            className={`duo-badge-card ${item.unlocked ? "badge-card-unlocked" : "badge-card-locked"}`}
          >
            <div className="badge-icon-bubble" aria-hidden="true">
              {item.icon}
            </div>
            <div className="badge-card-content">
              <div className="badge-title-row">
                <h4 className="badge-title">{item.title}</h4>
                <span className={`badge-state-pill ${item.unlocked ? "pill-unlocked" : "pill-locked"}`}>
                  {item.unlocked ? "Unlocked" : "Locked"}
                </span>
              </div>
              <p className="badge-desc">{item.description}</p>
              {item.unlockedAt && (
                <span className="badge-date">Earned: {item.unlockedAt}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
