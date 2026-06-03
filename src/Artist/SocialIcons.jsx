import React from "react";

import "./comic-buttons.css";

import "./SocialIcons.css";

import twitterLogo from "../buttons/twitter.PNG";

import dexscreenerLogo from "../buttons/dexscreener.PNG";



const DEXSCREENER_URL =

  "https://dexscreener.com/solana/ACpzkGJV3DDU8HXy8yjab7RL9qNmDGym2GwLkzNppump";



function SocialIcons({ plain = false, showDex = true }) {
  const linkClass = plain
    ? "social-icon-btn social-icon-btn--plain"
    : "comic-btn comic-btn--circle comic-btn--md social-icon-btn";

  return (
    <div className={`social-icons${plain ? " social-icons--plain" : ""}`}>
      <a
        href="https://x.com/WinningSon_"
        target="_blank"
        rel="noopener noreferrer"
        className={`${linkClass} social-icon-btn--x`}
      >
        <img src={twitterLogo} alt="X (Twitter)" />
      </a>
      {showDex && (
        <a
          href={DEXSCREENER_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={`${linkClass} social-icon-btn--dex`}
        >
          <img src={dexscreenerLogo} alt="DexScreener" />
        </a>
      )}
    </div>
  );
}



export default SocialIcons;

