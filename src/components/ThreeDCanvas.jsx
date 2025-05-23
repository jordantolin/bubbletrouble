import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import { useNavigate } from 'react-router-dom';

const Bubble = ({ orbit, topic, onClick }) => {
  const ref = useRef();

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() * orbit.speed;

    ref.current.position.x = orbit.radius * Math.sin(t + orbit.offset) * Math.cos(orbit.inclination);
    ref.current.position.y = orbit.radius * Math.sin(t + orbit.offset) * Math.sin(orbit.inclination);
    ref.current.position.z = orbit.radius * Math.cos(t + orbit.offset);

    ref.current.rotation.y += 0.002;
    ref.current.rotation.x += 0.0015;
  });

  return (
    <group ref={ref} onClick={() => onClick(topic)} className="cursor-pointer">
      <mesh>
        <sphereGeometry args={[1, 64, 64]} />
        <meshStandardMaterial
          color="#FACC15"
          roughness={0.3}
          metalness={0.4}
          emissive="#FDE68A"
          emissiveIntensity={0.1}
        />
      </mesh>
      <Html distanceFactor={10} style={{ pointerEvents: 'none' }}>
        <div className="text-xs font-semibold text-yellow-700 text-center drop-shadow-md">
          {topic.title}
        </div>
      </Html>
    </group>
  );
};

const PlanetCore = () => {
  return (
    <mesh>
      <sphereGeometry args={[2.5, 64, 64]} />
      <meshStandardMaterial
        color="#E5E7EB"
        roughness={0.4}
        metalness={0.2}
        emissive="#D1D5DB"
        emissiveIntensity={0.15}
      />
    </mesh>
  );
};

const ThreeDCanvas = ({ bubbles = [], onBubbleClick }) => {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const navigate = useNavigate();

  // genera orbite una volta sola in base al numero di bolle filtrate
  const orbits = React.useMemo(() => 
    bubbles.map(() => ({
      radius: 6 + Math.random() * 3,
      speed: 0.15 + Math.random() * 0.1,
      offset: Math.random() * Math.PI * 2,
      inclination: Math.random() * Math.PI,
    })), [bubbles]
  );

  const handleBubbleClick = (topic) => {
    if (onBubbleClick) {
      onBubbleClick(topic);
    } else {
      navigate(`/chat/${encodeURIComponent(topic.title)}`);
    }
  };

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'absolute', inset: 0, zIndex: 0 }}>
      <Canvas camera={{ position: [0, 10, 20], fov: 50 }}>
        <color attach="background" args={["#FFF9ED"]} />
        <ambientLight intensity={0.9} />
        <directionalLight position={[10, 10, 5]} intensity={0.5} />

        <PlanetCore />

        {orbits.map((orbit, i) => (
          <Bubble
            key={bubbles[i].id}
            orbit={orbit}
            topic={bubbles[i]}
            onClick={handleBubbleClick}
          />
        ))}

        <OrbitControls
          enableRotate
          enableZoom={!isMobile}
          enablePan={!isMobile}
          minPolarAngle={0}
          maxPolarAngle={Math.PI}
        />
      </Canvas>
    </div>
  );
};

export default ThreeDCanvas;
