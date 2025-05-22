import React from 'react';

function XPBar() {
  const xp = 50; // Mock XP value
  const level = 2; // Mock level

  return (
    <div className="xp-bar">
      <div className="xp-bar-fill" style={{ width: `${xp}%` }}></div>
      <span>Level {level}</span>
    </div>
  );
}

export default XPBar;