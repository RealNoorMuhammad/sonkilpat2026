import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import SocialIcons from "./SocialIcons";
import "./comic-buttons.css";
import "./Footer.css";

const Footer = () => {
  const [copied, setCopied] = useState(false);
  const contractAddress = "ACpzkGJV3DDU8HXy8yjab7RL9qNmDGym2GwLkzNppump";

  const handleCopy = () => {
    navigator.clipboard.writeText(contractAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-top-row">
          <div id="footer-music-slot" className="footer-music-slot">
            <button
              type="button"
              onClick={handleCopy}
              className="comic-btn comic-btn--pill contract-copy-btn contract-copy-btn--inline"
            >
              {copied ? "Copied!" : "Contract Address"}
            </button>
          </div>
          <SocialIcons />
        </div>

        {/* Contract Address + Copy */}
        <div className="address-copy">
          <span className="footer-text">{contractAddress}</span>

          <AnimatePresence mode="wait">
            {copied ? (
              <motion.button
                key="copied"
                className="comic-btn comic-btn--circle comic-btn--copy copy-btn copied"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3 }}
              >
                ✓
              </motion.button>
            ) : (
              <motion.button
                key="copy"
                onClick={handleCopy}
                className="comic-btn comic-btn--circle comic-btn--copy copy-btn"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3 }}
              >
                ⧉
              </motion.button>
            )}
          </AnimatePresence>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
