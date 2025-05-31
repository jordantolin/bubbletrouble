import React, { useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';

export default function AvatarUpload({ onUpload }) {
  const inputRef = useRef(null);

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;

      const { error } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) throw error;

      const url = `https://aaxmbdmzsyfgnzielkir.supabase.co/storage/v1/object/public/avatars/${fileName}`;
      onUpload(url);
    } catch (err) {
      console.error('Errore upload avatar:', err.message);
      alert('Errore upload avatar.');
    }
  };

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.click();
    }
  }, []);

  return (
    <input
      ref={inputRef}
      type="file"
      accept="image/*"
      onChange={handleFileChange}
      className="hidden"
    />
  );
}
