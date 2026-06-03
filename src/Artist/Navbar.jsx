import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import "./comic-buttons.css";
import "./Navbar.css";
import SiteLogo from "../buttons/SiteLogo";
import SocialIcons from "./SocialIcons";
import buyBtn from "../buttons/buy.PNG";

const MENU_LINKS = [
  { text: "Main", link: "/sonpfpmaker" },
  { text: "PFP Maker", link: "/pfp-maker" },
  { text: "MEME Generator", link: "/meme-generator" },
  { text: "Son AI PFP Maker", link: "/ai-pfp-maker" },
  { text: "Upload Meme", link: "/upload-meme" },
  { text: "What is Son PFP ?", link: "/about-son-pfp" },
  { text: "Son Meme", link: "/son-memes" },
  { text: "Love you Son", link: "https://areyawinningson.io/", external: true },
];

const BUY_URL =
  "https://dexscreener.com/solana/ACpzkGJV3DDU8HXy8yjab7RL9qNmDGym2GwLkzNppump";

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const leftMenuLinks = MENU_LINKS.slice(0, 4);
  const rightMenuLinks = MENU_LINKS.slice(4);

  useEffect(() => {
    document.body.classList.toggle("menu-open", menuOpen);
    return () => document.body.classList.remove("menu-open");
  }, [menuOpen]);

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.35, ease: "easeOut" } },
    exit: { opacity: 0, transition: { duration: 0.25, ease: "easeIn" } },
  };

  const listVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.08 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  };

  const renderMenuItem = (item, i) => (
    <motion.li key={`${item.text}-${i}`} variants={itemVariants}>
      {item.external ? (
        <a
          href={item.link}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => setMenuOpen(false)}
        >
          {item.text}
        </a>
      ) : (
        <Link to={item.link} onClick={() => setMenuOpen(false)}>
          {item.text}
        </Link>
      )}
    </motion.li>
  );

  return (
    <nav className={`navbar${menuOpen ? " navbar--menu-open" : ""}`}>
      <Link to="/" className="logo" onClick={() => setMenuOpen(false)}>
        <SiteLogo className="site-logo--nav" />
      </Link>

      <button
        type="button"
        className="comic-btn comic-btn--menu hamburger"
        onClick={() => setMenuOpen(true)}
        aria-label="Open menu"
      >
        <span />
        <span />
        <span />
      </button>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="menu-overlay"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
          >
            <button
              type="button"
              className="comic-btn comic-btn--circle close-btn"
              onClick={() => setMenuOpen(false)}
              aria-label="Close menu"
            >
              ✕
            </button>

            <div className="menu-overlay-inner">
              <div className="menu-list-grid">
                <motion.ul
                  className="menu-list menu-list--left"
                  variants={listVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {leftMenuLinks.map(renderMenuItem)}
                </motion.ul>

                <motion.ul
                  className="menu-list menu-list--right"
                  variants={listVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {rightMenuLinks.map(renderMenuItem)}
                </motion.ul>
              </div>

              <motion.div
                className="menu-actions"
                variants={listVariants}
                initial="hidden"
                animate="visible"
              >
                <a
                  href={BUY_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="menu-buy-btn"
                  onClick={() => setMenuOpen(false)}
                >
                  <img src={buyBtn} alt="Buy $SON" />
                </a>
                <SocialIcons />
              </motion.div>

              <motion.p className="menu-footer" variants={itemVariants}>
                Copyright © 2026 SON PFP. All rights reserved.
              </motion.p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

export default Navbar;
