import React, { useState } from "react";
// import { createBubble } from '../api/bubbles'; // Assicurati che la funzione abbia solo: name, topic, description

const topics = [
  "Filosofia", "Spiritualità", "Tecnologia", "Arte", "Musica", "Scienza", "Altro"
];

const CreateBubbleModal = ({ open, onClose, onCreate }) => {
  const [name, setName] = useState("");
  const [topic, setTopic] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  async function handleCreate(e) {
    e.preventDefault();
    setError("");
    if (!name.trim() || !topic.trim()) return;
    setLoading(true);

    try {
      const payload = {
        name: name.trim(),
        topic: topic.trim(),
        description: description.trim(),
      };
    
      const data = await onCreate(payload); // ricevi risposta da ThreeDCanvas
    
      if (!data || !data.id) {
        console.error("Errore: data è undefined o senza id", data);
        throw new Error("Errore: data is undefined o senza id");
      }
    
      setName("");
      setTopic("");
      setDescription("");
      onClose(); // Close modal on success
    } catch (err) {
      console.error("Error creating bubble via modal:", err);
      setError(err?.message || "Errore nella creazione. Riprova.");
    } finally {
      setLoading(false);
    }
    
  }

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#10101088] backdrop-blur-[2.5px] overflow-auto"
      style={{ paddingTop: 'env(safe-area-inset-top)', overflowY: 'auto', overflowX: 'hidden' }}
    >

      <div className="bg-[#FFF9ED] rounded-2xl shadow-2xl p-7 w-full max-w-md border border-yellow-100 relative animate-in fade-in zoom-in">
        {/* Close */}
        <button
          type="button"
          className="absolute right-4 top-3 text-gray-400 hover:text-gray-700 text-xl font-bold min-h-[48px] min-w-[48px]"
          onTouchStart={onClose}
          aria-label="Close"
          disabled={loading}
        >×</button>
        {/* Title */}
        <div className="flex items-center gap-2 mb-1">
          <span className="text-yellow-400 text-2xl font-bold">+</span>
          <span className="text-yellow-600 text-xl font-bold">Create New Bubble</span>
        </div>
        <p className="text-gray-500 text-[15px] mb-5 leading-tight">
          Create a new bubble that will last for 24 hours. Invite others to join your conversation!
        </p>
        <form onSubmit={(e) => { e.preventDefault(); handleCreate(e); }}>
          <label className="block mb-2 font-semibold text-gray-800">
            Name
            <input
              type="text"
              className="block w-full mt-1 p-2 border border-yellow-200 rounded-lg focus:outline-none focus:border-yellow-400 text-lg font-medium bg-white"
              placeholder="My awesome bubble"
              value={name}
              onChange={e => setName(e.target.value)}
              maxLength={40}
              required
              autoFocus
              disabled={loading}
            />
          </label>
          <label className="block mb-2 font-semibold text-gray-800 mt-2">
            Topic
            <select
              className="block w-full mt-1 p-2 border border-yellow-200 rounded-lg bg-white"
              value={topic}
              onChange={e => setTopic(e.target.value)}
              required
              disabled={loading}
            >
              <option value="">Select a topic</option>
              {topics.map((t, i) => (
                <option key={i} value={t}>{t}</option>
              ))}
            </select>
          </label>
          <label className="block mb-2 font-semibold text-gray-800 mt-2">
            Description
            <textarea
              className="block w-full mt-1 p-2 border border-yellow-200 rounded-lg bg-white"
              placeholder="What would you like to discuss in this bubble? (optional)"
              value={description}
              onChange={e => setDescription(e.target.value)}
              maxLength={140}
              rows={2}
              disabled={loading}
            />
          </label>
          {error && <div className="text-red-600 mt-2 mb-1 text-sm">{error}</div>}
          <button
            type="submit"
            className={`w-full mt-5 py-2 rounded-xl text-lg font-semibold transition min-h-[48px] min-w-[48px]
            ${name && topic && !loading ? 'bg-yellow-400 text-white hover:bg-yellow-500' : 'bg-yellow-100 text-yellow-400 cursor-not-allowed'}`}
            disabled={!(name && topic) || loading}
          >
            {loading ? "Creating..." : "Create Bubble"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateBubbleModal;
