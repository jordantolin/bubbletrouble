import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Paperclip,
  Mic,
  Send,
  X,
  ArrowLeft,
  Play,
  Pause
} from 'lucide-react';
import GiphySearch from './GiphySearch';

// PALETTE & HELPERS
const YELLOW_PALETTES = [
  'bg-yellow-50 text-yellow-900',
  'bg-yellow-100 text-yellow-900',
  'bg-yellow-200 text-yellow-900',
  'bg-yellow-300 text-yellow-900',
  'bg-yellow-400 text-yellow-900'
];
function getUserColor(id) {
  const map = JSON.parse(localStorage.getItem('bt_colors') || '{}');
  if (!map[id]) {
    map[id] = YELLOW_PALETTES[Math.floor(Math.random() * YELLOW_PALETTES.length)];
    localStorage.setItem('bt_colors', JSON.stringify(map));
  }
  return map[id];
}
function nextPowerOfTwo(x) {
  return Math.pow(2, Math.ceil(Math.log2(x)));
}

// FFT REAL EQUALIZER
function useAudioFFT(audioRef, active, barCount = 20) {
  const [heights, setHeights] = useState(Array(barCount).fill(18));
  const rafRef = useRef();
  const ctxRef = useRef();
  const srcRef = useRef();
  const analyserRef = useRef();

  useEffect(() => {
    if (!active || !audioRef.current) {
      setHeights(Array(barCount).fill(18));
      return;
    }
    ctxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    const src = ctxRef.current.createMediaElementSource(audioRef.current);
    const analyser = ctxRef.current.createAnalyser();
    analyser.fftSize = nextPowerOfTwo(Math.max(32, barCount * 2));
    src.connect(analyser);
    analyser.connect(ctxRef.current.destination);
    srcRef.current = src;
    analyserRef.current = analyser;
    const freqArr = new Uint8Array(analyser.frequencyBinCount);

    function draw() {
      analyser.getByteFrequencyData(freqArr);
      const bandSize = Math.floor(freqArr.length / barCount);
      const bars = [];
      for (let i = 0; i < barCount; ++i) {
        let sum = 0;
        for (let j = 0; j < bandSize; ++j) {
          sum += freqArr[i * bandSize + j];
        }
        let avg = sum / bandSize;
        bars.push(10 + (avg / 255) * 28);
      }
      setHeights(bars);
      rafRef.current = requestAnimationFrame(draw);
    }
    draw();

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      try { src.disconnect(); } catch {}
      try { analyser.disconnect(); } catch {}
      try { ctxRef.current.close(); } catch {}
    };
  }, [audioRef, active, barCount]);

  return heights;
}

// FAKE REC EQUALIZER
function useFakeRecEq(barCount, active) {
  const [heights, setHeights] = useState(Array(barCount).fill(18));
  useEffect(() => {
    if (!active) return;
    let running = true;
    function animate() {
      setHeights(
        Array.from({ length: barCount }, (_, i) =>
          14 + Math.round(
            12 * Math.abs(Math.sin(Date.now() / 210 + i * 0.45 + (i % 4)))
          )
        )
      );
      if (running) requestAnimationFrame(animate);
    }
    animate();
    return () => { running = false; };
  }, [barCount, active]);
  return heights;
}

// COOLDOWN
function CooldownCircle({ cd, maxCd }) {
  return (
    <div className="relative w-8 h-8 flex items-center justify-center text-yellow-600">
      <svg className="animate-spin-reverse" viewBox="0 0 36 36" style={{ width: 36, height: 36 }}>
        <path
          stroke="currentColor"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          strokeDasharray="100,100"
          strokeDashoffset={`${((100 * (cd / maxCd)).toFixed(1))}`}
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
        />
      </svg>
    </div>
  );
}

// BUBBLE VOCALI: LUNGHEZZA PROPORZIONALE
function getBubbleWidth(duration, min=110, max=380) {
  const seconds = Math.max(1, Math.min(duration || 1, 40));
  return `${min + ((max - min) * (seconds - 1) / 39)}px`;
}
function getBarCount(widthPx) {
  return Math.max(10, Math.min(36, Math.floor(parseInt(widthPx) / 8)));
}

