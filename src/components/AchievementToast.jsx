import React from "react";
import { useGamificationStore } from "../../stores/useGamificationStore";

export default function AchievementToast() {
  const toast = useGamificationStore((s) => s.achievementToast);
  if (!toast) return null;
  return (
    <div className="fixed left-1/2 top-32 z-50 -translate-x-1/2 flex items-center px-6 py-3 rounded-2xl shadow-2xl bg-yellow-200/95 text-yellow-900 font-bold text-lg animate-fade-in-up"
      style={{ boxShadow: "0 8px 30px 0 #ffd60033" }}>
      🏆 Achievement unlocked!
      <span className="ml-2 text-base font-medium text-yellow-800">{toast.description || toast.key}</span>
    </div>
  );
}
