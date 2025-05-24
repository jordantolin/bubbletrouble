import React from "react";
import { useGamificationStore } from "../../stores/useGamificationStore";

const LEVELS = [0, 50, 150, 350, 700, 1200, 2000, 3200, 5000];

function getNextLevelXP(level) {
  return LEVELS[level + 1] || (LEVELS[LEVELS.length - 1] + 1000);
}

export default function XPBar({ className = "" }) {
  const xp = useGamificationStore((s) => s.xp);
  const level = useGamificationStore((s) => s.level);

  const nextXP = getNextLevelXP(level);
  const prevXP = LEVELS[level] || 0;
  const percent = Math.min(100, ((xp - prevXP) / (nextXP - prevXP)) * 100);

  return (
    <div className={`w-full max-w-xs mx-auto flex flex-col items-center my-2 ${className}`}>
      <div className="flex items-center gap-2 mb-1 text-xs font-semibold">
        <span>Lv.{level}</span>
        <span className="ml-auto text-yellow-400">{xp} XP</span>
      </div>
      <div className="w-full h-3 bg-yellow-100 rounded-xl overflow-hidden shadow">
        <div
          className="h-full bg-yellow-400 transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
      <div className="w-full flex justify-between text-[10px] text-yellow-700 mt-1">
        <span>{prevXP} XP</span>
        <span>Next: {nextXP} XP</span>
      </div>
    </div>
  );
}
