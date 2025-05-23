import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Profile from './pages/Profile';

import Header from './components/Header';
import SplashScreen from './components/SplashScreen';
import ThreeDCanvas from './components/ThreeDCanvas';
import UIOverlay from './components/UIOverlay';

const bubblesData = [
  { id: 1, title: 'Filosofia', description: 'Discussioni filosofiche' },
  { id: 2, title: 'Spiritualità', description: 'Argomenti spirituali' },
  { id: 3, title: 'Tecnologia', description: 'Ultime novità tech' },
  { id: 4, title: 'Arte', description: 'Eventi artistici' },
  { id: 5, title: 'Psiche', description: 'Riflessioni sulla mente' },
  { id: 6, title: 'Scienza', description: 'Scoperte scientifiche' },
  { id: 7, title: 'Società', description: 'Discussioni sociali' },
  { id: 8, title: 'Musica', description: 'Novità musicali' },
  { id: 9, title: 'Cinema', description: 'Film e serie' },
  { id: 10, title: 'Miti', description: 'Miti e leggende' },
  { id: 11, title: 'Visioni', description: 'Prospettive e sogni' },
  { id: 12, title: 'Realtà', description: 'Filosofia della realtà' },
  { id: 13, title: 'Amore', description: 'Relazioni e sentimenti' },
  { id: 14, title: 'Tempo', description: 'Concetti di tempo' },
];

// Hook debounce personalizzato
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

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

  // Debounce con delay 1000ms per massima fluidità
  const debouncedSearchText = useDebounce(searchText, 1000);

  const filteredBubbles = bubblesData.filter(bubble =>
    bubble.title.toLowerCase().includes(debouncedSearchText.toLowerCase()) ||
    bubble.description.toLowerCase().includes(debouncedSearchText.toLowerCase())
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
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainApp />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </Router>
  );
}

export default App;
