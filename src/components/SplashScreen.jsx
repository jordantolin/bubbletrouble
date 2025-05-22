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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#4A3624] transition-all duration-500">
    <img
      src={logo}
      alt="Bubble Trouble Logo"
      className="w-24 h-24 animate-bounce drop-shadow-md"
    />
  </div>
  
  );
};

export default SplashScreen;
