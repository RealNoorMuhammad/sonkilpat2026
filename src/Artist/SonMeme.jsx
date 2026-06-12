import React from "react";
import { motion } from "framer-motion";
import "./SonMeme.css";
import Footer from "./Footer";
import SiteLogo from "../buttons/SiteLogo";

const mediaItems = [
  { type: "image", src: "https://res.cloudinary.com/dvp5f8zbt/image/upload/v1781304592/IMG_20260613_032715_898_pyfsvc.jpg" },
  { type: "image", src: "https://res.cloudinary.com/dvp5f8zbt/image/upload/v1781304592/IMG-20260610-WA0008_gniu8q.jpg" },
  { type: "image", src: "https://res.cloudinary.com/dvp5f8zbt/image/upload/v1781304592/IMG_20260613_032732_947_bdgsvn.jpg" },
  { type: "image", src: "https://res.cloudinary.com/dvp5f8zbt/image/upload/v1781304592/IMG_20260613_032700_492_kcagdx.jpg" },
  { type: "image", src: "https://res.cloudinary.com/dvp5f8zbt/image/upload/v1781304592/IMG_20260613_032710_194_ykm1ir.jpg" },
  { type: "image", src: "https://res.cloudinary.com/dvp5f8zbt/image/upload/v1781304592/IMG_20260613_032740_094_safkdh.jpg" },
  { type: "image", src: "https://res.cloudinary.com/dvp5f8zbt/image/upload/v1781304591/IMG_20260613_032747_171_e9jhfw.jpg" },
  { type: "image", src: "https://res.cloudinary.com/dvp5f8zbt/image/upload/v1781304591/IMG_20260613_032657_186_ilyzit.jpg" },
  { type: "image", src: "https://res.cloudinary.com/dvp5f8zbt/image/upload/v1781304591/IMG_20260613_032743_483_kxtdta.jpg" },
  { type: "image", src: "https://res.cloudinary.com/dvp5f8zbt/image/upload/v1781304591/IMG-20260610-WA0007_tvyr8o.jpg" },
  { type: "image", src: "https://res.cloudinary.com/dvp5f8zbt/image/upload/v1781304591/IMG-20260610-WA0013_msvvvw.jpg" },
  { type: "image", src: "https://res.cloudinary.com/dvp5f8zbt/image/upload/v1781304591/IMG-20260610-WA0009_p3wcsf.jpg" },
  { type: "image", src: "https://res.cloudinary.com/dvp5f8zbt/image/upload/v1781304591/IMG-20260610-WA0015_wkdmda.jpg" },
  { type: "image", src: "https://res.cloudinary.com/dvp5f8zbt/image/upload/v1781304591/IMG_20260613_032801_263_umjq4p.jpg" },
  { type: "image", src: "https://res.cloudinary.com/dvp5f8zbt/image/upload/v1781304591/IMG-20260610-WA0003_vwgshx.jpg" },
  { type: "image", src: "https://res.cloudinary.com/dvp5f8zbt/image/upload/v1781304590/IMG_20260613_032757_060_z1xzay.jpg" },
  { type: "image", src: "https://res.cloudinary.com/dvp5f8zbt/image/upload/v1781304590/IMG_20260613_032742_624_xxpexf.jpg" },
  { type: "image", src: "https://res.cloudinary.com/dvp5f8zbt/image/upload/v1781304590/IMG_20260613_032704_792_af97o8.jpg" },
  { type: "image", src: "https://res.cloudinary.com/dvp5f8zbt/image/upload/v1781304590/IMG_20260613_032745_557_fkrl5g.jpg" },
  { type: "image", src: "https://res.cloudinary.com/dvp5f8zbt/image/upload/v1781304590/IMG_20260613_032737_344_myiamm.jpg" },
  { type: "image", src: "https://res.cloudinary.com/dvp5f8zbt/image/upload/v1781304590/IMG_20260613_032759_637_i18kfr.jpg" },
  { type: "image", src: "https://res.cloudinary.com/dobgedyua/image/upload/v1780646485/IMG_20260605_125952_456_qe8lux.jpg" },
  { type: "image", src: "https://res.cloudinary.com/dobgedyua/image/upload/v1780646485/IMG_20260605_130004_872_ytuthb.jpg" },
  { type: "image", src: "https://res.cloudinary.com/dobgedyua/image/upload/v1780645797/IMG_20260605_114621_551_1_ojhdiy.jpg" },
  { type: "image", src: "https://res.cloudinary.com/dobgedyua/image/upload/v1780645797/IMG_20260605_114623_280_1_b32qne.jpg" },
  { type: "image", src: "https://res.cloudinary.com/dobgedyua/image/upload/v1780406069/Untitled_Artwork_11_wbia7p.jpg" },
  { type: "image", src: "https://res.cloudinary.com/dobgedyua/image/upload/v1780406069/Untitled_Artwork_9_vhehbo.jpg" },
  { type: "image", src: "https://res.cloudinary.com/dobgedyua/image/upload/v1780406069/IMG_5864_yqefza.jpg" },
  { type: "image", src: "https://res.cloudinary.com/dobgedyua/image/upload/v1780406068/Untitled_Artwork_10_ictenz.jpg" },
  { type: "image", src: "https://res.cloudinary.com/dobgedyua/image/upload/v1780406068/IMG_5858_mg2jzy.jpg" },
  { type: "image", src: "https://res.cloudinary.com/dobgedyua/image/upload/v1780406066/Untitled_Artwork_ajwuqz.jpg" },
  { type: "image", src: "https://res.cloudinary.com/dobgedyua/image/upload/v1780406068/Untitled_Artwork_8_epdmjl.jpg" },
  { type: "image", src: "https://res.cloudinary.com/dobgedyua/image/upload/v1780406068/Untitled_Artwork_5_tapekx.jpg" },
  { type: "image", src: "https://res.cloudinary.com/dobgedyua/image/upload/v1780406067/IMG_5857_eu0tgb.jpg" },
  { type: "image", src: "https://res.cloudinary.com/dobgedyua/image/upload/v1780406067/Untitled_Artwork_4_ordco3.jpg" },
  { type: "image", src: "https://res.cloudinary.com/dobgedyua/image/upload/v1780406067/Untitled_Artwork_7_mizpix.jpg" },
  { type: "image", src: "https://res.cloudinary.com/dobgedyua/image/upload/v1780406066/Untitled_Artwork_6_pxhi1u.jpg" },
  { type: "image", src: "https://res.cloudinary.com/dobgedyua/image/upload/v1780406066/Untitled_Artwork_1_u0nkvm.jpg" },
  { type: "image", src: "https://res.cloudinary.com/dobgedyua/image/upload/v1780406066/Untitled_Artwork_3_pj9unz.jpg" },
  { type: "image", src: "https://res.cloudinary.com/dobgedyua/image/upload/v1780406065/fat_son_vrlgn0.jpg" },
  { type: "image", src: "https://res.cloudinary.com/dobgedyua/image/upload/v1780406065/Untitled_Artwork_12_ouatbp.jpg" },
];

