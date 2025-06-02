import { toast } from 'react-toastify';
import { useSession } from '@supabase/auth-helpers-react';
import { uploadToCloudinary } from '../utils/uploadToCloudinary';
import AudioPlayerWithEqualizer from './AudioPlayerWithEqualizer';
import { useGamificationStore } from "../stores/useGamificationStore";
import { v4 as uuidv4 } from 'uuid';
import VoiceMessagePlayer from './VoiceMessagePlayer';
import { useBubblesStore } from "../stores/useBubblesStore";
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import ToastNotification from './ToastNotification';
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
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
dayjs.extend(duration);


// --- UPLOAD VERCEL BLOB: UNICA FUNZIONE --- //
// async function uploadToDropbox(file) { // MARKED FOR REMOVAL - CONTAINS HARDCODED SECRETS
//   const ACCESS_TOKEN = "YOUR_ACCESS_TOKEN_HERE"; // DO NOT HARDCODE SECRETS
//   // ... existing function body ...
//   return linkData.url.replace("?dl=0", "?raw=1");
// }
// IMPORTANT: The function uploadToDropbox has been removed due to a hardcoded access token.
// File uploads requiring Dropbox integration must be implemented via a secure backend service.

const uploadingMessages = new Set();
let mediaSending = false;



// ... (segue palette, helpers, FFT, SparkleIcon...)

