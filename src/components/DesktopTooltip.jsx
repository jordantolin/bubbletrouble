import React from 'react';
import { useBubblesStore } from '../stores/useBubblesStore';

const hasUserReflected = (bubble) => {
  const uid = localStorage.getItem('bt_uid') || 'guest';
  return bubble?.reflectsUsers?.includes(uid);
};

const DesktopTooltip = ({ tooltip }) => {
  const { toggleReflect, bubbles } = useBubblesStore();
  const bubble = bubbles.find(b => b.name === tooltip.topicTitle || b.topic === tooltip.topicTitle);

  return (
    <div
      style={{
        position: 'fixed',
        top: tooltip.y,
        left: tooltip.x,
        pointerEvents: 'none',
        minWidth: 240,
        background: 'rgba(255, 250, 224, 0.98)',
        color: '#333',
        borderRadius: '24px',
        fontWeight: 500,
        fontSize: '16px',
        boxShadow: '0 4px 32px 2px #ffeab999',
        opacity: tooltip.visible ? 1 : 0,
        transition: 'opacity 0.18s, transform 0.18s cubic-bezier(.51,.26,.45,1.33)',
        transform: tooltip.visible ? 'translate(0,0)' : 'translate(-10px,-12px)',
        zIndex: 10000,
        userSelect: 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '28px 28px 18px 28px',
        gap: 10,
        textAlign: 'center',
      }}
    >
      <div style={{
        fontWeight: 700,
        color: '#bc9400',
        marginBottom: 10,
        fontSize: 22,
        letterSpacing: 0.01,
        width: '100%',
        textAlign: 'center',
        textShadow: '0 2px 12px #fff3',
        filter: 'drop-shadow(0 1.5px 2.5px #fff7)'
      }}>
        {tooltip.topicTitle}
      </div>
      {tooltip.topic && (
        <div style={{
          color: "#555",
          fontSize: 15,
          fontWeight: 600,
          marginBottom: 3,
          marginTop: -7,
        }}>
          {tooltip.topic}
        </div>
      )}
      {tooltip.description && (
        <div style={{
          color: "#87864b",
          fontSize: 14,
          fontWeight: 400,
          marginBottom: 6,
          maxWidth: 220,
          whiteSpace: 'pre-wrap',
        }}>
          {tooltip.description}
        </div>
      )}
      {bubble && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          fontSize: 21,
          color: "#888",
          marginBottom: 4,
          fontWeight: 700,
          pointerEvents: 'auto'
        }}>
          <button
            type="button"
            onClick={async () => { await toggleReflect(bubble.id); }}
            style={{
              background: "none",
              border: "none",
              outline: "none",
              cursor: "pointer",
              padding: 0,
              fontSize: 26,
              filter: hasUserReflected(bubble) ? "drop-shadow(0 0 5px #ffd600ee)" : "none",
              color: hasUserReflected(bubble) ? "#FFD600" : "#ccc",
              transition: "filter 0.18s, color 0.18s"
            }}
          >✨</button>
          <span style={{
            fontWeight: 800,
            color: "#535353",
            minWidth: 24,
            fontSize: 22,
            letterSpacing: 0.02,
          }}>
            {bubble.reflections}
          </span>
          <span style={{ marginLeft: 2, fontWeight: 500, fontSize: 16, color: "#bb9f22" }}>
            reflections
          </span>
        </div>
      )}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        fontSize: 19,
        color: "#888",
      }}>
        <span style={{ color: "#86a1b8", fontSize: 22 }} role="img" aria-label="users">👥</span>
        <span style={{ fontWeight: 700, color: "#535353", minWidth: 24 }}>{tooltip.userCount}</span>
        <span style={{ marginLeft: 2, fontWeight: 500 }}>users</span>
      </div>
    </div>
  );
};

export default DesktopTooltip;
