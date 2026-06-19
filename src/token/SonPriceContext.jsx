import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { DEX_PAIRS_API, PRICE_POLL_MS, pickBestPair } from "./sonToken";

const SonPriceContext = createContext(null);

export function SonPriceProvider({ children }) {
  const [pair, setPair] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [tickDir, setTickDir] = useState(null);
  const [priceTick, setPriceTick] = useState(0);
  const [priceFlash, setPriceFlash] = useState(false);
  const [priceHistory, setPriceHistory] = useState([]);
  const prevPriceRef = useRef(null);

  const fetchPair = useCallback(async () => {
    try {
      const res = await fetch(DEX_PAIRS_API);
      if (!res.ok) throw new Error("DexScreener pair lookup failed");
      const pairs = await res.json();
      const best = pickBestPair(pairs);
      if (!best?.pairAddress) throw new Error("No trading pair found");

      const nextPrice = parseFloat(best.priceUsd);
      const prevPrice = prevPriceRef.current;
      if (
        Number.isFinite(prevPrice) &&
        Number.isFinite(nextPrice) &&
        nextPrice !== prevPrice
      ) {
        setTickDir(nextPrice > prevPrice ? "up" : "down");
        setPriceTick((n) => n + 1);
        setPriceFlash(true);
        setTimeout(() => {
          setTickDir(null);
          setPriceFlash(false);
        }, 700);
      }
      if (Number.isFinite(nextPrice)) prevPriceRef.current = nextPrice;

      setPair(best);
      setLastUpdated(Date.now());
      if (Number.isFinite(nextPrice)) {
        setPriceHistory((prev) =>
          [...prev, { t: Date.now(), p: nextPrice }].slice(-3000)
        );
      }
    } catch {
      /* keep last good pair */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPair();
    const id = setInterval(fetchPair, PRICE_POLL_MS);
    return () => clearInterval(id);
  }, [fetchPair]);

  const value = {
    pair,
    loading,
    lastUpdated,
    tickDir,
    priceTick,
    priceFlash,
    priceHistory,
    priceUsd: pair?.priceUsd,
    change24h: pair?.priceChange?.h24 ?? 0,
    marketCap: pair?.marketCap ?? pair?.fdv,
    volume24h: pair?.volume?.h24,
    liquidityUsd: pair?.liquidity?.usd,
    symbol: pair?.baseToken?.symbol || "SON",
    pairAddress: pair?.pairAddress,
  };

  return (
    <SonPriceContext.Provider value={value}>{children}</SonPriceContext.Provider>
  );
}

export function useSonPrice() {
  const ctx = useContext(SonPriceContext);
  if (!ctx) {
    throw new Error("useSonPrice must be used within SonPriceProvider");
  }
  return ctx;
}
