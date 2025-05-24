import React from "react";
import { useGamificationStore } from "../../stores/useGamificationStore";

export default function StreakToast() {
  const toast = useGamificationStore((s) => s.streakToast);
  if (!toast) return null;
  return (
    <div className="fixed left-1/2 top-20 z-50 -translate-x-1/2 flex items-center px-6 py-3 rounded-2xl shadow-xl bg-yellow-300/95 text-yellow-900 font-semibold text-lg animate-fade-in-up"
      style={{ boxShadow: "0 8px 30px 0 #ffd60044" }}>
      🔥 +1 Streak! <span className="ml-2">({toast.count} days)</span>
    </div>
  );
}
