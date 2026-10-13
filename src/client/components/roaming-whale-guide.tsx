"use client";

import React, { useState, useCallback, useId } from "react";
import { WhaleMascot, type WhaleMood } from "./whale-mascot";
import { sound } from "@/src/client/sound/synthesizer";

export type WhaleContextEvent =
  | "welcome"
  | "goal_selected"
  | "practice_started"
  | "stuck_hint"
  | "mistake_support"
  | "task_completed"
  | "return_visit";

export interface RoamingWhaleGuideProps {
  currentTab?: string;
  activeGoal?: string;
  eventTrigger?: WhaleContextEvent;
  onDismissMessage?: () => void;
  className?: string;
}

interface MessageConfig {
  mood: WhaleMood;
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function RoamingWhaleGuide({
  currentTab = "learn",
  activeGoal,
  eventTrigger = "welcome",
  onDismissMessage,
  className = "",
}: RoamingWhaleGuideProps) {
  const [isMinimized, setIsMinimized] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("speakql_whale_minimized") === "true";
    }
    return false;
  });

  const [isMuted, setIsMuted] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("speakql_whale_muted") === "true";
    }
    return false;
  });

  const [dismissedEvent, setDismissedEvent] = useState<string | null>(null);
  const [manualEventOverride, setManualEventOverride] = useState<WhaleContextEvent | null>(null);
  const [hintIndex, setHintIndex] = useState<number>(0);
  const tooltipId = useId();

  const currentEvent: WhaleContextEvent = manualEventOverride ?? eventTrigger;
  const isDismissed = dismissedEvent === currentEvent;

  // Contextual messages tailored to human communication goals
  const getMessageForContext = useCallback((): MessageConfig => {
    switch (currentEvent) {
      case "welcome":
        return {
          mood: "happy",
          title: "Welcome to SpeakQL 🐋",
          body: activeGoal
            ? `Ready to practice: "${activeGoal}"? Take it one natural conversation at a time.`
            : "What real-world communication challenge would you love to master today?",
        };

      case "goal_selected":
        return {
          mood: "coach",
          title: "Meaningful Practice Ahead",
          body: "Great focus! We'll practice realistic situations you'll actually encounter—no artificial drills.",
        };

      case "practice_started":
        return {
          mood: "thinking",
          title: "Express Yourself Freely",
          body: "Choose how you express your thought: Type, draw on the digital whiteboard, or speak aloud.",
        };

      case "stuck_hint": {
        const hints = [
          "For engineering standups: Cover completed work, today's focus, and blockers clearly.",
          "Keep your opening direct: 'Ayer terminé...', 'Hoy me enfoco en...', 'Tengo un bloqueo con...'",
          "If blocked, clearly state who or what credential is needed so colleagues can immediately assist.",
        ];
        return {
          mood: "coach",
          title: "Thoughtful Suggestion",
          body: hints[hintIndex % hints.length],
          actionLabel: "Next hint 💡",
          onAction: () => setHintIndex((prev) => prev + 1),
        };
      }

      case "mistake_support":
        return {
          mood: "coach",
          title: "Mistakes are Evidence of Growth",
          body: "Your intended meaning was clear. Notice the verb tense refinement and give it another try!",
        };

      case "task_completed":
        return {
          mood: "celebrating",
          title: "Demonstrated Improvement!",
          body: "Superb execution. Your latest response articulated the technical dependency with clarity.",
        };

      case "return_visit":
        return {
          mood: "swimming",
          title: "Welcome Back",
          body: "Ready to pick up where we left off? No streak pressure—just real communicative competence.",
        };

      default:
        return {
          mood: "swimming",
          title: "SpeakQL Guide",
          body: "Click anytime for tips on navigating professional workplace conversations.",
        };
    }
  }, [currentEvent, activeGoal, hintIndex]);

  const message = getMessageForContext();

  const toggleMinimize = () => {
    sound.playPop();
    setIsMinimized((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        localStorage.setItem("speakql_whale_minimized", String(next));
      }
      return next;
    });
  };

  const toggleMute = () => {
    sound.playPop();
    setIsMuted((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        localStorage.setItem("speakql_whale_muted", String(next));
      }
      return next;
    });
  };

  const handleDismiss = () => {
    sound.playPop();
    setDismissedEvent(currentEvent);
    onDismissMessage?.();
  };

  const requestHint = () => {
    sound.playPop();
    setManualEventOverride("stuck_hint");
    setDismissedEvent(null);
    setIsMinimized(false);
  };

  // If muted completely, render a tiny subtle reactivation trigger
  if (isMuted) {
    return (
      <div
        className={`speakql-whale-docked ${className}`}
        style={{
          position: "fixed",
          bottom: "1rem",
          right: "1rem",
          zIndex: 990,
        }}
      >
        <button
          type="button"
          onClick={toggleMute}
          title="Unmute SpeakQL Companion Whale"
          aria-label="Unmute Companion Whale"
          style={{
            background: "rgba(30, 41, 59, 0.8)",
            border: "1px solid rgba(168, 85, 247, 0.4)",
            borderRadius: "9999px",
            padding: "0.4rem 0.75rem",
            color: "#c084fc",
            fontSize: "0.8rem",
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
            cursor: "pointer",
            backdropFilter: "blur(8px)",
          }}
        >
          <span>🐋</span>
          <span>Companion Muted (Click to Restore)</span>
        </button>
      </div>
    );
  }

  return (
    <aside
      className={`speakql-roaming-whale-guide ${className}`}
      aria-label="SpeakQL Companion Guide"
      style={{
        position: "fixed",
        bottom: "1.5rem",
        right: "1.5rem",
        zIndex: 990,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        maxWidth: "360px",
        pointerEvents: "none", // child elements re-enable pointer-events
      }}
    >
      {/* Speech Bubble Card (when not minimized and not dismissed) */}
      {!isMinimized && !isDismissed && (
        <div
          id={tooltipId}
          role="region"
          aria-label="Companion Message"
          style={{
            pointerEvents: "auto",
            background: "linear-gradient(135deg, rgba(30, 27, 75, 0.95), rgba(15, 23, 42, 0.95))",
            border: "1.5px solid rgba(168, 85, 247, 0.4)",
            boxShadow: "0 12px 32px -4px rgba(0, 0, 0, 0.5), 0 0 16px rgba(168, 85, 247, 0.2)",
            borderRadius: "1.25rem",
            padding: "1rem 1.15rem",
            marginBottom: "0.75rem",
            backdropFilter: "blur(12px)",
            color: "#f8fafc",
            width: "100%",
            boxSizing: "border-box",
            animation: "fadeInUp 0.25s ease-out",
          }}
        >
          {/* Header & Controls */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "0.5rem",
              borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
              paddingBottom: "0.4rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <span style={{ fontSize: "1rem" }}>✨</span>
              <h4
                style={{
                  margin: 0,
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  color: "#e2e8f0",
                  letterSpacing: "0.02em",
                }}
              >
                {message.title}
              </h4>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
              <button
                type="button"
                onClick={toggleMinimize}
                title="Minimize Guide"
                aria-label="Minimize Companion"
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#94a3b8",
                  cursor: "pointer",
                  fontSize: "0.9rem",
                  padding: "0.2rem 0.35rem",
                  borderRadius: "0.25rem",
                }}
              >
                —
              </button>
              <button
                type="button"
                onClick={handleDismiss}
                title="Dismiss message"
                aria-label="Dismiss message"
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#94a3b8",
                  cursor: "pointer",
                  fontSize: "1rem",
                  lineHeight: 1,
                  padding: "0.2rem 0.35rem",
                  borderRadius: "0.25rem",
                }}
              >
                ✕
              </button>
            </div>
          </div>

          {/* Body Content */}
          <p
            style={{
              margin: 0,
              fontSize: "0.85rem",
              lineHeight: 1.5,
              color: "#cbd5e1",
            }}
          >
            {message.body}
          </p>

          {/* Optional Action Button */}
          {message.actionLabel && message.onAction && (
            <div style={{ marginTop: "0.6rem" }}>
              <button
                type="button"
                onClick={message.onAction}
                style={{
                  background: "rgba(168, 85, 247, 0.25)",
                  border: "1px solid rgba(168, 85, 247, 0.5)",
                  color: "#f3e8ff",
                  borderRadius: "0.5rem",
                  padding: "0.3rem 0.65rem",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {message.actionLabel}
              </button>
            </div>
          )}

          {/* Bottom Micro Controls */}
          <div
            style={{
              marginTop: "0.6rem",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: "0.7rem",
              color: "#64748b",
            }}
          >
            <button
              type="button"
              onClick={requestHint}
              style={{
                background: "transparent",
                border: "none",
                color: "#38bdf8",
                cursor: "pointer",
                padding: 0,
                fontSize: "0.7rem",
                textDecoration: "underline",
              }}
            >
              💡 Need a hint?
            </button>
            <button
              type="button"
              onClick={toggleMute}
              style={{
                background: "transparent",
                border: "none",
                color: "#64748b",
                cursor: "pointer",
                padding: 0,
                fontSize: "0.7rem",
              }}
            >
              Mute companion
            </button>
          </div>
        </div>
      )}

      {/* Floating Whale Avatar / Anchor */}
      <div
        style={{
          pointerEvents: "auto",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
        }}
      >
        <button
          type="button"
          onClick={() => {
            if (isMinimized || isDismissed) {
              sound.playPop();
              setIsMinimized(false);
              setDismissedEvent(null);
            } else {
              requestHint();
            }
          }}
          aria-expanded={!isMinimized && !isDismissed}
          aria-describedby={!isMinimized && !isDismissed ? tooltipId : undefined}
          title={isMinimized || isDismissed ? `Expand Companion Guide (${currentTab})` : "Click for a communication hint"}
          style={{
            background: "linear-gradient(135deg, rgba(139, 92, 246, 0.25), rgba(217, 70, 239, 0.25))",
            border: "2px solid rgba(168, 85, 247, 0.5)",
            boxShadow: "0 8px 24px rgba(168, 85, 247, 0.35)",
            borderRadius: "9999px",
            padding: "0.35rem",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease",
            backdropFilter: "blur(8px)",
          }}
        >
          <WhaleMascot mood={message.mood} size={48} animated={true} />
        </button>
      </div>
    </aside>
  );
}
