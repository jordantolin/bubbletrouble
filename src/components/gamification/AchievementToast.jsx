import React from "react";
import { X } from "lucide-react";

export default function AchievementToast({ description, onClose }) {
  return (
    <div
      className="
        fixed top-40 left-1/2 z-40 -translate-x-1/2
        bg-gradient-to-br from-yellow-50 to-yellow-100
        border border-yellow-300 shadow-xl
        rounded-2xl px-7 py-3
        flex flex-row items-center gap-3
        animate-pop-in
        min-w-[260px] max-w-[98vw]
        transition-all duration-350
        pointer-events-auto
      "
      style={{
        boxShadow: "0 5px 32px 0 #ffe47a42, 0 1.5px 10px #f5e9b7c9"
      }}
    >
      <div className="flex flex-col gap-0 flex-1">
        <span className="flex items-center text-amber-700 font-bold text-xl">
          <span className="text-2xl mr-1" role="img" aria-label="star">⭐️</span>
          <span>Achievement unlocked!</span>
        </span>
        {description && (
          <span className="text-yellow-700 mt-1 font-medium text-base">{description}</span>
        )}
      </div>
      <button onClick={onClose} className="ml-2 text-yellow-400 hover:text-yellow-600 rounded-full p-1 transition">
        <X size={19} />
      </button>
    </div>
  );
}
