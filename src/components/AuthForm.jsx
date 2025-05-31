import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import AvatarUpload from './AvatarUpload';
import logo from '../assets/logobubbletrouble.png';

function Bubble({ style, className }) {
  return (
    <div
      className={`absolute rounded-full bg-gradient-to-br from-yellow-100 to-yellow-300 shadow-xl animate-bubble-float ${className || ''}`}
      style={style}
    />
  );
}

const AuthForm = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMsg('');
    setEmailSent(false);

    if (isLogin) {
      // Gestione LOGIN
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (loginError) {
        setError(loginError.message);
      } else {
        // Login successful, redirect o aggiornamento UI gestito da onAuthStateChange listener in App.jsx o simile
        // Non c'è bisogno di un messaggio specifico qui, il redirect è sufficiente
      }
    } else {
      // Gestione REGISTRAZIONE
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        // options: { data: { username: username, avatar_url: avatarUrl } } // Non si può passare username/avatar qui direttamente con Supabase signUp standard email/password
      });

      if (signUpError) {
        setError(signUpError.message);
      } else if (signUpData.user) {
        // Registrazione Supabase Auth riuscita, ora salviamo il profilo
        const userId = signUpData.user.id;
        const { error: profileError } = await supabase.from('profiles').upsert({
          id: userId,
          username,
          avatar_url: avatarUrl || null, // Usa l'avatarUrl dallo stato del componente AvatarUpload
          updated_at: new Date(),
        });

        if (profileError) {
          console.error('Errore nel salvataggio profilo:', profileError.message);
          // Anche se il profilo non si salva, l'utente auth è creato.
          // Potremmo voler informare l'utente o gestire questo caso diversamente.
          setError('Utente registrato, ma errore nel creare il profilo. Riprova o contatta supporto.');
        } else {
          setEmailSent(true);
          setMsg("Registrazione completata! ✨<br>Controlla l'email per confermare.");
        }
      } else {
        // Caso inatteso: signUp non ha prodotto né utente né errore
        setError("Errore imprevisto durante la registrazione. Riprova.");
      }
    }

    setLoading(false);
  };


  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'https://bubbletrouble-beta.com'
      }
    });
    if (error) setError(error.message);
    setLoading(false);
  };

  const resendConfirmation = async () => {
    setLoading(true);
    const { error } = await supabase.auth.resend({ type: 'signup', email });
    if (error) setError(error.message);
    else setMsg('Mail di conferma inviata di nuovo.');
    setLoading(false);
  };

  useEffect(() => {
    setError('');
    setMsg('');
    setEmailSent(false);
  }, [isLogin]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-tr from-[#FFF9ED] via-[#FFF6D0] to-[#FFE96C] relative overflow-hidden">
      {[...Array(10)].map((_, i) => (
        <Bubble
          key={i}
          style={{
            left: `${Math.random() * 90}%`,
            top: `${Math.random() * 90}%`,
            width: 80 + Math.random() * 100,
            height: 80 + Math.random() * 100,
            opacity: 0.07 + Math.random() * 0.1,
            zIndex: 0,
            animationDelay: `${i * 1.4}s`
          }}
        />
      ))}
      <div className="relative w-full max-w-xs md:max-w-sm mx-auto px-6 py-10 rounded-3xl shadow-[0_10px_48px_0_#ffd60033] bg-white/90 backdrop-blur-xl border border-yellow-200 flex flex-col items-center animate-fade-in z-10">
        <img
          src={logo}
          alt="Bubble Trouble Logo"
          className="w-20 h-20 mb-2 rounded-full border-2 border-yellow-400 bg-white animate-bounce-smooth"
          style={{ objectFit: 'cover' }}
        />
        <h2 className="text-3xl font-bold text-yellow-600 drop-shadow mb-2">Bubble Trouble</h2>
        <div className="mb-3 text-base text-yellow-800 font-medium text-center">
          {isLogin ? "Accedi al tuo mondo." : "Crea il tuo profilo"}
        </div>

        {emailSent ? (
          <div className="p-4 text-center text-yellow-900 bg-yellow-50 rounded-xl shadow-inner mb-4">
            <b>Conferma inviata!</b><br />
            <span className="text-sm">Controlla <b>{email}</b></span>
            <div className="mt-2">
              <button className="text-xs underline" onClick={resendConfirmation}>Invia di nuovo</button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col w-full gap-3">
            {!isLogin && (
              <>
                <input
                  type="text"
                  placeholder="Username"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="input-style"
                />
                <AvatarUpload onUpload={setAvatarUrl} />
              </>
            )}
            <input
              type="email"
              required
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-style"
            />
            <input
              type="password"
              required
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-style"
            />
            <button
              type="submit"
              className="bg-yellow-400 hover:bg-yellow-500 text-white font-extrabold rounded-xl px-4 py-3 mt-2 text-lg"
              disabled={loading}
            >
              {loading ? 'Attendi...' : isLogin ? 'Login' : 'Registrati'}
            </button>
            <button
              onClick={handleGoogleLogin}
              type="button"
              className="bg-[#4285F4] hover:bg-[#2254c4] text-white font-bold rounded-xl px-4 py-3 w-full mt-1"
              disabled={loading}
            >
              {isLogin ? 'Accedi con Google' : 'Registrati con Google'}
            </button>
          </form>
        )}
        <div className="text-sm mt-4 text-gray-700">
          {isLogin ? (
            <>Non hai un account? <button onClick={() => setIsLogin(false)} className="text-yellow-700 underline font-semibold">Registrati</button></>
          ) : (
            <>Hai già un account? <button onClick={() => setIsLogin(true)} className="text-yellow-700 underline font-semibold">Accedi</button></>
          )}
        </div>
        {error && <div className="text-red-600 text-xs mt-2">{error}</div>}
        {msg && <div className="text-green-700 text-xs mt-2 text-center" dangerouslySetInnerHTML={{ __html: msg }} />}
      </div>

      <style>{`
        .input-style {
          border: 1px solid #fce87c;
          background: #fffbe9;
          padding: 0.75rem 1rem;
          border-radius: 0.75rem;
          font-weight: 600;
          color: #7a6500;
          transition: all 0.2s ease;
        }
        .input-style:focus {
          outline: none;
          background: #fff;
          border-color: #ffeb3b;
          box-shadow: 0 0 0 2px #ffec8077;
        }
      `}</style>
    </div>
  );
};

export default AuthForm;
