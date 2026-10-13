"use client";

import { useState } from "react";
import { createLearningGoal } from "./actions";

const INSPIRATION_GOALS = [
  "Lead daily engineering standups in Spanish",
  "Present quarterly product architecture to international partners",
  "Handle spontaneous customer negotiation and feedback in Spanish",
];

export default function OnboardingGoalForm() {
  const [description, setDescription] = useState("");

  return (
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
          value={description}
          onChange={(e) => setDescription(e.target.value)}
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
          {INSPIRATION_GOALS.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => setDescription(example)}
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
  );
}
