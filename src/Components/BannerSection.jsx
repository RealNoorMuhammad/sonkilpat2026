import React from "react";
import bannerGif from "../buttons/banner-C67mv3An.gif";
import "./BannerSection.css";

function BannerSection() {
  return (
    <section className="banner-section" aria-label="SON banner">
      <img
        src={bannerGif}
        alt=""
        className="banner-section__img"
        loading="lazy"
        decoding="async"
      />
    </section>
  );
}

export default BannerSection;
