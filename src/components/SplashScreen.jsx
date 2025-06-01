// SplashScreen.jsx
import React, { useEffect, useState } from 'react';
import logo from '../assets/logobubbletrouble.png';
import { motion } from 'framer-motion';

const SplashScreen = ({ onFinish }) => {
  const [alreadyShown, setAlreadyShown] = useState(false);

  useEffect(() => {
    const hasShown = localStorage.getItem('bt_splash_shown');
    if (hasShown) {
      setAlreadyShown(true);
      onFinish(); // salta subito
      return;
    }

    const timer = setTimeout(() => {
      localStorage.setItem('bt_splash_shown', '1');
      onFinish();
    }, 1200); // accorcia a 1.2s se vuoi

    return () => clearTimeout(timer);
  }, [onFinish]);

  if (alreadyShown) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gradient-to-b from-[#FFF9ED] to-[#F3EACB] backdrop-blur-sm transition-all duration-700">
      <motion.img
        src={logo}
        alt="Bubble Trouble Logo"
        className="w-24 h-24 animate-[bounce_1.5s_infinite] drop-shadow-lg"
        style={{ filter: 'drop-shadow(0 4px 4px rgba(255, 217, 10, 0.6))' }}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.3 }}
      />
    </div>
  );
};

export default SplashScreen;
