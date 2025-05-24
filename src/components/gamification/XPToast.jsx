import React from "react";
import { useGamificationStore } from "../../stores/useGamificationStore";

export default function XPToast() {
  const toast = useGamificationStore((s) => s.xpToast);
  if (!toast) return null;
  return (
    <div className="fixed left-1/2 top-8 z-50 -translate-x-1/2 flex items-center px-6 py-3 rounded-2xl shadow-xl bg-yellow-400/95 text-yellow-900 font-bold text-lg animate-fade-in-up"
      style={{ boxShadow: "0 8px 30px 0 #ffd60066" }}>
      +{toast.amount} XP
      {toast.levelUp && (
        <span className="ml-3 text-2xl animate-pop-in">🎉 LEVEL UP!</span>
      )}
      {toast.reason && (
        <span className="ml-2 text-sm font-medium text-yellow-800">{toast.reason}</span>
      )}
    </div>
  );
}
