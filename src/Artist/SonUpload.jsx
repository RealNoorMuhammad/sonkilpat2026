import React, { useState, useRef } from "react";
import "./comic-buttons.css";
import "./SonUpload.css";
import upload from "./upload.png";
import faceNormal from "../faces/normal.jpeg";
import Editor from "./Editor";
import Footer from "./Footer";
import SiteLogo from "../buttons/SiteLogo";

const MAX_FILE_MB = 8;

const createBlankCanvas = (size = 512) => {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, size, size);
  return canvas.toDataURL("image/png");
};

function SonUpload() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [initialFaceSrc, setInitialFaceSrc] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  const handleFile = (file) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file (JPG, PNG, or WebP).");
      return;
    }

    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      setError(`Image must be under ${MAX_FILE_MB} MB.`);
      return;
    }

    setError("");
    setInitialFaceSrc(null);
    const reader = new FileReader();
    reader.onload = () => setSelectedImage(reader.result);
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e) => {
    handleFile(e.target.files?.[0]);
    e.target.value = "";
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFile(e.dataTransfer.files?.[0]);
  };

  const handleFacePfp = () => {
    setError("");
    setSelectedImage(createBlankCanvas());
    setInitialFaceSrc(faceNormal);
  };

  return (
    <div className="pfp-maker-page">
      {!selectedImage ? (
        <div className="pfp-maker-upload">
          <header className="pfp-maker-header">
            <SiteLogo className="site-logo--hero pfp-maker-logo" />
            <h1 className="pfp-maker-title">PFP Maker</h1>
            <p className="pfp-maker-subtitle">
              Upload. Edit. Meme it. Make your PFP legendary.
            </p>
          </header>

          {error && <p className="pfp-maker-error">{error}</p>}

          <div
            className={`pfp-maker-dropzone${dragActive ? " pfp-maker-dropzone--active" : ""}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <img src={upload} className="pfp-maker-upload-icon" alt="" />
            <h2 className="pfp-maker-dropzone-title">ARE YA PFP&apos;ING, SON?</h2>
            <p className="pfp-maker-dropzone-text">
              Drop your photo here, then add stickers and text.
            </p>
            <div className="pfp-maker-actions">
              <label
                className="comic-btn comic-btn--pill pfp-maker-action-btn"
                htmlFor="pfp-upload-input"
              >
                + Upload an image
              </label>
              <button
                type="button"
                className="comic-btn comic-btn--pill pfp-maker-action-btn"
                onClick={handleFacePfp}
              >
                face pfp
              </button>
            </div>
            <input
              id="pfp-upload-input"
              type="file"
              ref={fileInputRef}
              className="pfp-maker-file-input"
              accept="image/*"
              onChange={handleFileChange}
            />
            <small className="pfp-maker-dropzone-hint">or drag &amp; drop here</small>
          </div>
        </div>
      ) : (
        <div className="pfp-maker-editor-wrap">
          <Editor
            image={selectedImage}
            initialFaceSrc={initialFaceSrc}
            allowBackgroundDownload={!initialFaceSrc}
            onBack={() => {
              setSelectedImage(null);
              setInitialFaceSrc(null);
              setError("");
            }}
          />
        </div>
      )}

      <Footer />
    </div>
  );
}

export default SonUpload;
