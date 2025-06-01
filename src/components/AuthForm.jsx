import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import AvatarUpload from './AvatarUpload';
import logo from '../assets/logobubbletrouble.png';
import { useNavigate } from 'react-router-dom';

const AuthForm = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [msg, setMsg] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMsg('');
    setEmailSent(false);

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !password) {
      setError('Email e password obbligatorie');
      setLoading(false);
      return;
    }

    if (!isLogin && password.length < 6) {
      setError('La password deve contenere almeno 6 caratteri.');
      setLoading(false);
      return;
    }

    if (!isLogin && (!username || username.length < 3)) {
      setError('Username troppo corto (minimo 3 caratteri).');
      setLoading(false);
      return;
    }

    if (isLogin) {
      const { error: loginError } = await supabase.auth.signInWithPassword({ email: trimmedEmail, password });
      if (loginError) setError(loginError.message);
    } else {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: {
          data: {
            username,
            avatar_url: avatarUrl || null,
          }
        }
      });

      if (signUpError) {
        console.error('Supabase SignUp Error:', signUpError);
        setError(signUpError.message || 'Errore durante la registrazione.');
        setLoading(false);
        return;
      }

      await supabase.auth.getSession(); // Forza aggiornamento sessione

      const { data: sessionData } = await supabase.auth.getUser();
      const user = sessionData?.user;
      
      if (!user) {
        setMsg('Registrazione avvenuta. Controlla la tua mail per confermare.');
        setEmailSent(true);
        setLoading(false);
        return;
      }
      

      const { error: profileError } = await supabase.from('profiles').upsert({
        id: session.user.id, // ESSENZIALE PER SUPERARE LA POLICY
        username,
        avatar_url: avatarUrl || null,
        updated_at: new Date().toISOString()
      });

      if (profileError) {
        console.error('Errore nel salvataggio profilo:', profileError.message);
        setError(`Registrazione riuscita, ma errore nel creare il profilo. Dettagli: ${profileError.message}`);
        setLoading(false);
        return;
      }

      setMsg('Registrazione completata!');
      navigate('/');
    }

    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: 'https://bubbletrouble-beta.com' }
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
    <div className="min-h-screen flex items-center justify-center bg-[#FFF9ED] relative overflow-hidden">
      <div className="relative w-full max-w-xs p-6 bg-white/90 rounded-3xl shadow-md z-10 border border-yellow-200">
        <img src={logo} alt="Logo" className="w-20 h-20 mx-auto mb-2 rounded-full border-2 border-yellow-400 bg-white" />
        <h2 className="text-2xl text-center font-bold text-yellow-600">Bubble Trouble</h2>
        <p className="text-center text-yellow-800 mb-4">{isLogin ? 'Accedi al tuo mondo' : 'Crea il tuo profilo'}</p>

        {emailSent ? (
          <div className="p-4 bg-yellow-100 text-yellow-800 rounded-xl text-center">
            <b>Conferma inviata!</b><br />Controlla <b>{email}</b>
            <div className="mt-2">
              <button className="text-xs underline" onClick={resendConfirmation}>Invia di nuovo</button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            {!isLogin && (
              <>
                <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} className="input-style" required />
                <AvatarUpload onUpload={setAvatarUrl} />
              </>
            )}
            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-style" required />
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="input-style" required />
            <button type="submit" className="bg-yellow-400 hover:bg-yellow-500 text-white font-bold py-2 px-4 rounded-xl" disabled={loading}>
              {loading ? 'Attendi...' : isLogin ? 'Login' : 'Registrati'}
            </button>
            <button onClick={handleGoogleLogin} type="button" className="bg-[#4285F4] hover:bg-[#2254c4] text-white py-2 px-4 rounded-xl">
              {isLogin ? 'Accedi con Google' : 'Registrati con Google'}
            </button>
          </form>
        )}

        <div className="text-sm text-center mt-4">
          {isLogin ? (
            <>Non hai un account? <button onClick={() => setIsLogin(false)} className="text-yellow-700 underline">Registrati</button></>
          ) : (
            <>Hai già un account? <button onClick={() => setIsLogin(true)} className="text-yellow-700 underline">Accedi</button></>
          )}
        </div>
        {error && <div className="text-red-600 text-xs mt-2 text-center">{error}</div>}
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
