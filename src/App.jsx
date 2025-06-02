import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Profile from './pages/Profile';
import Header from './components/Header';
import SplashScreen from './components/SplashScreen';
import ThreeDCanvas from './components/ThreeDCanvas';
import ChatView from './components/ChatView';
import MainApp from './MainApp';
import { useGamificationStore } from './stores/useGamificationStore';
import AuthForm from './components/AuthForm';
import { supabase } from './supabaseClient';
import PublicProfile from './pages/PublicProfile';
import BubbleExpired from "./pages/BubbleExpired";
import InstallPrompt from './components/InstallPrompt';

import { Navigate } from "react-router-dom";

import { SessionContextProvider } from '@supabase/auth-helpers-react';

function App() {
  const toasts = useGamificationStore((s) => s.toasts);
  const removeToast = useGamificationStore((s) => s.removeToast);
  const [streak, setStreak] = useState(null);
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [session, setSession] = useState(null);

  useEffect(() => {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    const isMobileDevice = /android|iphone|ipad|ipod|opera mini|iemobile|wpdesktop/i.test(userAgent.toLowerCase());
    setIsMobile(isMobileDevice);
  }, []);

  useEffect(() => {
    if (isMobile) {
      const timeout = setTimeout(() => setShowIntro(false), 2800);
      return () => clearTimeout(timeout);
    } else {
      setShowIntro(false);
    }
  }, [isMobile]);

  // ✅ AUTH SESSION CHECK
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setAuthChecked(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // ✅ STREAK TOAST
  useEffect(() => {
    const streakToast = toasts.find(t => t.type === "streak");
    if (streakToast) {
      setStreak(streakToast.streak);
      setTimeout(() => {
        removeToast(streakToast.id);
        setStreak(null);
      }, 2300);
    }
  }, [toasts, removeToast]);

  // ✅ BLOCCO DI SICUREZZA
  if (!authChecked) return null;

  return (
    <SessionContextProvider supabaseClient={supabase} initialSession={session}>
      <Router>
        {showIntro ? (
          <SplashScreen onFinish={() => setShowIntro(false)} />
        ) : (
          <>
            {streak && <StreakPopup count={streak} onClose={() => setStreak(null)} />}
            <InstallPrompt />
            <Routes>
              {!user ? (
                <Route path="/*" element={<AuthForm />} />
              ) : (
                <>
                  <Route path="/" element={<MainApp />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/chat/:topic" element={<ChatView />} />
<Route path="*" element={<Navigate to="/" />} />
                  <Route path="/profile/:id" element={<PublicProfile />} />
                  <Route path="/bubble-expired" element={<BubbleExpired />} />
                </>
              )}
            </Routes>
          </>
        )}
      </Router>
    </SessionContextProvider>
  );
}

export default App;

// test salvataggio forzato
