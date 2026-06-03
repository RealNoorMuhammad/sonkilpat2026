import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import Footer from "./Footer";
import mainpageImg from "../buttons/mainpage.png";
import mainpageMobileImg from "../buttons/mainpagemobile.png";
import "./Home.css";

function Home() {
  useEffect(() => {
    document.title = "Are ya winning, $SON? GENERATOR";
  }, []);

  return (
    <div className="home-page">
      <section className="home-hero">
        <picture className="home-hero-bg-picture">
          <source media="(max-width: 768px)" srcSet={mainpageMobileImg} />
          <img
            src={mainpageImg}
            alt=""
            aria-hidden="true"
            className="home-hero-bg"
          />
        </picture>
        <div className="home-hero-copy">
          <h1 className="home-hero-title">
            <span className="home-hero-title-line">$SON PFP</span>
            <span className="home-hero-title-line">GENERATOR</span>
          </h1>
          <div className="home-hero-lower">
            <p className="home-hero-tagline">ARE YA WINNING, SON?</p>
            <div className="home-hero-actions">
              <Link to="/pfp-maker" className="home-hero-btn">
                PFP maker
              </Link>
              <Link to="/meme-generator" className="home-hero-btn">
                MEME Generator
              </Link>
            </div>
          </div>
        </div>

        <div className="home-hero-actions-mobile">
          <Link to="/pfp-maker" className="home-hero-btn">
            PFP maker
          </Link>
          <Link to="/meme-generator" className="home-hero-btn">
            MEME Generator
          </Link>
        </div>
      </section>
      <Footer />
    </div>
  );
}

export default Home;
