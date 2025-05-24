import React from "react";
import { useGamificationStore } from "../../stores/useGamificationStore";

export default function XPToast() {
  const xpToast = useGamificationStore((s) => s.xpToast);

  if (!xpToast) return null;

  return (
    <div className="fixed z-[120] left-1/2 top-16 -translate-x-1/2 px-5 py-3 bg-yellow-400 shadow-lg rounded-2xl flex flex-col items-center animate-bounce-in">
      <span className="font-bold text-lg text-yellow-900">+{xpToast.amount} XP</span>
      {xpToast.reason && <span className="text-xs text-yellow-800">{xpToast.reason}</span>}
      {xpToast.levelUp && <span className="mt-1 text-emerald-800 font-bold">Level Up! 🚀</span>}
    </div>
  );
}