// TIMER 24H (serve per il countdown delle bolle)
function getBubbleCountdown(createdAt) {
  const expire = new Date(new Date(createdAt).getTime() + 24 * 60 * 60 * 1000);
  const now = new Date();
  const ms = expire - now;
  if (ms <= 0) return "00:00:00";
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((ms % (1000 * 60)) / 1000);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

// ✅ Ripristino funzione clean
function clean(arr) {
  return arr.filter((m, i, all) =>
    !(
      m.pending &&
      all.some(
        real =>
          !real.pending &&
          real.content === m.content &&
          real.type === m.type &&
          real.user_id === m.user_id
      )
    )
  );
}

// PALETTE & HELPERS
const YELLOW_PALETTES = [
  'bg-yellow-50 text-yellow-900',
  'bg-yellow-100 text-yellow-900',
  'bg-yellow-200 text-yellow-900',
  'bg-yellow-300 text-yellow-900',
  'bg-yellow-400 text-yellow-900'
];
function getUserColor(userId, bubbleId) {
  const storageKey = 'bt_colors_per_bubble';
  const allColors = JSON.parse(localStorage.getItem(storageKey) || '{}');

  if (!allColors[bubbleId]) {
    allColors[bubbleId] = {};
  }

  if (!allColors[bubbleId][userId]) {
    allColors[bubbleId][userId] = YELLOW_PALETTES[Math.floor(Math.random() * YELLOW_PALETTES.length)];
    localStorage.setItem(storageKey, JSON.stringify(allColors));
  }

  return allColors[bubbleId][userId];
}

function getUserAvatarUrl(uid) {
  return `https://api.dicebear.com/7.x/thumbs/svg?seed=${uid}`;
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
    if (!active || !audioRef.current || audioRef.current.readyState < 3) {
      setHeights(Array(barCount).fill(18));
      return;
    }

    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const source = ctx.createMediaElementSource(audioRef.current);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = Math.pow(2, Math.ceil(Math.log2(barCount * 2)));

    source.connect(analyser);
    analyser.connect(ctx.destination);

    const freqArray = new Uint8Array(analyser.frequencyBinCount);

    function draw() {
      analyser.getByteFrequencyData(freqArray);
      const bandSize = Math.floor(freqArray.length / barCount);
      const newHeights = [];

      for (let i = 0; i < barCount; i++) {
        let sum = 0;
        for (let j = 0; j < bandSize; j++) {
          sum += freqArray[i * bandSize + j];
        }
        const avg = sum / bandSize;
        newHeights.push(10 + (avg / 255) * 28);
      }

      setHeights(newHeights);
      rafRef.current = requestAnimationFrame(draw);
    }

    draw();

    ctxRef.current = ctx;
    srcRef.current = source;
    analyserRef.current = analyser;

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      try { srcRef.current.disconnect(); } catch { }
      try { analyserRef.current.disconnect(); } catch { }
      try { ctxRef.current.close(); } catch { }
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
function getBubbleWidth(duration, min = 90, max = 360) {
  const seconds = Math.max(1, Math.min(duration || 1, 40));
  const t = (seconds - 1) / 39; // normalizza tra 0 e 1
  const curve = Math.pow(t, 0.9); // curva progressiva più visiva
  return `${min + (max - min) * curve}px`;
}

function getBarCount(widthPx) {
  const px = parseInt(widthPx);
  return Math.max(8, Math.min(30, Math.floor(px / 7.2)));
}


// --- SPARKLE ICON (inline, senza import dipendenze extra) ---
const SparkleIcon = ({ filled = false, ...props }) => (
  <span
    {...props}
    style={{
      display: 'inline-block',
      fontSize: 22,
      color: filled ? '#FFD600' : '#fff',
      filter: filled ? 'drop-shadow(0 0 5px #ffd600cc)' : '',
      verticalAlign: 'middle',
      transition: 'color 0.15s, filter 0.15s',
      // 👇 FORZA il colore anche se ci sono override esterni
      ...(filled ? {} : { WebkitTextStroke: "0.7px #fff" }),
      ...props.style,
    }}
    role="img"
    aria-label="sparkle"
  >
    ✨
  </span>
);
function useAudioFFTForId(id, playingId, barCount = 20) {
  const ref = useRef(null);
  const heights = useAudioFFT(ref, playingId === id, barCount);
  return heights;
}


function ChatView() {
  const { topic } = useParams(); // <-- topic qui è l'ID della bolla!
  const { bubbles, toggleReflect, hasUserReflected, setBubble } = useBubblesStore();
  const bubble = useMemo(() => {
    return bubbles.find(b => String(b.id) === String(topic));
  }, [bubbles, topic]);

  const fetchReflectionsForBubbleAndUpdateStore = useBubblesStore(state => state.fetchReflectionsForBubbleAndUpdateStore);

  const navigate = useNavigate();
  const chatContainerRef = useRef(null); // Ref for swipe gesture


useEffect(() => {
  if (bubble?.id) {
    fetchReflectionsForBubbleAndUpdateStore(bubble.id);
  }
}, [bubble?.id]);

  
  const bubbleTitle = bubble?.title || '';
  // const bubblePrompt = bubble?.prompt || ''; // Replaced by bubble.description for clarity
const bubbleCategory = bubble?.category || '';

  if (!bubble) return <div>Caricamento...</div>;

  const [countdown, setCountdown] = useState(getBubbleCountdown(bubble.created_at));
  const [isDescriptionOpen, setIsDescriptionOpen] = useState(false); // New state for dropdown

  const reflectionsCount = typeof bubble?.reflections === "number" ? bubble.reflections : 0;

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(getBubbleCountdown(bubble.created_at));
    }, 1000);
    return () => clearInterval(interval);
  }, [bubble.created_at]);

  // Swipe back gesture for mobile
  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    let startX = 0;
    let startY = 0;
    let isSwiping = false; // This flag determines if the CURRENT gesture is being processed as a swipe by our logic.
                           // It's reset on touchstart and can be turned off during touchmove if a scroll is detected.

    const handleTouchStart = (e) => {
      if (e.touches.length === 1) { // Only consider single-touch gestures for our swipe logic.
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        isSwiping = true; // Assume it's a potential swipe until proven otherwise (e.g., it becomes a clear scroll).
      } else {
        isSwiping = false; // More than one touch point, not a swipe we handle.
      }
    };

    const handleTouchMove = (e) => {
      if (!isSwiping || e.touches.length !== 1) {
        // If isSwiping is already false (meaning we've decided this gesture is a scroll),
        // or if it's no longer a single touch, do nothing further with this event.
        return;
      }

      const currentX = e.touches[0].clientX;
      const currentY = e.touches[0].clientY;
      const deltaX = currentX - startX;
      const deltaY = currentY - startY;
      
      const absDeltaX = Math.abs(deltaX);
      const absDeltaY = Math.abs(deltaY);

      // CRITICAL FIRST CHECK: If vertical movement is more significant than horizontal,
      // this gesture is primarily a scroll. Our custom swipe logic should yield.
      // Setting isSwiping to false ensures subsequent touchmove events for THIS GESTURE
      // are ignored by this handler, allowing native scroll to dominate.
      if (absDeltaY > absDeltaX) {
        isSwiping = false; 
        return; // Yield to native vertical scrolling.
      }
      
      // If we're here, it means absDeltaX >= absDeltaY (horizontal movement is dominant or equal).
      // Now, check if this dominant horizontal movement qualifies as a swipe-right for navigation.
      if (deltaX > 70) { // Threshold for swipe-right navigation.
        navigate('/', { replace: true });
        isSwiping = false; // Important: Deactivate swiping for this gesture after navigation to prevent multiple triggers.
      }
      // If horizontal movement is dominant but doesn't meet navigation criteria (e.g., swipe left, or too short),
      // isSwiping remains true for this touchmove event. We don't navigate. Native horizontal scrolling
      // is prevented by `touchAction: pan-y` on the containers and no horizontal overflow.
    };

    const handleTouchEnd = () => {
      isSwiping = false; // Reset swipe state at the end of the touch sequence
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: true });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });
    container.addEventListener('touchcancel', handleTouchEnd, { passive: true }); // Handle cancellation too

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [navigate]); // Dependency: navigate


  // --- CONTROLLO SCADENZA 24H ---
  const now = new Date();
  const createdAt = new Date(bubble.created_at);
  const diffHours = (now - createdAt) / (1000 * 60 * 60);
  if (diffHours > 24) {

    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FFF9ED] px-6 text-center">
        {/* BUBBLE + X */}
        <div className="relative w-28 h-28 mb-6">
          <div className="absolute inset-0 bg-yellow-300 rounded-full shadow-lg" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-red-600 text-6xl font-bold tracking-tight">✕</div>
          </div>
        </div>

        {/* TITLE */}
        <h1 className="text-[26px] font-extrabold text-red-600 mb-2 tracking-tight">
          This bubble has expired
        </h1>

        {/* SUBTEXT */}
        <p className="text-gray-700 text-[15px] max-w-xs mb-6 leading-relaxed">
          The conversation has self-destructed after 24 hours.
          It is no longer accessible.
        </p>

        {/* BUTTON */}
        <button
          onClick={() => (window.location.href = '/')}
          className="bg-yellow-400 hover:bg-yellow-500 text-white text-sm font-semibold px-6 py-2 rounded-full shadow border border-yellow-500 transition active:scale-95"
        >
          Return to the bubble world
        </button>
      </div>
    );
  }




  const bottomRef = useRef(null);
  const audioRefs = useRef({});
  const lastMessageRef = useRef(null);
  const [isSending, setIsSending] = useState(false);
  
  const timerText = useMemo(() => {
    if (!bubble?.expires_at) return '∞';
    const diff = dayjs(bubble.expires_at).diff(dayjs());
    if (diff <= 0) return '00:00:00';
    return dayjs.duration(diff).format('HH:mm:ss');
  }, [bubble]);
  
  





  // session UID
  const [uid, setUid] = useState(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUid(user.id);
    });
  }, []);


  // Messaggi & stato preview
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState('');
  const [preview, setPreview] = useState(null);
  const [previewType, setPreviewType] = useState(null);
  const [showGiphy, setShowGiphy] = useState(false);
  const fileRef = useRef(null);

  // AUDIO PLAYBACK & REC
  const [playingId, setPlayingId] = useState(null);
  const [activeIndex, setActiveIndex] = useState(null);
  const audioRef = useRef(null);
  const currentAudioRef = useRef(null);
  const [recording, setRecording] = useState(false);
  const mediaRef = useRef(null);
  const [recTime, setRecTime] = useState(0);
  const recTimerRef = useRef(null);
  const [showRecConfirm, setShowRecConfirm] = useState(false);
  const [recAudioBlob, setRecAudioBlob] = useState(null);

  const [voiceMessagePreview, setVoiceMessagePreview] = useState(null);

  const [cancelBySwipe, setCancelBySwipe] = useState(false);
  const recordBtnRef = useRef(null);

  // DRAG REC
  const [recDrag, setRecDrag] = useState(false);
  const [recDragDir, setRecDragDir] = useState(null);

  // COOLDOWN
  const [cd, setCd] = useState(0);
  const cdRef = useRef(null);
  const [showWarning, setShowWarning] = useState(false);

  // PRIMA VOLTA IN BOLLA
  const [isFirstInteraction, setIsFirstInteraction] = useState(false);
  const [showGlow, setShowGlow] = useState(false);

  const [reflectionCount, setReflectionCount] = useState(0);
  const [hasReflected, setHasReflected] = useState(false);

  const xp = bubble?.xp || 0;

  

  useEffect(() => {
    const initUser = async () => {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth?.user;
      if (!user) return window.location.href = "/auth";
      setUid(user.id);

      // Rimosso il redirect verso username-setup
      // Il componente gestisce gracefully i profili mancanti/incompleti
    };
    initUser();
  }, []);




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

  const heights = useAudioFFT(currentAudioRef, !!playingMsg, playbackBarCount);


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

  // GAMIFICATION: XP, streak, achievements
  const addXP = (amount, reason) => {
    useGamificationStore.getState().addXP(amount, reason);
    //useGamificationStore.getState().checkStreak();
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


  const sendMessage = async (msg) => {
    if (!uid) {
      console.warn("UID not ready, cancelling send.");
      alert("User session not ready. Please wait a moment and try again.");
      return;
    }

    if (!bubble || !bubble.id) {
      console.warn("Bubble ID not ready or invalid, cancelling send.");
      alert("Bubble information is not available. Cannot send message.");
      return;
    }

    const contentForDB = msg.type === 'audio' ? msg.content : msg.content.trim();

    if (isSending && msg.type !== 'audio') { // Allow concurrent audio sending if main flow isn't busy
      console.warn("Already sending a non-audio message, new send cancelled.")
      return;
    }
    setIsSending(true);

    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('username, avatar_url')
      .eq('id', uid)
      .maybeSingle();

    if (!existingProfile || !existingProfile.username || existingProfile.username.startsWith('user-')) {
      await supabase
        .from('profiles')
        .upsert({
          id: uid,
          username: existingProfile?.username || 'utente-' + uid.slice(0, 5),
          avatar_url: existingProfile?.avatar_url || ''
        }, { onConflict: 'id' });
    }

    const payload = {
      bubble_id: bubble.id,
      user_id: uid,
      content: contentForDB, // This will be attachment_url for audio, or trimmed text
      type: msg.type,
      duration: msg.duration || null,
      client_temp_id: msg.client_temp_id || null, // Include client_temp_id if present
    };

    // For non-audio messages, we might still add a pending message if needed,
    // but audio messages are handled optimistically by sendRecPreview.
    let tempId = null;
    if (msg.type !== 'audio') {
      tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      setMessages(prev => [
        ...prev,
        {
          id: tempId,
          ...payload,
          seenLocal: true,
          pending: true,
          profiles: { // Add a basic profile structure for consistent rendering
            username: existingProfile?.username || 'Me',
            avatar_url: existingProfile?.avatar_url || getUserAvatarUrl(uid || 'default'),
          }
        }
      ]);
    }

    console.log('[sendMessage] Payload:', payload);

    const { error } = await supabase.from('messages').insert([payload]);

    setIsSending(false); // Set to false after operation completes

    if (error) {
      console.error("Error saving message:", error);
      if (tempId) { // Only remove non-audio pending message on error
        setMessages(prev => prev.filter(m => m.id !== tempId));
      }
      alert(`Error sending message: ${error.message}. Please try again.`);
    } else {
      // For non-audio messages, the pending message will be replaced by the subscription.
      // For audio messages, the placeholder from sendRecPreview will be updated by subscription.
      console.log("Message sent to Supabase:", payload);

      if (msg.type === 'text') {
        addXP(5, "Message sent");
        startCd(calcCd(messages.length));
      } else if (msg.type === 'audio') {
        addXP(10, "Voice message sent");
        startCd(calcCd(messages.length));
      } else if (['image', 'video', 'gif'].includes(msg.type)) {
        addXP(7, "Media sent");
        startCd(calcCd(messages.length));
      }
    }
  };



  const onFile = async e => {
    const f = e.target.files[0];
    if (!f) return;

    const t = f.type.startsWith('image/') ? 'image' : f.type.startsWith('video/') ? 'video' : null;
    if (!t) return;

    if (mediaSending) {
      console.warn("Upload già in corso (onFile).");
      return;
    }

    // Preview (solo lato frontend)
    setPreview(URL.createObjectURL(f));
    setPreviewType(t);

    // Upload su Cloudinary
    try {
      mediaSending = true;
      console.log("[DEBUG] File da caricare su Cloudinary:", f);

      const url = await uploadToCloudinary(f);
      if (!url) {
        console.error("❌ Nessuna URL ottenuta da Cloudinary.");
        return;
      }


      const placeholder = {
        id: uuid(), // o usa una tua funzione
        user_id: session.user.id,
        bubble_id: bubbleId,
        content: URL.createObjectURL(audioFile),
        type: 'audio',
        duration: recTime,
        created_at: new Date().toISOString(),
        pending: true,
      };
      setMessages(prev => [...prev, placeholder]);


      console.log('[onFile] Cloudinary URL:', url); // LOGGING

      if (url) {
        sendMessage({ type: t, content: url });
        fileRef.current.value = null;
        setPreview(null);
        setPreviewType(null);
      }

    } catch (err) {
      console.error("Errore upload Cloudinary:", err);
      // UI ERROR HANDLING
      alert(`Error uploading file: ${err.message}. Please try again.`);
    } finally {
      mediaSending = false;
    }
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
  const session = useSession();
  // *** FIX: questa funzione ora resetta TUTTI gli stati della registrazione ***
  const sendRecPreview = async () => {
    if (!recAudioBlob || mediaSending) return;

    mediaSending = true;
    const tempId = uuidv4();

    if (messages.some(m => m.client_temp_id === tempId && m.pending)) {
      console.warn("Attempting to send a voice message with an existing and pending client_temp_id:", tempId);
      mediaSending = false;
      return;
    }

    const newMsgPlaceholder = {
      id: tempId,
      type: 'audio',
      content: URL.createObjectURL(recAudioBlob),
      blob: recAudioBlob,
      duration: recTime,
      user_id: session?.user?.id || null,
      created_at: new Date().toISOString(),
      pending: true,
      client_temp_id: tempId,
      attachment_url: null,
      profiles: {
        username: session?.user?.user_metadata?.username || 'Me',
        avatar_url: session?.user?.user_metadata?.avatar_url || getUserAvatarUrl(session?.user?.id || 'default'),
      }
    };

    setMessages(prev => [...prev, newMsgPlaceholder]);

    try {
      const audioFile = new File([recAudioBlob], `audio-${Date.now()}.webm`, {
        type: 'audio/webm',
      });

      const cloudinaryUrl = await uploadToCloudinary(audioFile);
      console.log('[sendRecPreview] Cloudinary URL:', cloudinaryUrl);

      if (!cloudinaryUrl) {
        throw new Error("Upload to Cloudinary failed, no URL returned.");
      }

      setMessages(prev =>
        prev.map(msg =>
          msg.client_temp_id === tempId
            ? {
              ...msg,
              attachment_url: cloudinaryUrl,
              content: cloudinaryUrl,
            }
            : msg
        )
      );

      await sendMessage({
        type: 'audio',
        content: cloudinaryUrl,
        duration: recTime,
        client_temp_id: tempId,
      });

    } catch (err) {
      console.error('[sendRecPreview] Upload or send failed:', err);
      toast.error('Error sending voice message: ' + err.message);
      setMessages(prev => prev.filter(m => m.client_temp_id !== tempId));
    } finally {
      setShowRecConfirm(false);
      setRecAudioBlob(null);
      setRecTime(0);
      setRecording(false);
      setCancelBySwipe(false);
      setRecDrag(false);
      setRecDragDir(null);
      setVoiceMessagePreview(null);
      if (recTimerRef.current) {
        clearInterval(recTimerRef.current);
        recTimerRef.current = null;
      }
      mediaSending = false;
    }
  };


  const togglePlay = id => {
    if (playingId === id) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setPlayingId(null);
    } else {
      setPlayingId(id);
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.currentTime = 0;
          audioRef.current.play().catch(err => {
            console.warn("Errore play audio:", err);
          });
        }
      }, 0);
    }
  };


  const formatSec = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

  // ------ HEADER CHAT: SPARKLE BUTTON ------
  // Bubble può essere undefined se la route è sbagliata!
  const reflections = bubble?.reflections || 0;
  const isReflected = bubble ? hasUserReflected(bubble.id) : false;
  // Carica i messaggi dal DB
  useEffect(() => {
    if (!bubble?.id) {
      console.log("Bubble ID is undefined, skipping message fetch.");
      setLoading(false); // Ensure loading is set to false if we can't fetch
      return;
    }

    console.log("Loading messages for bubble:", bubble.id);
    setLoading(true);

    // ✅ FETCH persistente dei messaggi dal DB
    supabase
      .from('messages')
      .select(`
        *,
        profiles!user_id (
          username,
          avatar_url
        )
      `)
      .eq('bubble_id', bubble.id)
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (error) {
          console.error("Error fetching initial messages:", error);
          setLoading(false);
          return;
        }
        setMessages(prev => {
          const messageMap = new Map();

          // Add existing pending messages first, if they are not already replaced by fetched data
          prev.forEach(msg => {
            if (msg.pending && msg.client_temp_id) {
              // If a fetched message matches this pending one, don't add the pending one to map yet.
              const fetchedMatch = (data || []).find(d => d.client_temp_id === msg.client_temp_id || d.id === msg.id);
              if (!fetchedMatch) {
                messageMap.set(msg.client_temp_id || msg.id, msg);
              }
            } else if (msg.pending) { // Non-audio pending messages without client_temp_id
              messageMap.set(msg.id, msg);
            }
          });

          // Add fetched messages, replacing pending ones if a match by client_temp_id or id is found
          (data || []).forEach(fetchedMsg => {
            if (fetchedMsg.client_temp_id && messageMap.has(fetchedMsg.client_temp_id)) {
              // If there's a pending message with this client_temp_id, update it but keep its blob if current one is missing content
              const pendingMsg = messageMap.get(fetchedMsg.client_temp_id);
              messageMap.set(fetchedMsg.client_temp_id, {
                ...pendingMsg, // keep local properties like blob if needed
                ...fetchedMsg, // override with DB data
                pending: false, // No longer pending
                // Keep blob from pendingMsg if fetchedMsg.content is not yet populated for some reason (should not happen)
                blob: !fetchedMsg.content && pendingMsg?.blob ? pendingMsg.blob : null,
              });
            } else {
              messageMap.set(fetchedMsg.id, { ...fetchedMsg, pending: false });
            }
          });

          const merged = Array.from(messageMap.values());
          return merged.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        });
        setLoading(false);
      });

    // ✅ Sottoscrizione realtime
    const subscription = supabase
      .channel(`messages-${bubble.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `bubble_id=eq.${bubble.id}`
        },
        (payload) => {
          supabase
            .from('messages')
            .select(`
              *,
              profiles!user_id (
                username,
                avatar_url
              )
            `)
            .eq('id', payload.new.id)
            .maybeSingle()
            .then(({ data: newMessage, error: fetchError }) => {
              if (fetchError) {
                console.error("Error fetching new message after realtime event:", fetchError);
                return;
              }
              if (!newMessage) {
                console.warn("Realtime event for a message not found:", payload.new.id);
                return;
              }

              setMessages(prev => {
                const messageMap = new Map();
                prev.forEach(m => messageMap.set(m.client_temp_id || m.id, m));

                const newMsgId = newMessage.client_temp_id || newMessage.id;
                const existingMsg = messageMap.get(newMsgId);

                if (existingMsg && existingMsg.pending) {
                  // Replace pending message with the new message from DB
                  messageMap.set(newMsgId, {
                    ...existingMsg, // keep some potentially useful optimistic UI state if needed
                    ...newMessage,
                    pending: false,
                    blob: null // Clear blob as we now have the final message
                  });
                } else if (!existingMsg) {
                  // New message not seen before, add it
                  messageMap.set(newMsgId, { ...newMessage, pending: false });
                } else {
                  // Message already exists and is not pending (e.g., received through initial fetch or previous update)
                  // Potentially update if needed, but usually just keep the existing one to avoid re-renders
                  // For now, we assume if it exists and not pending, it's up-to-date.
                  messageMap.set(newMsgId, { ...newMessage, pending: false }); // Ensure it's marked not pending
                }

                const updatedMessages = Array.from(messageMap.values());
                return updatedMessages.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
              });
            });
        }
      )
      .subscribe();

    return () => {
      if (subscription) {
        supabase.removeChannel(subscription).catch(error => console.error("Error unsubscribing:", error));
      }
    };
  }, [bubble?.id]); // Dependency on bubble.id




  // PATCH START - Glow prima bolla e input bar iPhone-safe
  // Check prima volta in questa bolla
  useEffect(() => {
    if (!uid || !bubble?.id) return;

    const visitedBubbles = JSON.parse(localStorage.getItem('bt_visited_bubbles') || '{}');
    const bubbleKey = `${uid}-${bubble.id}`;

    if (!visitedBubbles[bubbleKey]) {
      setIsFirstInteraction(true);
      setShowGlow(true);

      // Salva che ha visitato questa bolla
      visitedBubbles[bubbleKey] = Date.now();
      localStorage.setItem('bt_visited_bubbles', JSON.stringify(visitedBubbles));

      // XP bonus per prima volta
      setTimeout(() => {
        addXP(15, "Prima interazione in una nuova bolla!");
      }, 1500);

      // Rimuovi glow dopo 4 secondi
      setTimeout(() => {
        setShowGlow(false);
      }, 4000);
    }
  }, [uid, bubble?.id, addXP]);
  // PATCH END

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendTouchStart = () => {
    if (!isSending) {
      attemptSend();
    }
  };

  // Helper function to fetch the total reflection count for the current bubble
  const fetchReflectionCount = async () => {
    if (!bubble?.id) return;
    try {
      const { count, error } = await supabase
        .from('reflections')
        .select('*', { count: 'exact', head: true })
        .eq('bubble_id', bubble.id);

      if (error) {
        console.error("Error fetching reflection count:", error);
        setReflectionCount(0);
        return;
      }
      setReflectionCount(count || 0);
    } catch (e) {
      console.error("Exception fetching reflection count:", e);
      setReflectionCount(0);
    }
  };

  // Helper function to check if the current user has reflected
  const fetchHasReflected = async () => {
    if (!bubble?.id || !uid) {
      setHasReflected(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('reflections')
        .select('id') // We only need to know if a record exists
        .eq('bubble_id', bubble.id)
        .eq('user_id', uid)
        .limit(1);

      if (error) {
        console.error("Error fetching user reflection status:", error);
        setHasReflected(false);
        return;
      }
      setHasReflected(data && data.length > 0);
    } catch (e) {
      console.error("Exception fetching user reflection status:", e);
      setHasReflected(false);
    }
  };

  // Function to toggle a reflection (add or remove)
  const toggleReflection = async () => {
    if (!bubble?.id || !uid) {
      console.warn("Cannot toggle reflection: bubble ID or user ID is missing.");
      alert("Please log in to reflect on bubbles.");
      return;
    }

    try {
      // Check if a reflection already exists for this user and bubble
      const { data: existingReflection, error: checkError } = await supabase
        .from('reflections')
        .select('id')
        .eq('bubble_id', bubble.id)
        .eq('user_id', uid)
        .maybeSingle();

      if (checkError) {
        console.error("Error checking existing reflection:", checkError);
        alert("Could not check your reflection status. Please try again.");
        return;
      }

      const currentBubbleInStore = useBubblesStore.getState().bubbles.find(b => String(b.id) === String(bubble.id));

      if (existingReflection) {
        // Reflection exists, so delete it
        const { error: deleteError } = await supabase
          .from('reflections')
          .delete()
          .eq('bubble_id', bubble.id)
          .eq('user_id', uid);

        if (deleteError) {
          console.error("Error deleting reflection:", deleteError);
          alert("Could not remove your reflection. Please try again.");
        } else {
          setHasReflected(false);
          if (currentBubbleInStore) {
            useBubblesStore.getState().updateBubble({
              ...currentBubbleInStore,
              reflections: Math.max(0, (currentBubbleInStore.reflections || 0) - 1),
            });
          }
          // Optionally, fetch and update the global reflection count if needed elsewhere
          // fetchReflectionCount(); 
        }
      } else {
        // Reflection does not exist, so insert it
        const { error: insertError } = await supabase
          .from('reflections')
          .insert([{
            bubble_id: bubble.id,
            user_id: uid,
            reflected_at: new Date().toISOString(),
          }]);

        if (insertError) {
          console.error("Error inserting reflection:", insertError);
          alert("Could not add your reflection. Please try again.");
        } else {
          setHasReflected(true);
          if (currentBubbleInStore) {
            useBubblesStore.getState().updateBubble({
              ...currentBubbleInStore,
              reflections: (currentBubbleInStore.reflections || 0) + 1,
            });
          }
          // Optionally, fetch and update the global reflection count
          // fetchReflectionCount();
        }
      }
    } catch (e) {
      console.error("Unexpected error in toggleReflection:", e);
      alert("An unexpected error occurred while toggling reflection. Please try again.");
    }
  };

  // useEffect for initial fetch of reflection data and whenever bubble/user changes
  useEffect(() => {
    if (bubble?.id) {
      fetchReflectionCount();
      if (uid) {
        fetchHasReflected();
      } else {
        setHasReflected(false); // No user logged in, cannot have reflected
      }
    } else {
      setReflectionCount(0); // No bubble, so 0 reflections
      setHasReflected(false); // No bubble, so cannot have reflected
    }
  }, [bubble?.id, uid]); // Dependencies

  return (
<div
  ref={chatContainerRef}
  className="chat-container flex flex-col"
  style={{
    touchAction: 'pan-y',
    overscrollBehavior: 'none',
    WebkitOverflowScrolling: 'touch',
    userSelect: 'none',
    minHeight: '100dvh',
    background: '#FFF9ED',
    paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 80px)',
    overflowY: 'auto',
  }}
>

<div className="flex flex-col flex-1 bg-[#FFF9ED] overflow-x-hidden" style={{ minHeight: 0 }}> {/* Main content scroll area */}
    {/* Info Card Fissa - Updated classes for sticky behavior and style */}
    <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-yellow-300">
      <div className="flex items-start justify-between px-4 pt-3 pb-2">
        <div className="min-w-0 mr-2 flex-grow"> {/* Added flex-grow */}
          <h1 className="text-lg font-semibold leading-none break-words">{bubble?.name || 'Untitled'}</h1>
          
          {/* Dropdown Descrizione */}
          <div className="mt-1">
            <button 
              onClick={() => setIsDescriptionOpen(!isDescriptionOpen)}
              className="text-sm text-yellow-600 hover:text-yellow-700 flex items-center focus:outline-none"
            >
              {isDescriptionOpen ? 'Nascondi' : 'Leggi di più'}
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className={`h-4 w-4 ml-1 transition-transform duration-300 ${isDescriptionOpen ? 'rotate-180' : ''}`} 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div 
              className="overflow-hidden transition-all duration-500 ease-in-out"
              style={{ maxHeight: isDescriptionOpen ? '1000px' : '0px', opacity: isDescriptionOpen ? 1 : 0 }}
            >
              <p className="text-sm text-gray-700 leading-snug italic break-words pt-1 pb-2 pr-2 border-l-2 border-yellow-300 pl-2 my-1">
                {bubble.description?.trim() ? bubble.description : "Nessuna descrizione."}
              </p>
            </div>
          </div>

          {/* Countdown Timer - Styled as per request */}
          <p className="mt-1 px-3 py-1 rounded-full bg-yellow-50 text-yellow-800 font-mono tracking-wide shadow-inner text-sm w-fit">
            {countdown}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2 min-w-0 shrink-0 ml-2"> {/* Added ml-2 for spacing */}
          <p className="text-sm font-medium text-right text-gray-700 break-words whitespace-nowrap"> {/* Added whitespace-nowrap */}
            {bubble?.category || 'Senza categoria'}
          </p>
          <button
  onClick={toggleReflection}
  className="flex items-center gap-1 px-2 py-1 rounded-full shadow transition active:scale-95 bg-yellow-200/80 text-yellow-900"
  aria-label="Reflect bubble"
>
  <span role="img" aria-label="sparkle" className="text-xl">✨</span>
  <span className="ml-0.5 font-semibold">{bubble?.reflections || 0}</span>
</button>

        </div>
      </div>
    </div>



      {/* Messages */}
      <div
        className="messages flex-1 overflow-y-auto overflow-x-hidden px-4 pt-2"
        style={{
          WebkitOverflowScrolling: 'touch',     // For smooth iOS momentum scrolling
          overscrollBehavior: 'contain',       // Prevents scroll chaining (e.g., to body/window)
          minHeight: 0,                        // Essential in flex layouts for children to scroll correctly
          touchAction: 'pan-y',                 // Explicitly allow vertical panning (scrolling) on this element
          paddingBottom: '1rem',               // Preserve existing style
          scrollPaddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 70px)' // Preserve existing style
        }}
      >
        {clean(messages).map((msg, i) => {
          const keySafe = msg.id
            ? `msg-${msg.id}-${i}`
            : `pending-${msg.content?.slice(0, 20)}-${msg.type}-${msg.user_id}-${i}`;

          const isCurrentUser = msg.user_id === uid;
          const isAudio = msg.type === 'audio';
          if (!audioRefs.current[msg.id]) {
            audioRefs.current[msg.id] = React.createRef();
          }

          const formattedTime = msg.created_at
            ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
            : '';

          const bubbleColor =
            msg.user === 'sys'
              ? 'bg-yellow-200 text-yellow-900'
              : getUserColor(msg.user_id || 'default', bubble.id);

          const shouldGlow = i === 0 && showGlow && isFirstInteraction;

          return (
            <div
              key={keySafe}
              className={`flex flex-col animate-fade-in mb-3 ${isCurrentUser ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`flex items-start gap-2 w-fit max-w-[85%] ${isCurrentUser ? 'flex-row-reverse' : ''}`}
              >
                {!isCurrentUser && (
                  <img
                    src={msg.profiles?.avatar_url || getUserAvatarUrl(msg.user_id)}
                    alt="avatar"
                    className="w-8 h-8 rounded-full shadow-md border border-yellow-200 mt-1 shrink-0"
                  />
                )}

                <div className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'}`}>
                  {!isCurrentUser && (
                    <span className="text-xs text-gray-500 font-medium mb-0.5 ml-1">
                      {msg.profiles?.username || `User-${msg.user_id.slice(0, 4)}`}
                    </span>
                  )}

                  {msg.type === 'text' && (
                    <div className={`px-3 pt-2 pb-1 rounded-xl shadow-md break-words ${isCurrentUser ? 'bg-yellow-400 text-white' : 'bg-white text-gray-800 border border-gray-200'}`}>
                      <div>{msg.content}</div>
                      {formattedTime && (
                        <div className={`text-xs mt-0.5 ${isCurrentUser ? 'text-yellow-200 opacity-75' : 'text-gray-400'} text-right`}>
                          {formattedTime}
                        </div>
                      )}
                    </div>
                  )}

                  {['image', 'gif'].includes(msg.type) && (
                    <>
                      <img src={msg.content} alt="media" className="rounded-xl max-w-full max-h-[40vh] object-contain shadow-md" />
                      {formattedTime && (
                        <span className={`text-xs mt-0.5 ${isCurrentUser ? 'text-gray-500' : 'text-gray-400'}`}>
                          {formattedTime}
                        </span>
                      )}
                    </>
                  )}

                  {msg.type === 'video' && (
                    <>
                      <video controls className="rounded-xl max-w-full max-h-[40vh] shadow-md">
                        <source src={msg.content} />
                      </video>
                      {formattedTime && (
                        <span className={`text-xs mt-0.5 ${isCurrentUser ? 'text-gray-500' : 'text-gray-400'}`}>
                          {formattedTime}
                        </span>
                      )}
                    </>
                  )}

                  {isAudio && (
                    <>
                      <div
                        className="flex items-center justify-between transition-all overflow-hidden"
                        style={{
                          width: getBubbleWidth(msg.duration),
                          minWidth: '90px',
                          maxWidth: 'calc(100vw - 100px)',
                          cursor: 'pointer'
                        }}
                        onClick={() => togglePlay(msg.id)}
                      >
                        <AudioPlayerWithEqualizer
                          key={msg.id + (msg.pending ? '-pending' : '-real')}
                          style={{
                            zIndex: 10,
                            position: 'relative',
                            width: '100%',
                            pointerEvents: 'auto',
                          }}
                          src={msg.pending && msg.blob ? URL.createObjectURL(msg.blob) : (msg.attachment_url || msg.content)}
                          isActive={playingId === msg.id && activeIndex === i}
                          duration={msg.duration}
                          onPlay={() => {
                            setPlayingId(msg.id);
                            setActiveIndex(i);
                            if (audioRefs.current[msg.id] && audioRefs.current[msg.id].current) {
                              currentAudioRef.current = audioRefs.current[msg.id].current;
                            }
                          }}
                          onStop={() => {
                            setPlayingId(null);
                            setActiveIndex(null);
                            if (currentAudioRef.current && currentAudioRef.current.src === (msg.pending && msg.blob ? URL.createObjectURL(msg.blob) : (msg.attachment_url || msg.content))) {
                              currentAudioRef.current = null;
                            }
                          }}
                          audioRef={audioRefs.current[msg.id]}
                          showTimeRight
                          isCurrentUser={isCurrentUser}
                        />
                      </div>
                      {formattedTime && (
                        <span className={`text-xs mt-0.5 ${isCurrentUser ? 'text-gray-500' : 'text-gray-400'}`}>
                          {formattedTime}
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Barra di registrazione vocale - iPhone safe */}
      {(recording && !showRecConfirm) && (
        <div className="fixed inset-x-0 z-30 flex justify-center px-4 pointer-events-auto"
          style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 80px)' }}>
          <div
            className="flex items-center bg-yellow-100 shadow px-3 py-3 rounded-2xl border border-yellow-300 animate-fade-in pointer-events-auto w-full"
            style={{
              width: bubbleWidth,
              maxWidth: 'calc(100vw - 2rem)',
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

      {/* Conferma invio/cancella vocale - iPhone safe */}
      {showRecConfirm && recAudioBlob && (
        <div className="fixed inset-x-0 z-30 flex justify-center px-4 pointer-events-auto"
          style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 80px)' }}>

          <div
            className="flex items-center bg-yellow-100 border border-yellow-200 shadow rounded-2xl px-4 py-2 w-full"
            style={{
              width: bubbleWidth,
              maxWidth: 'calc(100vw - 2rem)',
              minWidth: 150,
              boxShadow: '0 1.5px 6px 0 rgba(210,180,60,0.10)'
            }}
          >
            <button
              onClick={() => { setShowRecConfirm(false); setRecAudioBlob(null); setRecTime(0); setRecording(false); }}
              className="flex items-center justify-center rounded-full border border-red-200 mr-4 touch-manipulation"
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
              className={`flex items-center justify-center rounded-full shadow touch-manipulation
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

      {/* Preview immagini/video - iPhone safe */}
      {preview && previewType && previewType !== 'audio' && (
        <div className="fixed bottom-20 inset-x-0 px-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl border border-yellow-200 p-4 w-full max-w-md mx-auto flex flex-col items-center space-y-4">
            {previewType === 'image' ? (
              <img src={preview} alt="preview" className="rounded-xl max-h-[240px] w-auto object-contain" />
            ) : (
              <video controls className="rounded-xl max-h-[240px] w-full">
                <source src={preview} />
              </video>
            )}
            <div className="flex w-full justify-between items-center mt-2">
              <button
                onClick={() => {
                  setPreview(null);
                  setPreviewType(null);
                  fileRef.current.value = null;
                }}
                className="text-red-500 text-base font-semibold touch-manipulation"
              >
                Annulla
              </button>

              <button
                onClick={async () => {
                  if (mediaSending) {
                    console.warn("Upload già in corso.");
                    return;
                  }
                  mediaSending = true;
                  try {

                    const blob = await fetch(preview).then(r => r.blob());
                    const file = new File([blob], `media-${Date.now()}.${previewType === 'image' ? 'jpg' : 'mp4'}`, { type: blob.type });
                    url = await uploadToCloudinary
                      (file);

                    console.log('[preview send] Cloudinary URL:', url); // LOGGING

                    if (url) {
                      setPreview(null);
                      setPreviewType(null);
                      fileRef.current.value = null;
                      sendMessage({ type: previewType, content: url });
                    }
                  } catch (err) {
                    console.error("Errore invio media:", err);
                    // UI ERROR HANDLING
                    alert(`Error sending media: ${err.message}. Please try again.`);
                  } finally {
                    mediaSending = false;
                  }
                }}
                className="bg-yellow-400 hover:bg-yellow-500 text-white font-bold px-6 py-2 rounded-full shadow-lg text-base touch-manipulation"
              >
                Invia
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Input Bar - Footer */}
      <div
        className="fixed inset-x-0 z-50 w-full bg-[#FFF9ED] border-t border-yellow-200 px-3 py-3 flex items-center gap-2 transition-all duration-300"
        style={{
          bottom: 'env(safe-area-inset-bottom)',
          paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)',
          boxShadow: '0 -2px 6px rgba(0, 0, 0, 0.05)',
          borderTopLeftRadius: '18px',
          borderTopRightRadius: '18px',
        }}
      >
        {showWarning && (
          <div className="absolute inset-x-0 -top-6 flex justify-center pointer-events-none">
            <div className="bg-gray-100 text-gray-700 text-sm px-3 py-1 rounded-lg shadow-sm">
              ⏳ Daddy chill
            </div>
          </div>
        )}

        {/* Attachment */}
        <button
          onClick={() => fileRef.current.click()}
          className="text-gray-500 hover:text-yellow-600 p-1.5 rounded-full active:scale-95 touch-manipulation transition shrink-0"
        >
          <Paperclip className="w-5 h-5" />
        </button>

        {/* GIF */}
        <button
          onClick={() => setShowGiphy(!showGiphy)}
          className="text-yellow-600 font-semibold text-sm px-1 active:scale-95 touch-manipulation transition shrink-0"
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

        {/* Input Field */}
        <input
          type="text"
          inputMode="text"
          className="flex-1 min-w-0 text-[17px] px-4 py-2.5 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition placeholder:text-gray-400"
          placeholder="Write a message..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSendTouchStart()}
          disabled={recording}
        />

        {/* Send or Cooldown */}
        {cd > 0 ? (
          <div className="w-7 h-7 flex items-center justify-center shrink-0">
            <CooldownCircle cd={cd} maxCd={5000} />
          </div>
        ) : (
          <button
            onClick={handleSendTouchStart}
            className="text-yellow-600 p-1.5 rounded-full active:scale-95 touch-manipulation transition shrink-0"
            disabled={recording}
          >
            <Send className="w-5 h-5" />
          </button>
        )}

        {/* Mic Button */}
        <button
          ref={recordBtnRef}
          onPointerDown={recordPointerStart}
          className={`p-1.5 rounded-full transition touch-manipulation active:scale-95 shrink-0 ${
            recording
              ? cancelBySwipe
                ? 'bg-red-400 text-white'
                : 'bg-yellow-600 text-white'
              : 'text-gray-500 hover:text-yellow-600'
          } ${cd > 0 ? 'opacity-50 pointer-events-none' : ''}`}
          disabled={recording || showRecConfirm || cd > 0}
          style={{ touchAction: 'none' }}
        >
          <Mic className="w-5 h-5" />
        </button>

        {/* Giphy Picker */}
        {showGiphy && (
          <div
            className="absolute bottom-full left-0 right-0 p-2 bg-white shadow-lg rounded-t-lg border-t border-gray-200"
            style={{ marginBottom: '-1px' }}
          >
            <GiphySearch
              onSelect={url => {
                sendMessage({ type: 'gif', content: url });
                setShowGiphy(false);
              }}
            />
          </div>
        )}
        </div> {/* chiude .chat-container */}
        </div> {/* chiude fixed top wrapper */}
        </div>
      );
}



export default ChatView;
