import React, { useState } from 'react';
import axios from 'axios';

const GIPHY_API_KEY = 'PxGhLT9dme9aYW5mZtK6V7atEUupA41R'; // ← Inserisci la tua API Key qui

const GiphySearch = ({ onSelect }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  const searchGifs = async () => {
    if (!query) return;
    try {
      const res = await axios.get('https://api.giphy.com/v1/gifs/search', {
        params: {
          api_key: GIPHY_API_KEY,
          q: query,
          limit: 12,
        },
      });
      setResults(res.data.data);
    } catch (err) {
      console.error('Errore nella ricerca GIF:', err);
    }
  };

  return (
    <div className="bg-white border rounded p-3 w-full max-w-md shadow-lg">
      <div className="flex gap-2 mb-2">
        <input
          type="text"
          placeholder="Search GIFs..."
          className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-300"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && searchGifs()}
        />
        <button
          onClick={searchGifs}
          className="text-sm bg-yellow-400 text-white px-3 py-2 rounded hover:bg-yellow-500 transition"
        >
          Search
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2 mt-2 max-h-56 overflow-y-auto">
        {results.map((gif) => (
          <img
            key={gif.id}
            src={gif.images.fixed_width_small.url}
            alt={gif.title}
            className="cursor-pointer hover:scale-105 transition-transform rounded"
            onClick={() => onSelect(gif.images.original.url)}
          />
        ))}
      </div>
    </div>
  );
};

export default GiphySearch;
