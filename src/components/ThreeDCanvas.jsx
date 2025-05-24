import React, { useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import { useNavigate } from 'react-router-dom';
import { useSpring, animated } from '@react-spring/three';
import { Sparkles } from 'lucide-react';

const AnimatedGroup = animated.group;

const BASE_BUBBLE_COLOR = "#FFD600";
const HOVER_BUBBLE_COLOR = "#FFEA60";
const BUBBLE_EMISSIVE = "#FFD600";
const GLOW_COLOR = "#FFF6B3";
const LABEL_COLOR = "#BB8500";
const HEADER_HEIGHT = 68; // pixel, uguale all'altezza dell'header

// --- Bubble Component
const Bubble = ({
  idx,
  topic,
  reflections,
  userCount,
  positions,
  setPositions,
  orbitCenters,
  onClick,
  onHover,
  isMobile,
}) => {
  const ref = useRef();
  const [hovered, setHovered] = useState(false);

  const safeReflections = typeof reflections === 'number' && !isNaN(reflections) ? reflections : 0;
  const safeUserCount = typeof userCount === 'number' && !isNaN(userCount) ? userCount : 0;
  const dynamicRadius = Math.max(
    Math.min(1 * (1 + 0.2 * (safeReflections / 50) + 0.1 * (safeUserCount / 30)), 1.7),
    0.9
  );

  const posRef = useRef({ x: 0, y: 0, z: 0 });
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() * orbitCenters[idx].speed;
    const center = {
      x: orbitCenters[idx].radius * Math.sin(t + orbitCenters[idx].offset) * Math.cos(orbitCenters[idx].inclination),
      y: orbitCenters[idx].radius * Math.sin(t + orbitCenters[idx].offset) * Math.sin(orbitCenters[idx].inclination),
      z: orbitCenters[idx].radius * Math.cos(t + orbitCenters[idx].offset),
    };

    let pos = posRef.current;
    pos = {
      x: pos.x + (center.x - pos.x) * 0.13,
      y: pos.y + (center.y - pos.y) * 0.13,
      z: pos.z + (center.z - pos.z) * 0.13,
    };

    for (let relax = 0; relax < 5; relax++) {
      positions.forEach((p, j) => {
        if (j === idx || !p) return;
        const otherRadius = p.radius ?? 1;
        const d = Math.sqrt((pos.x - p.x) ** 2 + (pos.y - p.y) ** 2 + (pos.z - p.z) ** 2);
        const minDist = dynamicRadius + otherRadius + 0.01;
        if (d < minDist && d > 0) {
          const overlap = (minDist - d) / 2;
          const nx = (pos.x - p.x) / d;
          const ny = (pos.y - p.y) / d;
          const nz = (pos.z - p.z) / d;
          pos.x += nx * overlap;
          pos.y += ny * overlap;
          pos.z += nz * overlap;
        }
      });
    }

    const dCenter = Math.sqrt(pos.x ** 2 + pos.y ** 2 + pos.z ** 2);
    if (dCenter > 9.5) {
      const scale = (9.5 - dynamicRadius) / dCenter;
      pos.x *= scale;
      pos.y *= scale;
      pos.z *= scale;
    }

    posRef.current = pos;
    setPositions(idx, { ...pos, radius: dynamicRadius });

    if (ref.current) {
      ref.current.position.set(pos.x, pos.y, pos.z);
      ref.current.rotation.y += 0.002;
      ref.current.rotation.x += 0.0015;
    }
  });

  const { scale } = useSpring({
    scale: hovered ? 1.17 : 1,
    config: { mass: 1, tension: 300, friction: 18 },
  });
  const { glow } = useSpring({
    glow: hovered ? 0.36 : 0.09,
    config: { tension: 210, friction: 20 },
  });

  const handleEnter = (e) => {
    setHovered(true);
    onHover(e, topic, safeReflections, safeUserCount);
    if (!isMobile) document.body.style.cursor = 'pointer';
  };
  const handleLeave = (e) => {
    setHovered(false);
    onHover(null);
    if (!isMobile) document.body.style.cursor = 'default';
  };

  const labelFontSize = isMobile ? '0.9rem' : '1.13rem';

  return (
    <AnimatedGroup
      ref={ref}
      onPointerOver={handleEnter}
      onPointerOut={handleLeave}
      onClick={() => onClick(topic)}
      scale={scale}
      castShadow
      receiveShadow
      className="cursor-pointer"
    >
      {/* Bolla base */}
      <mesh frustumCulled geometry={new THREE.SphereGeometry(dynamicRadius, 40, 40)}>
        <meshStandardMaterial
          color={hovered ? HOVER_BUBBLE_COLOR : BASE_BUBBLE_COLOR}
          roughness={0.09}
          metalness={0.25}
          transparent={false}
          opacity={1}
          emissive={BUBBLE_EMISSIVE}
          emissiveIntensity={0.22 + (hovered ? 0.18 : 0)}
        />
      </mesh>
      {/* Glow */}
      <animated.mesh
        frustumCulled
        geometry={new THREE.SphereGeometry(dynamicRadius * 1.13, 40, 40)}
        visible={hovered}
      >
        <meshStandardMaterial
          color={GLOW_COLOR}
          roughness={0.6}
          metalness={0.04}
          transparent
          opacity={glow.to(g => g)}
          emissive={GLOW_COLOR}
          emissiveIntensity={glow.to(g => g)}
        />
      </animated.mesh>
      {/* Label */}
      <Html distanceFactor={10} style={{ pointerEvents: 'none', userSelect: 'none', marginTop: -12 }}>
        <div
          className="font-semibold font-elegant"
          style={{
            fontSize: labelFontSize,
            color: LABEL_COLOR,
            background: 'rgba(255,255,240,0.94)',
            borderRadius: '1.5em',
            padding: isMobile ? '4px 10px' : '7px 18px',
            boxShadow: hovered
              ? '0 3px 14px 1px #ffd60044'
              : '0 1px 8px 0 rgba(250,204,21,0.08), 0 0.5px 2px 0 rgba(0,0,0,0.03)',
            minWidth: 60,
            maxWidth: isMobile ? 80 : 150,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            margin: '0 auto',
            pointerEvents: 'none',
            userSelect: 'none',
            letterSpacing: 0.02,
          }}
        >
          {topic.title}
        </div>
      </Html>
    </AnimatedGroup>
  );
};

