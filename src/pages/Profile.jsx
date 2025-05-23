import React, { useState } from 'react';

const Profile = () => {
  const [bio, setBio] = useState('Ciao, sono Jordan, appassionato di Bubble Trouble!');
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [level, setLevel] = useState(1);
  const [xp, setXp] = useState(42);
  const [streak, setStreak] = useState(5);
  const [bubblesCreated, setBubblesCreated] = useState(12);
  const [reflections, setReflections] = useState(34);

  const [notificationsOn, setNotificationsOn] = useState(true);
  const [soundsOn, setSoundsOn] = useState(true);

  const achievements = [
    { id: 1, title: 'First Bubble', description: 'Created your first bubble!', icon: '🟡' },
    { id: 2, title: 'Reflector', description: 'Made 10 reflections.', icon: '💬' },
    { id: 3, title: 'Streak Master', description: '5-day streak!', icon: '🔥' },
  ];

  const saveBio = () => {
    setIsEditingBio(false);
    alert('Bio salvata!');
  };

  return (
    <div className="min-h-screen bg-[#FFF9ED] p-6 flex justify-center overflow-auto">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-md p-8 flex flex-col gap-8">
        {/* Avatar + nome */}
        <div className="flex items-center gap-5">
          <img
            src="https://i.pravatar.cc/120"
            alt="User Avatar"
            className="rounded-full w-28 h-28 border-4 border-yellow-400 shadow-md"
          />
          <div>
            <h2 className="text-3xl font-semibold text-yellow-600">Jordan</h2>
            <p className="text-gray-700 text-base mt-1">Level {level} - {xp} XP</p>
            <p className="text-yellow-500 font-semibold text-base mt-2 flex items-center gap-1">
              <span role="img" aria-label="fire">🔥</span> Streak: {streak} days
            </p>
          </div>
        </div>

        {/* Bio */}
        <section>
          <h3 className="text-xl font-semibold mb-3 border-b border-yellow-300 pb-2">Bio</h3>
          {isEditingBio ? (
            <>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full rounded-md border border-yellow-300 p-3 resize-none focus:outline-yellow-400 text-base"
                rows={4}
              />
              <div className="mt-3 flex gap-3">
                <button
                  onClick={saveBio}
                  className="bg-yellow-500 text-white px-5 py-2 rounded-md hover:bg-yellow-600 transition font-semibold"
                >
                  Salva
                </button>
                <button
                  onClick={() => setIsEditingBio(false)}
                  className="bg-gray-300 text-gray-700 px-5 py-2 rounded-md hover:bg-gray-400 transition"
                >
                  Annulla
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="text-gray-700 whitespace-pre-wrap text-base leading-relaxed">{bio}</p>
              <button
                onClick={() => setIsEditingBio(true)}
                className="mt-3 text-yellow-600 underline hover:text-yellow-700 text-sm font-medium"
              >
                Modifica bio
              </button>
            </>
          )}
        </section>

        {/* Statistiche */}
        <section>
          <h3 className="text-xl font-semibold mb-4 border-b border-yellow-300 pb-2">Statistiche</h3>
          <div className="grid grid-cols-2 gap-6 text-center text-gray-700">
            <div className="bg-yellow-50 rounded-lg p-5 shadow-sm">
              <p className="text-2xl font-bold text-yellow-600">{bubblesCreated}</p>
              <p className="text-sm mt-1">Bolle create</p>
            </div>
            <div className="bg-yellow-50 rounded-lg p-5 shadow-sm">
              <p className="text-2xl font-bold text-yellow-600">{reflections}</p>
              <p className="text-sm mt-1">Riflessioni</p>
            </div>
          </div>
        </section>

        {/* Achievements */}
        <section>
          <h3 className="text-xl font-semibold mb-4 border-b border-yellow-300 pb-2">Achievements</h3>
          <ul className="flex flex-wrap gap-5">
            {achievements.map((a) => (
              <li
                key={a.id}
                className="flex items-center gap-3 bg-yellow-50 px-4 py-2 rounded-md shadow-sm cursor-default hover:bg-yellow-100 transition font-medium text-gray-700"
                title={a.description}
              >
                <span className="text-2xl">{a.icon}</span>
                {a.title}
              </li>
            ))}
          </ul>
        </section>

        {/* Preferenze */}
        <section>
          <h3 className="text-xl font-semibold mb-4 border-b border-yellow-300 pb-2">Preferenze</h3>
          <div className="flex flex-col gap-5 max-w-xs">
            {/* Notifiche */}
            <label className="inline-flex relative items-center cursor-pointer select-none">
              <input
                type="checkbox"
                checked={notificationsOn}
                onChange={() => setNotificationsOn(!notificationsOn)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-green-500 transition-colors"></div>
              <div className="absolute left-1 top-1 bg-white border border-gray-300 w-4 h-4 rounded-full transition-transform peer-checked:translate-x-5"></div>
              <span className="ml-3 text-gray-700 text-base">Notifiche</span>
            </label>

            {/* Suoni */}
            <label className="inline-flex relative items-center cursor-pointer select-none">
              <input
                type="checkbox"
                checked={soundsOn}
                onChange={() => setSoundsOn(!soundsOn)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-green-500 transition-colors"></div>
              <div className="absolute left-1 top-1 bg-white border border-gray-300 w-4 h-4 rounded-full transition-transform peer-checked:translate-x-5"></div>
              <span className="ml-3 text-gray-700 text-base">Suoni</span>
            </label>

            {/* Modalità scura - testo in fondo */}
            <p className="text-sm text-gray-500 italic mt-2 select-none">
              Modalità scura in arrivo...
            </p>
          </div>
        </section>

        {/* Logout */}
        <div className="mt-8 flex justify-center">
          <button
            className="bg-red-500 text-white px-10 py-3 rounded-full shadow-md hover:bg-red-600 transition font-semibold"
            onClick={() => alert('Logout')}
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
