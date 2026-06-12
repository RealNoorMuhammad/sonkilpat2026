import React, { useState } from "react";
import { Link } from "react-router-dom";
import dextoolLogo from "../buttons/dextool.png";
import dexscreenerLogo from "../buttons/dexscreener.PNG";
import solscanLogo from "../buttons/solscan.png";
import twitterLogo from "../buttons/twitter.PNG";
import telegramLogo from "../buttons/telegram.PNG";
import "./HomeFooter.css";

const CONTRACT = "ACpzkGJV3DDU8HXy8yjab7RL9qNmDGym2GwLkzNppump";
const BUY_URL = `https://dexscreener.com/solana/${CONTRACT}`;

const SOCIAL_LINKS = [
  {
    id: "dextool",
    href: `https://www.dextools.io/app/en/solana/token/${CONTRACT}`,
    src: dextoolLogo,
    alt: "DEXTools",
  },
  {
    id: "dexscreener",
    href: `https://dexscreener.com/solana/${CONTRACT}`,
    src: dexscreenerLogo,
    alt: "DexScreener",
  },
  {
    id: "solscan",
    href: `https://solscan.io/token/${CONTRACT}`,
    src: solscanLogo,
    alt: "Solscan",
  },
  {
    id: "twitter",
    href: "https://x.com/WinningSon_",
    src: twitterLogo,
    alt: "X (Twitter)",
  },
  {
    id: "telegram",
    href: "https://t.me/WinningSonOnSol",
    src: telegramLogo,
    alt: "Telegram",
  },
];

const NAV_LINKS = [
  { text: "PFP Generator", to: "/sonpfpmaker" },
  { text: "Upload Meme", to: "/upload-meme" },
  { text: "MEME Generator", to: "/meme-generator" },
  { text: "SON Games", to: "/son-games" },
];

function HomeFooter() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(CONTRACT);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  };

  return (
    <footer className="home-footer">
      <div className="home-footer__inner">
        <div className="home-footer__brand">
          <p className="home-footer__eyebrow">$SON · SOLANA</p>
          <h2 className="home-footer__title">Are ya winning, son?</h2>
          <p className="home-footer__tagline">Been staring at the screen since 2014.</p>
        </div>

        <div className="home-footer__ca">
          <div className="home-footer__ca-body">
            <span className="home-footer__ca-label">Contract Address</span>
            <span className="home-footer__ca-value">{CONTRACT}</span>
          </div>
          <button
            type="button"
            className={`home-footer__ca-copy${copied ? " home-footer__ca-copy--done" : ""}`}
            onClick={handleCopy}
            aria-label={copied ? "Copied" : "Copy contract address"}
          >
            {copied ? "✓" : "⧉"}
          </button>
        </div>

        <div className="home-footer__socials" aria-label="Social and chart links">
          {SOCIAL_LINKS.map((item) => (
            <a
              key={item.id}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className="home-footer__social-btn"
              aria-label={item.alt}
            >
              <img src={item.src} alt={item.alt} />
            </a>
          ))}
        </div>

        <nav className="home-footer__nav" aria-label="Footer navigation">
          {NAV_LINKS.map((item) => (
            <Link key={item.to} to={item.to} className="home-footer__nav-link">
              {item.text}
            </Link>
          ))}
        </nav>

        <div className="home-footer__actions">
          <a
            href={BUY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="home-footer__buy"
          >
            Buy on Dex
          </a>
        </div>

        <p className="home-footer__legal">
          $SON is a meme coin with no intrinsic value. This is not financial advice. DYOR.
        </p>
        <p className="home-footer__copy">© {new Date().getFullYear()} Are Ya Winning, Son?</p>
      </div>
    </footer>
  );
}

export default HomeFooter;
