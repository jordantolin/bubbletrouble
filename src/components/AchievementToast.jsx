import React from "react";
import { useGamificationStore } from "../../stores/useGamificationStore";

export default function AchievementToast() {
  const achievementToast = useGamificationStore((s) => s.achievementToast);

  if (!achievementToast) return null;

  return (
    <div className="fixed z-[120] left-1/2 top-48 -translate-x-1/2 px-7 py-3 bg-amber-300 shadow-lg rounded-2xl flex flex-col items-center animate-bounce-in">
      <span className="font-bold text-md text-amber-900">🏆 Achievement Unlocked!</span>
      <span className="text-xs text-amber-800">{achievementToast.description}</span>
    </div>
  );
}
