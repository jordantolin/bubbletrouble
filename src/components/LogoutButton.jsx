// src/components/LogoutButton.jsx
import React from "react";
import { supabase } from "../supabaseClient";

const LogoutButton = () => {
  const handleLogout = async () => {
    await supabase.auth.signOut();
    // Only reload if necessary
    window.location.reload(); // Forza l'aggiornamento e rilegge la sessione
  };

  return (
    <button
      style={{
        padding: "8px 16px",
        borderRadius: "8px",
        background: "#FFD600",
        color: "#333",
        fontWeight: "bold",
        border: "none",
        cursor: "pointer",
        margin: "10px"
      }}
      onClick={handleLogout}
    >
      Logout
    </button>
  );
};

export default LogoutButton;
