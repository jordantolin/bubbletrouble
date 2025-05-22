import React from 'react';

function Bubble({ title, reflections }) {
  return (
    <div className="bubble">
      <h3>{title}</h3>
      <p>{reflections} reflections</p>
    </div>
  );
}

export default Bubble;