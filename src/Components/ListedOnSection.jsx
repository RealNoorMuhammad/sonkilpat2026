import React from "react";
import { motion } from "framer-motion";
import coingeckoLogo from "../buttons/coingecko.png";
import moonshotLogo from "../buttons/moonshotlogo.png";
import dexscanLogo from "../buttons/dexscanlogo.png";
import "./ListedOnSection.css";

const LISTINGS = [
  {
    id: "coingecko",
    name: "CoinGecko",
    url: "https://www.coingecko.com/en/coins/are-ya-winning-son-2",
    logo: coingeckoLogo,
    description: "Live price, market cap & community stats",
  },
  {
    id: "moonshot",
    name: "Moonshot",
    url: "https://moonshot.money/",
    logo: moonshotLogo,
    description: "Trade crypto & memecoins on the Moonshot app",
  },
  {
    id: "dexscan",
    name: "DexScan",
    url: "https://www.dexscan.markets/token/ACpzkGJV3DDU8HXy8yjab7RL9qNmDGym2GwLkzNppump",
    logo: dexscanLogo,
    description: "Real-time Solana token analytics & DEX trading",
  },
];

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

        <div className="listed-on__list">
          {LISTINGS.map((listing, index) => (
            <motion.a
              key={listing.id}
              href={listing.url}
              target="_blank"
              rel="noopener noreferrer"
              className="listed-on__showcase"
              initial={{ opacity: 0, y: 32, scale: 0.98 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.7, ease, delay: 0.08 + index * 0.08 }}
              whileHover={{ y: -4 }}
            >
              <span className="listed-on__showcase-shine" aria-hidden="true" />
              <span className="listed-on__showcase-border" aria-hidden="true" />

              <span className="listed-on__logo-stage">
                <span className="listed-on__logo-ring" aria-hidden="true" />
                <span className="listed-on__logo-glow" aria-hidden="true" />
                <img src={listing.logo} alt="" className="listed-on__logo" />
              </span>

              <span className="listed-on__copy">
                <span className="listed-on__badge">
                  <span className="listed-on__badge-dot" aria-hidden="true" />
                  Verified Listing
                </span>
                <span className="listed-on__name">{listing.name}</span>
                <span className="listed-on__desc">{listing.description}</span>
              </span>

              <span className="listed-on__cta">
                <span className="listed-on__cta-text">View Listing</span>
                <span className="listed-on__cta-icon" aria-hidden="true">
                  ↗
                </span>
              </span>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
}

export default ListedOnSection;
