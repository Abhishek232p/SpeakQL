import React from "react";

export type WhaleMood = "swimming" | "happy" | "coach" | "celebrating" | "thinking";

export interface WhaleMascotProps {
  mood?: WhaleMood;
  size?: number | string;
  className?: string;
  style?: React.CSSProperties;
  animated?: boolean;
}

export function WhaleMascot({
  mood = "swimming",
  size = 64,
  className = "",
  style,
  animated = true,
}: WhaleMascotProps) {
  const isHappy = mood === "happy" || mood === "celebrating";
  const isCoach = mood === "coach";
  const isCelebrating = mood === "celebrating";

  return (
    <div
      className={`speakql-whale-container ${animated ? "whale-float" : ""} ${className}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: typeof size === "number" ? `${size}px` : size,
        height: typeof size === "number" ? `${size}px` : size,
        ...style,
      }}
      aria-label="SpeakQL Purple Whale Mascot"
      role="img"
    >
      <svg
        viewBox="0 0 120 120"
        width="100%"
        height="100%"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ overflow: "visible" }}
      >
        <defs>
          {/* Main body royal purple to vibrant magenta gradient */}
          <linearGradient id="whaleBodyGrad" x1="15" y1="20" x2="105" y2="100" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="50%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#d946ef" />
          </linearGradient>

          {/* Bioluminescent belly gradient */}
          <linearGradient id="whaleBellyGrad" x1="30" y1="60" x2="80" y2="90" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="70%" stopColor="#f3e8ff" />
            <stop offset="100%" stopColor="#e9d5ff" />
          </linearGradient>

          {/* Water fountain cyan glow */}
          <linearGradient id="whaleWaterGrad" x1="45" y1="10" x2="65" y2="35" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="50%" stopColor="#818cf8" />
            <stop offset="100%" stopColor="#c084fc" />
          </linearGradient>

          {/* Glow filter */}
          <filter id="whaleGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* 1. Water Spout Fountain with Glowing Droplets & Stars */}
        <g className="whale-spout" filter="url(#whaleGlow)">
          <path
            d="M 52 35 C 50 20, 38 12, 34 16 C 30 20, 44 26, 48 36"
            fill="url(#whaleWaterGrad)"
            opacity="0.85"
          />
          <path
            d="M 56 34 C 58 16, 68 8, 74 12 C 78 16, 66 24, 60 35"
            fill="url(#whaleWaterGrad)"
            opacity="0.85"
          />
          <path
            d="M 54 34 C 54 18, 52 8, 54 6 C 56 8, 56 18, 55 34"
            fill="#38bdf8"
            opacity="0.9"
          />
          {/* Glowing water droplets / stars */}
          <circle cx="34" cy="14" r="3" fill="#38bdf8" />
          <circle cx="74" cy="10" r="3.5" fill="#67e8f9" />
          <circle cx="54" cy="4" r="2.5" fill="#f472b6" />
          <circle cx="44" cy="18" r="2" fill="#c084fc" />
          <circle cx="64" cy="16" r="2" fill="#38bdf8" />
        </g>

        {/* 2. Tail Flukes */}
        <g className="whale-tail">
          <path
            d="M 94 66 C 104 56, 114 52, 118 56 C 117 64, 108 68, 100 70 C 108 73, 116 78, 116 86 C 112 88, 102 82, 94 72 Z"
            fill="url(#whaleBodyGrad)"
          />
        </g>

        {/* 3. Main Whale Body */}
        <path
          d="M 22 68 C 16 52, 30 36, 52 36 C 80 36, 96 52, 98 70 C 99 82, 86 92, 60 92 C 34 92, 24 82, 22 68 Z"
          fill="url(#whaleBodyGrad)"
        />

        {/* 4. Bioluminescent Soft Lavender Underbelly with Subtle Grooves */}
        <path
          d="M 24 70 C 26 80, 36 90, 60 90 C 78 90, 88 84, 94 74 C 84 80, 68 83, 50 83 C 34 83, 26 77, 24 70 Z"
          fill="url(#whaleBellyGrad)"
        />
        {/* Subtle belly accordion texture lines */}
        <path d="M 38 80 C 44 84, 52 85, 62 85" stroke="#c084fc" strokeWidth="1" strokeLinecap="round" opacity="0.4" />
        <path d="M 42 85 C 48 88, 54 88, 62 88" stroke="#c084fc" strokeWidth="1" strokeLinecap="round" opacity="0.4" />

        {/* 5. Side Flipper */}
        <path
          d="M 44 68 C 42 76, 48 86, 58 84 C 64 83, 62 76, 54 72 C 48 70, 46 68, 44 68 Z"
          fill="#9333ea"
        />

        {/* 6. Friendly Facial Features */}
        {/* Cheerful rosy cheek blush */}
        <ellipse cx="28" cy="62" rx="4.5" ry="3.5" fill="#f472b6" opacity="0.65" />

        {/* Eyes: Expressive & Friendly */}
        {isHappy ? (
          /* Joyful closed eyes (^ ^) */
          <path
            d="M 32 54 C 34 50, 40 50, 42 54"
            stroke="#1e1b4b"
            strokeWidth="3"
            strokeLinecap="round"
          />
        ) : (
          /* Open sparkling curious eye */
          <g>
            <ellipse cx="37" cy="52" rx="4.5" ry="5.5" fill="#1e1b4b" />
            {/* Catchlight glints */}
            <circle cx="35.5" cy="50" r="2" fill="#ffffff" />
            <circle cx="39" cy="54" r="1" fill="#ffffff" />
          </g>
        )}

        {/* Sweet Gentle Smile */}
        <path
          d="M 24 61 C 27 65, 33 65, 36 61"
          stroke="#1e1b4b"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        {/* 7. Accessories / Badges depending on mood */}
        {isCoach && (
          /* Coach / Mentor Golden Star Pin */
          <g transform="translate(68, 44)">
            <circle cx="0" cy="0" r="7" fill="#fbbf24" stroke="#d97706" strokeWidth="1.5" />
            <path
              d="M 0 -4 L 1.2 -1.2 L 4 -1 L 2 1 L 2.5 4 L 0 2.5 L -2.5 4 L -2 1 L -4 -1 L -1.2 -1.2 Z"
              fill="#ffffff"
            />
          </g>
        )}

        {isCelebrating && (
          /* Celebratory Crown */
          <g transform="translate(48, 26)">
            <path
              d="M -9 6 L -6 -3 L -1 2 L 4 -4 L 9 2 L 14 -3 L 17 6 Z"
              fill="#fbbf24"
              stroke="#d97706"
              strokeWidth="1.2"
            />
            <circle cx="-6" cy="-3" r="1.5" fill="#ef4444" />
            <circle cx="4" cy="-4" r="1.5" fill="#3b82f6" />
            <circle cx="14" cy="-3" r="1.5" fill="#10b981" />
          </g>
        )}
      </svg>
    </div>
  );
}

export function SpeakQLLogo({ size = 36, showText = true }: { size?: number; showText?: boolean }) {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: "0.6rem" }}>
      <WhaleMascot size={size} animated={false} />
      {showText && (
        <span
          style={{
            fontFamily: "var(--font-heading, inherit)",
            fontWeight: 800,
            fontSize: "1.35rem",
            letterSpacing: "-0.03em",
            color: "#ffffff",
            display: "inline-flex",
            alignItems: "center",
          }}
        >
          Speak<span style={{ color: "#c084fc", textShadow: "0 0 12px rgba(192, 132, 252, 0.6)" }}>QL</span>
        </span>
      )}
    </div>
  );
}

export default WhaleMascot;
