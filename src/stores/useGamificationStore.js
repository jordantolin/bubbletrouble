import { create } from "zustand";
import { persist } from "zustand/middleware";

const LEVELS = [0, 50, 150, 350, 700, 1200, 2000, 3200, 5000];

function getLevel(xp) {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i]) return i;
  }
  return 0;
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export const useGamificationStore = create(
  persist(
    (set, get) => ({
      xp: 0,
      level: 0,
      streak: 0,
      lastActiveDay: null,
      achievements: [],
      xpToast: null,
      streakToast: null,
      achievementToast: null,

      // Add XP and show XP toast (with level up check)
      addXP: (amount, reason = "") => {
        const oldXP = get().xp;
        const newXP = oldXP + amount;
        const prevLevel = get().level;
        const newLevel = getLevel(newXP);
        set({
          xp: newXP,
          level: newLevel,
          xpToast: { amount, reason, levelUp: newLevel > prevLevel }
        });
        // Hide toast after 2s
        setTimeout(() => set({ xpToast: null }), 2000);
      },

      // Check/Update streak
      checkStreak: () => {
        const today = todayISO();
        const last = get().lastActiveDay;
        if (last === today) return;
        if (last && (new Date(today) - new Date(last)) === 86400000) {
          // +1 streak
          set(state => ({
            streak: state.streak + 1,
            lastActiveDay: today,
            streakToast: { count: state.streak + 1 }
          }));
          get().addXP(10, "Daily streak!");
          setTimeout(() => set({ streakToast: null }), 1800);
        } else {
          // reset streak
          set({ streak: 1, lastActiveDay: today, streakToast: { count: 1 } });
          get().addXP(10, "Daily login!");
          setTimeout(() => set({ streakToast: null }), 1800);
        }
      },

      // Add achievement and show toast
      addAchievement: (key, description) => {
        if (!get().achievements.find(a => a.key === key)) {
          set(state => ({
            achievements: [...state.achievements, { key, description }],
            achievementToast: { key, description }
          }));
          setTimeout(() => set({ achievementToast: null }), 2500);
        }
      },

      // Reset all gamification
      resetGamification: () => set({
        xp: 0,
        level: 0,
        streak: 0,
        lastActiveDay: null,
        achievements: [],
        xpToast: null,
        streakToast: null,
        achievementToast: null,
      }),
    }),
    { name: "bt_gamification" }
  )
);