const PlanetCore = () => (
  <mesh receiveShadow>
    <sphereGeometry args={[2.45, 40, 40]} />
    <meshStandardMaterial
      color="#f5f6f7"
      roughness={0.35}
      metalness={0.12}
      emissive="#fbe7a7"
      emissiveIntensity={0.16}
    />
  </mesh>
);

const DesktopTooltip = ({ tooltip }) => (
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
    {/* Nome bolla centrale */}
    <div style={{
      fontWeight: 700,
      color: '#bc9400',
      marginBottom: 10,
      fontSize: 22,
      letterSpacing: 0.01,
      lineHeight: 1.11,
      width: '100%',
      textAlign: 'center',
      textShadow: '0 2px 12px #fff3',
      filter: 'drop-shadow(0 1.5px 2.5px #fff7)'
    }}>
      {tooltip.topicTitle}
    </div>
    {/* Reflections */}
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      fontSize: 19,
      color: "#888",
      marginBottom: 4,
    }}>
      <span style={{ color: "#FFD600", fontSize: 22 }} role="img" aria-label="sparkles">✨</span>
      <span style={{ fontWeight: 700, color: "#535353", minWidth: 24 }}>{tooltip.reflections}</span>
      <span style={{ marginLeft: 2, fontWeight: 500 }}>reflections</span>
    </div>
    {/* Users */}
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

const MobileTooltip = ({ tooltip, onClose }) => (
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
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      gap: 10, fontSize: 18, color: "#888", marginBottom: 4,
    }}>
      <span style={{ color: "#FFD600", fontSize: 21 }} role="img" aria-label="sparkles">✨</span>
      <span style={{ fontWeight: 700, color: "#535353", minWidth: 24 }}>{tooltip.reflections}</span>
      <span style={{ marginLeft: 2, fontWeight: 500 }}>reflections</span>
    </div>
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

