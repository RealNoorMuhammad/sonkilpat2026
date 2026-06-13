import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "../theme/ThemeContext";
import ThemeToggle from "./ThemeToggle";
import "./SonGames.css";

const GAMES = [
  {
    id: "stickman-fighter",
    name: "Are Ya Fighting Son?",
    path: "/son-games/stickman-fighter",
  },
];

function SonGamesLoading() {
  return (
    <div className="son-games__loading" role="status" aria-live="polite" aria-busy="true">
      <div className="son-games__loading-orbit" aria-hidden="true">
        {[0, 1, 2].map((slot) => (
          <div
            key={slot}
            className="son-games__loading-orbit-item"
            style={{ animationDelay: `${slot * 0.35}s` }}
          >
            <span className="son-games__loading-ring" />
            <span className="son-games__loading-core">?</span>
          </div>
        ))}
      </div>

      <div className="son-games__loading-eq" aria-hidden="true">
        {Array.from({ length: 12 }, (_, i) => (
          <span
            key={i}
            className="son-games__loading-bar"
            style={{ animationDelay: `${i * 0.08}s` }}
          />
        ))}
      </div>

      <p className="son-games__loading-text">
        Are ya waiting, son?
        <span className="son-games__loading-dots" aria-hidden="true">
          <span>.</span>
          <span>.</span>
          <span>.</span>
        </span>
      </p>

      <div className="son-games__loading-track" aria-hidden="true">
        <div className="son-games__loading-fill" />
        <div className="son-games__loading-glow" />
      </div>

      <p className="son-games__loading-sub">New games drop here first</p>
    </div>
  );
}

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
        <p className="son-games__tagline">
          One game live now. More games coming soon — stay tuned, son.
        </p>

        <section className="son-games__section" aria-label="Available games">
          <h2 className="son-games__section-title">Play Now</h2>
          <ul className="son-games__grid son-games__grid--play">
            {GAMES.map((game) => (
              <li key={game.id} className="son-games__grid-item">
                <Link to={game.path} className="son-games__card son-games__card--row">
                  <div className="son-games__card-content">
                    <span className="son-games__card-name">{game.name}</span>
                    <span className="son-games__card-cta">
                      Play Game
                      <span className="son-games__card-cta-arrow" aria-hidden>
                        →
                      </span>
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="son-games__section" aria-label="Coming soon games">
          <h2 className="son-games__section-title">More Games Coming</h2>
          <SonGamesLoading />
        </section>

        <p className="son-games__footer-note">
          Are ya winning, son? New games drop here first.
        </p>
      </main>
      <ThemeToggle />
    </div>
  );
}

export default SonGames;
