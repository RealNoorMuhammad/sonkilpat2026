import React, { useState } from "react";
import { motion } from "framer-motion";
import heroImage from "../buttons/heroimage.jpeg";
import dextoolLogo from "../buttons/dextool.png";
import dexscreenerLogo from "../buttons/dexscreener.PNG";
import solscanLogo from "../buttons/solscan.png";
import twitterLogo from "../buttons/twitter.PNG";
import telegramLogo from "../buttons/telegram.PNG";
import "./HeroSection.css";

const CONTRACT =
  "ACpzkGJV3DDU8HXy8yjab7RL9qNmDGym2GwLkzNppump";

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

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  }),
};

function HeroSection() {
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
    <section className="hero" aria-labelledby="hero-heading">
      <div className="hero__inner">
        <div className="hero__content">
          <motion.p
            className="hero__eyebrow"
            custom={0}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
          >
            $SON · SOLANA
          </motion.p>

          <motion.h1
            id="hero-heading"
            className="hero__title"
            custom={1}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
          >
            ARE YA WINNING, SON?
          </motion.h1>

          <motion.div className="hero__copy" custom={2} initial="hidden" animate="visible" variants={fadeUp}>
            <p>Been staring at the screen since 2014.</p>
            <p>Are Ya Winning, $SON?</p>
            <p>Yes dad. we&apos;re finally winning.</p>
          </motion.div>

          <motion.div
            className="hero__ca"
            custom={3}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
          >
            <div className="hero__ca-body">
              <span className="hero__ca-label">Contract Address</span>
              <span className="hero__ca-value">{CONTRACT}</span>
            </div>
            <button
              type="button"
              className={`hero__ca-copy${copied ? " hero__ca-copy--done" : ""}`}
              onClick={handleCopy}
              aria-label={copied ? "Copied" : "Copy contract address"}
            >
              {copied ? "✓" : "⧉"}
            </button>
          </motion.div>

          <motion.div
            className="hero__socials"
            custom={4}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
          >
            {SOCIAL_LINKS.map((item) => (
              <a
                key={item.id}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="hero-social-btn"
                aria-label={item.alt}
              >
                <img src={item.src} alt={item.alt} />
              </a>
            ))}
          </motion.div>
        </div>

        <motion.div
          className="hero__visual"
          initial={{ opacity: 0, scale: 0.94, x: 24 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
        >
          <div className="hero__image-frame">
            <img src={heroImage} alt="Son character with headphones" className="hero__image" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default HeroSection;
