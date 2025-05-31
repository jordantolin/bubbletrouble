import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useAchievementToastStore } from "../../stores/useAchievementToastStore";

export default function AchievementToast() {
  const { toast, clearToast } = useAchievementToastStore();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (toast) {
      setVisible(true);
      const timeout = setTimeout(() => {
        setVisible(false);
        clearToast();
      }, 4000);
      return () => clearTimeout(timeout);
    }
  }, [toast, clearToast]);

  if (!toast || !visible) return null;

  const handleSwipe = (e) => {
    if (e.type === 'touchend' || e.type === 'mouseup') {
      setVisible(false);
      clearToast();
    }
  };

  return (
    <div
      className="
        fixed top-1/2 left-1/2 z-[9999] transform -translate-x-1/2 -translate-y-1/2
        bg-gradient-to-br from-yellow-50 to-yellow-100
        border border-yellow-300 shadow-xl
        rounded-2xl px-7 py-3
        flex flex-row items-center gap-3
        animate-pop-in
        min-w-[260px] max-w-[90vw]
        transition-all duration-350
        pointer-events-auto
        scale-100
        hover:scale-105
        sm:min-w-[320px] sm:max-w-[80vw]
      "
      style={{
        boxShadow: "0 5px 32px 0 #ffe47a42, 0 1.5px 10px #f5e9b7c9",
        animation: "fadeInUp 0.5s ease-out"
      }}
      onTouchEnd={handleSwipe}
      onMouseUp={handleSwipe}
    >
      <div className="flex flex-col gap-0 flex-1 text-center">
        <span className="flex items-center justify-center text-amber-700 font-bold text-xl">
          <span className="text-2xl mr-1" role="img" aria-label="star">⭐️</span>
          <span>Achievement unlocked!</span>
        </span>
        <span className="text-yellow-700 mt-1 font-medium text-base">{toast}</span>
      </div>
      <button onTouchStart={() => setVisible(false)} className="ml-2 text-yellow-400 hover:text-yellow-600 rounded-full p-1 transition min-h-[48px] min-w-[48px]">
        <X size={19} />
      </button>
    </div>
  );
}
