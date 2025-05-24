import React, { useEffect, useState } from "react";
import { useGamificationStore } from "../../stores/useGamificationStore";

export default function XPToast() {
  const toast = useGamificationStore((s) => s.xpToast);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (toast) {
      setShow(true);
      const hideTimer = setTimeout(() => setShow(false), 1700);
      return () => clearTimeout(hideTimer);
    }
    setShow(false);
  }, [toast]);

  if (!toast && !show) return null;

  return (
    <div
      className={`
        fixed left-1/2 top-7 z-50 -translate-x-1/2
        px-6 py-3 rounded-2xl shadow-xl bg-yellow-400/95 text-yellow-900 font-bold text-lg
        transition-all duration-350
        ${show ? "opacity-100 translate-y-0 scale-100 pointer-events-auto" : "opacity-0 -translate-y-4 scale-95 pointer-events-none"}
      `}
      style={{ boxShadow: "0 8px 30px 0 #ffd60066", minWidth: 160 }}
    >
      +{toast?.amount} XP
      {toast?.levelUp && (
        <span className="ml-3 text-2xl animate-pop-in">🎉 LEVEL UP!</span>
      )}
      {toast?.reason && (
        <span className="ml-2 text-sm font-medium text-yellow-800">{toast.reason}</span>
      )}
    </div>
  );
}
