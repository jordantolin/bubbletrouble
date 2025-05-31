import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Play, Pause, AlertTriangle, UploadCloud } from 'lucide-react';
import { useAudioFFT } from '../hooks/useAudioFFT';
import { animated, useTransition } from '@react-spring/web';

const formatSec = s => {
  const minutes = Math.floor(s / 60);
  const seconds = Math.floor(s % 60);
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

const VoiceMessagePlayer = ({
  src,
  duration = 0,
  isPlaying,
  onPlay,
  onPause,
  onEnded,
  isCurrentUser,
  status,
}) => {
  const audioRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);
  const [internalCurrentTime, setInternalCurrentTime] = useState(0);

  const { heights, analyserRef, bufferLength } = useAudioFFT(audioRef, isPlaying && !!src && status !== 'failed', 24);

  useEffect(() => {
    if (audioRef.current && src) {
      if (audioRef.current.src !== src) {
        audioRef.current.src = src;
        audioRef.current.load();
        setIsReady(false);
        setError(null);
      }
    } else if (!src && audioRef.current) {
      audioRef.current.removeAttribute('src');
      setIsReady(false);
      setError(null);
    }
  }, [src]);

  useEffect(() => {
    const audioElement = audioRef.current;
    if (!audioElement) return;

    const handleLoadedMetadata = () => setIsReady(true);
    const handleEnded = () => { onEnded && onEnded(); setError(null); };
    const handleError = (e) => {
      console.error("Audio Error:", e);
      setError("Errore caricamento audio.");
      setIsReady(false);
    };
    const handleTimeUpdate = () => setInternalCurrentTime(audioElement.currentTime);

    audioElement.addEventListener('loadedmetadata', handleLoadedMetadata);
    audioElement.addEventListener('ended', handleEnded);
    audioElement.addEventListener('error', handleError);
    audioElement.addEventListener('timeupdate', handleTimeUpdate);

    return () => {
      audioElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audioElement.removeEventListener('ended', handleEnded);
      audioElement.removeEventListener('error', handleError);
      audioElement.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [onEnded]);

  useEffect(() => {
    const audioElement = audioRef.current;
    if (audioElement && isReady) {
      if (isPlaying) {
        audioElement.play().catch(e => {
          if (e.name !== 'AbortError') {
            console.warn("Chat Play error:", e);
            setError("Impossibile riprodurre.");
          }
        });
      } else {
        if (!audioElement.paused) {
          audioElement.pause();
        }
      }
    }
  }, [isPlaying, isReady]);

  const handlePlayPause = () => {
    if (!isReady || !src || status === 'failed') return;
    if (isPlaying) {
      onPause && onPause();
    } else {
      onPlay && onPlay();
    }
  };

  const progressPercent = duration > 0 ? (internalCurrentTime / duration) * 100 : 0;

  const bgColor = isCurrentUser ? 'bg-yellow-400' : 'bg-white';
  const textColor = isCurrentUser ? 'text-white' : 'text-gray-800';
  const iconColor = isCurrentUser ? 'text-yellow-100' : 'text-yellow-600';
  const barColor = isCurrentUser ? 'bg-yellow-200/60' : 'bg-yellow-400/80';
  const progressTrackColor = isCurrentUser ? 'bg-yellow-500/50' : 'bg-yellow-300/50';

  if (status === 'failed') {
    return (
      <div className={`flex items-center gap-2 p-2 rounded-lg ${bgColor} ${textColor} opacity-70`}>
        <AlertTriangle size={20} className="text-red-500" />
        <span className="text-xs">Invio fallito</span>
      </div>
    );
  }

  return (
    <div
      className={`flex items-center gap-2 p-2.5 rounded-xl shadow-sm w-full ${bgColor} ${isCurrentUser ? '' : 'border border-gray-200'}`}
      style={{ minWidth: '180px', maxWidth: '280px' }}
    >
      <button
        onClick={handlePlayPause}
        disabled={!isReady || !src || status === 'uploading'}
        className={`p-1.5 rounded-full ${iconColor} hover:bg-black/10 transition-colors disabled:opacity-50 flex-shrink-0`}
      >
        {status === 'uploading' ? <UploadCloud size={18} className="animate-pulse" /> : (isPlaying ? <Pause size={18} /> : <Play size={18} />)}
      </button>

      <div className="flex-grow h-8 flex items-center gap-px relative overflow-hidden mx-1">
        {src && isReady && <div className={`absolute top-0 left-0 h-full ${progressTrackColor} rounded`} style={{ width: `${progressPercent}%` }} />}

        {Array.from({ length: bufferLength || 24 }).map((_, i) => (
          <div
            key={i}
            className={`${barColor} rounded-sm transition-all duration-50`}
            style={{
              width: '2.5px',
              height: `${(isPlaying && heights[i]) ? Math.max(2, (heights[i] / 255) * 100 * 0.28) : (status === 'uploading' ? 2 + Math.random() * 4 : 2)}px`,
              marginRight: '1px',
            }}
          />
        ))}
      </div>

      {src && isReady && (
        <span className={`text-xs font-medium ${textColor} opacity-80 min-w-[35px] text-right`}>
          {formatSec(duration || 0)}
        </span>
      )}
      {!src && status !== 'uploading' && <span className="text-xs text-gray-400">Audio non disp.</span>}

      <audio ref={audioRef} className="hidden" onEnded={onEnded} />
    </div>
  );
};

export default VoiceMessagePlayer;
