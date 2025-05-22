import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Header from './components/Header';
import SplashScreen from './components/SplashScreen';
import ThreeDCanvas from './components/ThreeDCanvas';
import UIOverlay from './components/UIOverlay';
import ChatView from './components/ChatView';

function Home() {
  const [showSplash, setShowSplash] = useState(true);
  const [selectedTopic, setSelectedTopic] = useState('Tutti');
  const [xp, setXp] = useState(42);
  const [streak, setStreak] = useState(3);

  const gainXP = (amount = 10) => {
    setXp((prev) => Math.min(prev + amount, 100));
    setStreak((prev) => prev + 1);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#FFF9ED]">
      <Header />
      {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}
      <ThreeDCanvas onBubbleClick={(topic) => {
        window.location.href = `/chat/${encodeURIComponent(topic.title)}`;
      }} />
      <div className="absolute inset-0 z-50 pointer-events-none">
        <UIOverlay
          selectedTopic={selectedTopic}
          onTopicChange={setSelectedTopic}
          xp={xp}
          streak={streak}
          gainXP={() => gainXP(5)}
        />
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/chat/:topic" element={<ChatView />} />
      </Routes>
    </Router>
  );
}

export default App;
