import React, { useEffect, useState } from 'react';

const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const hasDismissed = localStorage.getItem('bt_install_dismissed') === 'true';
    if (hasDismissed) return;

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowPrompt(false);
        localStorage.setItem('bt_install_dismissed', 'true');
      }
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('bt_install_dismissed', 'true');
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 mx-auto max-w-sm bg-yellow-100 border border-yellow-300 text-yellow-800 shadow-lg rounded-2xl px-4 py-3 flex items-center justify-between animate-slide-up z-50">
      <div className="text-sm font-semibold mr-3">
        Install Bubble Trouble?
      </div>
      <div className="flex gap-2">
        <button
          onClick={handleInstall}
          className="px-3 py-1 rounded-full bg-yellow-400 hover:bg-yellow-500 text-white text-xs font-semibold"
        >
          Install
        </button>
        <button
          onClick={handleDismiss}
          className="text-yellow-700 hover:text-red-600 text-xl font-bold leading-none px-1"
          aria-label="Close"
        >
          ×
        </button>
      </div>
    </div>
  );
};

export default InstallPrompt;
