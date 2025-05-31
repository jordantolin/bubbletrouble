import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './components/Header';
import SplashScreen from './components/SplashScreen';
import ThreeDCanvas from './components/ThreeDCanvas';
import { useBubblesStore } from './stores/useBubblesStore';
import { supabase } from './supabaseClient';


function MainApp() {
  const [showSplash, setShowSplash] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const debounceTimeout = useRef(null);
  const [selectedTopic, setSelectedTopic] = useState('Tutti');
  const navigate = useNavigate();

  const fetchAndSyncBubbles = useBubblesStore(state => state.fetchAndSyncBubbles);
  const bubbles = useBubblesStore(state => state.bubbles);

  // 🔁 Fetch iniziale + sub realtime
  useEffect(() => {
    fetchAndSyncBubbles();
    // eslint-disable-next-line
  }, []);



  useEffect(() => {
    const checkProfile = async () => {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth?.user;
      if (!user) return;

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Errore nel recuperare il profilo:", error.message);
        // Potresti voler gestire l'errore in modo più specifico, es. mostrare un messaggio
        // Per ora, non facciamo nulla e lasciamo che l'app carichi
        return;
      }

      // Se il profilo non esiste, o non ha username, o l'username è quello di default
      // reindirizza alla pagina profilo per completare/modificare i dati.
      if (!profile || !profile.username || profile.username.startsWith("user-")) {
        console.log("Profilo incompleto o username di default, redirect a /profile");
        navigate("/profile"); // Modificato il redirect
      }
    };

    checkProfile();
  }, []);


  // ⏳ Debounce per la search bar
  useEffect(() => {
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    debounceTimeout.current = setTimeout(() => {
      setDebouncedSearch(searchText);
    }, 300);
    return () => clearTimeout(debounceTimeout.current);
  }, [searchText]);

  // 🔎 Ricerca case-insensitive
  const filteredBubbles = bubbles.filter(bubble => {
    if (!bubble || typeof bubble.name !== "string") return false;
    const name = bubble.name.toLowerCase();
    const topic = (bubble.topic || '').toLowerCase();
    const search = (debouncedSearch || "").toLowerCase();
    return name.includes(search) || topic.includes(search);
  });

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#FFF9ED]">
      {!showSplash && (
        <Header
          searchText={searchText}
          onSearchChange={setSearchText}
        />
      )}
      {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}

      <ThreeDCanvas
        bubbles={filteredBubbles}
        onBubbleClick={(bubble) => navigate(`/chat/${encodeURIComponent(bubble.id)}`)}
      />

      {/* Elemento UIOverlay rimosso poiché il file è stato eliminato.
          La funzionalità di UIOverlay (es. selezione topic) andrà reimplementata se necessaria.
      <div className="absolute inset-0 z-50 pointer-events-none">
        <UIOverlay
          selectedTopic={selectedTopic}
          onTopicChange={setSelectedTopic}
        />
      </div>
      */}
    </div>
  );
}

export default MainApp;
