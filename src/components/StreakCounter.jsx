import React from 'react';

function StreakCounter() {
  const streak = 5; // Mock streak value

  return (
    <div className="streak-counter">
      <span>🔥 {streak} Streak!</span>
    </div>
  );
}

export default StreakCounter;