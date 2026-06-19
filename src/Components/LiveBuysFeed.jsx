import React, { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  BUYS_POLL_MS,
  DEX_URL,
  formatCompact,
  formatPrice,
} from "../token/sonToken";
import { useSonPrice } from "../token/SonPriceContext";
import "./LiveBuysFeed.css";

const MAX_BUYS = 14;
const WHALE_USD = 500;

function tradesApiUrl(pairAddress) {
  const pool = encodeURIComponent(pairAddress);
  return `/api/gecko/networks/solana/pools/${pool}/trades`;
}

function truncateWallet(addr) {
  if (!addr || addr.length < 12) return addr || "—";
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`;
}

function formatUsd(value) {
  const n = parseFloat(value);
  if (!Number.isFinite(n)) return "—";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 10_000) return `$${(n / 1_000).toFixed(1)}K`;
  if (n >= 100) return `$${n.toFixed(0)}`;
  if (n >= 1) return `$${n.toFixed(2)}`;
  return `$${n.toFixed(4)}`;
}

function formatTokens(value) {
  const n = parseFloat(value);
  if (!Number.isFinite(n)) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toFixed(0);
}

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000) return `${Math.max(1, Math.floor(diff / 1000))}s ago`;
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  return `${Math.floor(diff / 3_600_000)}h ago`;
}

function mapBuyTrade(trade) {
  const a = trade.attributes;
  return {
    id: trade.id,
    hash: a.tx_hash,
    wallet: a.tx_from_address,
    usd: parseFloat(a.volume_in_usd),
    tokens: parseFloat(a.to_token_amount),
    sol: parseFloat(a.from_token_amount),
    at: a.block_timestamp,
    solscan: `https://solscan.io/tx/${a.tx_hash}`,
  };
}

function LiveBuysFeed() {
  const { pair, pairAddress, priceUsd, symbol } = useSonPrice();
  const [buys, setBuys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pulse, setPulse] = useState(false);
  const seenRef = useRef(new Set());
  const hadBuysRef = useRef(false);

  const fetchBuys = useCallback(async (addr) => {
    if (!addr) return;

    const res = await fetch(tradesApiUrl(addr));
    if (!res.ok) throw new Error("Trade feed unavailable");

    const json = await res.json();
    if (json.error && !json.data) throw new Error(json.error);
    const incoming = (json.data || [])
      .filter((t) => t.attributes?.kind === "buy")
      .map(mapBuyTrade)
      .slice(0, MAX_BUYS);

    let hasNew = false;
    for (const buy of incoming) {
      if (!seenRef.current.has(buy.id)) {
        seenRef.current.add(buy.id);
        hasNew = true;
      }
    }

    if (hasNew && hadBuysRef.current) {
      setPulse(true);
      setTimeout(() => setPulse(false), 900);
    }

    hadBuysRef.current = incoming.length > 0;
    setBuys(incoming);
    setError(null);
  }, []);

  useEffect(() => {
    if (!pairAddress) return;

    let cancelled = false;

    const tick = async () => {
      try {
        await fetchBuys(pairAddress);
      } catch (e) {
        if (!cancelled && !hadBuysRef.current) {
          setError(e.message || "Could not load live buys");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    setLoading(true);
    tick();
    const intervalId = setInterval(tick, BUYS_POLL_MS);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [pairAddress, fetchBuys]);

  const stats = pair?.txns;

  return (
    <section
      className={`live-buys${pulse ? " live-buys--pulse" : ""}`}
      aria-labelledby="live-buys-heading"
    >
      <div className="live-buys__glow" aria-hidden="true" />
      <div className="live-buys__inner">
        <header className="live-buys__header">
          <div className="live-buys__title-row">
            <span className="live-buys__live-dot" aria-hidden="true" />
            <div>
              <p className="live-buys__eyebrow">DexScreener · Solana</p>
              <h2 id="live-buys-heading" className="live-buys__title">
                Live $SON Buys
              </h2>
            </div>
          </div>
          <a
            href={DEX_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="live-buys__dex-link"
          >
            Open chart
            <span aria-hidden="true">↗</span>
          </a>
        </header>

        <div className="live-buys__stats">
          <div className="live-buys__stat">
            <span className="live-buys__stat-label">Price</span>
            <span className="live-buys__stat-value">
              {priceUsd ? formatPrice(priceUsd) : "—"}
            </span>
          </div>
          <div className="live-buys__stat live-buys__stat--highlight">
            <span className="live-buys__stat-label">Buys · 5m</span>
            <span className="live-buys__stat-value">
              {stats?.m5?.buys ?? "—"}
            </span>
          </div>
          <div className="live-buys__stat">
            <span className="live-buys__stat-label">Buys · 1h</span>
            <span className="live-buys__stat-value">
              {stats?.h1?.buys ?? "—"}
            </span>
          </div>
          <div className="live-buys__stat">
            <span className="live-buys__stat-label">Vol · 24h</span>
            <span className="live-buys__stat-value">
              {pair?.volume?.h24 ? formatCompact(pair.volume.h24) : "—"}
            </span>
          </div>
        </div>

        <div className="live-buys__panel">
          <div className="live-buys__panel-head">
            <span>Incoming buys</span>
            <span className="live-buys__refresh">
              {loading ? "Syncing…" : `Updates every ${BUYS_POLL_MS / 1000}s`}
            </span>
          </div>

          {error && !buys.length ? (
            <p className="live-buys__empty">{error}</p>
          ) : loading && !buys.length ? (
            <div className="live-buys__skeletons" aria-busy="true">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="live-buys__skeleton" />
              ))}
            </div>
          ) : buys.length === 0 ? (
            <p className="live-buys__empty">
              Watching the pool — buys will appear here in real time.
            </p>
          ) : (
            <ul className="live-buys__list">
              <AnimatePresence initial={false}>
                {buys.map((buy, i) => (
                  <motion.li
                    key={buy.id}
                    className={`live-buys__row${buy.usd >= WHALE_USD ? " live-buys__row--whale" : ""}`}
                    initial={{ opacity: 0, x: -24, scale: 0.98 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{
                      duration: 0.35,
                      delay: i === 0 ? 0 : 0,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    layout
                  >
                    <a
                      href={buy.solscan}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="live-buys__row-link"
                    >
                      <span className="live-buys__badge">BUY</span>
                      <span className="live-buys__amount">
                        {formatUsd(buy.usd)}
                      </span>
                      <span className="live-buys__tokens">
                        +{formatTokens(buy.tokens)} {symbol}
                      </span>
                      <span className="live-buys__wallet" title={buy.wallet}>
                        {truncateWallet(buy.wallet)}
                      </span>
                      <span className="live-buys__time">{timeAgo(buy.at)}</span>
                      {buy.usd >= WHALE_USD && (
                        <span className="live-buys__whale">🐋</span>
                      )}
                    </a>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          )}
        </div>

        <p className="live-buys__foot">
          Pair data from{" "}
          <a href={DEX_URL} target="_blank" rel="noopener noreferrer">
            DexScreener
          </a>
          {" · "}
          On-chain buys refresh live
        </p>
      </div>
    </section>
  );
}

export default LiveBuysFeed;
