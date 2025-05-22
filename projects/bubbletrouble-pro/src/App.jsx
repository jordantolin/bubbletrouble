import React from 'react';
import ThreeDWorld from './three/ThreeDWorld';
import XPBar from './components/XPBar';
import Streak from './components/Streak';
import Dropdown from './components/Dropdown';
import Notification from './components/Notification';

const App = () => {
  return (
    <div className="app-container">
      <ThreeDWorld />
      <XPBar />
      <Streak />
      <Dropdown />
      <Notification />
    </div>
  );
};

export default App;