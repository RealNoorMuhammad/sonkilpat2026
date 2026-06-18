import React, { useEffect, useState } from "react";
import ThemeToggle from "./ThemeToggle";
import ScrollToTop from "./ScrollToTop";
import "./FloatingControls.css";

const BOTTOM_THRESHOLD = 96;

function FloatingControls() {
  const [atBottom, setAtBottom] = useState(false);

  useEffect(() => {
    const checkPosition = () => {
      const scrollBottom = window.scrollY + window.innerHeight;
      const pageHeight = document.documentElement.scrollHeight;
      setAtBottom(scrollBottom >= pageHeight - BOTTOM_THRESHOLD);
    };

    checkPosition();
    window.addEventListener("scroll", checkPosition, { passive: true });
    window.addEventListener("resize", checkPosition);

    return () => {
      window.removeEventListener("scroll", checkPosition);
      window.removeEventListener("resize", checkPosition);
    };
  }, []);

  return (
    <div className="floating-controls" aria-live="polite">
      <div
        className={`floating-controls__panel${atBottom ? " floating-controls__panel--hidden" : ""}`}
        aria-hidden={atBottom}
      >
        <ThemeToggle embedded />
      </div>
      <div
        className={`floating-controls__panel${!atBottom ? " floating-controls__panel--hidden" : ""}`}
        aria-hidden={!atBottom}
      >
        <ScrollToTop />
      </div>
    </div>
  );
}

export default FloatingControls;
