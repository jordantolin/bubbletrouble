import React from "react";
import { X } from "lucide-react";

export default function StreakToast({ count, onClose }) {
  return (
    <div
      className="
        fixed top-24 left-1/2 z-40 -translate-x-1/2
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
        <span className="flex items-center text-orange-600 font-bold text-xl">
          <span className="text-2xl mr-1" role="img" aria-label="fire">🔥</span>
          <span className="">+1 Streak!</span>
          <span className="ml-3 text-base font-normal text-amber-700">
            ({count} {count === 1 ? "day" : "days"})
          </span>
        </span>
        <span className="text-yellow-700 mt-1 font-medium text-base">Daily access</span>
      </div>
      <button onClick={onClose} className="ml-2 text-yellow-400 hover:text-yellow-600 rounded-full p-1 transition">
        <X size={19} />
      </button>
    </div>
  );
}
