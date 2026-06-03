import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "./supabaseClient";
import Footer from "./Footer";
import SiteLogo from "../buttons/SiteLogo";
import "./MemeLeaderboard.css";
import "./comic-buttons.css";

const shortWallet = (wallet = "") =>
  wallet.length > 10 ? `${wallet.slice(0, 4)}...${wallet.slice(-4)}` : wallet;

const normalizeMemes = (rows = []) =>
  rows.map(({ meme_likes, ...meme }) => ({
    ...meme,
    likes_count: meme_likes?.[0]?.count ?? meme.likes_count ?? 0,
  }));

const sortMemesByLikes = (memes = []) =>
  [...memes].sort((a, b) => {
    const likesDiff = (b.likes_count ?? 0) - (a.likes_count ?? 0);
    if (likesDiff !== 0) return likesDiff;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

const formatLikeCount = (count = 0) =>
  `${count} ${count === 1 ? "like" : "likes"}`;

const rankBadgeClass = (index) => {
  if (index === 0) return "rank-badge rank-badge--gold";
  if (index === 1) return "rank-badge rank-badge--silver";
  if (index === 2) return "rank-badge rank-badge--bronze";
  return "rank-badge";
};

function MemeLeaderboard() {
  const [memes, setMemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadLeaderboard = async () => {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from("memes")
        .select("*, meme_likes(count)")
        .order("created_at", { ascending: false })
        .limit(50);

      if (fetchError) {
        setError(fetchError.message || "Could not load leaderboard.");
      } else {
        setMemes(sortMemesByLikes(normalizeMemes(data)));
      }
      setLoading(false);
    };

    loadLeaderboard();
  }, []);

  return (
    <div className="leaderboard-page">
      <section className="leaderboard-header">
        <SiteLogo className="site-logo--hero" />
        <h1>Meme Leaderboard</h1>
        <p>Top $SON memes ranked by likes. Are ya winning, son?</p>
        <Link to="/upload-meme" className="comic-btn comic-btn--pill">
          Back to Upload Meme
        </Link>
      </section>

      <section className="leaderboard-content">
        {loading ? (
          <p className="hint">Loading leaderboard...</p>
        ) : error ? (
          <p className="hint error">{error}</p>
        ) : memes.length === 0 ? (
          <p className="hint">No memes ranked yet.</p>
        ) : (
          <div className="rank-list">
            {memes.map((meme, index) => (
              <motion.article
                className={`rank-card${index < 3 ? " rank-card--top" : ""}`}
                key={meme.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: index * 0.06 }}
              >
                <span className={rankBadgeClass(index)}>#{index + 1}</span>

                <div className="rank-card-media">
                  <img src={meme.image_url} alt={meme.title} />
                </div>

                <div className="rank-card-center">
                  <h3>{meme.title}</h3>
                  <div className="rank-card-meta">
                    <p className="rank-wallet">By {shortWallet(meme.author_wallet)}</p>
                  </div>
                </div>

                <div className="rank-card-side">
                  <strong className="rank-likes">{formatLikeCount(meme.likes_count || 0)}</strong>
                  <button
                    className="comic-btn comic-btn--pill rank-share-btn"
                    onClick={() => {
                      const text = `Top SON meme: "${meme.title}"`;
                      const shareUrl = `${window.location.origin}/meme-leaderboard`;
                      const intent = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
                        text
                      )}&url=${encodeURIComponent(shareUrl)}`;
                      window.open(intent, "_blank", "noopener,noreferrer");
                    }}
                  >
                    Share on X
                  </button>
                </div>
              </motion.article>
            ))}
          </div>
        )}
      </section>
      <Footer />
    </div>
  );
}

export default MemeLeaderboard;
