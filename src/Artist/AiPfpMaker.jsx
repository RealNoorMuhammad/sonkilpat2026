import React, { useCallback, useEffect, useState } from "react";
import { FaDownload, FaRedo } from "react-icons/fa";
import Footer from "./Footer";
import SiteLogo from "../buttons/SiteLogo";
import "./comic-buttons.css";
import "./AiPfpMaker.css";
import {
  formatCooldown,
  getCooldownStatus,
  recordGeneration,
} from "./aiPfp/rateLimit";
import { generateSonMemePfp } from "./aiPfp/sonAiApi";

const MAX_FILE_MB = 8;

function AiPfpMaker() {
  const [previewUrl, setPreviewUrl] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [resultUrl, setResultUrl] = useState(null);
  const [status, setStatus] = useState("idle");
  const [progressText, setProgressText] = useState("");
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(getCooldownStatus);

  const refreshCooldown = useCallback(() => {
    setCooldown(getCooldownStatus());
  }, []);

  useEffect(() => {
    refreshCooldown();
    const timer = setInterval(refreshCooldown, 1000);
    return () => clearInterval(timer);
  }, [refreshCooldown]);

  const resetSelection = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setSelectedFile(null);
    setResultUrl(null);
    setError("");
    setStatus("idle");
    setProgressText("");
  };

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
    setResultUrl(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setStatus("ready");
  };

  const handleInputChange = (e) => {
    handleFile(e.target.files?.[0]);
    e.target.value = "";
  };

  const handleDrop = (e) => {
    e.preventDefault();
    handleFile(e.dataTransfer.files?.[0]);
  };

  const handleGenerate = async () => {
    if (!selectedFile) return;

    const limit = getCooldownStatus();
    if (!limit.allowed) {
      setError(
        `One Son AI PFP per PC every 24 hours. Try again in ${formatCooldown(limit.remainingMs)}.`
      );
      refreshCooldown();
      return;
    }

    setError("");
    setStatus("generating");
    setProgressText("Starting…");

    try {
      const outputUrl = await generateSonMemePfp(selectedFile, {
        onProgress: setProgressText,
      });
      recordGeneration();
      refreshCooldown();
      setResultUrl(outputUrl);
      setStatus("done");
    } catch (err) {
      setStatus("ready");
      setError(
        err?.message || "Generation failed. Check your connection and try again."
      );
    } finally {
      setProgressText("");
    }
  };

  const handleDownload = () => {
    if (!resultUrl) return;
    const a = document.createElement("a");
    a.href = resultUrl;
    a.download = "son-ai-meme-pfp.png";
    a.click();
  };

  const isGenerating = status === "generating";
  const canGenerate =
    selectedFile && cooldown.allowed && !isGenerating && status !== "done";

  return (
    <div
      className="ai-pfp-page"
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
    >
      <SiteLogo className="site-logo--hero ai-pfp-logo" />
      <h1 className="ai-pfp-title">Son AI PFP Maker</h1>
      <p className="ai-pfp-subtitle">
        Upload any photo — AI turns it into an &ldquo;Are ya winning, son?&rdquo;
        meme PFP. One free generation per PC every 24 hours.
      </p>

      {!cooldown.allowed && (
        <p className="ai-pfp-cooldown" role="status">
          Next generation available in{" "}
          <strong>{formatCooldown(cooldown.remainingMs)}</strong>
        </p>
      )}

      {error && (
        <p className="ai-pfp-error" role="alert">
          {error}
        </p>
      )}

      {status !== "done" && (
        <div className="ai-pfp-upload">
          {previewUrl ? (
            <img src={previewUrl} alt="Your upload" className="ai-pfp-preview" />
          ) : (
            <label htmlFor="ai-pfp-input" className="ai-pfp-dropzone">
              <span className="ai-pfp-dropzone-icon">+</span>
              <span>Upload an image</span>
              <small>JPG, PNG, or WebP — max {MAX_FILE_MB} MB</small>
            </label>
          )}

          <input
            id="ai-pfp-input"
            type="file"
            accept="image/*"
            className="ai-pfp-hidden-input"
            onChange={handleInputChange}
            disabled={isGenerating || !cooldown.allowed}
          />

          {previewUrl && (
            <button
              type="button"
              className="comic-btn comic-btn--pill ai-pfp-secondary-btn"
              onClick={resetSelection}
              disabled={isGenerating}
            >
              <FaRedo /> Choose another image
            </button>
          )}
        </div>
      )}

      {status === "ready" && cooldown.allowed && (
        <button
          type="button"
          className="comic-btn comic-btn--pill ai-pfp-generate-btn"
          onClick={handleGenerate}
          disabled={!canGenerate}
        >
          Generate Son Meme PFP
        </button>
      )}

      {isGenerating && (
        <div className="ai-pfp-loading" aria-live="polite">
          <div className="ai-pfp-spinner" />
          <p>{progressText || "Creating your meme PFP…"}</p>
          <small>This uses AI over the internet and may take a minute.</small>
        </div>
      )}

      {status === "done" && resultUrl && (
        <div className="ai-pfp-result">
          <p className="ai-pfp-result-label">Are ya winning, son?</p>
          <img
            src={resultUrl}
            alt="Generated Son meme PFP"
            className="ai-pfp-result-img"
          />
          <div className="ai-pfp-result-actions">
            <button
              type="button"
              className="comic-btn comic-btn--pill ai-pfp-generate-btn"
              onClick={handleDownload}
            >
              <FaDownload /> Download PFP
            </button>
          </div>
          <p className="ai-pfp-done-note">
            You used your daily AI generation on this device. Come back in 24
            hours to make another.
          </p>
        </div>
      )}

      <Footer />
    </div>
  );
}

export default AiPfpMaker;
