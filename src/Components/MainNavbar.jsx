import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import SocialIcons from "../Artist/SocialIcons";
import "./MainNavbar.css";

const NAV_LINKS = [
  { text: "PFP Generator", to: "/sonpfpmaker" },
  { text: "Upload Meme", to: "/upload-meme" },
  { text: "MEME Generator", to: "/meme-generator" },
];

const BUY_URL =
  "https://dexscreener.com/solana/ACpzkGJV3DDU8HXy8yjab7RL9qNmDGym2GwLkzNppump";

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.28, ease: "easeOut" } },
  exit: { opacity: 0, transition: { duration: 0.2, ease: "easeIn" } },
};

const menuVariants = {
  hidden: { opacity: 0, scale: 0.96, y: -12 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: "spring", stiffness: 380, damping: 32 },
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    y: -8,
    transition: { duration: 0.22, ease: "easeIn" },
  },
};

const listVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09, delayChildren: 0.15 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.92 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 420, damping: 28 },
  },
};

function MainNavbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.body.classList.toggle("main-nav-open", menuOpen);
    return () => document.body.classList.remove("main-nav-open");
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className={`main-nav${menuOpen ? " main-nav--open" : ""}`}>
      <div className="main-nav__bar">
        <Link to="/" className="main-nav__brand" onClick={closeMenu}>
          ARE YA WINNING, SON?
        </Link>

        <nav className="main-nav__desktop" aria-label="Main navigation">
          {NAV_LINKS.map((item) => (
            <Link key={item.to} to={item.to} className="main-nav__link">
              {item.text}
            </Link>
          ))}
        </nav>

        <div className="main-nav__actions main-nav__actions--desktop">
          <SocialIcons showDex={false} />
          <a
            href={BUY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="main-nav__buy"
          >
            BUY ON DEX
          </a>
        </div>

        <button
          type="button"
          className={`main-nav__menu-btn${menuOpen ? " main-nav__menu-btn--open" : ""}`}
          onClick={() => setMenuOpen((open) => !open)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
        >
          <span className="main-nav__menu-btn-label">MENU</span>
          <span className="main-nav__menu-btn-bars" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
        </button>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              className="main-nav__backdrop"
              variants={overlayVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={closeMenu}
              aria-hidden="true"
            />

            <motion.div
              className="main-nav__mobile"
              variants={menuVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              role="dialog"
              aria-modal="true"
              aria-label="Mobile navigation"
            >
              <div className="main-nav__mobile-top">
                <p className="main-nav__mobile-tag">Navigation</p>
                <button
                  type="button"
                  className="main-nav__close-btn"
                  onClick={closeMenu}
                  aria-label="Close menu"
                >
                  <span className="main-nav__close-btn-label">Close</span>
                  <span className="main-nav__close-btn-x" aria-hidden="true">
                    <span />
                    <span />
                  </span>
                </button>
              </div>

              <motion.nav
                className="main-nav__mobile-links"
                variants={listVariants}
                initial="hidden"
                animate="visible"
              >
                {NAV_LINKS.map((item, i) => (
                  <motion.div key={item.to} variants={itemVariants}>
                    <Link
                      to={item.to}
                      className="main-nav__mobile-card"
                      onClick={closeMenu}
                    >
                      <span className="main-nav__mobile-card-num">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="main-nav__mobile-card-text">{item.text}</span>
                      <span className="main-nav__mobile-card-arrow" aria-hidden="true">
                        →
                      </span>
                    </Link>
                  </motion.div>
                ))}
              </motion.nav>

              <motion.div
                className="main-nav__mobile-footer"
                variants={listVariants}
                initial="hidden"
                animate="visible"
              >
                <motion.a
                  href={BUY_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="main-nav__buy main-nav__buy--mobile"
                  variants={itemVariants}
                  onClick={closeMenu}
                >
                  BUY ON DEX
                </motion.a>
                <motion.div
                  className="main-nav__mobile-social"
                  variants={itemVariants}
                >
                  <SocialIcons showDex={false} />
                </motion.div>
                <motion.p className="main-nav__mobile-copy" variants={itemVariants}>
                  Son on Solana · Are ya winning?
                </motion.p>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}

export default MainNavbar;
