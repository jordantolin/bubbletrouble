import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotificationsStore, NOTIFICATION_TYPES } from '../stores/useNotificationsStore';
import { X, Bell, Gift, Zap, Award, Info, CheckCircle } from 'lucide-react';

const NotificationPanel = ({ isOpen, onClose, anchorRef }) => {
  const notifications = useNotificationsStore((state) => state.notifications);
  const markAsRead = useNotificationsStore((state) => state.markAsRead);
  const panelRef = useRef(null);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);

  useEffect(() => {
    const checkScreenSize = () => setIsDesktop(window.innerWidth >= 768);
    window.addEventListener('resize', checkScreenSize);
    checkScreenSize();
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const touchStartY = useRef(0);
  const handleTouchStart = (e) => {
    if (!isDesktop) touchStartY.current = e.touches[0].clientY;
  };
  const handleTouchMove = (e) => {
    if (!isDesktop && touchStartY.current !== 0) {
      const deltaY = e.touches[0].clientY - touchStartY.current;
      if (deltaY > 50) {
        onClose();
        touchStartY.current = 0;
      }
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target) &&
        anchorRef?.current &&
        !anchorRef.current.contains(event.target)
      ) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen, onClose, anchorRef]);

  const getIconForType = (type) => {
    switch (type) {
      case NOTIFICATION_TYPES.XP:
        return <Zap size={20} className="text-yellow-500" />;
      case NOTIFICATION_TYPES.ACHIEVEMENT:
        return <Award size={20} className="text-orange-500" />;
      case NOTIFICATION_TYPES.STREAK:
        return <Gift size={20} className="text-pink-500" />;
      case NOTIFICATION_TYPES.SUCCESS:
        return <CheckCircle size={20} className="text-green-500" />;
      case NOTIFICATION_TYPES.INFO:
        return <Info size={20} className="text-blue-500" />;
      default:
        return <Bell size={20} className="text-gray-500" />;
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.isRead) markAsRead(notification.id);
    if (notification.action && typeof notification.action === 'function') notification.action();
    onClose();
  };

  const sortedNotifications = [...notifications].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
  ref={panelRef}
  initial={{ opacity: 0, scale: 0.9, y: 20 }}
  animate={{ opacity: 1, scale: 1, y: 0 }}
  exit={{ opacity: 0, scale: 0.9, y: 20 }}
  transition={{ type: 'spring', stiffness: 300, damping: 30, duration: 0.3 }}
  onTouchStart={handleTouchStart}
  onTouchMove={handleTouchMove}
  className="fixed inset-x-0 top-[72px] z-50 flex justify-center"
>
  <div className="w-[90vw] md:w-[420px] bg-[#FFF9ED] rounded-2xl shadow-lg shadow-yellow-300/50 border-b-2 border-yellow-400">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-md font-semibold text-yellow-700">Notifiche</h3>
              <button onClick={onClose} className="p-1 rounded-full hover:bg-yellow-100 active:scale-90 transition-all">
                <X size={20} className="text-yellow-600" />
              </button>
            </div>

            {sortedNotifications.length === 0 ? (
              <p className="text-sm text-yellow-600 text-center py-8">Nessuna notifica per ora.</p>
            ) : (
              <div className="max-h-[180px] md:max-h-[220px] overflow-y-auto scrollbar-thin scrollbar-thumb-yellow-400 scrollbar-track-yellow-100 pr-1">
                {sortedNotifications.map((notif) => (
                  <motion.div
                    key={notif.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2 }}
                    onClick={() => handleNotificationClick(notif)}
                    className={`flex items-center gap-3 p-2.5 mb-2 rounded-xl cursor-pointer transition-all duration-200 ease-in-out hover:bg-yellow-100/70 ${
                      !notif.isRead ? 'bg-yellow-50/50' : 'bg-transparent hover:bg-yellow-50/30'
                    }`}
                  >
                    <div
                      className={`transition-transform duration-200 ease-in-out ${
                        !notif.isRead ? 'scale-105' : ''
                      } hover:scale-110 hover:shadow-md rounded-full p-1.5 ${
                        notif.type === NOTIFICATION_TYPES.ACHIEVEMENT
                          ? 'bg-orange-100'
                          : notif.type === NOTIFICATION_TYPES.XP
                          ? 'bg-yellow-100'
                          : 'bg-gray-100'
                      }`}
                    >
                      {getIconForType(notif.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm font-semibold truncate ${
                          !notif.isRead ? 'text-yellow-800' : 'text-gray-700'
                        }`}
                      >
                        {notif.title}
                      </p>
                      {notif.message && (
                        <p
                          className={`text-xs truncate ${
                            !notif.isRead ? 'text-yellow-700' : 'text-gray-500'
                          }`}
                        >
                          {notif.message}
                        </p>
                      )}
                    </div>
                    {!notif.isRead && (
                      <div className="w-2.5 h-2.5 bg-red-500 rounded-full shrink-0 shadow-sm" title="Non letta"></div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}

            {notifications.length > 0 && (
              <button
                onClick={() => useNotificationsStore.getState().markAllAsRead()}
                className="text-xs text-yellow-600 hover:text-yellow-700 underline mt-2 p-1 w-full text-center"
              >
                Segna tutte come lette
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NotificationPanel;
