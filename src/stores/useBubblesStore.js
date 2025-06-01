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

      setBubbles: (bubbles) =>
        set({
          bubbles: bubbles.map(b => ({
            ...b,
            reflections: b.reflections || 0,
            reflectsUsers: b.reflectsUsers || []
          }))
        }),

      updateBubble: (bubble) =>
        set(state => ({
          bubbles: state.bubbles.map(b =>
            b.id === bubble.id
              ? {
                  ...bubble,
                  reflections: bubble.reflections || 0,
                  reflectsUsers: bubble.reflectsUsers || []
                }
              : b
          )
        })),

      addBubble: (bubble) =>
        set(state => ({
          bubbles: [
            {
              ...bubble,
              reflections: bubble.reflections || 0,
              reflectsUsers: bubble.reflectsUsers || []
            },
            ...state.bubbles.filter(b => b.id !== bubble.id)
          ]
        })),

      removeBubble: (id) =>
        set(state => ({
          bubbles: state.bubbles.filter(b => b.id !== id)
        })),

      fetchAndSyncBubbles: async () => {
        const data = await fetchActiveBubbles();

        set({
          bubbles: Array.isArray(data)
            ? data.map(b => ({
                ...b,
                reflections: b.reflections || 0,
                reflectsUsers: b.reflectsUsers || []
              }))
            : []
        });

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

      toggleReflect: async (bubbleId) => {
        const uid = localStorage.getItem('bt_uid') || 'guest';
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
          if (useGamificationStore.getState().incrementReflects) {
            useGamificationStore.getState().incrementReflects();
          }
        }

        await supabase
          .from('bubbles')
          .update({ reflectsUsers, reflections })
          .eq('id', bubbleId);
      },

      hasUserReflected: (bubbleId) => {
        const uid = localStorage.getItem('bt_uid') || 'guest';
        const bubble = get().bubbles.find(b => b.id === bubbleId);
        return bubble && Array.isArray(bubble.reflectsUsers) && bubble.reflectsUsers.includes(uid);
      }
    }),
    { name: 'bubbletrouble-bubbles' }
  )
);