const directions = [
  { x: -200, y: 0 },
  { x: 200, y: 0 },
  { x: 0, y: -200 },
  { x: 0, y: 200 },
];

const cardVariants = (dir) => ({
  hidden: { opacity: 0, ...dir },
  show: {
    opacity: 1,
    x: 0,
    y: 0,
    transition: {
      duration: 0.8,
      type: "spring",
      stiffness: 70,
    },
  },
});

function SonMeme({ stopMusic, videoRefs, stopAllVideos }) {
  const handlePlay = (index) => {
    videoRefs.current.forEach((video, i) => {
      if (video && i !== index) video.pause();
    });
    if (stopMusic) stopMusic();
  };

  return (
    <div className="gallery-container">
      <SiteLogo className="site-logo--hero" />
      <h1 className="gallery-title">$Son Memes </h1>

      <div className="gallery-grid">
        {mediaItems.map((item, index) => {
          const randomDir = directions[index % directions.length];

          return (
            <motion.div
              key={index}
              className="gallery-card"
              variants={cardVariants(randomDir)}
              initial="hidden"
              whileInView="show"
              viewport={{ amount: 0.2 }}
              whileHover={{ scale: 1.08, rotate: 2 }}
              whileTap={{ scale: 0.95 }}
            >
              {item.type === "image" ? (
                <img src={item.src} alt="meme" className="gallery-media" />
              ) : (
                <video
                  ref={(el) => (videoRefs.current[index] = el)}
                  className="gallery-media"
                  controls
                  playsInline
                  onPlay={() => handlePlay(index)}
                >
                  <source src={item.src} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              )}

              <motion.div
                className="gallery-overlay"
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 1 }}
              >
                Meme #{index + 1}
              </motion.div>
            </motion.div>
          );
        })}
      </div>

      <br />
      <br />
      <br />
      <br />
      <br />
      <Footer />
    </div>
  );
}

export default SonMeme;
