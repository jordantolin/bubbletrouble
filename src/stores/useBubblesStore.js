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

      updateBubbleReflectState: (bubbleId, { reflectsUsers, reflections }) =>
        set(state => ({
          bubbles: state.bubbles.map(b =>
            b.id === bubbleId
              ? { ...b, reflectsUsers: reflectsUsers || [], reflections: reflections || 0 }
              : b
          )
        })),

      fetchReflectionsForBubbleAndUpdateStore: async (bubbleId) => {
        if (!bubbleId) return;
        try {
          const { data, error, count } = await supabase
            .from('reflections')
            .select('user_id', { count: 'exact' })
            .eq('bubble_id', bubbleId);

          if (error) {
            console.error('[Store] Error fetching reflections:', error);
            return;
          }

          const reflectsUsers = data ? data.map(r => r.user_id) : [];
          const reflectionsCount = count || 0;
          get().updateBubbleReflectState(bubbleId, { reflectsUsers, reflections: reflectionsCount });
        } catch (e) {
          console.error('[Store] Exception fetching reflections:', e);
        }
      },

      fetchAndSyncBubbles: async () => {
        const data = await fetchActiveBubbles();
      
        const bubbles = Array.isArray(data)
          ? data.map(b => ({
              ...b,
              reflections: b.reflections || 0,
              reflectsUsers: b.reflectsUsers || []
            }))
          : [];
      
        set({ bubbles });
      
        // 🔥 AGGIUNGI QUESTO: sincronizza le reflection per ogni bubble
        for (const b of bubbles) {
          await get().fetchReflectionsForBubbleAndUpdateStore(b.id);
        }
      
        // 🔁 Subscriptions
        supabase
          .channel('public:bubbles')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'bubbles' }, payload => {
            if (payload.eventType === 'INSERT') get().addBubble(payload.new);
            if (payload.eventType === 'UPDATE') get().updateBubble(payload.new);
            if (payload.eventType === 'DELETE') get().removeBubble(payload.old.id);
          })
          .subscribe();
      },      

      toggleReflect: async (bubbleId) => {
        let uid = localStorage.getItem('bt_uid');

        if (!uid) {
          const { data: { user }, error } = await supabase.auth.getUser();
          if (error || !user?.id) {
            console.warn("[Store] User ID not found, cannot toggle reflect.");
            return;
          }
          uid = user.id;
        }
        if (!bubbleId) {
          console.warn("[Store] Bubble ID not found, cannot toggle reflect.");
          return;
        }

        const bubble = get().bubbles.find(b => String(b.id) === String(bubbleId));
        if (!bubble) {
          console.warn(`[Store] Bubble with id ${bubbleId} not found in store.`);
          return;
        }

        const hasReflected = bubble.reflectsUsers && bubble.reflectsUsers.includes(uid);

        if (hasReflected) {
          // User has reflected, so delete the reflection
          const { error: deleteError } = await supabase
            .from('reflections')
            .delete()
            .eq('bubble_id', bubbleId)
            .eq('user_id', uid);

          if (deleteError) {
            console.error('[Store] Error deleting reflection:', deleteError);
            // Potentially revert optimistic update or show error to user
          } else {
            // Successfully deleted, now fetch updated state from DB
            await get().fetchReflectionsForBubbleAndUpdateStore(bubbleId);
            // Gamification: Note - decrementing points on un-reflecting might be desired or not.
            // For now, we only add points on reflecting.
          }
        } else {
          // User has not reflected, so insert a new reflection
          const { error: insertError } = await supabase
            .from('reflections')
            .insert([{ bubble_id: bubbleId, user_id: uid, reflected_at: new Date().toISOString() }]);

          if (insertError) {
            console.error('[Store] Error inserting reflection:', insertError);
            // Potentially revert optimistic update or show error to user
          } else {
            // Successfully inserted, now fetch updated state from DB
            await get().fetchReflectionsForBubbleAndUpdateStore(bubbleId);
            // Gamification
            if (useGamificationStore.getState().incrementReflects) {
              useGamificationStore.getState().incrementReflects();
            }
            // You might want to add XP here specifically for reflecting
            // useGamificationStore.getState().addXP(10, "Reflected on a bubble");
          }
        }
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
