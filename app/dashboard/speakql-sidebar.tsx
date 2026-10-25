"use client";

import Link from "next/link";
import { sound } from "@/src/client/sound/synthesizer";
import { SpeakQLLogo } from "@/src/client/components/whale-mascot";

export type NavTab =
  | "learn"
  | "practice"
  | "conversation"
  | "profile"
  | "leaderboard"
  | "quests"
  | "shop"
  | "achievements";

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  unreviewedMistakesCount: number;
}

export default function SpeakQLSidebar({
  currentTab,
  onSelectTab,
  unreviewedMistakesCount,
}: SidebarProps) {
  // Four clear primary destinations: Learn, Practice, Conversations, Settings
  const primaryTabs = [
    {
      id: "learn" as NavTab,
      label: "Learn",
      icon: "🗺️",
      hint: "Curriculum Map & Depth Progression",
    },
    {
      id: "practice" as NavTab,
      label: "Practice",
      icon: "🎯",
      hint: "Targeted Exercises & Mistake Review",
      badge: unreviewedMistakesCount > 0 ? unreviewedMistakesCount : undefined,
    },
    {
      id: "conversation" as NavTab,
      label: "Conversations",
      icon: "💬",
      hint: "AI Workplace Voice Call Simulator",
    },
    {
      id: "profile" as NavTab,
      label: "Settings",
      icon: "⚙️",
      hint: "Profile, Goals & Language Track",
    },
  ];

  const handleTabClick = (tab: NavTab) => {
    sound.playPop();
    onSelectTab(tab);
  };

  return (
    <aside className="duo-sidebar" aria-label="Main Navigation">
      {/* Brand Wordmark with Purple Whale Mascot */}
      <div className="duo-sidebar-logo">
        <Link href="/" className="duo-brand-link" style={{ textDecoration: "none" }}>
          <SpeakQLLogo size={32} showText={true} />
        </Link>
      </div>

      {/* Primary Navigation Buttons */}
      <nav className="duo-nav-list" role="tablist" aria-label="Main learning navigation">
        {primaryTabs.map((tab) => {
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`tab-${tab.id}`}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`tabpanel-${tab.id}`}
              className={`duo-nav-item ${isActive ? "nav-item-active" : ""}`}
              onClick={() => handleTabClick(tab.id)}
              title={tab.hint}
            >
              <span className="nav-item-icon" aria-hidden="true">
                {tab.icon}
              </span>
              <span className="nav-item-label">{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  className="nav-item-badge"
                  role="status"
                  aria-label={`${tab.badge} unreviewed mistakes`}
                  title={`${tab.badge} mistakes in review queue`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Status */}
      <div className="duo-sidebar-footer">
        <span className="duo-footer-status">● Ocean Depth Active</span>
        <Link
          href="/scale"
          className="duo-footer-link"
          style={{
            display: "block",
            marginTop: "0.5rem",
            fontSize: "0.75rem",
            color: "#38bdf8",
            textDecoration: "none",
            fontWeight: 650,
          }}
        >
          🤝 Scale With Us ↗
        </Link>
      </div>
    </aside>
  );
}

export { SpeakQLSidebar as DuolingoSidebar };
