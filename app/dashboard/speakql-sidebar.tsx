"use client";

import Link from "next/link";
import { sound } from "@/src/client/sound/synthesizer";
import { SpeakQLLogo } from "@/src/client/components/whale-mascot";

export type NavTab =
  | "learn"
  | "practice"
  | "conversation"
  | "leaderboard"
  | "quests"
  | "shop"
  | "achievements"
  | "profile";

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
  const tabs = [
    { id: "learn" as NavTab, label: "Learn", icon: "📘", hint: "Your next lesson and learning path" },
    {
      id: "practice" as NavTab,
      label: "Practice",
      icon: "🎯",
      hint: "Exercises and corrections",
      badge: unreviewedMistakesCount > 0 ? unreviewedMistakesCount : undefined,
    },
    { id: "conversation" as NavTab, label: "Conversations", icon: "💬", hint: "Guided speaking practice" },
    { id: "profile" as NavTab, label: "Settings", icon: "⚙", hint: "Account and preferences" },
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

      {/* Navigation Buttons */}
      <nav className="duo-nav-list" role="tablist" aria-label="Main learning navigation">
        {tabs.map((tab) => {
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
            >
              <span className="nav-item-icon" aria-hidden="true">
                {tab.icon}
              </span>
              <span className="nav-item-label">{tab.label}</span>
              {tab.badge !== undefined && (
                <span className="nav-item-badge" role="status" aria-label={`${tab.badge} unreviewed mistakes`} title={`${tab.badge} mistakes in review queue`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Settings / Sound Info */}
      <div className="duo-sidebar-footer">
        <span className="duo-footer-status">Your learning space</span>
        <Link
          href="/scale"
          className="duo-footer-link"
          style={{
            display: "block",
            marginTop: "0.5rem",
            fontSize: "0.75rem",
            color: "#a855f7",
            textDecoration: "none",
            fontWeight: 600,
          }}
        >
          About SpeakQL ↗
        </Link>
      </div>
    </aside>
  );
}

export { SpeakQLSidebar as DuolingoSidebar };
