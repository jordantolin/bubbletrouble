import React from 'react';

const MobileTopBubblesSheet = ({ open, bubbles, onSelect, onClose }) => {
  const topBubbles = [...bubbles].sort((a, b) => b.reflections - a.reflections).slice(0, 5);

  return (
    <div
      style={{
        position: 'fixed',
        left: 0,
        bottom: open ? 0 : '-100vh',
        width: '100vw',
        height: '56vh',
        minHeight: 300,
        zIndex: 20000,
        background: '#FFFBEA',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        boxShadow: '0 -10px 32px #ffeac399',
        transition: 'bottom 0.27s cubic-bezier(.64,.08,.34,1.27)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '0 0 14px 0'
      }}
    >
      <div style={{ width: '100%', display: 'flex', alignItems: 'center', padding: '17px 19px 7px 19px' }}>
        <div style={{ fontWeight: 800, fontSize: 20, color: '#bb9000', flex: 1, textAlign: 'center', letterSpacing: 0.04 }}>
          <span role="img" aria-label="star">⭐️</span> Top Bubbles
        </div>
        <button
          type="button"
          onClick={onClose}
          style={{
            fontSize: 24,
            color: '#adadad',
            background: 'none',
            border: 'none',
            outline: 'none',
            fontWeight: 700,
            cursor: 'pointer',
            marginLeft: 8,
          }}
          aria-label="Chiudi"
        >✕</button>
      </div>
      <ul style={{ width: '100%', marginTop: 10 }}>
        {topBubbles.map((bubble, idx) => (
          <li
            key={bubble.id}
            onClick={() => { onSelect(bubble); onClose(); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 9,
              fontWeight: 600,
              fontSize: 17,
              color: "#BC9400",
              padding: '13px 19px',
              borderBottom: '1px solid #f4e1aa',
              background: idx === 0 ? '#FFF9E0' : 'transparent',
              cursor: 'pointer',
              transition: 'background 0.18s',
            }}
          >
            <span className="truncate" style={{ maxWidth: '52vw', flex: 1 }}>{bubble.name}</span>
            <span style={{ marginLeft: 10, fontSize: 15, color: '#A88C2B', background: '#FFEFBE', borderRadius: 7, padding: '2.5px 9px' }}>
              {bubble.reflections} ✨
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default MobileTopBubblesSheet;
