import React, {
  useRef,
  useState,
  useEffect,
  useCallback,
  lazy,
  Suspense,
  memo
} from 'react';

import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import { useSpring, animated, to } from '@react-spring/three';
import { useNavigate } from 'react-router-dom';
import { useSession } from '@supabase/auth-helpers-react';

import DesktopTooltip from './DesktopTooltip';
import MobileTooltip from './MobileTooltip';
import TopBubblesFeed from './TopBubblesFeed';
import ToastNotification from './ToastNotification';
import CreateBubbleModal from './CreateBubbleModal';
import MobileTopBubblesSheet from './MobileTopBubblesSheet';

import { createBubble } from '../api/bubbles';
import { supabase } from '../supabaseClient';
import { useNotificationsStore, NOTIFICATION_TYPES } from '../stores/useNotificationsStore';


const VoiceMessagePlayer = lazy(() => import('./VoiceMessagePlayer'));
const ChatView = lazy(() => import('../components/ChatView'));

const AnimatedGroup = animated.group;
const HEADER_HEIGHT = 68;

const HOVER_BUBBLE_COLOR = "#FFEA60";
const GLOW_COLOR = "#FFF6B3";
const LABEL_COLOR = "#BB8500";

const BUBBLE_COLORS = [
  "#FFFDEA", // 0 reflects
  "#FFF7A0", // ~3 reflects
  "#FFE156", // ~7 reflects
  "#FFD600", // ~15 reflects
  "#FFB800"  // 20+ reflects
];

const hasUserReflected = (bubble) => {
  const uid = localStorage.getItem('bt_uid') || 'guest';
  return bubble.reflectsUsers?.includes(uid);
};

function getGradientColor(stops, t) {
  if (t <= 0) return stops[0];
  if (t >= 1) return stops[stops.length - 1];
  const pos = (stops.length - 1) * t;
  const idx = Math.floor(pos);
  const frac = pos - idx;
  return lerpColor(stops[idx], stops[idx + 1], frac);
}

function lerpColor(a, b, t) {
  const ah = parseInt(a.replace('#', ''), 16);
  const bh = parseInt(b.replace('#', ''), 16);
  const ar = (ah >> 16) & 0xff, ag = (ah >> 8) & 0xff, ab = ah & 0xff;
  const br = (bh >> 16) & 0xff, bg = (bh >> 8) & 0xff, bb = bh & 0xff;
  const rr = ar + t * (br - ar);
  const rg = ag + t * (bg - ag);
  const rb = ab + t * (bb - ab);
  return '#' + ((1 << 24) + (Math.round(rr) << 16) + (Math.round(rg) << 8) + Math.round(rb)).toString(16).slice(1);
}

