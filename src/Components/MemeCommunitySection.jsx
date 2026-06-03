import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FaHeart, FaImages, FaTrophy, FaUpload } from "react-icons/fa";
import "./MemeCommunitySection.css";

const STEPS = [
  {
    id: "upload",
    num: "01",
    icon: FaUpload,
    title: "Upload your meme",
    description:
      "Drop your best $SON meme with your wallet. One upload, one shot at the timeline.",
    to: "/upload-meme",
    cta: "Upload meme",
  },
  {
    id: "likes",
    num: "02",
    icon: FaHeart,
    title: "Get likes",
    description:
      "Share your post. Every like pushes you up the board — the community picks the winners.",
    to: "/meme-leaderboard",
    cta: "View leaderboard",
  },
  {
    id: "top",
    num: "03",
    icon: FaTrophy,
    title: "Reach the top",
    description:
      "Climb the meme leaderboard. The most liked memes rise to the top with your name on display.",
    to: "/meme-leaderboard",
    cta: "See rankings",
  },
];

const LINKS = [
  {
    id: "upload",
    label: "Upload Meme",
    hint: "Post yours",
    to: "/upload-meme",
  },
  {
    id: "leaderboard",
    label: "Meme Leaderboard",
    hint: "Rankings by likes",
    to: "/meme-leaderboard",
  },
  {
    id: "gallery",
    label: "Son Memes",
    hint: "Meme gallery",
    to: "/son-memes",
    icon: FaImages,
  },
];

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  }),
};

function MemeCommunitySection() {
  return (
    <section
      className="meme-community"
      aria-labelledby="meme-community-heading"
    >
      <div className="meme-community__inner">
        <motion.header
          className="meme-community__header"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.5 }}
        >
          <p className="meme-community__eyebrow">$SON · COMMUNITY</p>
          <h2 id="meme-community-heading" className="meme-community__title">
            Meme the timeline
          </h2>
          <p className="meme-community__intro">
            Upload memes, rack up likes, and fight for the top of the leaderboard.
            The best memes get featured on our{" "}
            <Link to="/son-memes" className="meme-community__intro-link">
              Son Memes gallery
            </Link>{" "}
            — with your name on the win.
          </p>
        </motion.header>

        <div className="meme-community__steps">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.article
                key={step.id}
                className="meme-community__step"
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-30px" }}
                variants={cardVariants}
              >
                <span className="meme-community__step-num">{step.num}</span>
                <span className="meme-community__step-icon" aria-hidden="true">
                  <Icon />
                </span>
                <h3 className="meme-community__step-title">{step.title}</h3>
                <p className="meme-community__step-desc">{step.description}</p>
                <Link
                  to={step.to}
                  className="meme-community__step-link"
                >
                  {step.cta}
                  <span aria-hidden="true">→</span>
                </Link>
              </motion.article>
            );
          })}
        </div>

        <motion.div
          className="meme-community__highlight"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-20px" }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <FaImages className="meme-community__highlight-icon" aria-hidden />
          <p className="meme-community__highlight-text">
            Top-ranked memes from the leaderboard are showcased on the{" "}
            <strong>Son Memes</strong> page — your meme, your name, on the main
            gallery for everyone to see.
          </p>
        </motion.div>

        <div className="meme-community__actions">
          {LINKS.map((link, i) => (
            <motion.div
              key={link.id}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-20px" }}
              variants={cardVariants}
            >
              <Link to={link.to} className="meme-community__action">
                {link.icon && (
                  <span className="meme-community__action-icon" aria-hidden>
                    <link.icon />
                  </span>
                )}
                <span className="meme-community__action-body">
                  <span className="meme-community__action-label">
                    {link.label}
                  </span>
                  <span className="meme-community__action-hint">
                    {link.hint}
                  </span>
                </span>
                <span className="meme-community__action-arrow" aria-hidden>
                  ↗
                </span>
              </Link>
            </motion.div>
          ))}
        </div>

        <motion.div
          className="meme-community__cta-wrap"
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45 }}
        >
          <Link to="/upload-meme" className="meme-community__cta">
            Upload your meme now
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

export default MemeCommunitySection;
