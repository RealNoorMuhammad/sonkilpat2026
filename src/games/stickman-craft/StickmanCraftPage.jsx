import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import "./StickmanCraftPage.css";

export default function StickmanCraftPage() {
  useEffect(() => {
    document.title = "Stickman Craft — SON Games";
  }, []);

  return (
    <div className="stickman-game-page">
      <Link to="/son-games" className="stickman-game-page__back">
        ← All Games
      </Link>
      <iframe
        src="/games/stickman-craft/index.html"
        title="Stickman Craft"
        className="stickman-game-page__frame"
        allow="autoplay"
      />
    </div>
  );
}