const Bubble = memo(React.forwardRef(({
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
  maxReflections,
  isNew,
  canvasActive,
}, ref) => {
  const safeReflections = typeof reflections === 'number' ? reflections : 0;
  const safeUserCount = typeof userCount === 'number' ? userCount : 0;

  const IDEAL_MAX = 20;
  const reflectNorm = Math.min(safeReflections / IDEAL_MAX, 1);

  const minRadius = 1;
  const maxRadius = 1.8;
  const dynamicRadius = minRadius + (maxRadius - minRadius) * reflectNorm + 0.1 * (safeUserCount / 30);

  const baseEmissive = BUBBLE_COLORS[3];
  const maxGlow = "#FFFBE8";
  const { emissiveIntensity } = useSpring({
    emissiveIntensity: reflectNorm > 0.9 ? 1.5 : 0.5 + reflectNorm,
    config: { mass: 1, tension: 300, friction: 18 },
  });

  const sphereGlowColor = reflectNorm > 0.9 ? maxGlow : GLOW_COLOR;
  const glowStrength = 0.21 + reflectNorm * 1.8;

  const groupRef = useRef();
  const posRef = useRef({ x: 0, y: 0, z: 0 });

  useFrame(({ clock }) => {
    if (!groupRef.current || !orbitCenters[idx]) return;
    const t = clock.getElapsedTime() * orbitCenters[idx].speed;
    const center = {
      x: orbitCenters[idx].radius * Math.sin(t + orbitCenters[idx].offset) * Math.cos(orbitCenters[idx].inclination),
      y: orbitCenters[idx].radius * Math.sin(t + orbitCenters[idx].offset) * Math.sin(orbitCenters[idx].inclination),
      z: orbitCenters[idx].radius * Math.cos(t + orbitCenters[idx].offset),
    };

    let pos = posRef.current;
    pos = {
      x: pos.x + (center.x - pos.x) * 0.07,
      y: pos.y + (center.y - pos.y) * 0.07,
      z: pos.z + (center.z - pos.z) * 0.07,
    };

    for (let relax = 0; relax < 3; relax++) {
      positions.forEach((p, j) => {
        if (j === idx || !p) return;
        const otherRadius = p.radius ?? 1;
        const d = Math.sqrt((pos.x - p.x) ** 2 + (pos.y - p.y) ** 2 + (pos.z - p.z) ** 2);
        const minDist = dynamicRadius + otherRadius + 0.18;
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
    requestAnimationFrame(() => {
      setPositions(idx, { ...pos, radius: dynamicRadius });
    });
        groupRef.current.position.set(pos.x, pos.y, pos.z);
    if (canvasActive) {
      groupRef.current.rotation.y += 0.002;
      groupRef.current.rotation.x += 0.0015;
    }
  });

  const [hovered, setHovered] = useState(false);
  const [recentlyCreated, setRecentlyCreated] = useState(isNew);

  useEffect(() => {
    if (isNew) {
      const timeout = setTimeout(() => setRecentlyCreated(false), 5000);
      return () => clearTimeout(timeout);
    }
  }, [isNew]);

  const { scale } = useSpring({
    scale: hovered || recentlyCreated ? 1.2 : 1,
    config: { mass: 1, tension: 300, friction: 18 },
  });

  const { glow } = useSpring({
    glow: hovered ? 0.46 : 0.19 + glowStrength,
    config: { tension: 210, friction: 20 },
  });

  const { pulse } = useSpring({
    pulse: recentlyCreated ? 1.4 : 1,
    config: { tension: 220, friction: 12 },
  });

  const { bubbleScale, bubbleOpacity } = useSpring({
    bubbleScale: canvasActive ? 1 : 0.8,
    bubbleOpacity: canvasActive ? 1 : 0,
    config: { tension: 170, friction: 26 },
  });

  const bubbleColor = getGradientColor(BUBBLE_COLORS, reflectNorm);
  const labelFontSize = isMobile ? '0.9rem' : '1.13rem';

  const handleEnter = (e) => {
    setHovered(true);
    onHover(e, topic, safeReflections, safeUserCount);
    if (!isMobile) document.body.style.cursor = 'pointer';
  };

  const handleLeave = () => {
    setHovered(false);
    onHover(null);
    if (!isMobile) document.body.style.cursor = 'default';
  };

  return (
    <AnimatedGroup
  ref={(el) => {
    groupRef.current = el;
    if (typeof ref === 'function') ref(el);
    else if (ref) ref.current = el;
  }}
  onPointerOver={handleEnter}
  onPointerOut={handleLeave}
  onClick={() => onClick(topic)}
  scale={to([scale, pulse, bubbleScale], (s, p, b) => s * p * b)}
  castShadow
  receiveShadow
  className="cursor-pointer"
>
  <animated.mesh
geometry={new THREE.SphereGeometry(dynamicRadius, isMobile ? 18 : 48, isMobile ? 18 : 48)}
scale={bubbleScale}
    opacity={bubbleOpacity}
  >
    <animated.meshStandardMaterial
      color={hovered ? HOVER_BUBBLE_COLOR : bubbleColor}
      roughness={0.35}
      metalness={0.2}
      emissive={baseEmissive}
      emissiveIntensity={emissiveIntensity}
      transparent={false}
      opacity={1}
    />
  </animated.mesh>

  <animated.mesh
    geometry={new THREE.SphereGeometry(dynamicRadius * 1.18, isMobile ? 16 : 32, isMobile ? 16 : 32)}
    visible={hovered || reflectNorm > 0.35 || recentlyCreated}
    scale={bubbleScale}
    opacity={bubbleOpacity}
  >
<meshStandardMaterial
  color={hovered ? '#fffac0' : sphereGlowColor}
  roughness={0.7}
  metalness={0.02}
  transparent
  opacity={glow.to(g => Math.max(g, 0.13 + reflectNorm * 0.26))}
  emissive={sphereGlowColor}
  emissiveIntensity={glow.to(g => 0.6 + g * 1.25 + reflectNorm * 2.1 + (recentlyCreated ? 1.8 : 0))}
/>

  </animated.mesh>

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
      {topic.name || topic.title || "[NO NAME]"}
    </div>
  </Html>
</AnimatedGroup>

  );
}));

const PlanetCore = memo(() => (
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
));

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }
  render() {
    if (this.state.hasError) return <h1>Something went wrong.</h1>;
    return this.props.children;
  }
}

const ThreeDCanvas = memo(({ bubbles, onBubbleClick, showIntro }) => {
  const [positions, setPositionsState] = useState([]);
  const [orbitCenters, setOrbitCenters] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isIPhone, setIsIPhone] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, topicTitle: '', topic: '', description: '', reflections: 0, userCount: 0 });
  const [openTopFeed, setOpenTopFeed] = useState(false);
  const [canvasActive, setCanvasActive] = useState(true);
  const [loading, setLoading] = useState(true);
  const [newBubbleId, setNewBubbleId] = useState(null);
  const toastNotifications = useNotificationsStore(state => state.notifications);
  const showToast = useNotificationsStore(state => state.showToast);
  const clearToast = useNotificationsStore(state => state.clearToast);

  const session = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    const iPhone = /iPhone/i.test(userAgent);
    const android = /android/i.test(userAgent);
    setIsIPhone(iPhone);
    setIsAndroid(android);
    setIsMobile(iPhone || android);
  }, []);

  const handleCreateBubbleClick = async () => {
    if (!session) {
      alert("Devi essere loggato per creare una bolla.");
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    try {
      const { data, error } = await supabase
        .from('bubbles')
        .select('id, created_at')
        .eq('user_id', session.user.id);
      if (error) throw error;

      const todayCount = data.filter(b => b.created_at.startsWith(today)).length;
      if (todayCount >= 3) {
        alert("Hai già creato 3 bolle oggi.");
      } else {
        setShowModal(true);
      }
    } catch (err) {
      alert("Errore nel controllo del limite di creazione.");
    }
  };

  const handleCreateBubble = async (bubbleModalData) => {
    if (!session?.user?.id) {
      alert('Sessione scaduta.');
      setShowModal(false);
      return;
    }

    try {
      const newBubblePayload = {
        ...bubbleModalData,
        user_id: session?.user?.id,
      };

      const data = await createBubble(newBubblePayload);
      if (!data || !data.id) {
        alert('Errore nella creazione.');
        return null;
      }

      setNewBubbleId(data.id);
      showToast({ title: '🎉 Nuova Bolla Creata!', message: '+100 XP', type: NOTIFICATION_TYPES.SUCCESS });

      const today = new Date().toISOString().split('T')[0];
      const { data: bubblesData, error } = await supabase
        .from('bubbles')
        .select('id, created_at')
        .eq('user_id', session.user.id);

      if (!error) {
        const todayCount = bubblesData.filter(b => b.created_at.startsWith(today)).length;
        if (todayCount === 1) {
          showToast({ title: '🏆 Achievement!', message: 'Prima Bolla del Giorno!', type: NOTIFICATION_TYPES.INFO });
        }
      }

      return data;
    } catch (err) {
      alert(`Errore: ${err.message || 'Riprova.'}`);
      return null;
    } finally {
      setShowModal(false);
    }
  };

  const handleBubbleClick = useCallback((bubble) => {
    console.log("[ThreeDCanvas] handleBubbleClick triggered for bubble:", bubble);
    if (!bubble || typeof bubble.id === 'undefined') {
      console.error("[ThreeDCanvas] Tentativo di navigare con una bolla non valida o senza ID:", bubble);
      showToast({ title: 'Errore', message: 'Impossibile aprire la bolla selezionata.', type: NOTIFICATION_TYPES.ERROR });
      return;
    }

    if (onBubbleClick) {
      console.log("[ThreeDCanvas] Chiamata onBubbleClick (prop) con la bolla.");
      onBubbleClick(bubble);
    } else {
      console.log(`[ThreeDCanvas] Navigazione diretta a /chat/${encodeURIComponent(bubble.id)}`);
      navigate(`/chat/${encodeURIComponent(bubble.id)}`);
    }
  }, [onBubbleClick, navigate, showToast]);

  useEffect(() => {
    if (!Array.isArray(bubbles) || !bubbles.length) return;

    const newPositions = bubbles.map((_, i) => positions[i] || { x: 0, y: 0, z: 0, radius: 1 });
    setPositionsState(newPositions.slice(0, bubbles.length));

    const newCenters = bubbles.map((_, i) => orbitCenters[i] || {
      radius: 6 + Math.random() * 3,
      speed: 0.13 + Math.random() * 0.09,
      offset: Math.random() * Math.PI * 2,
      inclination: Math.random() * Math.PI,
    });
    setOrbitCenters(newCenters.slice(0, bubbles.length));
  }, [bubbles]);

  const setPositions = (idx, pos) => {
    setPositionsState((prev) => {
      const updated = [...prev];
      updated[idx] = pos;
      return updated;
    });
  };

  useEffect(() => {
    if (!isMobile || !tooltip.visible) return;
    const handler = () => setTooltip(prev => ({ ...prev, visible: false }));
    window.addEventListener('touchstart', handler);
    return () => window.removeEventListener('touchstart', handler);
  }, [isMobile, tooltip.visible]);

  useEffect(() => {
    if (canvasActive) setLoading(false);
  }, [canvasActive]);

  return (
    <>
      {loading && <div className="loading-indicator">Loading...</div>}

      {toastNotifications.length > 0 && (
        <ToastNotification
          title={toastNotifications[0].title}
          message={toastNotifications[0].message}
          onClose={clearToast}
        />
      )}

      <CreateBubbleModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onCreate={handleCreateBubble}
      />

<Suspense fallback={null}>
  {canvasActive && (
    <VoiceMessagePlayer
      url="/audio.mp3"
      isPlaying={false}
      onPlay={() => {}}
      onPause={() => {}}
      heights={[]}
    />
  )}
</Suspense>


      {isMobile && (
        <>
          <button className="fixed bottom-6 left-5 z-40 bg-yellow-400 text-white rounded-full shadow-xl w-16 h-16 flex items-center justify-center text-3xl font-bold" onClick={() => setOpenTopFeed(true)}>⭐️</button>
          <button className="fixed bottom-6 right-5 z-40 bg-yellow-400 text-white rounded-full shadow-xl w-16 h-16 flex items-center justify-center text-3xl font-bold" onClick={handleCreateBubbleClick}>+</button>
        </>
      )}

      {isMobile ? (
        <MobileTooltip tooltip={tooltip} onClose={() => setTooltip(prev => ({ ...prev, visible: false }))} />
      ) : (
        <DesktopTooltip tooltip={tooltip} />
      )}

      {!isMobile && (
        <TopBubblesFeed
          bubbles={bubbles}
          onSelect={bubble => handleBubbleClick(bubble)}
        />
      )}

      {isMobile && (
        <MobileTopBubblesSheet
          open={openTopFeed}
          bubbles={bubbles}
          onSelect={handleBubbleClick}
          onClose={() => setOpenTopFeed(false)}
        />
      )}

      <div
        style={{
          position: "absolute",
          top: HEADER_HEIGHT + 60,
          left: 0,
          right: 0,
          bottom: 0,
          width: "100vw",
          height: `calc(100vh - ${HEADER_HEIGHT + 60}px)`,
          zIndex: 0,
          background: '#FFF9ED',
          overflow: 'hidden',
        }}
      >
        <ErrorBoundary>
          <Canvas
            shadows={!isIPhone}
            frameloop="always"
            dpr={isMobile ? [0.8, 1] : [1, 1.5]}
            camera={{ position: [0, 10, 20], fov: isMobile ? 60 : 48, near: 1, far: 100 }}
            gl={{ antialias: false, alpha: false }}
            style={{ width: '100vw', height: '100%' }}
            onCreated={({ gl }) => {
              gl.domElement.addEventListener('webglcontextlost', (event) => {
                event.preventDefault();
                console.warn("WebGL context lost. Trying to recover...");
                setCanvasActive(false);
                setTimeout(() => setCanvasActive(true), 1200);
              });
              gl.domElement.addEventListener('webglcontextrestored', () => {
                console.info("WebGL context restored.");
                setCanvasActive(true);
              });
            }}
            performance={{ min: 0.8, max: 1 }}
          >
<color attach="background" args={[isMobile ? '#FFF9ED' : '#FDF6E3']} />
<ambientLight intensity={1.1} />
            <pointLight position={[10, 10, 5]} intensity={1.4} />
            <OrbitControls enableZoom enablePan={false} enableRotate maxDistance={30} minDistance={10} />
            <PlanetCore />
            {Array.isArray(bubbles) &&
              Array.isArray(positions) &&
              Array.isArray(orbitCenters) &&
              typeof positions?.length === 'number' &&
              typeof orbitCenters?.length === 'number' &&
              positions.length === bubbles.length &&
              orbitCenters.length === bubbles.length &&
              bubbles.map((bubble, i) => (
                <Bubble
                  key={bubble.id}
                  idx={i}
                  topic={bubble}
                  reflections={bubble.reflections || 0}
                  userCount={bubble.userCount || 0}
                  positions={positions}
                  setPositions={setPositions}
                  orbitCenters={orbitCenters}
                  onClick={handleBubbleClick}
                  onHover={(e, topic, reflections, userCount) => {
                    if (e && topic) {
                      setTooltip({
                        visible: true,
                        ...(isMobile
                          ? { x: 0, y: 0 }
                          : { x: e.clientX + 12, y: e.clientY + 8 }
                        ),
                        topicTitle: topic.name,
                        topic: topic.topic,
                        description: topic.description,
                        reflections: typeof reflections === "number" ? reflections : 0,
                        userCount: typeof userCount === "number" ? userCount : 0,
                      });
                    } else {
                      setTooltip(prev => ({ ...prev, visible: false }));
                    }
                  }}
                  isMobile={isMobile}
                  isNew={bubble.id === newBubbleId}
                  canvasActive={canvasActive}
                />
              ))}

          </Canvas>
        </ErrorBoundary>
      </div>
    </>
  );
});

export default memo(ThreeDCanvas);

