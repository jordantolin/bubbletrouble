import React from 'react';
import BubbleWorld from '../threejs/BubbleWorld';
import TopicMenu from './TopicMenu';
import XPBar from './XPBar';
import StreakCounter from './StreakCounter';

const App = () => {
  return (
    <div className="app-container">
      <XPBar />
      <StreakCounter />
      <TopicMenu />
      <BubbleWorld />
    </div>
  );
};

export default App;