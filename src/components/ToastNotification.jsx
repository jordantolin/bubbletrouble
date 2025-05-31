import React, { useEffect, useState, useRef } from "react";

export default function ToastNotification({ title, message, onClose, duration = 3000 }) {
  const [visible, setVisible] = useState(true);
  const toastRef = useRef({ startX: 0 });

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 350);
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  function handleTouchStart(e) {
    toastRef.current.startX = e.touches[0].clientX;
  }

  function handleTouchMove(e) {
    const deltaX = e.touches[0].clientX - toastRef.current.startX;
    if (deltaX > 60) {
      setVisible(false);
      setTimeout(onClose, 350);
    }
  }

  return (
    <div
      ref={toastRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      className={`fixed top-4 z-[9999] left-1/2 -translate-x-1/2
        flex items-center justify-between
        bg-yellow-100 text-yellow-900 px-5 py-3 rounded-2xl shadow-xl
        max-w-sm w-[92vw] border border-yellow-300
        transition-all duration-300 ease-out
        ${visible ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}
      style={{
        animation: "popin 0.25s ease-out",
        boxShadow: "0 4px 18px #ffea94aa",
      }}
    >
      <div className="flex-1 pr-3 text-center">
        <div className="font-bold text-base">{title}</div>
        {message && <div className="text-sm">{message}</div>}
      </div>

      <style>{`
        @keyframes popin {
          from { transform: scale(0.92); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
