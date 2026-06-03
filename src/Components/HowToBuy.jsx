import React, { useState, useRef, useLayoutEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import step1Img from "../buttons/step1-buy.jpg";
import step2Img from "../buttons/step2-buy.jpg";
import step3Img from "../buttons/step3-buy.jpg";
import phantomLogo from "../buttons/phantom.png";
import "./HowToBuy.css";

gsap.registerPlugin(ScrollTrigger);

const CONTRACT = "ACpzkGJV3DDU8HXy8yjab7RL9qNmDGym2GwLkzNppump";
const DEX_URL = `https://dexscreener.com/solana/${CONTRACT}`;
const PHANTOM_URL = "https://phantom.app/";

const STEPS = [
  {
    id: "phantom",
    num: "01",
    title: "Get Phantom & SOL",
    image: step1Img,
    imageAlt: "Character holding a phone with the Phantom wallet app",
    description:
      "Download the Phantom wallet from phantom.app on desktop or mobile. Fund it with SOL from your favorite exchange (Coinbase, Binance, Kraken) and send it to your Phantom address.",
    action: "phantom",
  },
  {
    id: "swap",
    num: "02",
    title: "Swap SOL for $SON",
    image: step2Img,
    imageAlt: "Swapping SOL for SON token illustration",
    description:
      "Open Phantom's built-in swap (or Jupiter / Raydium). Paste the contract address below into the token field and choose how much SOL you want to swap.",
    action: "copy",
  },
  {
    id: "confirm",
    num: "03",
    title: "Confirm & track",
    image: step3Img,
    imageAlt: "Characters celebrating with stacks of cash",
    description:
      "Confirm the transaction in Phantom. Once it lands, you're holding $SON. Watch the chart on DexScreener and welcome to the timeline.",
    action: "dex",
  },
];

function HowToBuy() {
  const [copied, setCopied] = useState(false);
  const [copyToast, setCopyToast] = useState(false);
  const sectionRef = useRef(null);
  const viewportRef = useRef(null);
  const trackRef = useRef(null);
  const cardsRef = useRef([]);
  const dotsRef = useRef([]);
  const hintRef = useRef(null);
  const copyToastTimer = useRef(null);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(CONTRACT);
      setCopied(true);
      setCopyToast(true);

      if (copyToastTimer.current) {
        clearTimeout(copyToastTimer.current);
      }

      copyToastTimer.current = setTimeout(() => {
        setCopyToast(false);
        setCopied(false);
      }, 2400);
    } catch {
      /* ignore */
    }
  };

  const truncateContract = (addr) => {
    if (addr.length <= 44) return addr;
    return `${addr.slice(0, 38)}...`;
  };

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!section || !viewport || !track) return undefined;

    const mm = gsap.matchMedia();

    mm.add("(min-width: 769px)", () => {
      const cards = cardsRef.current.filter(Boolean);
      if (cards.length !== STEPS.length) return undefined;

      const getDistance = () => viewport.offsetWidth;

      const setActiveDot = (index) => {
        dotsRef.current.forEach((dot, i) => {
          dot?.classList.toggle("how-to-buy__dot--active", i === index);
        });
      };

      gsap.set(cards[0], { x: 0, zIndex: 2 });
      gsap.set(cards[1], { x: getDistance(), zIndex: 4 });
      gsap.set(cards[2], { x: getDistance(), zIndex: 1 });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: () => `+=${window.innerHeight * 3.5}`,
          pin: true,
          pinSpacing: true,
          scrub: 1,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            const p = self.progress;
            if (p < 0.28) setActiveDot(0);
            else if (p < 0.62) setActiveDot(1);
            else setActiveDot(2);
          },
        },
      });

      /* Card 1 exits fully off the left ← | Card 2 enters from off-screen right → */
      tl.to({}, { duration: 0.7 })
        .to(
          cards[0],
          { x: () => -getDistance(), zIndex: 1, duration: 1, ease: "power2.inOut" },
          "slide-1"
        )
        .to(
          cards[1],
          { x: 0, zIndex: 4, duration: 1, ease: "power2.inOut" },
          "slide-1"
        )
        .to({}, { duration: 0.7 })
        .to(
          cards[1],
          { x: () => -getDistance(), zIndex: 1, duration: 1, ease: "power2.inOut" },
          "slide-2"
        )
        .to(
          cards[2],
          { x: 0, zIndex: 4, duration: 1, ease: "power2.inOut" },
          "slide-2"
        )
        .to({}, { duration: 0.7 });

      if (hintRef.current) {
        gsap.to(hintRef.current, {
          y: 6,
          opacity: 0.35,
          duration: 1.2,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
      }

      setActiveDot(0);

      const onResize = () => ScrollTrigger.refresh();
      window.addEventListener("resize", onResize);

      return () => {
        window.removeEventListener("resize", onResize);
        tl.scrollTrigger?.kill();
        tl.kill();
      };
    });

    mm.add("(max-width: 768px)", () => {
      const cards = cardsRef.current.filter(Boolean);
      gsap.set(cards, { clearProps: "all" });

      cards.forEach((card, i) => {
        gsap.fromTo(
          card,
          { opacity: 0, y: 40 },
          {
            opacity: 1,
            y: 0,
            duration: 0.7,
            ease: "power2.out",
            scrollTrigger: {
              trigger: card,
              start: "top 85%",
              toggleActions: "play none none reverse",
            },
            delay: i * 0.05,
          }
        );
      });

      if (hintRef.current) {
        gsap.set(hintRef.current, { display: "none" });
      }
    });

    return () => mm.revert();
  }, []);

  useLayoutEffect(
    () => () => {
      if (copyToastTimer.current) {
        clearTimeout(copyToastTimer.current);
      }
    },
    []
  );

  return (
    <section className="how-to-buy" ref={sectionRef} aria-labelledby="how-to-buy-heading">
      <div className="how-to-buy__inner how-to-buy__inner--head">
        <header className="how-to-buy__header">
          <p className="how-to-buy__eyebrow">How to buy</p>
          <h2 id="how-to-buy-heading" className="how-to-buy__title">
            Three steps. No excuses.
          </h2>
        </header>
      </div>

      <div className="how-to-buy__viewport" ref={viewportRef}>
        <div className="how-to-buy__track" ref={trackRef}>
          {STEPS.map((step, i) => (
            <article
              key={step.id}
              ref={(el) => {
                cardsRef.current[i] = el;
              }}
              className="how-to-buy__card"
            >
              <div className="how-to-buy__card-shell">
                <div className="how-to-buy__card-inner">
                  <div className="how-to-buy__image-wrap">
                    <img
                      src={step.image}
                      alt={step.imageAlt}
                      className="how-to-buy__image"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>

                  <div className="how-to-buy__body">
                    <h3 className="how-to-buy__step-title">
                      <span className="how-to-buy__step-num">{step.num}</span>
                      {step.title}
                    </h3>
                    <p className="how-to-buy__desc">{step.description}</p>

                    {step.action === "phantom" && (
                      <a
                        href={PHANTOM_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="how-to-buy__phantom-btn"
                        aria-label="Download Phantom wallet"
                      >
                        <img src={phantomLogo} alt="" className="how-to-buy__phantom-img" />
                      </a>
                    )}

                    {step.action === "copy" && (
                      <button
                        type="button"
                        className={`how-to-buy__copy${copied ? " how-to-buy__copy--done" : ""}`}
                        onClick={handleCopy}
                        aria-label={copied ? "Contract copied" : "Click to copy contract address"}
                      >
                        <span className="how-to-buy__copy-label">Click to copy contract</span>
                        <span className="how-to-buy__copy-row">
                          <span className="how-to-buy__copy-value">{truncateContract(CONTRACT)}</span>
                          <span className="how-to-buy__copy-icon" aria-hidden="true">
                            {copied ? "✓" : "⧉"}
                          </span>
                        </span>
                      </button>
                    )}

                    {step.action === "dex" && (
                      <a
                        href={DEX_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="how-to-buy__dex-btn"
                      >
                        View chart on DexScreener
                        <span className="how-to-buy__dex-arrow" aria-hidden="true">
                          ↗
                        </span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className="how-to-buy__inner how-to-buy__inner--foot">
        <div className="how-to-buy__footer">
          <div className="how-to-buy__dots" aria-hidden="true">
            {STEPS.map((step, i) => (
              <span
                key={step.id}
                ref={(el) => {
                  dotsRef.current[i] = el;
                }}
                className={`how-to-buy__dot${i === 0 ? " how-to-buy__dot--active" : ""}`}
              />
            ))}
          </div>
          <p ref={hintRef} className="how-to-buy__scroll-hint">
            Scroll to see next step
          </p>
        </div>
      </div>

      {copyToast && (
        <p className="how-to-buy__toast" role="status" aria-live="polite">
          Contract Address Copied
        </p>
      )}
    </section>
  );
}

export default HowToBuy;
