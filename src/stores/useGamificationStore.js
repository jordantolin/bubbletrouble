// src/stores/useGamificationStore.js
import { create } from "zustand";
import { persist } from "zustand/middleware";

const LEVELS = [0, 50, 150, 350, 700, 1200, 2000, 3200, 5000];

function getLevel(xp) {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i]) return i;
  }
  return 0;
}
function nextLevelXP(lvl) {
  return LEVELS[lvl + 1] ?? LEVELS[LEVELS.length - 1];
}
function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
function generateId() {
  return Math.random().toString(36).slice(2) + Date.now();
}

// PATCH: Commento import useNotificationsStore fino a implementazione
// import { useNotificationsStore } from "../stores/useNotificationsStore";
// import { NOTIFICATION_TYPES } from '../constants/notificationTypes';

export const useGamificationStore = create(
  persist(
    (set, get) => ({
      xp: 0,
      level: 0,
      streak: 0,
      lastActiveDay: null,
      achievements: [],
      toasts: [],
      totalReflectsGiven: 0,
      totalMessagesSent: 0,
      firstLogin: null,

      checkStreak: () => {
        console.log("checkStreak() non ancora implementato");
      },

      addXP: (amount, reason = "") => {
        const oldXP = get().xp;
        const newXP = oldXP + amount;
        const oldLevel = getLevel(oldXP);
        const newLevel = getLevel(newXP);
        set({ xp: newXP, level: newLevel });

        if (!get().firstLogin) set({ firstLogin: todayISO() });

        // Gamification toast (interno)
        get().addToast({
          id: generateId(),
          type: "xp",
          amount,
          levelUp: newLevel > oldLevel,
          level: newLevel,
          reason,
        });

        // PATCH: Commento notifica globale fino a implementazione store
        // useNotificationsStore.getState().pushNotification({
        //   type: NOTIFICATION_TYPES.XP,
        //   title: "+ " + amount + " XP!",
        //   message: reason ? reason : `Hai guadagnato ${amount} XP.`,
        //   duration: 4000,
        //   meta: { level: newLevel },
        // });

        // Example: unlock "Level 2" achievement
        if (oldLevel < 2 && newLevel >= 2) {
          get().unlockAchievement({
            key: "level2",
            description: "Hai raggiunto il livello 2!",
            unlockedAt: todayISO()
          });
        }
      },

      incrementReflects: () => {
        set((state) => ({ totalReflectsGiven: state.totalReflectsGiven + 1 }));
        // Unlock "First Reflect" achievement
        if (get().totalReflectsGiven === 0) {
          get().unlockAchievement({
            key: "first_reflect",
            description: "Hai dato il tuo primo reflect! ✨",
            unlockedAt: todayISO()
          });
        }
      },

      incrementMessages: () => {
        set((state) => ({ totalMessagesSent: state.totalMessagesSent + 1 }));
        // Unlock "First Chat" achievement
        if (get().totalMessagesSent === 0) {
          get().unlockAchievement({
            key: "first_chat",
            description: "Hai scritto il tuo primo messaggio!",
            unlockedAt: todayISO()
          });
        }
      },

      addStreak: () => {
        const oldStreak = get().streak;
        const newStreak = oldStreak + 1;
        set({ streak: newStreak, lastActiveDay: todayISO() });

        // Gamification toast (interno)
        get().addToast({
          id: generateId(),
          type: "streak",
          streak: newStreak,
        });

        // Unlock "Streak 3 giorni"
        if (oldStreak < 2 && newStreak >= 3) {
          get().unlockAchievement({
            key: "streak3",
            description: "3 giorni consecutivi di attività! 🔥",
            unlockedAt: todayISO()
          });
        }
      },

      unlockAchievement: (achievement) => {
        const exists = get().achievements.find(a => a.key === achievement.key);
        if (!exists) {
          set((state) => ({
            achievements: [...state.achievements, achievement]
          }));
          get().addToast({
            id: generateId(),
            type: "achievement",
            achievement,
          });

          // PATCH: Commento notifica globale fino a implementazione store
          // useNotificationsStore.getState().pushNotification({
          //   type: NOTIFICATION_TYPES.ACHIEVEMENT,
          //   title: "🏆 Achievement sbloccato!",
          //   message: achievement.description,
          //   duration: 4000,
          //   meta: { key: achievement.key }
          // });
        }
      },

      addToast: (toast) =>
        set((state) => ({
          toasts: [...state.toasts, toast]
        })),

      removeToast: (id) =>
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id)
        }))
    }),
    { name: "gamification" }
  )
);
