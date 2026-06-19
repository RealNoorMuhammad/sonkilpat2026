import React from "react";
import { FaArrowUp, FaArrowDown } from "react-icons/fa";
import {
  DEX_URL,
  formatChange,
  formatMarketCap,
  formatPrice,
} from "../token/sonToken";
import { useSonPrice } from "../token/SonPriceContext";
import "./PriceTicker.css";

function PriceTicker() {
  const { loading, priceFlash, priceUsd, marketCap, change24h, symbol } =
    useSonPrice();

  const isUp = (change24h ?? 0) >= 0;
  const Arrow = isUp ? FaArrowUp : FaArrowDown;

  const items = loading
    ? [{ key: "load", label: "LIVE", value: "Loading $SON price…", change: null }]
    : priceUsd
      ? [
          {
            key: "price",
            label: "LIVE PRICE",
            value: formatPrice(priceUsd),
            change: change24h,
          },
          {
            key: "mcap",
            label: "MARKET CAP",
            value: formatMarketCap(marketCap),
            change: null,
          },
          {
            key: "chg",
            label: "24H CHANGE",
            value: formatChange(change24h),
            change: change24h,
          },
          {
            key: "son",
            label: symbol.startsWith("$") ? symbol : `$${symbol}`,
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
        <span
          className={`price-ticker__value${priceFlash && item.key === "price" ? " price-ticker__value--flash" : ""}`}
        >
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
