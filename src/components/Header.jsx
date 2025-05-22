import React, { useState, useEffect } from 'react';
import { Bell, Menu, User } from 'lucide-react';
import logo from '/public/logobubbletrouble.png';

const Header = () => {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    console.log("Header mounted");
  }, []);

  return (
    <header className="fixed top-0 left-0 w-full z-[9999] bg-[#FFF9ED] border-b border-yellow-300 shadow-sm">
      {/* Logo + Title */}
      <div className="flex justify-between items-center px-6 py-3">
        <div className="flex items-center gap-2">
          <img src={logo} alt="Bubble Trouble Logo" className="h-8 w-8" />
          <h1 className="text-xl font-bold text-yellow-600">Bubble Trouble</h1>
        </div>

        {/* Center search (hidden on mobile) */}
        <div className="hidden md:flex flex-1 justify-center">
          <input
            type="text"
            placeholder="Search bubbles..."
            className="w-96 px-4 py-1 rounded-full bg-white border border-yellow-200 focus:outline-none focus:ring-2 focus:ring-yellow-300"
          />
        </div>

        {/* Right: Notifications and User */}
        <div className="flex items-center gap-4 relative">
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="relative hover:scale-105 transition-transform"
          >
            <Bell className="text-yellow-700" />
            <span className="absolute -top-1 -right-2 bg-red-500 text-white text-xs w-4 h-4 flex items-center justify-center rounded-full">
              3
            </span>
          </button>

          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 hover:scale-105 transition-transform"
            >
              <img
                src="https://i.pravatar.cc/40"
                alt="User Avatar"
                className="rounded-full w-8 h-8 border border-yellow-400"
              />
              <div className="text-right hidden md:block">
                <p className="text-sm font-semibold text-yellow-800">Jordan</p>
                <p className="text-xs text-gray-500">Level 1 – 42 XP</p>
              </div>
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-lg z-50 border border-yellow-200">
                <ul className="text-sm text-gray-700">
                  <li className="px-4 py-2 hover:bg-yellow-50 cursor-pointer">Profile</li>
                  <li className="px-4 py-2 hover:bg-yellow-50 cursor-pointer">Settings</li>
                  <li className="px-4 py-2 hover:bg-yellow-100 cursor-pointer text-red-500 font-semibold">Logout</li>
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Mobile hamburger */}
        <div className="md:hidden">
          <Menu className="text-yellow-700" />
        </div>
      </div>
    </header>
  );
};

export default Header;
