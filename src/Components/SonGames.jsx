import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "../theme/ThemeContext";
import ThemeToggle from "./ThemeToggle";
import "./SonGames.css";

function SonGames() {
  const { theme } = useTheme();

  useEffect(() => {
    document.title = "SON Games — Are ya winning, $SON?";
  }, []);

  return (
    <div className="main-home son-games-page" data-theme={theme}>
      <Link to="/" className="son-games__home-btn">
        ← Home
      </Link>
      <main className="son-games" aria-labelledby="son-games-heading">
        <p className="son-games__eyebrow">$SON · SOLANA</p>
        <h1 id="son-games-heading" className="son-games__title">
          SON GAMES
        </h1>
        <p className="son-games__status">Under Development</p>
        <p className="son-games__tagline">
          Are ya winning, son? Games loading soon — stay tuned.
        </p>
      </main>
      <ThemeToggle />
    </div>
  );
}

export default SonGames;
