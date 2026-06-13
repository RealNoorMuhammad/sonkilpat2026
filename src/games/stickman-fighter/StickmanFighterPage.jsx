import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import "./StickmanFighterPage.css";

export default function StickmanFighterPage() {
  useEffect(() => {
    document.title = "Are Ya Fighting Son? — SON Games";
  }, []);

  return (
    <div className="stickman-game-page">
      <Link to="/son-games" className="stickman-game-page__back">
        ← All Games
      </Link>
      <iframe
        src="/games/stickman-fighter/index.html"
        title="Are Ya Fighting Son?"
        className="stickman-game-page__frame"
        allow="autoplay"
      />
    </div>
  );
}
