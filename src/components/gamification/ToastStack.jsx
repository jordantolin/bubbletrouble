import React, { useEffect, useRef, useState } from "react";
import { useGamificationStore } from "../../stores/useGamificationStore";

// Toast TYPE: { type: "xp" | "streak" | "achievement", content: ReactNode, id: string }
function Toast({ toast, onDone, idx }) {
  const [show, setShow] = useState(false);
  const timer = useRef();

  useEffect(() => {
    setShow(true);
    timer.current = setTimeout(() => setShow(false), toast.timeout || 2100);
    return () => clearTimeout(timer.current);
  }, [toast]);

  // Remove from DOM after fade out
  useEffect(() => {
    if (!show) {
      const t = setTimeout(() => onDone(toast.id), 370);
      return () => clearTimeout(t);
    }
  }, [show, toast, onDone]);

  return (
    <div
      onClick={() => setShow(false)}
      className={`
        cursor-pointer select-none
        fixed left-1/2 z-50 -translate-x-1/2
        transition-all duration-350
        ${show
          ? "opacity-100 translate-y-0 scale-100 pointer-events-auto"
          : "opacity-0 -translate-y-5 scale-90 pointer-events-none"
        }
      `}
      style={{
        top: 24 + idx * 72, // stack position!
        minWidth: 210,
        maxWidth: '90vw',
        boxShadow: "0 10px 40px 0 #ffd60055, 0 2px 14px #e1b20033",
        background: "linear-gradient(94deg, #fffbe0 65%, #ffec9e 100%)",
        borderRadius: 22,
        padding: "18px 30px",
        fontWeight: 600,
        fontSize: 17,
        color: "#b78300",
        display: "flex",
        alignItems: "center",
        gap: 11,
        // Glow (PRO)
        filter: "drop-shadow(0 4px 18px #ffd60066)",
        userSelect: "none"
      }}
    >
      {toast.content}
      <span className="ml-4 text-gray-400 text-base font-medium">✕</span>
    </div>
  );
}

export default function ToastStack() {
  // Raccolta TOAST (max 3, con id unico)
  const xpToast = useGamificationStore(s => s.xpToast);
  const streakToast = useGamificationStore(s => s.streakToast);
  const achievementToast = useGamificationStore(s => s.achievementToast);

  // Stack array, mostra solo se attivi
  const toasts = [
    // ...nell'array dei toast, parte xpToast:
xpToast
? {
    type: "xp",
    id: "xp",
    timeout: 2000,
    content: (
      <div className="flex flex-col items-center justify-center w-full">
        <div className="flex items-center gap-2 mb-1">
          <span style={{ fontSize: 20, color: "#FFD600" }} role="img" aria-label="xp">⭐️</span>
          <span style={{ fontWeight: 700, color: "#b78300", fontSize: 18 }}>
            +{xpToast.amount}
          </span>
          <span className="ml-1 text-base font-semibold" style={{ color: "#d6aa1e" }}>
            XP
          </span>
        </div>
        <div className="flex items-center justify-center text-[15px] font-medium text-[#b77d10]">
          {xpToast.reason}
          {xpToast.levelUp && (
            <span className="ml-2 text-lg animate-pop-in" style={{ color: "#E86B00" }}>
              🎉 LEVEL UP!
            </span>
          )}
        </div>
      </div>
    ),
  }
: null,

    streakToast
      ? {
          type: "streak",
          id: "streak",
          timeout: 1700,
          content: (
            <>
              <span style={{ fontSize: 21, color: "#FFD600" }}>🔥</span>
              +1 Streak! <span style={{ color: "#b78300" }}>({streakToast.count} days)</span>
            </>
          ),
        }
      : null,
    achievementToast
      ? {
          type: "achievement",
          id: "achievement",
          timeout: 2700,
          content: (
            <>
              <span style={{ fontSize: 21, color: "#FFD600" }}>🏆</span>
              Achievement unlocked!
              <span className="ml-2 text-base font-medium text-yellow-800">
                {achievementToast.description || achievementToast.key}
              </span>
            </>
          ),
        }
      : null,
  ].filter(Boolean);

  // Gestione chiusura (rimuovi dallo store)
  const removeToast = id => {
    if (id === "xp") useGamificationStore.setState({ xpToast: null });
    if (id === "streak") useGamificationStore.setState({ streakToast: null });
    if (id === "achievement") useGamificationStore.setState({ achievementToast: null });
  };

  // Stack = più toast visibili in verticale!
  return (
    <>
      {toasts.map((t, i) => (
        <Toast toast={t} onDone={removeToast} idx={i} key={t.id} />
      ))}
    </>
  );
}