export default function ChatView() {
  const { topic } = useParams();
  const navigate = useNavigate();
  const bottomRef = useRef(null);

  // session UID
  const [uid] = useState(() => {
    const saved = localStorage.getItem('bt_uid');
    if (saved) return saved;
    const id = 'u' + Date.now();
    localStorage.setItem('bt_uid', id);
    return id;
  });

  // Messaggi & stato preview
  const [messages, setMessages] = useState([
    { id: 1, type: 'text', content: `Welcome to the "${topic}" bubble!`, user: 'sys' }
  ]);
  const [input, setInput] = useState('');
  const [preview, setPreview] = useState(null);
  const [previewType, setPreviewType] = useState(null);
  const [showGiphy, setShowGiphy] = useState(false);
  const fileRef = useRef(null);

  // AUDIO PLAYBACK & REC
  const [playingId, setPlayingId] = useState(null);
  const audioRef = useRef(null);
  const [recording, setRecording] = useState(false);
  const mediaRef = useRef(null);
  const [recTime, setRecTime] = useState(0);
  const recTimerRef = useRef(null);
  const [showRecConfirm, setShowRecConfirm] = useState(false);
  const [recAudioBlob, setRecAudioBlob] = useState(null);
  const [cancelBySwipe, setCancelBySwipe] = useState(false);
  const recordBtnRef = useRef(null);

  // DRAG REC
  const [recDrag, setRecDrag] = useState(false);
  const [recDragDir, setRecDragDir] = useState(null);

  // COOLDOWN
  const [cd, setCd] = useState(0);
  const cdRef = useRef(null);
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), [messages]);
  useEffect(() => () => mediaRef.current?.stream?.getTracks().forEach(t => t.stop()), []);

  // Responsive: aggiorna a ogni frame
  const bubbleWidth = getBubbleWidth(recTime);
  const recBarCount = getBarCount(bubbleWidth);
  const recEqualizerHeights = useFakeRecEq(recBarCount, recording);

  const playingMsg = useMemo(
    () => messages.find(m => m.id === playingId && m.type === 'audio'),
    [messages, playingId]
  );
  const playbackBarCount = playingMsg ? getBarCount(getBubbleWidth(playingMsg.duration)) : 20;
  const playbackEqualizerHeights = useAudioFFT(audioRef, !!playingMsg, playbackBarCount);

  const calcCd = cnt => {
    const MIN = 1500, MAX = 5000;
    return Math.max(MIN, Math.min(MAX, MAX - (cnt / 50) * (MAX - MIN)));
  };
  const startCd = dur => {
    setCd(dur);
    clearInterval(cdRef.current);
    cdRef.current = setInterval(
      () => setCd(p => (p <= 50 ? (clearInterval(cdRef.current), 0) : p - 50)),
      50
    );
  };

  const attemptSend = () => {
    if (cd > 0) {
      setShowWarning(true);
      setTimeout(() => setShowWarning(false), 2000);
      return;
    }
    if (!input.trim()) return;
    sendMessage({ type: 'text', content: input.trim() });
    setInput('');
  };

  const sendMessage = msg => {
    let heights = [];
    let barCount = 0;
    let width = undefined;
    if (msg.type === 'audio') {
      width = getBubbleWidth(msg.duration || 1);
      barCount = getBarCount(width);
      heights = Array.from({ length: barCount }, () => 18);
    }
    setMessages(m => [
      ...m,
      {
        id: Date.now(),
        ...msg,
        user: uid,
        ...(msg.type === 'audio'
          ? { duration: msg.duration, barCount, heights, width }
          : {})
      }
    ]);
    startCd(calcCd(messages.length + 1));
  };

  const onFile = e => {
    const f = e.target.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      const t = f.type.startsWith('image/') ? 'image' : f.type.startsWith('video/') ? 'video' : null;
      if (t) {
        setPreview(r.result);
        setPreviewType(t);
      }
    };
    r.readAsDataURL(f);
  };

  const startRecording = async () => {
    if (recording) return;
    setCancelBySwipe(false);
    setRecDrag(false);
    setRecDragDir(null);
    setRecTime(0);
    setRecAudioBlob(null);
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mr = new MediaRecorder(stream);
    let chunks = [];
    mr.ondataavailable = e => chunks.push(e.data);
    mr.onstop = () => {
      if (!cancelBySwipe) {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setRecAudioBlob(blob);
        setShowRecConfirm(true);
      }
    };
    mr.start();
    mediaRef.current = mr;
    setRecording(true);
    setRecTime(0);
    recTimerRef.current = setInterval(() => {
      setRecTime(t => {
        if (t + 1 >= 40) {
          clearInterval(recTimerRef.current);
          mr.stop();
          setRecording(false);
          setShowRecConfirm(true);
          return 40;
        }
        return t + 1;
      });
    }, 1000);
  };

  const stopRecording = () => {
    if (recording) {
      mediaRef.current.stop();
      setRecording(false);
      clearInterval(recTimerRef.current);
    }
  };

  const cancelRecording = () => {
    setCancelBySwipe(true);
    setRecording(false);
    stopRecording();
    setRecTime(0);
    setShowRecConfirm(false);
    setRecDrag(false);
    setRecDragDir(null);
    setRecAudioBlob(null);
  };

  // HOLD-to-record + swipe-to-cancel
  const recordPointerStart = e => {
    e.preventDefault();
    setRecDrag(false);
    setRecDragDir(null);
    startRecording();
    window.addEventListener('pointermove', recordPointerMove);
    window.addEventListener('pointerup', recordPointerEnd);
  };
  const recordPointerMove = e => {
    if (!recordBtnRef.current || !recording) return;
    setRecDrag(true);
    const rect = recordBtnRef.current.getBoundingClientRect();
    const dx = e.clientX - (rect.left + rect.width / 2);
    const dy = e.clientY - (rect.top + rect.height / 2);
    if (dx < -80) {
      setRecDragDir('left');
      cancelRecording();
      window.removeEventListener('pointermove', recordPointerMove);
      window.removeEventListener('pointerup', recordPointerEnd);
    } else if (dy < -60) {
      setRecDragDir('up');
      cancelRecording();
      window.removeEventListener('pointermove', recordPointerMove);
      window.removeEventListener('pointerup', recordPointerEnd);
    } else {
      setRecDragDir(null);
    }
  };
  const recordPointerEnd = e => {
    window.removeEventListener('pointermove', recordPointerMove);
    window.removeEventListener('pointerup', recordPointerEnd);
    if (!cancelBySwipe && recording) stopRecording();
    setRecDrag(false);
    setRecDragDir(null);
  };

  const sendRecPreview = () => {
    if (recAudioBlob) {
      const url = URL.createObjectURL(recAudioBlob);
      sendMessage({
        type: 'audio',
        content: url,
        duration: recTime
      });
    }
    setShowRecConfirm(false);
    setRecAudioBlob(null);
    setRecTime(0);
  };

  const togglePlay = id => {
    if (playingId === id) {
      if (audioRef.current) audioRef.current.pause();
      setPlayingId(null);
    } else {
      setPlayingId(id);
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.currentTime = 0;
          audioRef.current.play().catch(() => {});
        }
      }, 0);
    }
  };

  const formatSec = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

  return (
    <div className="flex flex-col h-screen bg-[#FFF9ED] font-elegant">
      {/* Header */}
      <header className="flex items-center p-4 bg-yellow-500 text-white">
        <button onClick={() => navigate('/')} className="mr-4">
          <ArrowLeft />
        </button>
        <h2 className="text-lg font-semibold">{topic}</h2>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(msg => {
          const isAudio = msg.type === 'audio';
          const bubbleColor =
            msg.user === 'sys' ? 'bg-yellow-200 text-yellow-900' : getUserColor(msg.user);
          const wrapperCls = isAudio
            ? `flex items-center space-x-3 py-2 w-fit self-start ${bubbleColor}`
            : msg.type === 'text'
            ? 'w-fit px-4 py-2 self-start ' + bubbleColor
            : 'w-fit self-start ' + bubbleColor;
          let heights = [];
          let width = undefined;
          if (isAudio) {
            width = msg.width || getBubbleWidth(msg.duration);
            if (msg.id === playingId) {
              heights = playbackEqualizerHeights;
            } else if (msg.heights && msg.heights.length > 0) {
              heights = msg.heights;
            } else {
              heights = Array(msg.barCount || 20).fill(18);
            }
          }
          return (
            <div key={msg.id} className={`${wrapperCls} rounded-2xl shadow animate-fade-in`}>
              {msg.type === 'text' && <span>{msg.content}</span>}
              {['image', 'gif'].includes(msg.type) && (
                <img src={msg.content} alt="" className="rounded-2xl max-w-xs" />
              )}
              {msg.type === 'video' && (
                <video controls className="rounded-2xl max-w-xs">
                  <source src={msg.content} />
                </video>
              )}
              {isAudio && (
                <div
                  className="flex items-center gap-2"
                  style={{
                    width: width,
                    maxWidth: '94vw',
                    minWidth: '110px'
                  }}
                >
                  <button
                    onClick={() => togglePlay(msg.id)}
                    className="p-2 bg-white rounded-full flex-shrink-0"
                    style={{ minWidth: 40, minHeight: 40 }}
                  >
                    {playingId === msg.id ? (
                      <Pause size={22} className="text-yellow-600" />
                    ) : (
                      <Play size={22} className="text-yellow-600" />
                    )}
                  </button>
                  {playingId === msg.id && (
                    <audio ref={audioRef} src={msg.content} onEnded={() => setPlayingId(null)} />
                  )}
                  <div className="flex flex-row items-end h-8 flex-1 overflow-hidden px-1">
                    {heights.slice(0, getBarCount(width)).map((h, i) => (
                      <div
                        key={i}
                        className="bg-yellow-600 rounded-t"
                        style={{
                          width: 3,
                          marginRight: 1,
                          height: `${h}px`,
                          minHeight: '4px',
                          maxHeight: '32px'
                        }}
                      />
                    ))}
                  </div>
                  <span className="ml-1 text-xs font-medium text-yellow-900 flex-shrink-0">
                    {msg.duration ? formatSec(msg.duration) : ''}
                  </span>
                </div>
              )}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Barra di registrazione vocale (solo timer + equalizer, proporzionale) */}
      {(recording && !showRecConfirm) && (
        <div className="fixed left-0 right-0 bottom-20 flex justify-center pointer-events-none z-30">
          <div
            className="flex items-center bg-yellow-100 shadow px-3 py-3 rounded-2xl border border-yellow-300 animate-fade-in pointer-events-auto w-full"
            style={{
              width: bubbleWidth,
              maxWidth: '94vw',
              minWidth: '110px'
            }}
          >
            <span className="text-yellow-900 font-semibold mr-2 min-w-[36px]">{formatSec(recTime)}</span>
            <div className="flex flex-row items-end h-8 flex-1 overflow-hidden px-1 mr-2">
              {recEqualizerHeights.slice(0, recBarCount).map((h, i) => (
                <div
                  key={i}
                  className="bg-yellow-600 rounded-t"
                  style={{
                    width: 3,
                    marginRight: 1,
                    height: `${h}px`,
                    minHeight: '4px',
                    maxHeight: '32px'
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Conferma invio/cancella vocale */}
      {showRecConfirm && recAudioBlob && (
        <div className="fixed left-0 right-0 bottom-20 flex justify-center z-30 animate-fade-in">
          <div
            className="flex items-center bg-yellow-100 border border-yellow-200 shadow rounded-2xl px-4 py-2 w-full"
            style={{
              width: bubbleWidth,
              maxWidth: '90vw',
              minWidth: 150,
              boxShadow: '0 1.5px 6px 0 rgba(210,180,60,0.10)'
            }}
          >
            <button
              onClick={() => { setShowRecConfirm(false); setRecAudioBlob(null); }}
              className="flex items-center justify-center rounded-full border border-red-200 mr-4"
              style={{
                width: 34,
                height: 34,
                background: '#fff',
              }}
            >
              <X size={17} className="text-red-400" />
            </button>
            <span
              className="text-[#ae8b1c] font-medium text-base select-none"
              style={{
                minWidth: 38,
                textAlign: 'center',
                letterSpacing: '0px',
                fontWeight: 500,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {formatSec(recTime)}
            </span>
            <div className="flex-1" />
            <button
              onClick={cd > 0 ? () => setShowWarning(true) : sendRecPreview}
              disabled={cd > 0}
              className={`flex items-center justify-center rounded-full shadow
                ${cd > 0 ? 'opacity-40 pointer-events-none' : ''}
              `}
              style={{
                background: 'linear-gradient(135deg,#e6b100,#ffd34d)',
                width: 36,
                height: 36,
                marginLeft: 22,
                boxShadow: '0 2px 6px 0 rgba(220,180,40,0.10)',
                transition: 'box-shadow 0.14s'
              }}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 11 17 4 10" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Preview immagini/video normali */}
      {preview && previewType && previewType !== 'audio' && (
        <div className="flex items-center space-x-3 p-4 bg-white shadow">
          {previewType === 'image' ? (
            <img src={preview} alt="preview" className="w-20 rounded-xl" />
          ) : (
            <video controls className="w-20 rounded-xl">
              <source src={preview} />
            </video>
          )}
          <button
            onClick={() => {
              setPreview(null);
              setPreviewType(null);
              fileRef.current.value = null;
            }}
          >
            <X size={20} />
          </button>
        </div>
      )}

      {/* Input Bar */}
      <div className="p-4 bg-white border-t border-yellow-300 relative">
        {showWarning && (
          <div className="absolute inset-x-0 -top-6 flex justify-center pointer-events-none">
            <div className="bg-gray-100 text-gray-700 text-sm px-3 py-1 rounded-lg shadow-sm">
              ⏳ Riprova tra poco
            </div>
          </div>
        )}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => fileRef.current.click()}
            className="text-gray-500 hover:text-yellow-600"
          >
            <Paperclip />
          </button>
          <button
            onClick={() => setShowGiphy(!showGiphy)}
            className="text-yellow-600"
          >
            GIF
          </button>
          <input
            type="file"
            accept="image/*,video/*"
            ref={fileRef}
            onChange={onFile}
            className="hidden"
          />
          <input
            type="text"
            className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:ring-2 focus:ring-yellow-400"
            placeholder="Write a message..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && attemptSend()}
            disabled={recording}
          />
          {cd > 0 ? (
            <div className="w-6 h-6 flex items-center justify-center">
              <CooldownCircle cd={cd} maxCd={5000} />
            </div>
          ) : (
            <button onClick={attemptSend} className="text-yellow-600" disabled={recording}>
              <Send />
            </button>
          )}
          <button
            ref={recordBtnRef}
            onPointerDown={recordPointerStart}
            className={`p-2 rounded-full transition select-none ${
              recording ? (cancelBySwipe ? 'bg-red-400 text-white' : 'bg-yellow-600 text-white') : 'text-gray-500 hover:text-yellow-600'
            } ${cd > 0 ? 'opacity-50 pointer-events-none' : ''}`}
            disabled={recording || showRecConfirm || cd > 0}
            style={{ userSelect: 'none', touchAction: 'none' }}
          >
            <Mic />
          </button>
        </div>
        {showGiphy && (
          <div className="mt-2">
            <GiphySearch
              onSelect={url => {
                sendMessage({ type: 'gif', content: url });
                setShowGiphy(false);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
