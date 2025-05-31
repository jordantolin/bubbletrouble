// src/pages/BubbleExpired.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

const BubbleExpired = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#FFF9ED] px-6 text-center">
      
      {/* Bubble Icon */}
      <div className="relative w-28 h-28 bg-yellow-300 rounded-full shadow-md mb-6 flex flex-col items-center justify-center">
        <div className="flex justify-center gap-4 text-xl text-red-700 font-bold">
          ✕ ✕
        </div>
        <div className="w-8 h-[3px] bg-red-400 rounded-full mt-3" />
      </div>

      {/* Title */}
      <h1 className="text-3xl font-extrabold text-red-600 mb-2 tracking-tight">Bubble 404</h1>

      {/* Subtitle */}
      <p className="text-sm text-gray-700 mb-6">
        This bubble is no longer available.<br />
        It popped after 24 hours.
      </p>

      {/* Button */}
      <button
        onClick={() => navigate('/')}
        className="px-5 py-2 bg-yellow-400 hover:bg-yellow-500 text-white rounded-full font-medium text-sm shadow-md border border-yellow-600 active:scale-95 transition"
      >
        ⬅ Go back
      </button>
    </div>
  );
};

export default BubbleExpired;
