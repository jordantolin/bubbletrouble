// src/components/ThreeDCanvas.jsx
import React, { useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import { useNavigate } from 'react-router-dom';
import { useSpring, animated } from '@react-spring/three';

const AnimatedGroup = animated.group;

const Bubble = ({ orbit, topic, reflections, userCount, onClick, onHover }) => {
  const ref = useRef();
  const [hovered, setHovered] = useState(false);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() * orbit.speed;

    ref.current.position.x = orbit.radius * Math.sin(t + orbit.offset) * Math.cos(orbit.inclination);
    ref.current.position.y = orbit.radius * Math.sin(t + orbit.offset) * Math.sin(orbit.inclination);
    ref.current.position.z = orbit.radius * Math.cos(t + orbit.offset);

    ref.current.rotation.y += 0.002;
    ref.current.rotation.x += 0.0015;
  });

  const intensity = Math.min(reflections / 100, 1);
  const baseColor = `rgba(250, 204, 21, ${0.6 + intensity * 0.4})`;
  const hoverColor = '#FFF59D';

  const { scale } = useSpring({
    scale: hovered ? 1.15 : 1,
    config: { mass: 1, tension: 180, friction: 12 },
  });

  return (
    <AnimatedGroup
      ref={ref}
      onPointerOver={(e) => {
        setHovered(true);
        onHover(e, topic, reflections, userCount);
        e.stopPropagation();
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={(e) => {
        setHovered(false);
        onHover(null);
        e.stopPropagation();
        document.body.style.cursor = 'default';
      }}
      onClick={() => onClick(topic)}
      scale={scale}
      castShadow
      receiveShadow
      className="cursor-pointer"
    >
      <mesh frustumCulled geometry={new THREE.SphereGeometry(1, 16, 16)}>
        <meshStandardMaterial
          color={hovered ? hoverColor : baseColor}
          roughness={0.3}
          metalness={0.4}
          emissive="#FACC15"
          emissiveIntensity={0.2 + intensity * 0.6}
        />
      </mesh>
      <Html distanceFactor={10} style={{ pointerEvents: 'none', userSelect: 'none' }}>
        <div
          className="text-xs font-elegant font-semibold text-yellow-800 text-center drop-shadow-md select-none"
          style={{ whiteSpace: 'nowrap', userSelect: 'none' }}
        >
          {topic.title}
        </div>
      </Html>
    </AnimatedGroup>
  );
};

const PlanetCore = () => (
  <mesh receiveShadow>
    <sphereGeometry args={[2.5, 16, 16]} />
    <meshStandardMaterial
      color="#E5E7EB"
      roughness={0.4}
      metalness={0.2}
      emissive="#D1D5DB"
      emissiveIntensity={0.15}
    />
  </mesh>
);

const ThreeDCanvas = ({ bubbles = [], onBubbleClick }) => {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const navigate = useNavigate();

  // Tooltip stato: posizione {x,y} e contenuto, visibilità
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, content: '' });

  const orbits = React.useMemo(
    () =>
      bubbles.map(() => ({
        radius: 6 + Math.random() * 3,
        speed: 0.15 + Math.random() * 0.1,
        offset: Math.random() * Math.PI * 2,
        inclination: Math.random() * Math.PI,
      })),
    [bubbles]
  );

  const handleBubbleClick = (topic) => {
    if (onBubbleClick) {
      onBubbleClick(topic);
    } else {
      navigate(`/chat/${encodeURIComponent(topic.title)}`);
    }
  };

  // Aggiorna tooltip su hover
  const handleHover = (e, topic, reflections, userCount) => {
    if (e) {
      setTooltip({
        visible: true,
        x: e.clientX + 15,
        y: e.clientY + 15,
        content: (
          <div className="font-elegant text-sm text-gray-900 select-none">
            <div><strong>{topic.title}</strong></div>
            <div>✨ Reflections: {reflections}</div>
            <div>👥 Users: {userCount}</div>
          </div>
        ),
      });
    } else {
      setTooltip({ visible: false, x: 0, y: 0, content: '' });
    }
  };

  return (
    <>
      <div
        style={{
          position: 'fixed',
          top: tooltip.y,
          left: tooltip.x,
          pointerEvents: 'none',
          padding: '8px 12px',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          color: '#333',
          borderRadius: '10px',
          fontWeight: '500',
          fontSize: '13px',
          whiteSpace: 'nowrap',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          opacity: tooltip.visible ? 1 : 0,
          transition: 'opacity 0.25s ease, transform 0.25s ease',
          transform: tooltip.visible ? 'translate(0, 0)' : 'translate(-10px, -10px)',
          zIndex: 10000,
          userSelect: 'none',
          pointerEvents: 'none',
        }}
      >
        {tooltip.content}
      </div>

      <div style={{ width: '100vw', height: '100vh', position: 'absolute', inset: 0, zIndex: 0 }}>
        <Canvas
          shadows
          camera={{ position: [0, 10, 20], fov: 50 }}
          gl={{ antialias: true }}
        >
          <color attach="background" args={['#FFF9ED']} />
          <ambientLight intensity={0.8} />
          <directionalLight
            castShadow
            position={[10, 20, 10]}
            intensity={0.7}
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
            shadow-camera-far={50}
            shadow-camera-left={-10}
            shadow-camera-right={10}
            shadow-camera-top={10}
            shadow-camera-bottom={-10}
          />

          <PlanetCore />

          {orbits.map((orbit, i) => (
            <Bubble
              key={bubbles[i].id}
              orbit={orbit}
              topic={bubbles[i]}
              reflections={bubbles[i].reflections ?? 0}
              userCount={bubbles[i].userCount ?? 0}
              onClick={handleBubbleClick}
              onHover={handleHover}
            />
          ))}

          <OrbitControls
            enableRotate
            enableZoom={!isMobile}
            enablePan={!isMobile}
            minDistance={10}
            maxDistance={30}
            minPolarAngle={0}
            maxPolarAngle={Math.PI}
            enableDamping
            dampingFactor={0.1}
          />
        </Canvas>
      </div>
    </>
  );
};

export default ThreeDCanvas;
