import React from "react";
import { useGamificationStore } from "../../stores/useGamificationStore";

export default function StreakToast() {
  const streakToast = useGamificationStore((s) => s.streakToast);

  if (!streakToast) return null;

  return (
    <div className="fixed z-[120] left-1/2 top-32 -translate-x-1/2 px-6 py-3 bg-orange-500 shadow-lg rounded-2xl flex flex-col items-center animate-bounce-in">
      <span className="font-bold text-lg text-white">🔥 +{streakToast.count} Streak!</span>
      <span className="text-xs text-orange-100">Keep it up!</span>
    </div>
  );
}
