import React, { useEffect, useRef, useState } from 'react';

const VoiceMessagePlayer = ({
  url,
  isPlaying,
  onPlay,
  onPause,
  heights = [],
  width = 120,
  barWidth = 4,
  spacing = 2,
}) => {
  const audioRef = useRef(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setProgress(audio.currentTime / audio.duration);
    };

    const handleEnded = () => {
      setProgress(0);
      onPause();
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [onPause]);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch((e) => console.error('Errore audio:', e));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying]);

  const handleToggle = () => {
    if (isPlaying) {
      onPause();
    } else {
      onPlay();
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={handleToggle}
        className="text-yellow-600 hover:text-yellow-800 text-xl"
      >
        {isPlaying ? '⏸️' : '▶️'}
      </button>
      <div className="relative flex items-end h-8" style={{ width }}>
        {heights.map((h, i) => {
          const barHeight = Math.max(4, h * (0.5 + 0.5 * progress));
          return (
            <div
              key={i}
              className="bg-yellow-500 rounded-sm"
              style={{
                width: barWidth,
                height: `${barHeight}px`,
                marginRight: spacing,
              }}
            />
          );
        })}
      </div>
      <audio ref={audioRef} src={url} preload="auto" className="hidden" />
    </div>
  );
};

export default VoiceMessagePlayer;
