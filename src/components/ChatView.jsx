import React, { useState, useRef, useEffect } from 'react';
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

// -------------------------------------------------------------------------
// PALETTE & HELPERS
// -------------------------------------------------------------------------
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

// Genera un array di altezze per equalizzatore: se in riproduzione, oscillano, altrimenti fisse
const genHeights = (seconds, animate = false) => {
  const count = Math.max(1, Math.min(40, Math.round(seconds)));
  if (!animate) return Array(count).fill(24);
  // Se animato, genera valori oscillanti tra 16 e 32
  return Array.from({ length: count }, (_, i) => 16 + Math.abs(Math.sin(Date.now() / 200 + i)) * 16);
};

// Cerchio di caricamento cooldown
function CooldownCircle({ cd, maxCd }) {
  return (
    <div className="relative w-8 h-8 flex items-center justify-center text-yellow-600">
      <svg
        className="animate-spin-reverse"
        viewBox="0 0 36 36"
        style={{ width: 36, height: 36 }}
      >
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

  // messaggi
  const [messages, setMessages] = useState([
    { id: 1, type: 'text', content: `Welcome to the "${topic}" bubble!`, user: 'sys' }
  ]);
  const [input, setInput] = useState('');
  const [preview, setPreview] = useState(null);
  const [previewType, setPreviewType] = useState(null);
  const [showGiphy, setShowGiphy] = useState(false);
  const fileRef = useRef(null);

  // audio playback & recording
  const [playingId, setPlayingId] = useState(null);
  const audioRef = useRef(null);
  const [recording, setRecording] = useState(false);
  const mediaRef = useRef(null);
  const [recTime, setRecTime] = useState(0);
  const recTimerRef = useRef(null);
  const [showRecConfirm, setShowRecConfirm] = useState(false);
  const [cancelBySwipe, setCancelBySwipe] = useState(false);
  const recordBtnRef = useRef(null);

  // cooldown
  const [cd, setCd] = useState(0);
  const cdRef = useRef(null);
  // warning on attempt
  const [showWarning, setShowWarning] = useState(false);

  // scroll on new msg
  useEffect(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), [messages]);
  useEffect(() => () => mediaRef.current?.stream.getTracks().forEach(t => t.stop()), []);

  // cooldown helpers
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

  // invio con warning
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

  // invia msg
  const sendMessage = msg => {
    setMessages(m => [
      ...m,
      {
        id: Date.now(),
        ...msg,
        user: uid,
        ...(msg.type === 'audio'
          ? {
              duration: msg.duration,
              barCount: Math.max(5, Math.ceil(msg.duration * 5)),
              heights: genHeights(Math.max(5, Math.ceil(msg.duration * 5)))
            }
          : {})
      }
    ]);
    startCd(calcCd(messages.length + 1));
  };

  // file / preview
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

  // registra stile WhatsApp
  const startRecording = async () => {
    if (recording) return;
    setCancelBySwipe(false);
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mr = new MediaRecorder(stream);
    let chunks = [];
    mr.ondataavailable = e => chunks.push(e.data);
    mr.onstop = () => {
      if (!cancelBySwipe) {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setShowRecConfirm(false);
        sendMessage({ type: 'audio', content: url, duration: recTime });
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

  // Cancella vocale in corso
  const cancelRecording = () => {
    setCancelBySwipe(true);
    stopRecording();
    setRecTime(0);
    setShowRecConfirm(false);
  };

  // Eventi per il pulsante stile WhatsApp
  const handleRecordMouseDown = e => {
    e.preventDefault();
    startRecording();
    window.addEventListener('mousemove', handleRecordMouseMove);
    window.addEventListener('mouseup', handleRecordMouseUp);
  };
  const handleRecordMouseUp = e => {
    window.removeEventListener('mousemove', handleRecordMouseMove);
    window.removeEventListener('mouseup', handleRecordMouseUp);
    if (!cancelBySwipe) stopRecording();
  };
  const handleRecordMouseMove = e => {
    if (!recordBtnRef.current) return;
    const rect = recordBtnRef.current.getBoundingClientRect();
    if (e.clientX < rect.left - 40) {
      setCancelBySwipe(true);
      cancelRecording();
    }
  };
  // Touch events
  const handleRecordTouchStart = e => {
    startRecording();
    window.addEventListener('touchmove', handleRecordTouchMove);
    window.addEventListener('touchend', handleRecordTouchEnd);
  };
  const handleRecordTouchEnd = e => {
    window.removeEventListener('touchmove', handleRecordTouchMove);
    window.removeEventListener('touchend', handleRecordTouchEnd);
    if (!cancelBySwipe) stopRecording();
  };
  const handleRecordTouchMove = e => {
    if (!recordBtnRef.current) return;
    const rect = recordBtnRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    if (touch.clientX < rect.left - 40) {
      setCancelBySwipe(true);
      cancelRecording();
    }
  };

  // play / pause
  const togglePlay = id => {
    if (playingId === id) {
      audioRef.current.pause();
      setPlayingId(null);
    } else {
      setPlayingId(id);
      setTimeout(() => audioRef.current.play(), 0);
    }
  };

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
                <>
                  <button onClick={() => togglePlay(msg.id)} className="p-2 bg-white rounded-full">
                    {playingId === msg.id ? (
                      <Pause size={20} className="text-yellow-600" />
                    ) : (
                      <Play size={20} className="text-yellow-600" />
                    )}
                  </button>
                  {playingId === msg.id && (
                    <audio ref={audioRef} src={msg.content} onEnded={() => setPlayingId(null)} />
                  )}
                  <div className="flex flex-1 space-x-0.5 items-end h-8">
                    {(playingId === msg.id
                      ? genHeights(msg.heights.length, true)
                      : msg.heights
                    ).map((h, i) => (
                      <div
                        key={i}
                        className="bg-yellow-600 rounded-b"
                        style={{
                          width: '3px',
                          height: `${h}px`,
                          animation:
                            playingId === msg.id
                              ? `wave 0.8s ease-in-out infinite alternate`
                              : 'none',
                          animationDelay: `${(i * 0.08).toFixed(2)}s`
                        }}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Preview */}
      {preview && (
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
          />
          <button onClick={attemptSend} className="text-yellow-600">
            <Send />
          </button>
          <button
            ref={recordBtnRef}
            onMouseDown={handleRecordMouseDown}
            onTouchStart={handleRecordTouchStart}
            className={`p-2 rounded-full transition select-none ${
              recording ? (cancelBySwipe ? 'bg-red-400 text-white' : 'bg-yellow-600 text-white') : 'text-gray-500 hover:text-yellow-600'
            }`}
            disabled={showRecConfirm}
            style={{ userSelect: 'none' }}
          >
            <Mic />
          </button>
          {recording && !showRecConfirm && (
            <span className={`ml-2 text-sm ${cancelBySwipe ? 'text-red-600' : 'text-yellow-800'} animate-pulse`}>
              {cancelBySwipe ? 'Trascina per annullare' : `● ${recTime}s`}
            </span>
          )}
        </div>
        {showRecConfirm && (
          <div className="flex items-center justify-center gap-4 mt-4">
            <span className="text-yellow-700 font-semibold">Vocale massimo raggiunto (40s)</span>
            <button
              onClick={stopRecording}
              className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition"
            >
              Invia
            </button>
            <button
              onClick={cancelRecording}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
            >
              Cancella
            </button>
          </div>
        )}
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
