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

const COMING_SOON = [
  { id: "coming-1", name: "???", badge: "Coming Soon" },
  { id: "coming-2", name: "???", badge: "Coming Soon" },
  { id: "coming-3", name: "???", badge: "Coming Soon" },
];

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
          <ul className="son-games__grid">
            {GAMES.map((game) => (
              <li key={game.id} className="son-games__grid-item">
                <Link to={game.path} className="son-games__card">
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
          <ul className="son-games__grid son-games__grid--soon">
            {COMING_SOON.map((game) => (
              <li key={game.id} className="son-games__grid-item">
                <div className="son-games__card son-games__card--soon" aria-disabled="true">
                  <span className="son-games__card-badge son-games__card-badge--soon">
                    {game.badge}
                  </span>
                  <div className="son-games__card-content">
                    <p className="son-games__card-quote">Loading soon...</p>
                    <span className="son-games__card-name son-games__card-name--soon">
                      {game.name}
                    </span>
                    <span className="son-games__card-cta son-games__card-cta--soon">
                      Coming Soon
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
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
