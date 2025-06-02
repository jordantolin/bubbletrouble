// FINAL POLISHED VERSION — Bubble Trouble Profile View
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '../supabaseClient';
import AvatarUpload from '../components/AvatarUpload';
import LogoutButton from '../components/LogoutButton';
import { useGamificationStore } from '../stores/useGamificationStore';
import { AnimatePresence, motion } from 'framer-motion';


const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [bio, setBio] = useState('');
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [editingAvatar, setEditingAvatar] = useState(false);
  const [newAvatar, setNewAvatar] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const avatarRef = useRef();
  const [achievements, setAchievements] = useState([]);


  const level = useGamificationStore((s) => s.level);
  const xp = useGamificationStore((s) => s.xp);
  const streak = useGamificationStore((s) => s.streak);

  const LEVELS = [0, 50, 150, 350, 700, 1200, 2000, 3200, 5000];
  const levelLabel = [
    "Novizio", "Studente", "Esploratore", "Pensatore", "Mentore", "Saggio", "Maestro", "Leggenda", "Mito"
  ][level] || 'Sconosciuto';

  const nextXP = LEVELS[level + 1] ?? LEVELS[LEVELS.length - 1];
  const prevXP = LEVELS[level] ?? 0;
  const xpPercent = Math.min(100, ((xp - prevXP) / (nextXP - prevXP)) * 100);

  // Helper to format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const fetchUser = async () => {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, avatar_url, bio')
      .eq('id', user.id);

    if (!error && data?.length > 0) {
      setUser(data[0]);
      setBio(data[0].bio || '');
    }

    const { data: aData, error: aError } = await supabase
  .from('achievements')
  .select(`
    *,
    achievement_types (
      title,
      description,
      icon_url
    )
  `)
  .eq('user_id', user.id);

