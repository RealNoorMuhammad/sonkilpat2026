import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

const SubmittedImages = () => {
  const [images, setImages] = useState([]);

  const fetchImages = async () => {
    const { data, error } = await supabase
      .from('submitted_images')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error) {
      setImages(data);
    } else {
      console.error('Fetch error:', error);
    }
  };

  useEffect(() => {
    fetchImages();
  }, []);

  return (
    <div className="submitted-section">
      <h2>🖼️ Submitted Images</h2>
      <div className="image-grid">
        {images.map((img) => (
          <div key={img.id} className="image-card">
            <img src={img.url} alt={img.name} />
            <p>{img.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SubmittedImages;
