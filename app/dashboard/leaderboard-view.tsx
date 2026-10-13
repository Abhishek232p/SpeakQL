"use client";

import { useMemo } from "react";

interface LeaderboardViewProps {
  userXp: number;
  userStreak: number;
}

interface LeaderboardUser {
  rank: number;
  name: string;
  avatar: string;
  xp: number;
  isCurrentUser: boolean;
  streak: number;
}

export default function LeaderboardView({ userXp, userStreak }: LeaderboardViewProps) {
  // Deterministic cohort of learners surrounding the user
  const cohort: LeaderboardUser[] = useMemo(() => {
    const rawCohort = [
      { name: "Elena Rostova", avatar: "👩‍💼", baseOffset: 120, streak: 14 },
      { name: "Mateo Silva", avatar: "👨‍💻", baseOffset: 85, streak: 8 },
      { name: "Aria Chen", avatar: "👩‍🔬", baseOffset: 60, streak: 21 },
      { name: "Marcus Brody", avatar: "👨‍🏫", baseOffset: 45, streak: 5 },
      { name: "Sofia Morales", avatar: "👩‍🎨", baseOffset: 30, streak: 12 },
      { name: "You (Learner)", avatar: "🐳", baseOffset: 0, streak: userStreak, isCurrentUser: true },
      { name: "Liam O'Connor", avatar: "👨‍🚀", baseOffset: -15, streak: 4 },
      { name: "Yuki Tanaka", avatar: "👩‍🎤", baseOffset: -35, streak: 9 },
      { name: "Amara Diallo", avatar: "👩‍⚕️", baseOffset: -50, streak: 3 },
      { name: "Lucas Müller", avatar: "👨‍🏭", baseOffset: -75, streak: 6 },
      { name: "Chloe Dupont", avatar: "👩‍🍳", baseOffset: -95, streak: 2 },
      { name: "Dmitri Ivanov", avatar: "👨‍🌾", baseOffset: -115, streak: 7 },
      { name: "Ananya Sharma", avatar: "👩‍💻", baseOffset: -140, streak: 1 },
      { name: "Hassan Al-Mansoor", avatar: "👨‍💼", baseOffset: -160, streak: 4 },
      { name: "Zara Lindholm", avatar: "👩‍🔧", baseOffset: -185, streak: 2 },
    ];

    const sorted = rawCohort.map((u) => {
      const computedXp = u.isCurrentUser ? userXp : Math.max(10, userXp + u.baseOffset);
      return {
        ...u,
        xp: computedXp,
        isCurrentUser: Boolean(u.isCurrentUser),
      };
    }).sort((a, b) => b.xp - a.xp);

    return sorted.map((u, i) => ({ ...u, rank: i + 1 }));
  }, [userXp, userStreak]);

  const userRank = cohort.find((u) => u.isCurrentUser)?.rank ?? 6;
  const leagueTier = userXp >= 150 ? "Gold League" : userXp >= 60 ? "Silver League" : "Bronze League";
  const leagueIcon = userXp >= 150 ? "🥇" : userXp >= 60 ? "🥈" : "🥉";

  return (
    <div className="duo-tab-view" aria-label="Leaderboards Tab">
      {/* League Header Card */}
      <div className="duo-league-header-card">
        <div className="league-trophy-display">
          <span className="league-icon-big" aria-hidden="true">{leagueIcon}</span>
          <div>
            <span className="league-kicker">CURRENT DIVISION &bull; COHORT BENCHMARK</span>
            <h2 className="league-title">{leagueTier}</h2>
            <p className="league-subtitle">
              Illustrative cohort standing &bull; Progression and mastery reflect your demonstrated exercise evaluations.
            </p>
          </div>
        </div>
        <div className="league-timer-box">
          <span className="timer-label">YOUR RANK &bull; WEEK ENDS</span>
          <strong className="timer-val">#{userRank} &bull; 2d 14h</strong>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="duo-leaderboard-container">
        <div className="leaderboard-legend">
          <span className="legend-item legend-promo">▲ Top 7: Promotion Zone</span>
          <span className="legend-item legend-demo">▼ Bottom 3: Demotion Zone</span>
        </div>

        <ol className="duo-leaderboard-list">
          {cohort.map((item) => {
            const isPromo = item.rank <= 7;
            const isDemo = item.rank >= cohort.length - 2;

            return (
              <li
                key={item.name}
                className={`duo-leaderboard-row ${item.isCurrentUser ? "row-current-user" : ""} ${
                  isPromo ? "row-promo" : isDemo ? "row-demo" : ""
                }`}
              >
                <div className="row-rank-col">
                  <span className={`rank-number ${item.rank <= 3 ? `rank-top-${item.rank}` : ""}`}>
                    {item.rank <= 3 ? ["🥇", "🥈", "🥉"][item.rank - 1] : item.rank}
                  </span>
                  {isPromo && <span className="promo-arrow" title="In promotion zone">▲</span>}
                  {isDemo && <span className="demo-arrow" title="In demotion zone">▼</span>}
                </div>

                <div className="row-avatar-col" aria-hidden="true">
                  <span className="user-avatar">{item.avatar}</span>
                </div>

                <div className="row-name-col">
                  <strong className="user-display-name">
                    {item.name} {item.isCurrentUser && <span className="you-pill">YOU</span>}
                  </strong>
                  <span className="user-streak-note">🔥 {item.streak} day streak</span>
                </div>

                <div className="row-xp-col">
                  <strong className="xp-amount">{item.xp} XP</strong>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