if (!aError) {
  setAchievements(
    aData.map((a) => ({
      ...a,
      title: a.achievement_types?.title,
      description: a.achievement_types?.description,
      icon: a.achievement_types?.icon_url,
    }))
  );
}
  };

  const saveBio = async () => {
    const { error } = await supabase.from('profiles').update({ bio }).eq('id', user.id);
    if (!error) {
      setIsEditingBio(false);
      alert('Bio salvata!');
    }
  };

  const saveAvatar = async () => {
    const { error } = await supabase.from('profiles').update({ avatar_url: newAvatar }).eq('id', user.id);
    if (!error) {
      alert('Avatar aggiornato!');
      setEditingAvatar(false);
      fetchUser();
    }
  };

  useEffect(() => {
    fetchUser();
    const handleClickOutside = (e) => {
      if (avatarRef.current && !avatarRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 backdrop-blur">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3 }}
        className="relative w-full max-w-md mx-auto bg-white rounded-3xl shadow-xl p-5 flex flex-col gap-5 max-h-[95dvh] overflow-y-auto scrollbar-thin scrollbar-thumb-yellow-400 scrollbar-track-yellow-100"
      >
        <button
          onClick={() => navigate("/")}
          className="absolute top-4 left-4 z-20 bg-yellow-100 hover:bg-yellow-200 text-yellow-600 rounded-full p-2 shadow-md active:scale-95 transition"
        >
          <ArrowLeft size={24} />
        </button>

        <div className="flex flex-col items-center gap-1 mt-2 relative">
        <div className="relative" ref={avatarRef}>
        <img
    src={user.avatar_url || 'https://i.pravatar.cc/120'}
    alt="Avatar"
    className="rounded-full w-24 h-24 border-[3px] border-yellow-400 shadow-xl object-cover cursor-pointer hover:scale-105 transition"
    onClick={() => setEditingAvatar(true)}
  />
</div>


          <div className="text-xs font-semibold text-yellow-700 -mb-1">{xp} / {nextXP} XP</div>
          <h2 className="text-2xl font-bold text-yellow-800">{user.username || 'Utente'}</h2>
          <p className="text-yellow-600 text-sm italic">Livello {level} — {levelLabel}</p>
          <a
  href={`${window.location.origin}/profile/${user.id}`}
  target="_blank"
  rel="noopener noreferrer"
  className="text-xs text-yellow-500 hover:underline mt-1 font-medium"
>
  🔗 Condividi profilo pubblico
</a>


          <div className="w-full bg-yellow-100 rounded-full h-4 shadow-inner overflow-hidden">
            <div className="bg-yellow-400 h-4 rounded-full transition-all duration-700" style={{ width: `${xpPercent}%` }}></div>
          </div>

          <div className="text-sm font-semibold text-yellow-900">🔥 Streak: {streak} giorni</div>
        </div>

        {editingAvatar && (
  <div className="w-full animate-fade-in flex flex-col items-center mt-3 gap-3">
    <AvatarUpload onUpload={setNewAvatar} />
    {newAvatar && (
      <img
        src={newAvatar}
        alt="Preview"
        className="rounded-full w-24 h-24 object-cover border-[3px] border-yellow-300 shadow-md transition-all duration-300"
      />
    )}
    <div className="flex gap-3 mt-2 w-full">
      <button
        onClick={saveAvatar}
        className="bg-yellow-500 text-white px-4 py-2 rounded-xl hover:bg-yellow-600 w-full font-semibold"
      >
        Salva avatar
      </button>
      <button
        onClick={() => {
          setEditingAvatar(false);
          setNewAvatar(null);
        }}
        className="bg-gray-100 text-gray-700 px-4 py-2 rounded-xl hover:bg-gray-200 w-full"
      >
        Annulla
      </button>
    </div>
  </div>
)}




        <section className="w-full">
          <h3 className="text-lg font-semibold mb-1 border-b border-yellow-200 pb-1">Bio</h3>
          {isEditingBio ? (
            <>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full rounded-xl border border-yellow-300 p-3 resize-none focus:outline-yellow-400 text-base"
                rows={3}
              />
              <div className="mt-2 flex gap-3">
                <button onClick={saveBio} className="bg-yellow-500 text-white px-4 py-2 rounded-xl hover:bg-yellow-600 w-full font-semibold">
                  Salva
                </button>
                <button onClick={() => setIsEditingBio(false)} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-xl hover:bg-gray-200 w-full">
                  Annulla
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="text-gray-700 whitespace-pre-wrap text-base leading-relaxed">{bio}</p>
              <button onClick={() => setIsEditingBio(true)} className="mt-2 text-yellow-600 underline hover:text-yellow-700 text-sm font-medium">
                Modifica bio
              </button>
            </>
          )}
        </section>

        <section className="w-full border-t pt-3 border-yellow-100">
          <h3 className="text-lg font-semibold mb-1 pb-1">Preferenze</h3>
          <div className="flex flex-col gap-3">
            <label className="inline-flex relative items-center cursor-pointer select-none">
              <input type="checkbox" defaultChecked className="sr-only peer" />
              <div className="w-12 h-6 bg-gray-200 rounded-full peer peer-checked:bg-green-500 transition-colors"></div>
              <div className="absolute left-1 top-1 bg-white border border-gray-300 w-4 h-4 rounded-full transition-transform peer-checked:translate-x-6"></div>
              <span className="ml-3 text-gray-700 text-base">Notifiche</span>
            </label>
            <label className="inline-flex relative items-center cursor-pointer select-none">
              <input type="checkbox" defaultChecked className="sr-only peer" />
              <div className="w-12 h-6 bg-gray-200 rounded-full peer peer-checked:bg-green-500 transition-colors"></div>
              <div className="absolute left-1 top-1 bg-white border border-gray-300 w-4 h-4 rounded-full transition-transform peer-checked:translate-x-6"></div>
              <span className="ml-3 text-gray-700 text-base">Suoni</span>
            </label>
            <div className="mt-1 text-left text-xs text-gray-400 font-semibold italic select-none pb-1 animate-pulse">
              Dark mode is coming...
            </div>
          </div>
        </section>

        <section className="w-full mt-5 border-t pt-4 border-yellow-100">
          <h3 className="text-lg font-semibold mb-3 border-b border-yellow-200 pb-1 text-yellow-800">🏆 Achievements</h3>
          {achievements.length > 0 ? (
            <motion.div 
              className="grid grid-cols-2 md:grid-cols-3 gap-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ staggerChildren: 0.1, delayChildren: 0.2 }}
            >
              {achievements.map((a, index) => (
                <motion.div
                  key={a.id || index} // Use index as fallback key if a.id is not present
                  className="flex flex-col items-center text-center transition-all duration-300 ease-in-out transform hover:scale-105 rounded-xl p-3 bg-white shadow-sm border border-yellow-200 hover:shadow-yellow-300/50 hover:border-yellow-300"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <div className="w-16 h-16 rounded-full bg-yellow-50 border-2 border-yellow-300 flex items-center justify-center shadow-md mb-2 transition-all duration-300 hover:shadow-lg hover:shadow-yellow-400/50 hover:border-yellow-400">
                    {a.icon ? (
                        <img
                        src={a.icon}
                        alt={a.title || 'Achievement icon'}
                        className="w-10 h-10 object-contain transition-transform duration-300 group-hover:scale-110"
                        />
                    ) : (
                        <span className="text-3xl">🏅</span> // Fallback icon
                    )}
                  </div>
                  <div className="font-bold text-sm text-yellow-900">{a.title || 'Achievement'}</div>
                  {a.description && (
                    <p className="text-xs text-yellow-700 mt-0.5 px-1">{a.description}</p>
                  )}
                  {a.achieved_at && (
                    <p className="text-xs text-yellow-500 italic mt-1">{formatDate(a.achieved_at)}</p>
                  )}
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <p className="text-center text-yellow-600 italic py-4">Nessun achievement ancora sbloccato...</p>
          )}
        </section>

        <div className="mt-auto pt-6 flex justify-center">
          <LogoutButton />
        </div>
      </motion.div>
    </div>
  );
};

export default Profile;
