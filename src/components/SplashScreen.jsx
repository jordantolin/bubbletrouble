import React, { useEffect } from 'react';
import logo from '/public/logobubbletrouble.png';

const SplashScreen = ({ onFinish }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onFinish();
    }, 2200);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gradient-to-b from-[#FFF9ED] to-[#F3EACB] backdrop-blur-sm transition-all duration-700">
      <img
        src={logo}
        alt="Bubble Trouble Logo"
        className="w-24 h-24 animate-[bounce_1.5s_infinite] drop-shadow-lg"
        style={{ filter: 'drop-shadow(0 4px 4px rgba(255, 217, 10, 0.6))' }}
      />
    </div>
  );
};

export default SplashScreen;
