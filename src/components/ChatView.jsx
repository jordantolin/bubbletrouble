import React, { useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Paperclip, Mic, Send, X } from 'lucide-react';
import GiphySearch from './GiphySearch';

const ChatView = () => {
  const { topic } = useParams();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [preview, setPreview] = useState(null);
  const [previewType, setPreviewType] = useState(null);
  const [showGiphy, setShowGiphy] = useState(false);
  const fileInputRef = useRef();

  const handleSendMessage = (msg) => {
    const newMessage = {
      id: Date.now(),
      type: msg.type || 'text',
      content: msg.content || msg,
    };
    setMessages((prev) => [...prev, newMessage]);
  };

  const handleSend = () => {
    if (input.trim() !== '') {
      handleSendMessage({ type: 'text', content: input });
      setInput('');
    }
    if (preview) {
      handleSendMessage({ type: previewType, content: preview });
      setPreview(null);
      setPreviewType(null);
      if (fileInputRef.current) fileInputRef.current.value = null;
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const type = file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : null;
      if (type) {
        setPreview(reader.result);
        setPreviewType(type);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col h-screen bg-[#FFF9ED]">
      {/* Header */}
      <div className="p-4 bg-white border-b shadow flex items-center justify-between">
        <h2 className="text-xl font-bold text-yellow-700">Chat: {topic}</h2>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, idx) => (
          <div key={idx} className="bg-white rounded-xl p-3 max-w-xs shadow text-sm text-gray-800">
            {msg.type === 'text' && <p>{msg.content}</p>}
            {msg.type === 'image' && <img src={msg.content} alt="preview" className="rounded-lg max-w-xs" />}
            {msg.type === 'video' && (
              <video controls className="rounded-lg max-w-xs">
                <source src={msg.content} type="video/mp4" />
              </video>
            )}
            {msg.type === 'gif' && <img src={msg.content} alt="gif" className="max-w-xs rounded" />}
          </div>
        ))}
        {preview && (
          <div className="relative max-w-xs">
            {previewType === 'image' && <img src={preview} alt="preview" className="rounded-lg shadow" />}
            {previewType === 'video' && (
              <video controls className="rounded-lg shadow">
                <source src={preview} type="video/mp4" />
              </video>
            )}
            <button onClick={() => {
              setPreview(null);
              setPreviewType(null);
              if (fileInputRef.current) fileInputRefRef.current.value = null;
            }} className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow">
              <X size={16} />
            </button>
          </div>
        )}
        {showGiphy && (
          <div className="mt-4">
            <GiphySearch onSelect={(gifUrl) => {
              handleSendMessage({ type: 'gif', content: gifUrl });
              setShowGiphy(false);
            }} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t shadow flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <label className="text-gray-500 hover:text-yellow-600 cursor-pointer">
            <Paperclip size={20} />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
          <input
            type="text"
            className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
            placeholder="Scrivi un messaggio..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <button onClick={handleSend} className="text-yellow-600 hover:text-yellow-800">
            <Send size={20} />
          </button>
          <button className="text-gray-500 hover:text-yellow-600">
            <Mic size={20} />
          </button>
        </div>
        <button
          type="button"
          onClick={() => setShowGiphy(!showGiphy)}
          className="text-sm text-yellow-500 hover:underline text-left"
        >
          + GIF
        </button>
      </div>
    </div>
  );
};

export default ChatView;
