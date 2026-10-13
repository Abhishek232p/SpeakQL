"use client";

import { sound } from "@/src/client/sound/synthesizer";

interface ShopViewProps {
  gems: number;
  hearts: number;
  onRefillHearts: () => void;
  onBuyItem: (cost: number, itemName: string) => void;
  onGoToPractice: () => void;
}

export default function ShopView({
  gems,
  hearts,
  onRefillHearts,
  onBuyItem,
  onGoToPractice,
}: ShopViewProps) {
  const handleHeartRefill = () => {
    if (hearts >= 5) return;
    if (gems >= 150) {
      sound.playCorrect();
      onBuyItem(150, "Full Heart Refill");
      onRefillHearts();
    } else {
      sound.playIncorrect();
    }
  };

  const handleBuyStreakFreeze = () => {
    if (gems >= 200) {
      sound.playCorrect();
      onBuyItem(200, "Streak Freeze");
    } else {
      sound.playIncorrect();
    }
  };

  const handleBuyXpBoost = () => {
    if (gems >= 100) {
      sound.playCorrect();
      onBuyItem(100, "Double XP Boost");
    } else {
      sound.playIncorrect();
    }
  };

  return (
    <div className="duo-tab-view" aria-label="Shop Store Tab">
      {/* Header Balance Banner */}
      <div className="duo-shop-balance-card">
        <div className="shop-balance-left">
          <span className="shop-kicker">LINGOTS &amp; GEMS</span>
          <h2>Rewards Vault</h2>
          <p>Earn gems by finishing practice lessons and completing daily quests. Spend gems to refill hearts and protect streaks!</p>
        </div>
        <div className="shop-balance-display">
          <span className="gem-icon-large" aria-hidden="true">💎</span>
          <strong className="gem-amount-large">{gems}</strong>
          <span className="gem-label">Gems Balance</span>
        </div>
      </div>

      {/* Shop Items Grid */}
      <div className="duo-shop-grid">
        {/* Heart Refill */}
        <div className="duo-shop-item-card">
          <div className="shop-item-icon" aria-hidden="true">❤️</div>
          <div className="shop-item-details">
            <h3>Full Hearts Refill</h3>
            <p>Restore your hearts to maximum (5/5) so you can keep practicing lessons without interruptions.</p>
            <span className="shop-current-status">Current hearts: {hearts} / 5</span>
          </div>
          <div className="shop-item-action">
            {hearts >= 5 ? (
              <span className="shop-max-tag">Full Hearts</span>
            ) : (
              <button
                type="button"
                className="duo-shop-buy-btn"
                disabled={gems < 150}
                onClick={handleHeartRefill}
              >
                150 💎 REFILL
              </button>
            )}
            <button
              type="button"
              className="duo-shop-free-btn"
              onClick={onGoToPractice}
            >
              Or Practice for Free ❤️
            </button>
          </div>
        </div>

        {/* Streak Freeze */}
        <div className="duo-shop-item-card">
          <div className="shop-item-icon" aria-hidden="true">🧊</div>
          <div className="shop-item-details">
            <h3>Streak Freeze</h3>
            <p>Streak Freeze protects your practice streak for one full day of inactivity.</p>
            <span className="shop-current-status">Equipped: 1 Active Shield</span>
          </div>
          <div className="shop-item-action">
            <button
              type="button"
              className="duo-shop-buy-btn"
              disabled={gems < 200}
              onClick={handleBuyStreakFreeze}
            >
              200 💎 GET FREEZE
            </button>
          </div>
        </div>

        {/* Double XP Boost */}
        <div className="duo-shop-item-card">
          <div className="shop-item-icon" aria-hidden="true">⚡</div>
          <div className="shop-item-details">
            <h3>Double XP Boost (15 Mins)</h3>
            <p>Earn 2x experience points on all interactive exercises in your next practice session.</p>
          </div>
          <div className="shop-item-action">
            <button
              type="button"
              className="duo-shop-buy-btn"
              disabled={gems < 100}
              onClick={handleBuyXpBoost}
            >
              100 💎 ACTIVATE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
