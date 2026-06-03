import React from "react";
import beforeFooterImg from "../buttons/beforefooter.png";
import beforeFooterMobileImg from "../buttons/beforefootermobile.jpg";
import "./BeforeFooterSection.css";

function BeforeFooterSection() {
  return (
    <section className="before-footer" aria-label="SON closing banner">
      <picture>
        <source media="(max-width: 768px)" srcSet={beforeFooterMobileImg} />
        <img
          src={beforeFooterImg}
          alt=""
          className="before-footer__img"
          loading="lazy"
          decoding="async"
        />
      </picture>
    </section>
  );
}

export default BeforeFooterSection;
