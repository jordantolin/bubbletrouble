import React from 'react';

const TopicMenu = () => {
  return (
    <div className="topic-menu">
      <select className="topic-dropdown">
        <option value="all">All Topics</option>
        <option value="technology">Technology</option>
        <option value="science">Science</option>
        <option value="art">Art</option>
      </select>
    </div>
  );
};

export default TopicMenu;