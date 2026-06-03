import React, { useCallback, useRef } from "react";
import gsap from "gsap";
import { FaMoon, FaSun } from "react-icons/fa";
import { useTheme } from "../theme/ThemeContext";
import "./ThemeToggle.css";

const LIGHT = "#ffffff";
const DARK = "#0a0a0c";

const WAVE_LAYERS = [
  { path: "M0,192L48,197.3C96,203,192,213,288,192C384,171,480,117,576,112C672,107,768,149,864,165.3C960,181,1056,171,1152,149.3C1248,128,1344,96,1392,80L1440,64L1440,320L0,320Z", opacity: 0.92, yFrom: 120, duration: 1.35, delay: 0 },
  { path: "M0,224L60,213.3C120,203,240,181,360,186.7C480,192,600,224,720,229.3C840,235,960,213,1080,197.3C1200,181,1320,171,1380,165.3L1440,160L1440,320L0,320Z", opacity: 0.78, yFrom: 130, duration: 1.45, delay: 0.1 },
  { path: "M0,256L80,250.7C160,245,320,235,480,245.3C640,256,800,288,960,277.3C1120,267,1280,213,1360,186.7L1440,160L1440,320L0,320Z", opacity: 0.65, yFrom: 140, duration: 1.55, delay: 0.2 },
];

function ThemeToggle() {
  const btnRef = useRef(null);
  const { theme, isDark, isTransitioning, setIsTransitioning, setTheme } =
    useTheme();

  const runWaveTransition = useCallback(
    (nextTheme, origin) => {
      const fill = nextTheme === "dark" ? DARK : LIGHT;
      const maxRadius =
        Math.hypot(
          Math.max(origin.x, window.innerWidth - origin.x),
          Math.max(origin.y, window.innerHeight - origin.y)
        ) * 1.25;
      const orbSize = maxRadius * 2;

      const overlay = document.createElement("div");
      overlay.className = "theme-transition";
      overlay.setAttribute("aria-hidden", "true");
      overlay.innerHTML = `
        <div class="theme-transition__orb" style="background:${fill}"></div>
        <div class="theme-transition__glow" style="background:${fill}"></div>
        <div class="theme-transition__waves">
          ${WAVE_LAYERS.map(
            (layer, i) =>
              `<svg class="theme-transition__wave theme-transition__wave--${i + 1}" viewBox="0 0 1440 320" preserveAspectRatio="none" aria-hidden="true"><path fill="${fill}" d="${layer.path}"/></svg>`
          ).join("")}
        </div>
      `;

      document.body.appendChild(overlay);

      const orb = overlay.querySelector(".theme-transition__orb");
      const glow = overlay.querySelector(".theme-transition__glow");
      const waves = overlay.querySelectorAll(".theme-transition__wave");

      gsap.set(overlay, { opacity: 1 });
      gsap.set(orb, {
        width: orbSize,
        height: orbSize,
        left: origin.x,
        top: origin.y,
        xPercent: -50,
        yPercent: -50,
        scale: 0,
        transformOrigin: "center center",
        force3D: true,
      });
      gsap.set(glow, {
        width: orbSize * 0.4,
        height: orbSize * 0.4,
        left: origin.x,
        top: origin.y,
        xPercent: -50,
        yPercent: -50,
        scale: 0,
        opacity: 0.35,
        transformOrigin: "center center",
      });
      gsap.set(waves, { yPercent: 115, opacity: 0, scaleY: 1.2 });

      const tl = gsap.timeline({
        defaults: { ease: "power2.inOut" },
        onComplete: () => {
          overlay.remove();
          setIsTransitioning(false);
        },
      });

      /* Soft bloom from the toggle — feels like water erupting */
      tl.to(
        glow,
        {
          scale: 2.8,
          opacity: 0,
          duration: 0.85,
          ease: "power2.out",
        },
        0
      );

      /* Color orb washes outward (the “tide” front) */
      tl.to(
        orb,
        {
          scale: 1,
          duration: 1.5,
          ease: "power3.inOut",
        },
        0
      );

      /* Waves rise and sweep the screen in layers */
      waves.forEach((wave, i) => {
        const layer = WAVE_LAYERS[i];
        tl.fromTo(
          wave,
          { yPercent: layer.yFrom, opacity: 0, scaleY: 1.25 },
          {
            yPercent: -12,
            opacity: layer.opacity,
            scaleY: 1,
            duration: layer.duration,
            ease: "sine.inOut",
          },
          0.12 + layer.delay
        );
        tl.to(
          wave,
          {
            xPercent: i % 2 === 0 ? -3 : 3,
            duration: layer.duration * 0.9,
            ease: "sine.inOut",
          },
          0.12 + layer.delay
        );
      });

      /* Switch theme while the wash is in front of the user (~halfway) */
      tl.call(() => setTheme(nextTheme), [], 0.52);

      /* Waves settle; orb fully covers */
      tl.to(
        waves,
        {
          yPercent: -18,
          opacity: 0,
          duration: 0.55,
          stagger: 0.06,
          ease: "sine.out",
        },
        1.05
      );

      /* Dissolve overlay — page underneath already matches */
      tl.to(
        overlay,
        {
          opacity: 0,
          duration: 0.45,
          ease: "power1.inOut",
        },
        1.2
      );
    },
    [setTheme, setIsTransitioning]
  );

  const handleClick = () => {
    if (isTransitioning || !btnRef.current) return;

    const nextTheme = isDark ? "light" : "dark";

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setTheme(nextTheme);
      return;
    }

    const rect = btnRef.current.getBoundingClientRect();
    setIsTransitioning(true);
    runWaveTransition(nextTheme, {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    });
  };

  return (
    <button
      ref={btnRef}
      type="button"
      className={`theme-toggle${isDark ? " theme-toggle--dark" : ""}${isTransitioning ? " theme-toggle--busy" : ""}`}
      onClick={handleClick}
      disabled={isTransitioning}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Light mode" : "Dark mode"}
    >
      <span className="theme-toggle__icon theme-toggle__icon--sun" aria-hidden>
        <FaSun />
      </span>
      <span className="theme-toggle__icon theme-toggle__icon--moon" aria-hidden>
        <FaMoon />
      </span>
      <span className="theme-toggle__ripple" aria-hidden="true" />
    </button>
  );
}

export default ThemeToggle;
