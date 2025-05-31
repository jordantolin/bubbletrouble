import React, { useState, useEffect, useRef } from 'react';
import { Bell, User, Search } from 'lucide-react';
import logo from '../assets/logobubbletrouble.png';
import { useNavigate } from 'react-router-dom';
import { useGamificationStore } from '../stores/useGamificationStore';
import { useBubblesStore } from '../stores/useBubblesStore';

const Header = ({ searchText, onSearchChange, onBubbleSelect }) => {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const bubbles = useBubblesStore(state => state.bubbles);

  // Stato locale per le notifiche del dropdown Header
  const [notifications, setNotifications] = useState([
    { id: 1, icon: '💬', text: 'New bubble reflection', read: false, visible: true, type: 'xp', amount: 20, reason: "Bubble reflected" },
    { id: 2, icon: '🔥', text: 'Streak +1! Daily access.', read: false, visible: true, type: 'streak', count: 1 },
    { id: 3, icon: '⭐️', text: 'Achievement unlocked!', read: false, visible: true, type: 'achievement', key: "reflection", description: "First Reflection" },
    { id: 4, icon: '🎲', text: 'New game event starting soon', read: false, visible: true }
  ]);

  const userMenuRef = useRef(null);
  const notificationsRef = useRef(null);
  const searchInputRef = useRef(null);
  const suggestionsRef = useRef(null);
  const navigate = useNavigate();

  const showXPToast = useGamificationStore((s) => s.showXPToast);
  const showStreakToast = useGamificationStore((s) => s.showStreakToast);
  const showAchievementToast = useGamificationStore((s) => s.showAchievementToast);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        userMenuRef.current && !userMenuRef.current.contains(event.target) &&
        !event.target.closest('[aria-label="Profile"]')
      ) {
        setUserMenuOpen(false);
      }
      if (
        notificationsRef.current && !notificationsRef.current.contains(event.target) &&
        !event.target.closest('[aria-label="Notifications"]')
      ) {
        setNotificationsOpen(false);
      }
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target) && searchInputRef.current && !searchInputRef.current.contains(event.target)) {
        setSearchSuggestions([]);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLocalSearchChange = (e) => {
    const searchTerm = e.target.value;
    onSearchChange(searchTerm);

    if (searchTerm.trim().length > 0) {
      const filtered = bubbles.filter(bubble =>
        bubble.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bubble.topic?.toLowerCase().includes(searchTerm.toLowerCase())
      ).slice(0, 5);
      setSearchSuggestions(filtered);
    } else {
      setSearchSuggestions([]);
    }
  };

  const handleSuggestionClick = (bubble) => {
    onSearchChange(bubble.name);
    setSearchSuggestions([]);
    if (onBubbleSelect && bubble.id) {
      onBubbleSelect(bubble.id);
    }
    if (searchInputRef.current) {
      searchInputRef.current.blur();
    }
  };

  const onNotificationClick = (id) => {
    const notif = notifications.find(n => n.id === id);

    if (notif && !notif.read) {
      if (notif.type === 'xp') {
        showXPToast(notif.amount, notif.reason);
      } else if (notif.type === 'streak') {
        showStreakToast(notif.count);
      } else if (notif.type === 'achievement') {
        showAchievementToast(notif.description);
        setTimeout(() => navigate('/profile#achievements'), 400);
      }
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id
            ? { ...n, read: true }
            : n
        )
      );
      setTimeout(() => {
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === id
              ? { ...n, visible: false }
              : n
          )
        );
      }, 800);
    }
  };

  const onProfileClick = () => {
    setUserMenuOpen(false);
    navigate('/profile');
  };

  const unreadCount = notifications.filter(n => !n.read && n.visible).length;

  return (
    <header
      className="fixed top-0 left-0 w-full z-[9999] px-4 pt-3 pb-2 bg-[#FFF9ED] bg-opacity-80 backdrop-blur-xl shadow-xl rounded-b-[32px] select-none"
      style={{
        WebkitTransform: 'translateZ(0)',
        transform: 'translateZ(0)',
        willChange: 'transform',
        pointerEvents: 'auto'
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-shrink-0">
          <img
            src={logo}
            alt="Bubble Trouble Logo"
            className="h-10 w-10 rounded-full shadow-lg"
            style={{ objectFit: 'cover' }}
          />
        </div>

        <div className="flex-grow mx-4 relative">
          <div ref={searchInputRef} className="flex items-center gap-2 px-4 py-2 bg-white/70 backdrop-blur-lg rounded-full shadow-inner transition-all duration-500 ease-in-out">
            <Search className="text-[#8E8E93]" size={18} />
            <input
              type="text"
              placeholder="Search bubbles..."
              value={searchText}
              onChange={handleLocalSearchChange}
              onFocus={handleLocalSearchChange}
              className="w-full bg-transparent text-sm placeholder-[#8E8E93] px-2 border-0 focus:outline-none focus:ring-0 shadow-none transition-colors duration-300 ease-in-out"
              style={{ caretColor: '#FFD90A' }}
            />
          </div>
          {searchSuggestions.length > 0 && (
            <div ref={suggestionsRef} className="absolute top-full left-0 right-0 mt-1.5 bg-white/95 backdrop-blur-md rounded-xl shadow-lg border border-yellow-200 z-50 overflow-hidden">
              <ul className="py-1">
                {searchSuggestions.map(bubble => (
                  <li
                    key={bubble.id}
                    onClick={() => handleSuggestionClick(bubble)}
                    className="px-4 py-2.5 text-sm text-yellow-800 hover:bg-yellow-100 cursor-pointer transition-colors duration-150"
                  >
                    {bubble.name} <span className="text-xs text-gray-500">({bubble.topic})</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="relative" ref={notificationsRef}>
            <button
              className="relative rounded-full p-2 bg-white/40 backdrop-blur-sm shadow-md hover:scale-[1.07] transition-transform focus:outline-none"
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              aria-label="Notifications"
            >
              <Bell className="text-yellow-600" size={22} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full font-semibold select-none">
                  {unreadCount}
                </span>
              )}
            </button>

            {notificationsOpen && (
              <div
                className="absolute right-0 mt-2 w-64 bg-white/90 backdrop-blur-md rounded-lg shadow-lg z-50 border border-yellow-200"
                style={{ animation: 'fadeIn 0.3s ease forwards' }}
              >
                <ul className="text-sm text-gray-700 max-h-48 overflow-auto">
                  {notifications.filter(n => n.visible).map(({ id, icon, text, read }) =>
                    <li
                      key={id}
                      onClick={() => onNotificationClick(id)}
                      className={`flex items-center gap-3 px-4 py-2 cursor-pointer border-b border-yellow-100 hover:bg-yellow-100 transition-colors duration-300 select-none ${read ? 'opacity-50 line-through' : 'opacity-100'
                        }`}
                      style={{
                        transition: 'opacity 0.3s ease, max-height 0.3s ease',
                        maxHeight: '1000px',
                        overflow: 'hidden',
                      }}
                    >
                      <span role="img" aria-label="notification-icon" className="select-none">{icon}</span>
                      <span>{text}</span>
                    </li>
                  )}
                  {notifications.filter(n => n.visible).length === 0 && (
                    <li className="px-4 py-2 text-center text-gray-500">No new notifications</li>
                  )}
                </ul>
              </div>
            )}
          </div>

          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="rounded-full p-2 bg-white/40 backdrop-blur-sm shadow-md hover:scale-105 transition-transform flex items-center justify-center focus:outline-none"
              aria-label="Profile"
            >
              <User className="text-[#8E8E93]" size={20} />
            </button>
            {userMenuOpen && (
              <div
                className="absolute right-0 mt-2 w-48 bg-white/70 backdrop-blur-md rounded-lg shadow-lg z-50 border border-yellow-200"
                style={{ animation: 'fadeIn 0.3s ease forwards' }}
              >
                <ul className="text-sm text-gray-700">
                  <li
                    className="px-4 py-2 hover:bg-yellow-50 cursor-pointer"
                    onClick={onProfileClick}
                  >
                    Profile
                  </li>
                  <li className="px-4 py-2 hover:bg-yellow-50 cursor-pointer">Settings</li>
                  <li className="px-4 py-2 hover:bg-yellow-100 cursor-pointer text-red-500 font-semibold">Logout</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}
      </style>
    </header>
  );
};

export default Header;
