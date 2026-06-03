import React from "react";
import { motion } from "framer-motion";
import "./Tokenomics.css";

const CONTRACT = "ACpzkGJV3DDU8HXy8yjab7RL9qNmDGym2GwLkzNppump";

const STATS = [
  { id: "chain", label: "Chain", value: "Solana" },
  { id: "tax", label: "Tax", value: "0%" },
  {
    id: "explorer",
    label: "Explorer",
    value: "Solscan",
    href: `https://solscan.io/token/${CONTRACT}`,
  },
  { id: "max", label: "Max Supply", value: "1,000,000,000" },
  { id: "total", label: "Total Supply", value: "1,000,000,000" },
];

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  }),
};

function Tokenomics() {
  return (
    <section className="tokenomics" aria-labelledby="tokenomics-heading">
      <div className="tokenomics__inner">
        <motion.header
          className="tokenomics__header"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.5 }}
        >
          <p className="tokenomics__eyebrow">$SON · ON CHAIN</p>
          <h2 id="tokenomics-heading" className="tokenomics__title">
            Tokenomics
          </h2>
        </motion.header>

        <div className="tokenomics__grid">
          {STATS.map((stat, i) => {
            const content = (
              <>
                <span className="tokenomics__label">{stat.label}</span>
                <span className="tokenomics__value">{stat.value}</span>
              </>
            );

            return (
              <motion.div
                key={stat.id}
                className="tokenomics__card"
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-30px" }}
                variants={cardVariants}
              >
                {stat.href ? (
                  <a
                    href={stat.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="tokenomics__card-link"
                  >
                    {content}
                    <span className="tokenomics__link-hint" aria-hidden="true">
                      ↗
                    </span>
                  </a>
                ) : (
                  <div className="tokenomics__card-body">{content}</div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default Tokenomics;
