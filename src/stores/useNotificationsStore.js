import { create } from "zustand";
import { persist } from "zustand/middleware";
import { v4 as uuidv4 } from "uuid";

// Tipi di notifiche supportate
export const NOTIFICATION_TYPES = {
  INFO: "info",
  SUCCESS: "success",
  ERROR: "error",
  WARNING: "warning",
  XP: "xp",
  ACHIEVEMENT: "achievement",
  STREAK: "streak",
};

export const useNotificationsStore = create(
  persist(
    (set, get) => ({
      notifications: [],

      // Aggiunge una nuova notifica
      addNotification: ({ title, message = "", type = NOTIFICATION_TYPES.INFO, duration = 4000, action = null }) => {
        const id = uuidv4();
        const newNotification = {
          id,
          title,
          message,
          type,
          duration,
          isRead: false,
          createdAt: new Date().toISOString(),
          action,
        };

        set((state) => ({
          notifications: [newNotification, ...state.notifications],
        }));
      },

      // Rimuove una notifica
      removeNotification: (id) =>
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        })),
      
      // Segna una notifica come letta
      markAsRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, isRead: true } : n
          ),
        })),

      // Segna tutte le notifiche come lette
      markAllAsRead: () =>
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
        })),

      // Forza la rimozione di tutte le notifiche
      clearAllNotifications: () => set({ notifications: [] }),
    }),
    {
      name: "notifications-storage",
    }
  )
);
