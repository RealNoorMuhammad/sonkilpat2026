import React, { useCallback } from "react";
import { FaArrowUp } from "react-icons/fa";
import "./ScrollToTop.css";

function ScrollToTop({ className = "" }) {
  const handleClick = useCallback(() => {
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    window.scrollTo({
      top: 0,
      behavior: prefersReduced ? "auto" : "smooth",
    });
  }, []);

  return (
    <button
      type="button"
      className={`scroll-to-top${className ? ` ${className}` : ""}`}
      onClick={handleClick}
      aria-label="Scroll to top"
      title="Back to top"
    >
      <FaArrowUp aria-hidden />
    </button>
  );
}

export default ScrollToTop;
