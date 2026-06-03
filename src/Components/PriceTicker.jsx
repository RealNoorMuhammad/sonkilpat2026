import React, { useEffect, useState, useCallback } from "react";
import { FaArrowUp, FaArrowDown } from "react-icons/fa";
import "./PriceTicker.css";

const TOKEN = "ACpzkGJV3DDU8HXy8yjab7RL9qNmDGym2GwLkzNppump";
const DEX_API = `https://api.dexscreener.com/latest/dex/tokens/${TOKEN}`;
const DEX_URL = `https://dexscreener.com/solana/${TOKEN}`;
const REFRESH_MS = 30_000;

function formatPrice(value) {
  const n = parseFloat(value);
  if (!Number.isFinite(n)) return "—";
  if (n < 0.00001) return `$${n.toExponential(4)}`;
  if (n < 1) return `$${n.toFixed(6)}`;
  if (n < 100) return `$${n.toFixed(4)}`;
  return `$${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

function formatMarketCap(value) {
  const n = parseFloat(value);
  if (!Number.isFinite(n)) return "—";
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(2)}K`;
  return `$${n.toFixed(0)}`;
}

function formatChange(value) {
  const n = parseFloat(value);
  if (!Number.isFinite(n)) return "—";
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(2)}%`;
}

function pickBestPair(pairs) {
  if (!pairs?.length) return null;
  return [...pairs].sort(
    (a, b) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0)
  )[0];
}

function PriceTicker() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [flash, setFlash] = useState(false);

  const fetchPrice = useCallback(async () => {
    try {
      const res = await fetch(DEX_API);
      if (!res.ok) throw new Error("DexScreener request failed");
      const json = await res.json();
      const pair = pickBestPair(json.pairs);
      if (!pair) throw new Error("No pair data");

      setData((prev) => {
        if (prev && prev.priceUsd !== pair.priceUsd) {
          setFlash(true);
          setTimeout(() => setFlash(false), 600);
        }
        return {
          priceUsd: pair.priceUsd,
          marketCap: pair.marketCap ?? pair.fdv,
          change24h: pair.priceChange?.h24 ?? 0,
          volume24h: pair.volume?.h24,
          symbol: pair.baseToken?.symbol || "$SON",
        };
      });
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrice();
    const id = setInterval(fetchPrice, REFRESH_MS);
    return () => clearInterval(id);
  }, [fetchPrice]);

  const isUp = (data?.change24h ?? 0) >= 0;
  const Arrow = isUp ? FaArrowUp : FaArrowDown;

  const items = loading
    ? [
        { key: "load", label: "LIVE", value: "Loading $SON price…", change: null },
      ]
    : data
      ? [
          {
            key: "price",
            label: "LIVE PRICE",
            value: formatPrice(data.priceUsd),
            change: data.change24h,
          },
          {
            key: "mcap",
            label: "MARKET CAP",
            value: formatMarketCap(data.marketCap),
            change: null,
          },
          {
            key: "chg",
            label: "24H CHANGE",
            value: formatChange(data.change24h),
            change: data.change24h,
          },
          {
            key: "son",
            label: "$SON",
            value: "ON SOLANA",
            change: null,
          },
        ]
      : [
          {
            key: "err",
            label: "LIVE",
            value: "Price unavailable — tap to open DexScreener",
            change: null,
          },
        ];

  const renderSegment = (suffix = "") =>
    items.map((item) => (
      <span
        key={`${item.key}${suffix}`}
        className={`price-ticker__item${item.change != null ? (item.change >= 0 ? " price-ticker__item--up" : " price-ticker__item--down") : ""}`}
      >
        <span className="price-ticker__label">{item.label}</span>
        <span className={`price-ticker__value${flash && item.key === "price" ? " price-ticker__value--flash" : ""}`}>
          {item.value}
          {item.change != null && (
            <span className="price-ticker__change">
              <Arrow className="price-ticker__arrow" aria-hidden />
              {formatChange(item.change)}
            </span>
          )}
        </span>
        <span className="price-ticker__dot" aria-hidden="true">
          ◆
        </span>
      </span>
    ));

  return (
    <section className="price-ticker" aria-label="Live $SON price ticker">
      <a
        href={DEX_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="price-ticker__link"
      >
        <div className="price-ticker__viewport">
          <div className="price-ticker__track">
            <div className="price-ticker__row">{renderSegment("a")}</div>
            <div className="price-ticker__row" aria-hidden="true">
              {renderSegment("b")}
            </div>
          </div>
        </div>
      </a>
    </section>
  );
}

export default PriceTicker;
