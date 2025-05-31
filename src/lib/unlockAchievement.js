import { supabase } from "../supabaseClient";
import { useAchievementToastStore } from "../stores/useAchievementToastStore";

export const unlockAchievement = async (userId, key) => {
  const { data: already } = await supabase
    .from("achievements")
    .select("id")
    .eq("user_id", userId)
    .eq("achievement_key", key);

  if (already.length > 0) return;

  const { error } = await supabase
    .from("achievements")
    .insert([{ user_id: userId, achievement_key: key }]);

  if (!error) {
    const { data: type } = await supabase
      .from("achievement_types")
      .select("title")
      .eq("key", key)
      .single();

    if (type?.title) {
      useAchievementToastStore.getState().showToast(type.title);
    }
  }
};
