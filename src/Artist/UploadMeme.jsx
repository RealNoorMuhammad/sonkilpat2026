import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "./supabaseClient";
import Footer from "./Footer";
import SiteLogo from "../buttons/SiteLogo";
import "./UploadMeme.css";
import "./comic-buttons.css";

const MAX_FILE_SIZE = 8 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

const shortWallet = (wallet = "") =>
  wallet.length > 10 ? `${wallet.slice(0, 4)}...${wallet.slice(-4)}` : wallet;

const isValidSolanaAddress = (value = "") =>
  /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(value.trim());

const normalizeMemes = (rows = []) =>
  rows.map(({ meme_likes, ...meme }) => ({
    ...meme,
    likes_count: meme_likes?.[0]?.count ?? meme.likes_count ?? 0,
  }));

const formatLikeCount = (count = 0) =>
  `${count} ${count === 1 ? "like" : "likes"}`;

function MemeCommentList({ comments }) {
  const containerRef = useRef(null);
  const firstCommentRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    const firstComment = firstCommentRef.current;

    if (!container) return undefined;

    if (comments.length <= 1) {
      container.style.maxHeight = "";
      return undefined;
    }

    const syncHeight = () => {
      if (firstComment) {
        container.style.maxHeight = `${firstComment.offsetHeight}px`;
      }
    };

    syncHeight();
    window.addEventListener("resize", syncHeight);
    return () => window.removeEventListener("resize", syncHeight);
  }, [comments]);

  if (!comments.length) return null;

  return (
    <div
      ref={containerRef}
      className={`meme-comments${comments.length > 1 ? " meme-comments--scroll" : ""}`}
    >
      {comments.map((comment, index) => (
        <div className="meme-comment" key={comment.id} ref={index === 0 ? firstCommentRef : null}>
          <strong>{shortWallet(comment.wallet_address)}</strong>
          <p>{comment.comment_text}</p>
        </div>
      ))}
    </div>
  );
}

function ImageViewerModal({ open, imageUrl, title, onClose }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="meme-image-modal-backdrop" onClick={onClose}>
      <div className="meme-image-modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="meme-modal-close" onClick={onClose} aria-label="Close">
          ✕
        </button>
        {title && <p className="meme-image-modal-title">{title}</p>}
        <img src={imageUrl} alt={title || "Meme"} />
      </div>
    </div>
  );
}

function WalletModal({ open, title, description, wallet, onWalletChange, onSubmit, onClose, submitLabel, loading, children }) {
  if (!open) return null;

  return (
    <div className="meme-modal-backdrop" onClick={onClose}>
      <div className="meme-modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="meme-modal-close" onClick={onClose} aria-label="Close">
          ✕
        </button>
        <h3>{title}</h3>
        <p className="meme-modal-desc">{description}</p>
        {children}
        <input
          type="text"
          placeholder="Your Solana address"
          value={wallet}
          onChange={(e) => onWalletChange(e.target.value)}
          autoFocus
        />
        <button
          type="button"
          className="comic-btn comic-btn--pill"
          onClick={onSubmit}
          disabled={loading}
        >
          {loading ? "Saving..." : submitLabel}
        </button>
      </div>
    </div>
  );
}

