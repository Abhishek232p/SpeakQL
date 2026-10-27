"use client";

import { useState, useCallback } from "react";
import { useClientStorage } from "@/src/client/hooks/use-client-storage";
import { WhaleMascot } from "@/src/client/components/whale-mascot";
import { sound } from "@/src/client/sound/synthesizer";
import type { GamificationAchievement } from "@/src/server/goals/gamification";
import LogoutButton from "./logout-button";

interface ProfileSettingsViewProps {
  goalDescription: string;
  totalXp: number;
  streakDays: number;
  gems: number;
  hearts: number;
  achievements?: readonly GamificationAchievement[];
}

export default function ProfileSettingsView({
  goalDescription,
  totalXp,
  streakDays,
  gems,
  hearts,
  achievements = [],
}: ProfileSettingsViewProps) {
  const [dailyTargetXp, setDailyTargetXp] = useClientStorage<number>(
    "speakql_daily_target_xp",
    30,
    useCallback((raw: string) => {
      const parsed = Number(raw);
      return !Number.isNaN(parsed) && parsed > 0 ? parsed : 30;
    }, [])
  );
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleToggleSound = () => {
    const isNowMuted = sound.toggleMute();
    setSoundEnabled(!isNowMuted);
    if (!isNowMuted) {
      sound.playPop();
    }
  };

  const handleSaveSettings = () => {
    sound.playPop();
    if (typeof window !== "undefined") {
      localStorage.setItem("speakql_daily_target_xp", String(dailyTargetXp));
    }
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      {/* 1. Learner Overview Hero Card */}
      <div
        style={{
          background: "linear-gradient(135deg, rgba(30, 27, 75, 0.9) 0%, rgba(18, 24, 62, 0.9) 100%)",
          border: "1px solid rgba(139, 92, 246, 0.35)",
          borderRadius: "24px",
          padding: "32px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "24px",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <WhaleMascot mood="happy" size={84} animated={true} />
          <div>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 800,
                letterSpacing: "0.08em",
                color: "#38bdf8",
                textTransform: "uppercase",
              }}
            >
              LEARNER PROFILE
            </span>
            <h2 style={{ fontSize: "28px", fontWeight: 800, margin: "4px 0 8px", color: "#ffffff" }}>
              Ocean Explorer
            </h2>
            <p style={{ margin: 0, fontSize: "14px", color: "#c4b5fd" }}>
              Active in SpeakQL Ocean World
            </p>
          </div>
        </div>

        {/* Stats Summary Pill Group */}
        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
          <div
            style={{
              background: "rgba(10, 14, 40, 0.7)",
              border: "1px solid rgba(139, 92, 246, 0.3)",
              padding: "12px 18px",
              borderRadius: "16px",
              textAlign: "center",
              minWidth: "85px",
            }}
          >
            <span style={{ fontSize: "11px", color: "#94a3b8", display: "block", fontWeight: 700 }}>STREAK</span>
            <strong style={{ fontSize: "20px", color: "#f59e0b" }}>🔥 {streakDays}</strong>
          </div>
          <div
            style={{
              background: "rgba(10, 14, 40, 0.7)",
              border: "1px solid rgba(139, 92, 246, 0.3)",
              padding: "12px 18px",
              borderRadius: "16px",
              textAlign: "center",
              minWidth: "85px",
            }}
          >
            <span style={{ fontSize: "11px", color: "#94a3b8", display: "block", fontWeight: 700 }}>TOTAL XP</span>
            <strong style={{ fontSize: "20px", color: "#38bdf8" }}>⚡ {totalXp}</strong>
          </div>
          <div
            style={{
              background: "rgba(10, 14, 40, 0.7)",
              border: "1px solid rgba(139, 92, 246, 0.3)",
              padding: "12px 18px",
              borderRadius: "16px",
              textAlign: "center",
              minWidth: "85px",
            }}
          >
            <span style={{ fontSize: "11px", color: "#94a3b8", display: "block", fontWeight: 700 }}>GEMS</span>
            <strong style={{ fontSize: "20px", color: "#c084fc" }}>💎 {gems}</strong>
          </div>
          <div
            style={{
              background: "rgba(10, 14, 40, 0.7)",
              border: "1px solid rgba(139, 92, 246, 0.3)",
              padding: "12px 18px",
              borderRadius: "16px",
              textAlign: "center",
              minWidth: "85px",
            }}
          >
            <span style={{ fontSize: "11px", color: "#94a3b8", display: "block", fontWeight: 700 }}>HEARTS</span>
            <strong style={{ fontSize: "20px", color: "#ec4899" }}>❤️ {hearts}/5</strong>
          </div>
        </div>
      </div>

      {/* 2. Learning Goal & Preferences Card */}
      <div
        style={{
          background: "rgba(16, 22, 58, 0.85)",
          border: "1px solid rgba(139, 92, 246, 0.28)",
          borderRadius: "24px",
          padding: "28px 32px",
          boxShadow: "0 8px 30px rgba(0, 0, 0, 0.35)",
        }}
      >
        <h3 style={{ fontSize: "20px", fontWeight: 800, margin: "0 0 16px", color: "#ffffff" }}>
          Learning Focus &amp; Curriculum Goal
        </h3>

        <div
          style={{
            background: "rgba(24, 32, 75, 0.7)",
            border: "1px solid rgba(139, 92, 246, 0.3)",
            borderRadius: "16px",
            padding: "18px 22px",
            marginBottom: "24px",
          }}
        >
          <span style={{ fontSize: "11px", fontWeight: 800, color: "#38bdf8", textTransform: "uppercase" }}>
            Current Active Goal
          </span>
          <p style={{ margin: "6px 0 0", fontSize: "16px", fontWeight: 700, color: "#ffffff", lineHeight: 1.5 }}>
            &ldquo;{goalDescription}&rdquo;
          </p>
        </div>

        {/* Daily XP Target Preference */}
        <div style={{ marginBottom: "24px" }}>
          <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "#c4b5fd", marginBottom: "8px" }}>
            Daily Learning Target (XP)
          </label>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            {[15, 30, 50, 100].map((target) => (
              <button
                key={target}
                type="button"
                onClick={() => setDailyTargetXp(target)}
                style={{
                  padding: "10px 20px",
                  borderRadius: "12px",
                  fontSize: "13px",
                  fontWeight: 800,
                  cursor: "pointer",
                  border: dailyTargetXp === target ? "2px solid #38bdf8" : "1px solid rgba(139, 92, 246, 0.3)",
                  background: dailyTargetXp === target ? "rgba(56, 189, 248, 0.2)" : "rgba(22, 28, 70, 0.6)",
                  color: "#ffffff",
                  transition: "all 0.15s ease",
                }}
              >
                {target} XP / day
              </button>
            ))}
          </div>
        </div>

        {/* Audio Effects Setting */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "16px 0",
            borderTop: "1px solid rgba(139, 92, 246, 0.2)",
            borderBottom: "1px solid rgba(139, 92, 246, 0.2)",
            marginBottom: "24px",
          }}
        >
          <div>
            <h4 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#ffffff" }}>
              Sound Effects &amp; Audio Synthesizer
            </h4>
            <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#c4b5fd" }}>
              Interactive Web Audio chimes for correct responses, token pops, and fanfare.
            </p>
          </div>
          <button
            type="button"
            onClick={handleToggleSound}
            style={{
              padding: "8px 18px",
              borderRadius: "12px",
              fontSize: "13px",
              fontWeight: 800,
              cursor: "pointer",
              border: soundEnabled ? "1px solid rgba(16, 185, 129, 0.6)" : "1px solid rgba(100, 116, 139, 0.4)",
              background: soundEnabled ? "rgba(16, 185, 129, 0.2)" : "rgba(30, 41, 59, 0.6)",
              color: soundEnabled ? "#34d399" : "#94a3b8",
            }}
          >
            {soundEnabled ? "🔊 ENABLED" : "🔇 MUTED"}
          </button>
        </div>

        {/* Save Button */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <button
            type="button"
            onClick={handleSaveSettings}
            className="button button-primary"
            style={{ padding: "12px 28px", borderRadius: "12px", fontSize: "14px" }}
          >
            Save Preferences ✓
          </button>
          {savedSuccess && (
            <span style={{ fontSize: "13px", color: "#34d399", fontWeight: 700 }}>
              Preferences saved successfully!
            </span>
          )}
        </div>
      </div>

      {/* 3. Milestones & Achievements Badges */}
      {achievements.length > 0 && (
        <div
          style={{
            background: "linear-gradient(135deg, rgba(20, 24, 60, 0.9) 0%, rgba(15, 23, 42, 0.95) 100%)",
            border: "1px solid rgba(139, 92, 246, 0.35)",
            borderRadius: "24px",
            padding: "28px 32px",
            boxShadow: "0 8px 30px rgba(0, 0, 0, 0.35)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
            <div>
              <span style={{ fontSize: "11px", fontWeight: 800, letterSpacing: "0.08em", color: "#38bdf8", textTransform: "uppercase" }}>
                MILESTONES &amp; BADGES
              </span>
              <h3 style={{ fontSize: "20px", fontWeight: 800, margin: "4px 0 0", color: "#ffffff" }}>
                Hall of Achievements
              </h3>
            </div>
            <span
              style={{
                fontSize: "12px",
                fontWeight: 700,
                color: "#c084fc",
                background: "rgba(168, 85, 247, 0.15)",
                border: "1px solid rgba(168, 85, 247, 0.3)",
                padding: "6px 14px",
                borderRadius: "12px",
              }}
            >
              🏆 {achievements.filter((a) => a.unlocked).length} / {achievements.length} Unlocked
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
            {achievements.map((item) => (
              <div
                key={item.id}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "14px",
                  padding: "16px",
                  borderRadius: "16px",
                  background: item.unlocked ? "rgba(139, 92, 246, 0.12)" : "rgba(30, 41, 59, 0.4)",
                  border: item.unlocked ? "1px solid rgba(168, 85, 247, 0.35)" : "1px solid rgba(255, 255, 255, 0.05)",
                  opacity: item.unlocked ? 1 : 0.65,
                }}
              >
                <div
                  style={{
                    fontSize: "24px",
                    width: "44px",
                    height: "44px",
                    borderRadius: "12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: item.unlocked ? "rgba(168, 85, 247, 0.25)" : "rgba(255, 255, 255, 0.05)",
                    flexShrink: 0,
                  }}
                  aria-hidden="true"
                >
                  {item.icon}
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                    <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: item.unlocked ? "#ffffff" : "#94a3b8" }}>
                      {item.title}
                    </h4>
                    <span
                      style={{
                        fontSize: "10px",
                        fontWeight: 700,
                        padding: "2px 6px",
                        borderRadius: "6px",
                        background: item.unlocked ? "rgba(34, 197, 94, 0.2)" : "rgba(100, 116, 139, 0.2)",
                        color: item.unlocked ? "#4ade80" : "#94a3b8",
                      }}
                    >
                      {item.unlocked ? "Unlocked" : "Locked"}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: "12px", color: "#94a3b8", lineHeight: 1.4 }}>
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Session & Account Security Controls */}
      <div
        style={{
          background: "rgba(16, 22, 58, 0.85)",
          border: "1px solid rgba(139, 92, 246, 0.28)",
          borderRadius: "24px",
          padding: "28px 32px",
          boxShadow: "0 8px 30px rgba(0, 0, 0, 0.35)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <h3 style={{ fontSize: "17px", fontWeight: 800, margin: 0, color: "#ffffff" }}>
            Session &amp; Security Controls
          </h3>
          <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#c4b5fd" }}>
            Sign out of your active session on this device.
          </p>
        </div>
        <LogoutButton />
      </div>
    </div>
  );
}
