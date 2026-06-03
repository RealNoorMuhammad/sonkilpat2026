// src/ArtistSubmission.jsx
import React, { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import { motion } from "framer-motion";
import {
  Window,
  WindowHeader,
  WindowContent,
  TextField,
  Button,
  Fieldset,
  Separator,
} from "react95";

export default function ArtistSubmission() {
  const [form, setForm] = useState({ name: "", file: null });
  const [errors, setErrors] = useState({});
  const [artList, setArtList] = useState([]);
  const [selectedArt, setSelectedArt] = useState(null);

  useEffect(() => {
    fetchArt();
  }, []);

  async function fetchArt() {
    const { data, error } = await supabase
      .from("artworks")
      .select("id, title, image_url")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching artworks:", error.message);
    } else {
      setArtList(data || []);
    }
  }

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setForm((prev) => ({ ...prev, [name]: files ? files[0] : value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { name, file } = form;
    const errs = {};
    if (!name.trim()) errs.name = "Name is required.";
    if (!file) errs.file = "Image is required.";
    if (Object.keys(errs).length) return setErrors(errs);

    // Make a unique filename
    const ext = file.name.split(".").pop();
    const filename = `${Date.now()}.${ext}`;

    // Upload to Supabase Storage (bucket must be named 'artworks')
    const { error: uploadError } = await supabase.storage
      .from("artworks")
      .upload(filename, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError.message);
      return;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("artworks")
      .getPublicUrl(filename);

    const publicUrl = urlData?.publicUrl;
    if (!publicUrl) {
      console.error("Could not get public URL. Is your bucket public?");
      return;
    }

    // Insert record into artworks table
    const { error: insertError } = await supabase.from("artworks").insert([
      { title: name, image_url: publicUrl },
    ]);

    if (insertError) {
      console.error("Database insert error:", insertError.message);
    } else {
      setForm({ name: "", file: null });
      fetchArt();
    }
  };

  return (
    <div className="containerxz">
      {/* Submission Form */}
      <Window className="form-section">
        <WindowHeader>submit-art.exe</WindowHeader>
        <WindowContent>
          <form onSubmit={handleSubmit} className="submission-form">
            <Fieldset label="Artist Name">
              <TextField
                fullWidth
                name="name"
                value={form.name}
                onChange={handleChange}
              />
              {errors.name && <div className="error">{errors.name}</div>}
            </Fieldset>
            <Fieldset label="Upload Image">
              <input
                type="file"
                accept="image/*"
                name="file"
                onChange={handleChange}
              />
              {errors.file && <div className="error">{errors.file}</div>}
            </Fieldset>
            <Separator style={{ margin: "20px 0" }} />
            <Button type="submit">🎨 Submit Artwork</Button>
          </form>
        </WindowContent>
      </Window>

      {/* Gallery */}
      <Window className="list-section">
        <WindowHeader>gallery.exe</WindowHeader>
        <WindowContent>
          <motion.div
            className="listGrid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {artList.map((art) => (
              <motion.div
                className="listItem"
                key={art.id}
                whileHover={{ scale: 1.05 }}
              >
                <img
                  src={art.image_url}
                  alt={art.title}
                  onClick={() => setSelectedArt(art)}
                />
                <div className="tipTitle">{art.title}</div>
              </motion.div>
            ))}
          </motion.div>
        </WindowContent>
      </Window>

      {/* Image preview modal */}
      {selectedArt && (
        <div className="modal-backdrop">
          <Window className="modal-window">
            <WindowHeader className="modal-header">
              Artwork
              <Button size="sm" onClick={() => setSelectedArt(null)}>
                x
              </Button>
            </WindowHeader>
            <WindowContent>
              <img
                src={selectedArt.image_url}
                alt={selectedArt.title}
                className="modal-image"
              />
              <p>{selectedArt.title}</p>
            </WindowContent>
          </Window>
        </div>
      )}
    </div>
  );
}
