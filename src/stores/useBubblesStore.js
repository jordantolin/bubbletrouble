// src/stores/useBubblesStore.js

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../supabaseClient';
import { useGamificationStore } from './useGamificationStore';
import { fetchActiveBubbles } from '../api/bubbles';

export const useBubblesStore = create(
  persist(
    (set, get) => ({
      bubbles: [], 

      // Sostituisce tutte le bolle (usato solo dal fetch iniziale)
      setBubbles: (bubbles) => set({ bubbles }),

      // Aggiorna una singola bolla dopo UPDATE (usato solo da sub realtime)
      updateBubble: (bubble) => set(state => ({
        bubbles: state.bubbles.map(b => b.id === bubble.id ? bubble : b)
      })),

      // Aggiunge una nuova bolla (usato solo da sub realtime)
      addBubble: (bubble) => set(state => ({
        bubbles: [bubble, ...state.bubbles.filter(b => b.id !== bubble.id)]
      })),

      // Rimuove una bolla (usato solo da sub realtime)
      removeBubble: (id) => set(state => ({
        bubbles: state.bubbles.filter(b => b.id !== id)
      })),

      // Fetch solo bolle attive (ultime 24h) + attiva subscription realtime Supabase
      fetchAndSyncBubbles: async () => {
        // Fetch solo bolle attive (ultime 24h)
        const data = await fetchActiveBubbles();
        console.log("DEBUG: fetchAndSyncBubbles SUPABASE DATA:", data);

        set({
          bubbles: Array.isArray(data)
            ? data.map(b => ({
                ...b,
                reflections: b.reflections || []
              }))
            : []
        });
        

        // Realtime subscription: ascolta tutte le modifiche su bubbles
        supabase
          .channel('public:bubbles')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'bubbles' },
            payload => {
              if (payload.eventType === 'INSERT') get().addBubble(payload.new);
              if (payload.eventType === 'UPDATE') get().updateBubble(payload.new);
              if (payload.eventType === 'DELETE') get().removeBubble(payload.old.id);
            }
          )
          .subscribe();
      },

      // Toggle reflect: aggiorna SOLO il DB, lo stato si aggiorna tramite la sub
      toggleReflect: async (bubbleId) => {
        const uid = localStorage.getItem('bt_uid') || 'guest';
        // Fetch la bolla aggiornata dal DB
        const { data: bubble, error } = await supabase
          .from('bubbles')
          .select('*')
          .eq('id', bubbleId)
          .single();
        if (error || !bubble) return;

        let reflectsUsers = bubble.reflectsUsers || [];
        let reflections = typeof bubble.reflections === 'number' ? bubble.reflections : 0;
        const hasReflected = reflectsUsers.includes(uid);

        if (hasReflected) {
          reflectsUsers = reflectsUsers.filter(u => u !== uid);
          reflections = Math.max(0, reflections - 1);
        } else {
          reflectsUsers = [...reflectsUsers, uid];
          reflections += 1;
          // XP o gamification (facoltativo)
          if (useGamificationStore.getState().incrementReflects) {
            useGamificationStore.getState().incrementReflects();
          }
        }

        await supabase
          .from('bubbles')
          .update({ reflectsUsers, reflections })
          .eq('id', bubbleId);

        // Lo store si aggiorna live tramite la subscription realtime!
      },

      // Ritorna true se l'utente ha già reflectato questa bolla
      hasUserReflected: (bubbleId) => {
        const uid = localStorage.getItem('bt_uid') || 'guest';
        const bubble = get().bubbles.find(b => b.id === bubbleId);
        return bubble && Array.isArray(bubble.reflectsUsers) && bubble.reflectsUsers.includes(uid);
      },
    }),
    { name: 'bubbletrouble-bubbles' }
  )
);