function UploadMeme() {
  const [title, setTitle] = useState("");
  const [authorWallet, setAuthorWallet] = useState("");
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingFeed, setIsLoadingFeed] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [memes, setMemes] = useState([]);
  const [commentsByMeme, setCommentsByMeme] = useState({});

  const [likeModal, setLikeModal] = useState({ open: false, memeId: null, wallet: "" });
  const [commentModal, setCommentModal] = useState({
    open: false,
    memeId: null,
    wallet: "",
    text: "",
  });
  const [modalLoading, setModalLoading] = useState(false);
  const [likeModalError, setLikeModalError] = useState("");
  const [commentModalError, setCommentModalError] = useState("");
  const [imageViewer, setImageViewer] = useState({ open: false, url: "", title: "" });

  const loadMemes = useCallback(async () => {
    setIsLoadingFeed(true);
    const { data, error: fetchError } = await supabase
      .from("memes")
      .select("*, meme_likes(count)")
      .order("created_at", { ascending: false })
      .limit(50);

    if (fetchError) {
      setError(fetchError.message || "Could not load memes.");
      setIsLoadingFeed(false);
      return;
    }

    const nextMemes = normalizeMemes(data);
    setMemes(nextMemes);

    if (nextMemes.length) {
      const memeIds = nextMemes.map((m) => m.id);
      const { data: commentRows } = await supabase
        .from("meme_comments")
        .select("*")
        .in("meme_id", memeIds)
        .order("created_at", { ascending: true });

      const grouped = {};
      (commentRows || []).forEach((row) => {
        if (!grouped[row.meme_id]) grouped[row.meme_id] = [];
        grouped[row.meme_id].push(row);
      });
      setCommentsByMeme(grouped);
    } else {
      setCommentsByMeme({});
    }

    setIsLoadingFeed(false);
  }, []);

  useEffect(() => {
    loadMemes();
  }, [loadMemes]);

  useEffect(() => {
    if (!file) {
      setPreviewUrl("");
      return undefined;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const resetComposer = () => {
    setTitle("");
    setFile(null);
    setPreviewUrl("");
  };

  const validateUpload = () => {
    if (!title.trim()) return "Please add a meme name.";
    if (!isValidSolanaAddress(authorWallet)) {
      return "Enter a valid Solana address to upload.";
    }
    if (!file) return "Please select a meme image.";
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return "Only JPG, PNG, WEBP or GIF images are allowed.";
    }
    if (file.size > MAX_FILE_SIZE) {
      return "Max upload size is 8MB.";
    }
    return "";
  };

  const handleUpload = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    const validationError = validateUpload();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    const cleanWallet = authorWallet.trim();

    const { data: existing } = await supabase
      .from("memes")
      .select("id")
      .eq("author_wallet", cleanWallet)
      .maybeSingle();

    if (existing) {
      setError("This Solana address has already uploaded a meme. One upload per wallet.");
      setIsSubmitting(false);
      return;
    }

    const extension = file.name.split(".").pop()?.toLowerCase() || "png";
    const filePath = `${cleanWallet}/${Date.now()}-${crypto.randomUUID()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from("memes")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });

    if (uploadError) {
      setError(uploadError.message || "Upload failed.");
      setIsSubmitting(false);
      return;
    }

    const { data: publicData } = supabase.storage.from("memes").getPublicUrl(filePath);

    const { error: insertError } = await supabase.from("memes").insert({
      title: title.trim(),
      author_wallet: cleanWallet,
      image_path: filePath,
      image_url: publicData?.publicUrl,
    });

    if (insertError) {
      if (insertError.code === "23505") {
        setError("This Solana address has already uploaded a meme. One upload per wallet.");
      } else {
        setError(insertError.message || "Could not create meme post.");
      }
      setIsSubmitting(false);
      return;
    }

    setSuccess("Meme uploaded successfully.");
    resetComposer();
    await loadMemes();
    setIsSubmitting(false);
  };

  const openLikeModal = (memeId) => {
    setLikeModalError("");
    setLikeModal({ open: true, memeId, wallet: "" });
  };

  const submitLike = async () => {
    setLikeModalError("");
    const wallet = likeModal.wallet.trim();
    if (!isValidSolanaAddress(wallet)) {
      setLikeModalError("Enter a valid Solana address.");
      return;
    }

    setModalLoading(true);
    const likedMemeId = likeModal.memeId;

    const { error: likeError } = await supabase.from("meme_likes").insert({
      meme_id: likedMemeId,
      wallet_address: wallet,
    });

    if (likeError) {
      if (likeError.code === "23505") {
        setLikeModalError("This wallet already liked this meme.");
      } else {
        setLikeModalError(likeError.message || "Unable to add like.");
      }
      setModalLoading(false);
      return;
    }

    setMemes((prev) =>
      prev.map((meme) =>
        meme.id === likedMemeId
          ? { ...meme, likes_count: (meme.likes_count || 0) + 1 }
          : meme
      )
    );

    setLikeModal({ open: false, memeId: null, wallet: "" });
    setModalLoading(false);
    await loadMemes();
  };

  const openCommentModal = (memeId) => {
    setCommentModalError("");
    setCommentModal({ open: true, memeId, wallet: "", text: "" });
  };

  const submitComment = async () => {
    setCommentModalError("");
    const wallet = commentModal.wallet.trim();
    const text = commentModal.text.trim();

    if (!isValidSolanaAddress(wallet)) {
      setCommentModalError("Enter a valid Solana address.");
      return;
    }
    if (!text) {
      setCommentModalError("Write a comment first.");
      return;
    }
    if (text.length > 280) {
      setCommentModalError("Comment must be 280 characters or less.");
      return;
    }

    setModalLoading(true);

    const { error: commentError } = await supabase.from("meme_comments").insert({
      meme_id: commentModal.memeId,
      wallet_address: wallet,
      comment_text: text,
    });

    if (commentError) {
      if (commentError.code === "23505") {
        setCommentModalError("This wallet already commented on this meme.");
      } else {
        setCommentModalError(commentError.message || "Unable to add comment.");
      }
      setModalLoading(false);
      return;
    }

    setCommentModal({ open: false, memeId: null, wallet: "", text: "" });
    setModalLoading(false);
    await loadMemes();
  };

  const shareOnX = (meme) => {
    const shareText = `Check out "${meme.title}" on SON Upload Meme`;
    const shareUrl = `${window.location.origin}/upload-meme`;
    const intent = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      shareText
    )}&url=${encodeURIComponent(shareUrl)}`;
    window.open(intent, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="meme-page">
      <section className="meme-hero">
        <SiteLogo className="site-logo--hero" />
        <h1>Are Ya Meme&apos;ing, Son?</h1>
        <p>Upload. Like. Comment. Share. Climb the leaderboard with your best SON meme.</p>
        <Link to="/meme-leaderboard" className="comic-btn comic-btn--pill leaderboard-link">
          Leaderboard
        </Link>
      </section>

      <section className="meme-composer">
        <div className="meme-composer-box">
          <form onSubmit={handleUpload} className="meme-form">
            <div className="meme-form-fields">
              <h2>Create a Meme Post</h2>
              <p className="hint">One Solana address can upload only one meme.</p>
              <input
                type="text"
                placeholder="Meme name"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                maxLength={80}
              />
              <input
                type="text"
                placeholder="Your Solana address (required)"
                value={authorWallet}
                onChange={(event) => setAuthorWallet(event.target.value)}
              />
              <input
                type="file"
                accept={ACCEPTED_TYPES.join(",")}
                onChange={(event) => setFile(event.target.files?.[0] || null)}
              />
              <button className="comic-btn comic-btn--pill upload-btn" type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Uploading..." : "+ Post Meme"}
              </button>
            </div>

            <div className="meme-form-preview">
              {previewUrl ? (
                <div className="meme-preview">
                  <img src={previewUrl} alt="Upload preview" />
                </div>
              ) : (
                <div className="meme-preview meme-preview--empty">
                  <p>Image preview</p>
                  <span>Choose a meme image to see it here</span>
                </div>
              )}
            </div>
          </form>

          {error && <p className="status error">{error}</p>}
          {success && <p className="status success">{success}</p>}
        </div>
      </section>

      <section className="meme-feed">
        <h2>$Son Memes</h2>
        {isLoadingFeed ? (
          <p className="hint">Loading memes...</p>
        ) : memes.length === 0 ? (
          <p className="hint">No meme posts yet. Be the first one.</p>
        ) : (
          <div className="meme-grid">
            {memes.map((meme, index) => (
              <motion.article
                className="meme-card"
                key={meme.id}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                whileHover={{ scale: 1.03, rotate: 1 }}
              >
                <h3 className="meme-card-title">{meme.title}</h3>

                <div className="meme-card-row">
                  <div className="meme-card-media">
                    <button
                      type="button"
                      className="meme-card-image-btn"
                      onClick={() =>
                        setImageViewer({
                          open: true,
                          url: meme.image_url,
                          title: meme.title,
                        })
                      }
                      aria-label={`View ${meme.title}`}
                    >
                      <img src={meme.image_url} alt={meme.title} />
                    </button>
                    <span className="meme-like-badge">{meme.likes_count || 0} ❤</span>
                  </div>

                  <div className="card-actions card-actions--rail">
                    <button
                      className="comic-btn comic-btn--pill"
                      onClick={() => openLikeModal(meme.id)}
                    >
                      Like ({meme.likes_count || 0})
                    </button>
                    <button
                      className="comic-btn comic-btn--pill"
                      onClick={() => openCommentModal(meme.id)}
                    >
                      Comment
                    </button>
                    <button
                      className="comic-btn comic-btn--pill"
                      onClick={() => shareOnX(meme)}
                    >
                      Share on X
                    </button>
                  </div>
                </div>

                <div className="meme-card-body">
                  <div className="meme-card-meta">
                    <p className="meme-likes-total">{formatLikeCount(meme.likes_count || 0)}</p>
                    <p className="wallet">By {shortWallet(meme.author_wallet)}</p>
                  </div>
                  <MemeCommentList comments={commentsByMeme[meme.id] || []} />
                </div>
              </motion.article>
            ))}
          </div>
        )}
      </section>

      <WalletModal
        open={likeModal.open}
        title="Like this meme"
        description="Enter your Solana address. One wallet can like each meme only once."
        wallet={likeModal.wallet}
        onWalletChange={(v) => setLikeModal((prev) => ({ ...prev, wallet: v }))}
        onSubmit={submitLike}
        onClose={() => setLikeModal({ open: false, memeId: null, wallet: "" })}
        submitLabel="Like"
        loading={modalLoading}
      >
        {likeModalError && <p className="status error">{likeModalError}</p>}
      </WalletModal>

      <WalletModal
        open={commentModal.open}
        title="Add a comment"
        description="Enter your Solana address and comment. One wallet can comment once per meme."
        wallet={commentModal.wallet}
        onWalletChange={(v) => setCommentModal((prev) => ({ ...prev, wallet: v }))}
        onSubmit={submitComment}
        onClose={() => setCommentModal({ open: false, memeId: null, wallet: "", text: "" })}
        submitLabel="Post Comment"
        loading={modalLoading}
      >
        <textarea
          className="meme-comment-input"
          placeholder="Your comment..."
          value={commentModal.text}
          onChange={(e) => setCommentModal((prev) => ({ ...prev, text: e.target.value }))}
          maxLength={280}
          rows={3}
        />
        {commentModalError && <p className="status error">{commentModalError}</p>}
      </WalletModal>

      <ImageViewerModal
        open={imageViewer.open}
        imageUrl={imageViewer.url}
        title={imageViewer.title}
        onClose={() => setImageViewer({ open: false, url: "", title: "" })}
      />

      <Footer />
    </div>
  );
}

export default UploadMeme;
