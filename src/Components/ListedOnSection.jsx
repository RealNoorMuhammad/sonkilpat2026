import React from "react";
import { motion } from "framer-motion";
import coingeckoLogo from "../buttons/coingecko.png";
import "./ListedOnSection.css";

const COINGECKO_URL = "https://www.coingecko.com/en/coins/are-ya-winning-son-2";

const ease = [0.22, 1, 0.36, 1];

function ListedOnSection() {
  return (
    <section className="listed-on" aria-labelledby="listed-on-heading">
      <div className="listed-on__bg" aria-hidden="true">
        <div className="listed-on__grid" />
        <div className="listed-on__orb listed-on__orb--a" />
        <div className="listed-on__orb listed-on__orb--b" />
      </div>

      <div className="listed-on__inner">
        <motion.header
          className="listed-on__header"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.65, ease }}
        >
          <p className="listed-on__eyebrow">$SON · VERIFIED LISTING</p>
          <h2 id="listed-on-heading" className="listed-on__title">
            Listed On
          </h2>
        </motion.header>

        <motion.a
          href={COINGECKO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="listed-on__showcase"
          initial={{ opacity: 0, y: 32, scale: 0.98 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.7, ease, delay: 0.08 }}
          whileHover={{ y: -4 }}
        >
          <span className="listed-on__showcase-shine" aria-hidden="true" />
          <span className="listed-on__showcase-border" aria-hidden="true" />

          <span className="listed-on__logo-stage">
            <span className="listed-on__logo-ring" aria-hidden="true" />
            <span className="listed-on__logo-glow" aria-hidden="true" />
            <img src={coingeckoLogo} alt="" className="listed-on__logo" />
          </span>

          <span className="listed-on__copy">
            <span className="listed-on__badge">
              <span className="listed-on__badge-dot" aria-hidden="true" />
              Verified Listing
            </span>
            <span className="listed-on__name">CoinGecko</span>
            <span className="listed-on__desc">
              Live price, market cap &amp; community stats
            </span>
          </span>

          <span className="listed-on__cta">
            <span className="listed-on__cta-text">View Listing</span>
            <span className="listed-on__cta-icon" aria-hidden="true">
              ↗
            </span>
          </span>
        </motion.a>
      </div>
    </section>
  );
}

export default ListedOnSection;
