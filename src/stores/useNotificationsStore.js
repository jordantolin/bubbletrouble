import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";

// Tipi di notifiche supportate
export const NOTIFICATION_TYPES = {
  INFO: "info",
  SUCCESS: "success",
  ERROR: "error",
  WARNING: "warning",
  XP: "xp",
  ACHIEVEMENT: "achievement",
};

export const useNotificationsStore = create((set, get) => ({
  notifications: [],

  // Aggiunge una nuova notifica (max 3 visibili)
  showToast: ({ title, message = "", type = NOTIFICATION_TYPES.INFO, duration = 4000 }) => {
    const id = uuidv4();
    const newNotification = {
      id,
      title,
      message,
      type,
      duration,
    };

    const current = get().notifications;
    const updated = [...current, newNotification].slice(-3); // max 3
    set({ notifications: updated });

    // Auto-clear dopo duration
    setTimeout(() => {
      get().clearToast(id);
    }, duration);
  },

  // Rimuove una notifica
  clearToast: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),

  // Forza la rimozione di tutte le notifiche
  clearAll: () => set({ notifications: [] }),
}));
