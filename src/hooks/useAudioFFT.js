import { useState, useEffect, useRef } from 'react';

const nextPowerOfTwo = (x) => Math.pow(2, Math.ceil(Math.log2(x)));

export const useAudioFFT = (audioRef, isActive, barCount = 24) => {
  const [heights, setHeights] = useState(Array(barCount).fill(0));
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);
  const dataArrayRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    if (isActive && audioRef.current && audioRef.current.readyState >= 1 /* HAVE_METADATA */) {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        analyserRef.current = audioContextRef.current.createAnalyser();
        // Imposta fftSize in base al barCount, assicurandoti che sia una potenza di 2
        // e almeno 2 volte il barCount per una buona risoluzione per banda.
        analyserRef.current.fftSize = nextPowerOfTwo(Math.max(32, barCount * 2));
        sourceRef.current = audioContextRef.current.createMediaElementSource(audioRef.current);
        sourceRef.current.connect(analyserRef.current);
        // Non connettere l'analyser alla destinazione se non vuoi sentire l'audio processato due volte
        // o se l'audio originale sta già andando alla destinazione.
        // Per la sola visualizzazione, non è necessario connetterlo alla destinazione.
        // Se l'audio non si sente, potresti dover connettere sourceRef.current anche a audioContextRef.current.destination
        // MA SOLO SE audioRef.current non sta già suonando attraverso il tag <audio> visibile.
        // sourceRef.current.connect(audioContextRef.current.destination); // Opzionale, spesso non necessario per visualizzazione

        dataArrayRef.current = new Uint8Array(analyserRef.current.frequencyBinCount);
      }

      const animate = () => {
        if (analyserRef.current && dataArrayRef.current) {
          analyserRef.current.getByteFrequencyData(dataArrayRef.current);
          const newHeights = [];
          const bandWidth = Math.floor(dataArrayRef.current.length / barCount);
          for (let i = 0; i < barCount; i++) {
            let sum = 0;
            for (let j = 0; j < bandWidth; j++) {
              sum += dataArrayRef.current[i * bandWidth + j];
            }
            const average = sum / bandWidth;
            newHeights.push(average);
          }
          setHeights(newHeights);
        }
        rafRef.current = requestAnimationFrame(animate);
      };
      animate();

    } else {
      // Cleanup quando non attivo o audio non pronto
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      setHeights(Array(barCount).fill(0)); // Resetta le barre
    }

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      // Non chiudere il contesto audio qui, potrebbe essere riutilizzato.
      // La chiusura del contesto avverrà quando il componente che usa l'hook viene smontato,
      // o se l'audioRef cambia e non è più valido.
    };
  }, [isActive, audioRef, barCount]);

  // Effetto per pulire il contesto audio quando il componente viene smontato
  useEffect(() => {
    const audioCtx = audioContextRef.current;
    const audioSrc = sourceRef.current;
    const audioAnalyser = analyserRef.current;
    return () => {
      if (audioSrc) {
        audioSrc.disconnect();
      }
      if (audioAnalyser) {
        audioAnalyser.disconnect();
      }
      if (audioCtx && audioCtx.state !== 'closed') {
        audioCtx.close().catch(console.error);
      }
    };
  }, []);

  return { heights, analyserRef: analyserRef.current, bufferLength: analyserRef.current?.frequencyBinCount };
};
