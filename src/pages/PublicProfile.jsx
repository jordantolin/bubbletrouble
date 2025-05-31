// pages/PublicProfile.jsx
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const PublicProfile = () => {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          username,
          avatar_url,
          bio,
          xp,
          streak,
          achievements (
            achievement_key,
            achieved_at
          )
        `)
        .eq('id', id)
        .single();

      if (!error) setProfile(data);
      setLoading(false);
    };

    if (id) fetchProfile();
  }, [id]);

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getAchievementEmoji = (key) => {
    const icons = {
      "First Reflection": "💡",
      "Bubble Master": "🫧",
      "Daily Streak": "🔥",
      "XP Overload": "⚡️",
      "Social Link": "🔗",
    };
    return icons[key] || "🏅";
  };

  if (loading) return <div className="text-center mt-10 text-gray-500">Caricamento profilo...</div>;
  if (!profile) return <div className="text-center mt-10 text-red-500">Profilo non trovato</div>;

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-100 px-4 py-8">
      <div className="bg-white rounded-3xl shadow-xl p-6 w-full max-w-md flex flex-col items-center gap-4">
        <img
          src={profile.avatar_url || 'https://i.pravatar.cc/120'}
          alt="Avatar"
          className="w-24 h-24 rounded-full border-4 border-yellow-400 object-cover shadow hover:scale-105 transition"
        />
        <h1 className="text-2xl font-bold text-yellow-700 drop-shadow-sm">{profile.username}</h1>
        <button
          onClick={copyLink}
          className="text-xs text-yellow-600 hover:underline"
        >
          {copied ? '✅ Link copiato!' : '🔗 Copia link profilo'}
        </button>
        <p className="text-sm text-yellow-800">🔥 {profile.streak} giorni di streak</p>
        <p className="text-sm text-gray-600 text-center italic">{profile.bio}</p>

        <div className="w-full">
          <div className="text-sm font-medium text-yellow-900 mb-1">XP: {profile.xp}</div>
          <div className="w-full bg-yellow-100 rounded-full h-3 relative overflow-hidden">
            <div
              className="bg-gradient-to-r from-yellow-400 to-yellow-300 h-3 rounded-full animate-pulse"
              style={{ width: `${Math.min(100, (profile.xp / 5000) * 100)}%` }}
            ></div>
          </div>
        </div>

        <div className="w-full">
          <h3 className="text-lg font-semibold text-yellow-700 mt-4 mb-2">Achievements</h3>
          {profile.achievements && profile.achievements.length > 0 ? (
            <ul className="grid grid-cols-2 gap-2">
              {profile.achievements.map((ach, idx) => (
                <li
                  key={idx}
                  className="bg-yellow-100 text-yellow-900 text-sm font-semibold px-3 py-2 rounded-xl shadow-sm text-center flex items-center justify-center gap-1"
                >
                  <span>{getAchievementEmoji(ach.achievement_key)}</span> {ach.achievement_key}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-400">Nessun achievement sbloccato.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PublicProfile;
