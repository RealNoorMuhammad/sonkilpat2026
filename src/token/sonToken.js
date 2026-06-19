export const TOKEN = "ACpzkGJV3DDU8HXy8yjab7RL9qNmDGym2GwLkzNppump";
export const DEX_PAIRS_API = `https://api.dexscreener.com/token-pairs/v1/solana/${TOKEN}`;
export const DEX_URL = `https://dexscreener.com/solana/${TOKEN}`;
export const DEXSCAN_URL = `https://www.dexscan.markets/token/${TOKEN}`;

export const PRICE_POLL_MS = 1_000;
export const BUYS_POLL_MS = 2_000;
export const OHLCV_POLL_MS = 30_000;

const RANGE_BUCKETS_MS = {
  "1h": 60_000,
  "4h": 5 * 60_000,
  "24h": 60 * 60_000,
  "7d": 4 * 60 * 60_000,
};

export function pickBestPair(pairs) {
  if (!pairs?.length) return null;
  return [...pairs].sort(
    (a, b) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0)
  )[0];
}

export function formatPrice(value) {
  const n = parseFloat(value);
  if (!Number.isFinite(n)) return "—";
  if (n < 0.00001) return `$${n.toExponential(4)}`;
  if (n < 1) return `$${n.toFixed(6)}`;
  if (n < 100) return `$${n.toFixed(4)}`;
  return `$${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

export function formatMarketCap(value) {
  const n = parseFloat(value);
  if (!Number.isFinite(n)) return "—";
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(2)}K`;
  return `$${n.toFixed(0)}`;
}

export function formatChange(value) {
  const n = parseFloat(value);
  if (!Number.isFinite(n)) return "—";
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(2)}%`;
}

export function formatCompact(value) {
  const n = parseFloat(value);
  if (!Number.isFinite(n)) return "—";
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

export function formatAgo(ms) {
  if (!ms) return "—";
  const sec = Math.max(0, Math.floor((Date.now() - ms) / 1000));
  if (sec < 2) return "just now";
  if (sec < 60) return `${sec}s ago`;
  return `${Math.floor(sec / 60)}m ago`;
}

/** Build OHLCV candles from live price snapshots when GeckoTerminal is unavailable. */
export function buildSyntheticOhlcv(history, rangeId) {
  if (!history?.length) return [];

  const bucketMs = RANGE_BUCKETS_MS[rangeId] || RANGE_BUCKETS_MS["24h"];
  const buckets = new Map();

  for (const { t, p } of history) {
    const price = parseFloat(p);
    if (!Number.isFinite(price)) continue;

    const key = Math.floor(t / bucketMs) * bucketMs;
    const existing = buckets.get(key);
    if (!existing) {
      buckets.set(key, {
        t: Math.floor(key / 1000),
        o: price,
        h: price,
        l: price,
        c: price,
      });
    } else {
      existing.h = Math.max(existing.h, price);
      existing.l = Math.min(existing.l, price);
      existing.c = price;
    }
  }

  return [...buckets.values()]
    .sort((a, b) => a.t - b.t)
    .map((b) => [b.t, b.o, b.h, b.l, b.c, 0]);
}

/** Guarantee at least two candles so the chart can render. */
export function ensureMinOhlcv(list, priceUsd) {
  if (list?.length >= 2) return list;

  const p = parseFloat(priceUsd);
  if (!Number.isFinite(p)) return list || [];

  const t = Math.floor(Date.now() / 1000);
  if (list?.length === 1) {
    const c = list[0];
    return [c, [t, c[1], Math.max(c[2], p), Math.min(c[3], p), p, 0]];
  }

  return [
    [t - 120, p, p, p, p, 0],
    [t, p, p, p, p, 0],
  ];
}
