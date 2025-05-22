import React from 'react';

const topics = ['Tutti', 'Filosofia', 'Spiritualità', 'Tecnologia', 'Arte', 'Psiche'];

const TopicDropdown = ({ selectedTopic, onChange }) => {
  return (
    <div>
      <label className="block mb-1 text-sm font-bold">Topic:</label>
      <select
        className="bg-black text-white border border-white p-2 rounded"
        value={selectedTopic}
        onChange={(e) => onChange(e.target.value)}
      >
        {topics.map((topic) => (
          <option key={topic} value={topic}>
            {topic}
          </option>
        ))}
      </select>
    </div>
  );
};

export default TopicDropdown;
