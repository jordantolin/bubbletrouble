import React, { useRef, useEffect, useState } from 'react';
import { Play, Pause } from 'lucide-react';
import { useSpring, animated } from '@react-spring/web'; // o @react-spring/three se usato in contesto 3D, ma qui è UI 2D

// Funzione helper per formattare i secondi in MM:SS
const formatSec = s => {
  const minutes = Math.floor(s / 60);
  const seconds = Math.floor(s % 60);
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

const VoiceMessagePreview = ({
  src,
  duration,
  isPlaying,
  onPlay,
  onPause,
  onEnded
}) => {
  const audioRef = useRef(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [isAudioReady, setIsAudioReady] = useState(false);

  const MAX_BARS = 30; // Numero massimo di barre per l'equalizer
  const numBars = Math.min(MAX_BARS, Math.max(5, Math.floor(duration / 1.5))); // Barre proporzionali, min 5

  useEffect(() => {
    if (audioRef.current && src) {
      audioRef.current.src = src;
      audioRef.current.onloadedmetadata = () => {
        setIsAudioReady(true);
      };
      audioRef.current.onended = onEnded;
      audioRef.current.ontimeupdate = () => {
        if (audioRef.current) {
          setCurrentTime(audioRef.current.currentTime);
        }
      };
    }
    // Cleanup: revoca l'URL del blob se la src cambia o il componente viene smontato
    return () => {
      if (src && src.startsWith('blob:')) {
        URL.revokeObjectURL(src);
      }
    };
  }, [src, onEnded]);

  useEffect(() => {
    if (audioRef.current && isAudioReady) {
      if (isPlaying) {
        audioRef.current.play().catch(e => console.warn("Preview play error:", e));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, isAudioReady]);

  const handlePlayPause = () => {
    if (!isAudioReady) return;
    if (isPlaying) {
      onPause && onPause();
    } else {
      onPlay && onPlay();
    }
  };

  // Animazione per le barre dell'equalizer (fake)
  const barAnimations = Array.from({ length: numBars }).map((_, i) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { height } = useSpring({
      loop: { reverse: true },
      from: { height: 4 + Math.random() * 4 }, // Altezza minima + variazione
      to: { height: 10 + Math.random() * 8 },   // Altezza massima + variazione
      config: { duration: 300 + Math.random() * 400 },
      delay: i * 50, // Delay per effetto cascata
    });
    return height;
  });

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      className="flex items-center w-full p-2 rounded-lg bg-yellow-50 shadow"
    // style={{ background: '#FFF9ED' }} // Se si preferisce un colore specifico
    >
      <button
        onClick={handlePlayPause}
        disabled={!isAudioReady}
        className="p-2 text-yellow-600 hover:text-yellow-700 disabled:opacity-50 mr-2 rounded-full hover:bg-yellow-100 transition-colors"
      >
        {isPlaying ? <Pause size={20} /> : <Play size={20} />}
      </button>

      <div className="flex-grow h-10 flex items-center gap-0.5 relative overflow-hidden">
        {/* Traccia di progresso sotto le barre */}
        <div className="absolute top-0 left-0 h-full bg-yellow-300/50 rounded" style={{ width: `${progressPercent}%` }} />

        {barAnimations.map((animatedStyle, i) => (
          <animated.div
            key={i}
            className="bg-yellow-400 rounded-sm"
            style={{
              width: '3px',
              height: animatedStyle.to(h => `${Math.max(4, h)}px`), // Altezza minima 4px
              marginRight: '1px',
              opacity: 0.6 + (i / numBars) * 0.4 // Barre più opache verso la fine
            }}
          />
        ))}
      </div>

      <span className="text-xs font-semibold text-yellow-800 ml-2 min-w-[40px] text-right">
        {formatSec(duration || 0)}
      </span>
      <audio ref={audioRef} className="hidden" />
    </div>
  );
};

export default VoiceMessagePreview;
