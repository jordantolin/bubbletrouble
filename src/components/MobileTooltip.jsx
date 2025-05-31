import React from 'react';
import { useBubblesStore } from '../stores/useBubblesStore';

const hasUserReflected = (bubble) => {
  const uid = localStorage.getItem('bt_uid') || 'guest';
  return bubble?.reflectsUsers?.includes(uid);
};

const MobileTooltip = ({ tooltip, onClose }) => {
  const { toggleReflect, bubbles } = useBubblesStore();
  const bubble = bubbles.find(b => b.name === tooltip.topicTitle || b.topic === tooltip.topicTitle);

  return (
    <div
      style={{
        position: 'fixed',
        left: 0,
        bottom: 0,
        width: '100vw',
        minHeight: 90,
        background: 'rgba(255, 250, 224, 0.98)',
        color: '#333',
        fontWeight: 600,
        fontSize: 19,
        borderTop: '2.2px solid #ffd600',
        borderRadius: '22px 22px 0 0',
        zIndex: 10000,
        boxShadow: '0 -7px 36px 0 rgba(255,200,32,0.12)',
        padding: 24,
        transition: 'transform 0.19s cubic-bezier(.51,.26,.45,1.33)',
        transform: tooltip.visible ? 'translateY(0)' : 'translateY(100%)',
        pointerEvents: tooltip.visible ? 'auto' : 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 9,
        textAlign: 'center',
      }}
      onClick={onClose}
    >
      <div style={{
        fontWeight: 700,
        color: '#bc9400',
        fontSize: 21,
        marginBottom: 10,
        letterSpacing: 0.01,
        width: '100%',
        textAlign: 'center',
        textShadow: '0 1.5px 6px #fff2',
        filter: 'drop-shadow(0 1.5px 2.5px #fff7)'
      }}>
        {tooltip.topicTitle}
      </div>
      {tooltip.topic && (
        <div style={{
          color: "#555",
          fontSize: 15,
          fontWeight: 600,
          marginBottom: 2,
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
            onClick={(e) => { e.stopPropagation(); toggleReflect(bubble.id); }}
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
          <span style={{ marginLeft: 2, fontWeight: 500, fontSize: 15, color: "#bb9f22" }}>
            reflections
          </span>
        </div>
      )}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 10, fontSize: 18, color: "#888",
      }}>
        <span style={{ color: "#86a1b8", fontSize: 21 }} role="img" aria-label="users">👥</span>
        <span style={{ fontWeight: 700, color: "#535353", minWidth: 24 }}>{tooltip.userCount}</span>
        <span style={{ marginLeft: 2, fontWeight: 500 }}>users</span>
      </div>
      <span style={{ fontSize: 13, marginTop: 2, color: '#aaa', fontWeight: 400 }}>
        Tap anywhere to close
      </span>
    </div>
  );
};

export default MobileTooltip;
