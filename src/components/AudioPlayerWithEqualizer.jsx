import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause } from 'lucide-react';

const formatTime = (s) => {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
};

const getBarCount = (duration) => {
  const min = 10, max = 34;
  const seconds = Math.max(1, Math.min(duration || 1, 40));
  return Math.round(min + ((max - min) * (seconds - 1) / 39));
};

const AudioPlayerWithEqualizer = ({ src, isActive = false, duration = 1, onPlay, onStop }) => {
  const audioRef = useRef(null);
  const [heights, setHeights] = useState(Array(getBarCount(duration)).fill(18));
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const rafId = useRef(null);
  const barCount = getBarCount(duration);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);
  const contextRef = useRef(null);

  // Aggiorna il tempo
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !isActive) return;

    const updateTime = () => {
      setCurrentTime(audio.currentTime);
      rafId.current = requestAnimationFrame(updateTime);
    };

    rafId.current = requestAnimationFrame(updateTime);
    return () => cancelAnimationFrame(rafId.current);

  }, [isActive]);
  const barContainerRef = useRef(null);
  // Equalizer
  useEffect(() => {
    const audio = audioRef.current;
    if (!isActive || !audio) return;

    if (!contextRef.current) {
      contextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      sourceRef.current = contextRef.current.createMediaElementSource(audio);
      analyserRef.current = contextRef.current.createAnalyser();

      sourceRef.current.connect(analyserRef.current);
      analyserRef.current.connect(contextRef.current.destination);
      analyserRef.current.fftSize = 64;
    }

    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const segment = Math.floor(bufferLength / barCount);

    const update = () => {
      analyser.getByteFrequencyData(dataArray);
      const bars = [];
      for (let i = 0; i < barCount; i++) {
        const slice = dataArray.slice(i * segment, (i + 1) * segment);
        const sum = slice.reduce((a, b) => a + b, 0);
        const avg = sum / segment;
        bars.push(10 + (avg / 255) * 22);
      }
      setHeights(bars);
      rafId.current = requestAnimationFrame(update);
    };

    rafId.current = requestAnimationFrame(update);
    return () => cancelAnimationFrame(rafId.current);
  }, [isActive, duration]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (playing) {
      audio.pause();
      setPlaying(false);
      onStop?.();
    } else {
      try {
        if (contextRef.current?.state === 'suspended') {
          contextRef.current.resume();
        }
        audio.play();
        setPlaying(true);
        onPlay?.();
      } catch (err) {
        console.warn('Play error:', err);
      }
    }
  };

  const seekTo = (index) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const targetTime = (index / barCount) * duration;
    audio.currentTime = targetTime;
};

useEffect(() => {
  const el = barContainerRef.current;
  if (!el) return;

  let isDragging = false;

  const handleSeek = (x) => {
    const rect = el.getBoundingClientRect();
    const relativeX = Math.max(0, Math.min(x - rect.left, rect.width));
    const index = Math.floor((relativeX / rect.width) * barCount);
    seekTo(index);
  };

  const onTouchMove = (e) => {
    if (!isDragging) return;
    handleSeek(e.touches[0].clientX);
  };

  const onTouchEnd = () => {
    isDragging = false;
    el.removeEventListener('touchmove', onTouchMove);
    el.removeEventListener('touchend', onTouchEnd);
  };

  const onTouchStart = (e) => {
    isDragging = true;
    handleSeek(e.touches[0].clientX);
    el.addEventListener('touchmove', onTouchMove);
    el.addEventListener('touchend', onTouchEnd);
  };

  const onMouseMove = (e) => {
    if (!isDragging) return;
    handleSeek(e.clientX);
  };

  const onMouseUp = () => {
    isDragging = false;
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
  };

  const onMouseDown = (e) => {
    isDragging = true;
    handleSeek(e.clientX);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  el.addEventListener('mousedown', onMouseDown);
  el.addEventListener('touchstart', onTouchStart);

  return () => {
    el.removeEventListener('mousedown', onMouseDown);
    el.removeEventListener('touchstart', onTouchStart);
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
  };
}, [barCount, duration]);


  const totalWidth = barCount * 4 + 55; // 3px width + 1px gap per barra + spazio pulsante


  return (
    <div
      className="flex items-center justify-between px-2 py-2 rounded-2xl transition-all"
      style={{
        width: `${totalWidth}px`,
        minWidth: 'min-content',
        maxWidth: '94vw',
        backgroundColor: 'transparent',
      }}
    >
      <div
        className="flex items-center gap-3 px-2 py-1 rounded-2xl"
        style={{
            width: `${totalWidth}px`,
            minWidth: 'min-content',
            maxWidth: '94vw',
            background: 'linear-gradient(135deg,#fff5cc,#fff)',
            boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
          }}
          
      >
        <button
          onClick={togglePlay}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-white shadow-md hover:scale-105 transition-transform"
          style={{ boxShadow: '0 0 4px rgba(255,215,0,0.25)' }}
        >
          {playing ? (
            <Pause className="text-yellow-600 w-5 h-5" />
          ) : (
            <Play className="text-yellow-600 w-5 h-5" />
          )}
        </button>

        <audio
          ref={audioRef}
          src={src}
          crossOrigin="anonymous"
          preload="auto"
          onEnded={() => {
            setPlaying(false);
            setCurrentTime(0);
            onStop?.();
          }}
          hidden
        />

        <div className="flex flex-col flex-1">
        <div
  className="flex items-end h-8 px-1 gap-[1px] overflow-hidden flex-1 touch-none"
  ref={barContainerRef}
>

{heights.map((h, i) => {
  const progressIndex = Math.floor((currentTime / duration) * barCount);
  const isPlayed = i <= progressIndex;
  const distanceFromCurrent = progressIndex - i;
  const baseHeight = isPlayed
    ? h
    : 6 + Math.max(0, 4 - Math.abs(distanceFromCurrent)) * 1.2;

  return (
    <div
      key={`eqbar-${i}-${Math.floor(h)}`}
      className="rounded-t"
      style={{
        width: 3,
        height: `${baseHeight}px`,
        minHeight: '4px',
        maxHeight: '32px',
        backgroundColor: isPlayed ? '#facc15' : '#fde68a',
        transition: 'height 80ms ease, background-color 200ms ease',
        willChange: 'height',
        boxShadow: isPlayed ? `0 0 ${Math.max(1, baseHeight / 4)}px #facc15aa` : 'none',
      }}
    ></div>
  );
})}

          </div>
        </div>
      </div>

      {/* Tempo dinamico a destra */}
      <span className="ml-3 text-xs font-mono text-yellow-800 select-none" style={{ minWidth: 30 }}>
        {formatTime(currentTime)}
      </span>
    </div>
  );
};

export default AudioPlayerWithEqualizer;
