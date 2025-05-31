import { supabase } from '../supabaseClient'; // Assicurati che il path sia corretto
import { useGamificationStore } from '../stores/useGamificationStore';

// --- Fetch tutte le bolle dal DB, ordinate per data di creazione (più recente prima)
export async function createBubble({ user_id, ...bubbleData }) {
  const { data, error } = await supabase
    .from('bubbles')
    .insert([{ ...bubbleData, user_id }])
    .select()
    .single();

  if (error) throw error;

  // Gamification: XP + achievement
  const gamification = useGamificationStore.getState();
  gamification.addXP(20, 'Hai creato la tua prima bolla');
  gamification.unlockAchievement({
    key: "first_bubble",
    description: "Hai creato la tua prima bolla! 🗨️",
    unlockedAt: new Date().toISOString()
  });

  return data;
}


// Controlla quante bolle ha già creato l'utente oggi
export async function countBubblesToday(userId) {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const { data, error } = await supabase
    .from('bubbles')
    .select('id')
    .eq('user_id', userId)
    .gte('created_at', startOfDay.toISOString());
  if (error) throw error;
  return data.length;
}


// --- Aggiorna reflects di una bolla (opzionale, se vuoi chiamarla separatamente)
export async function updateReflects(bubbleId, reflectsUsers, reflections) {
  const { data, error } = await supabase
    .from('bubbles')
    .update({ reflectsUsers, reflections })
    .eq('id', bubbleId)
    .select()
    .single();

  if (error) {
    console.error('Errore updateReflects:', error);
    throw error;
  }

  return data;
}

// --- Cancella una bolla (opzionale, per admin)
export async function deleteBubble(bubbleId) {
  const { error } = await supabase
    .from('bubbles')
    .delete()
    .eq('id', bubbleId);

  if (error) {
    console.error('Errore deleteBubble:', error);
    throw error;
  }
  return true;
}
export async function fetchActiveBubbles() {
  const { data, error } = await supabase
    .from('bubbles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    alert("Supabase error: " + JSON.stringify(error));
    throw error;
  }
  return data;
}