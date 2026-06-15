import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import StickmanWalletProvider from "./StickmanWalletProvider";
import "./StickmanFighterPage.css";

export default function StickmanFighterPage() {
  const iframeRef = useRef(null);

  useEffect(() => {
    document.title = "Are Ya Fighting Son? — SON Games";
  }, []);

  return (
    <StickmanWalletProvider iframeRef={iframeRef}>
      <div className="stickman-game-page">
        <Link to="/son-games" className="stickman-game-page__back">
          ← All Games
        </Link>
        <iframe
          ref={iframeRef}
          src="/games/stickman-fighter/index.html"
          title="Are Ya Fighting Son?"
          className="stickman-game-page__frame"
          allow="autoplay"
        />
      </div>
    </StickmanWalletProvider>
  );
}
