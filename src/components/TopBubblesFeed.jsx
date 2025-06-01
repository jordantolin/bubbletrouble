import React from "react";

const TopBubblesFeed = ({ bubbles, onSelect }) => {
  const topBubbles = [...bubbles].sort((a, b) => b.reflections - a.reflections).slice(0, 5);

  return (
    <div
      className="fixed left-2 top-[90px] z-30 w-[260px] max-w-[90vw] p-4 rounded-2xl shadow-xl bg-[#FFFBEA] border border-yellow-200"
      style={{
        backdropFilter: "blur(2px)",
        boxShadow: "0 3px 18px 0 #ffeac377",
        fontFamily: "inherit"
      }}
    >
      <h3 className="font-bold text-yellow-700 mb-2 text-lg flex items-center gap-2">
        <span role="img" aria-label="star">⭐️</span> Top Bubbles
      </h3>
      <ul>
        {topBubbles.map((bubble, idx) => (
          <li
            key={bubble.id}
            className="flex items-center gap-2 p-2 rounded-xl cursor-pointer hover:bg-yellow-100 transition"
            onClick={() => onSelect(bubble)}
            style={{
              fontWeight: 600,
              fontSize: 16,
              color: "#BC9400",
              marginBottom: 2,
              borderLeft: idx === 0 ? "4px solid #FFD600" : "none"
            }}
          >
            <span className="truncate">{bubble.name || bubble.title || "[NO NAME]"}</span>
            <span className="ml-auto text-yellow-900 bg-yellow-200 px-2 py-1 rounded text-xs">{bubble.reflections} ✨</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TopBubblesFeed;
