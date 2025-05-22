import React, { useState } from 'react';

const Dropdown = ({ topics, onSelect }) => {
  const [selectedTopic, setSelectedTopic] = useState(topics[0]);

  const handleSelect = (topic) => {
    setSelectedTopic(topic);
    onSelect(topic);
  };

  return (
    <div className="dropdown">
      <select value={selectedTopic} onChange={(e) => handleSelect(e.target.value)}>
        {topics.map((topic) => (
          <option key={topic} value={topic}>{topic}</option>
        ))}
      </select>
    </div>
  );
};

export default Dropdown;