const ThreeDCanvas = ({ bubbles = [], onBubbleClick }) => {
  const [isMobile, setIsMobile] = useState(false);
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, topicTitle: '', reflections: 0, userCount: 0 });
  const navigate = useNavigate();

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const [positions, setPositionsState] = useState(
    bubbles.map(() => ({ x: 0, y: 0, z: 0, radius: 1 }))
  );
  useEffect(() => {
    setPositionsState(bubbles.map(() => ({ x: 0, y: 0, z: 0, radius: 1 })));
  }, [bubbles]);

  const setPositions = (idx, pos) => {
    setPositionsState((prev) => {
      const updated = [...prev];
      updated[idx] = pos;
      return updated;
    });
  };

  const [orbitCenters] = useState(() =>
    bubbles.map(() => ({
      radius: 6 + Math.random() * 3,
      speed: 0.13 + Math.random() * 0.09,
      offset: Math.random() * Math.PI * 2,
      inclination: Math.random() * Math.PI,
    }))
  );

  const handleBubbleClick = (topic) => {
    if (onBubbleClick) onBubbleClick(topic);
    else navigate(`/chat/${encodeURIComponent(topic.title)}`);
  };

  // PATCH: Fixato! Numero corretti in tooltip!
  const handleHover = (e, topic, reflections, userCount) => {
    if (e && topic) {
      setTooltip({
        visible: true,
        ...(isMobile
          ? { x: 0, y: 0 }
          : { x: e.clientX + 12, y: e.clientY + 8 }
        ),
        topicTitle: topic.title,
        reflections: typeof reflections === "number" ? reflections : 0,
        userCount: typeof userCount === "number" ? userCount : 0,
      });
    } else {
      setTooltip((prev) => ({ ...prev, visible: false }));
    }
  };

  useEffect(() => {
    if (!isMobile) return;
    if (!tooltip.visible) return;
    const handler = (e) => setTooltip((prev) => ({ ...prev, visible: false }));
    window.addEventListener('touchstart', handler);
    return () => window.removeEventListener('touchstart', handler);
  }, [isMobile, tooltip.visible]);

  return (
    <>
      {isMobile
        ? <MobileTooltip tooltip={tooltip} onClose={() => setTooltip(prev => ({ ...prev, visible: false }))} />
        : <DesktopTooltip tooltip={tooltip} />
      }
      <div
        style={{
          position: "absolute",
          top: HEADER_HEIGHT,
          left: 0,
          right: 0,
          bottom: 0,
          width: "100vw",
          height: `calc(100vh - ${HEADER_HEIGHT}px)`,
          zIndex: 0,
          touchAction: 'none',
          background: '#FFF9ED'
        }}
      >
        <Canvas
          shadows
          camera={{ position: [0, 10, 20], fov: isMobile ? 60 : 48 }}
          gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
          style={{ width: '100vw', height: '100%', background: '#FFF9ED' }}
        >
          <color attach="background" args={['#FFF9ED']} />
          <ambientLight intensity={0.81} />
          <directionalLight
            castShadow
            position={[10, 20, 10]}
            intensity={0.69}
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
            shadow-camera-far={50}
            shadow-camera-left={-12}
            shadow-camera-right={12}
            shadow-camera-top={12}
            shadow-camera-bottom={-12}
          />
          <PlanetCore />
          {bubbles.map((bubble, i) => (
            <Bubble
              key={bubble.id}
              idx={i}
              topic={bubble}
              reflections={typeof bubble.reflections === "number" ? bubble.reflections : 0}
              userCount={typeof bubble.userCount === "number" ? bubble.userCount : 0}
              positions={positions}
              setPositions={setPositions}
              orbitCenters={orbitCenters}
              onClick={handleBubbleClick}
              onHover={handleHover}
              isMobile={isMobile}
            />
          ))}
          <OrbitControls
            enableRotate
            enableZoom
            enablePan={!isMobile}
            minDistance={10}
            maxDistance={30}
            minPolarAngle={0}
            maxPolarAngle={Math.PI}
            enableDamping
            dampingFactor={0.13}
            zoomSpeed={0.66}
            panSpeed={0.48}
            target={[0, 0, 0]}
          />
        </Canvas>
      </div>
    </>
  );
};

export default ThreeDCanvas;
