import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Profile from './pages/Profile';
import Header from './components/Header';
import XPToast from "./components/gamification/XPToast";
import StreakToast from "./components/gamification/StreakToast";
import AchievementToast from "./components/gamification/AchievementToast";
import { useGamificationStore } from "./stores/useGamificationStore";
import SplashScreen from './components/SplashScreen';
import ThreeDCanvas from './components/ThreeDCanvas';
import UIOverlay from './components/UIOverlay';
import ChatView from './components/ChatView'; // importa ChatView

const bubblesData = [
  { id: 1, title: 'Filosofia', description: 'Discussioni filosofiche', reflections: 45, userCount: 23 },
  { id: 2, title: 'Spiritualità', description: 'Argomenti spirituali', reflections: 75, userCount: 17 },
  { id: 3, title: 'Tecnologia', description: 'Ultime novità tech', reflections: 15, userCount: 29 },
  { id: 4, title: 'Arte', description: 'Eventi artistici', reflections: 60, userCount: 5 },
  { id: 5, title: 'Psiche', description: 'Riflessioni sulla mente', reflections: 25, userCount: 11 },
  { id: 6, title: 'Scienza', description: 'Scoperte scientifiche', reflections: 32, userCount: 20 },
  { id: 7, title: 'Società', description: 'Discussioni sociali', reflections: 10, userCount: 8 },
  { id: 8, title: 'Musica', description: 'Novità musicali', reflections: 18, userCount: 4 },
  { id: 9, title: 'Cinema', description: 'Film e serie', reflections: 55, userCount: 14 },
  { id: 10, title: 'Miti', description: 'Miti e leggende', reflections: 23, userCount: 9 },
  { id: 11, title: 'Visioni', description: 'Prospettive e sogni', reflections: 40, userCount: 19 },
  { id: 12, title: 'Realtà', description: 'Filosofia della realtà', reflections: 12, userCount: 6 },
  { id: 13, title: 'Amore', description: 'Relazioni e sentimenti', reflections: 35, userCount: 21 },
  { id: 14, title: 'Tempo', description: 'Concetti di tempo', reflections: 5, userCount: 3 },
];

function MainApp() {
  const [showSplash, setShowSplash] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('Tutti');
  const [xp, setXp] = useState(42);
  const [streak, setStreak] = useState(3);

  const gainXP = (amount = 10) => {
    setXp((prev) => Math.min(prev + amount, 100));
    setStreak((prev) => prev + 1);
  };

  const filteredBubbles = bubblesData.filter(bubble =>
    bubble.title.toLowerCase().includes(searchText.toLowerCase()) ||
    bubble.description.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#FFF9ED]">
      {!showSplash && (
        <Header
          searchText={searchText}
          onSearchChange={setSearchText}
        />
      )}

      {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}

      <ThreeDCanvas
        bubbles={filteredBubbles}
        onBubbleClick={(topic) => {
          window.location.href = `/chat/${encodeURIComponent(topic.title)}`;
        }}
      />

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
  const { xpToast, streakToast, achievementToast, set } = useGamificationStore();

  return (
    <Router>
      {/* Notifiche toast, sempre visibili */}
      {xpToast && (
        <XPToast
          amount={xpToast.amount}
          reason={xpToast.reason}
          levelUp={xpToast.levelUp}
          onClose={() => set({ xpToast: null })}
        />
      )}
      {streakToast && (
        <StreakToast
          count={streakToast.count}
          onClose={() => set({ streakToast: null })}
        />
      )}
      {achievementToast && (
        <AchievementToast
          description={achievementToast.description}
          onClose={() => set({ achievementToast: null })}
        />
      )}

      <Routes>
        <Route path="/" element={<MainApp />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/chat/:topic" element={<ChatView />} />
      </Routes>
    </Router>
  );
}

export default App;
