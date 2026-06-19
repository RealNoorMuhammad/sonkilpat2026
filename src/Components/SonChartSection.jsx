import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaArrowDown, FaArrowUp } from "react-icons/fa";
import {
  DEX_URL,
  DEXSCAN_URL,
  OHLCV_POLL_MS,
  PRICE_POLL_MS,
  TOKEN,
  buildSyntheticOhlcv,
  ensureMinOhlcv,
  formatAgo,
  formatChange,
  formatCompact,
  formatPrice,
} from "../token/sonToken";
import { useSonPrice } from "../token/SonPriceContext";
import "./SonChartSection.css";

const RANGES = [
  { id: "1h", label: "1H", timeframe: "minute", aggregate: 1, limit: 60 },
  { id: "4h", label: "4H", timeframe: "minute", aggregate: 5, limit: 48 },
  { id: "24h", label: "24H", timeframe: "hour", aggregate: 1, limit: 24 },
  { id: "7d", label: "7D", timeframe: "hour", aggregate: 4, limit: 42 },
];

const CHART = { w: 900, h: 340, pad: { top: 24, right: 72, bottom: 52, left: 12 } };
const ease = [0.22, 1, 0.36, 1];

function formatTime(ts, rangeId) {
  const d = new Date(ts * 1000);
  if (rangeId === "7d") {
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }
  return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

function mergeLivePrice(ohlcvList, livePrice) {
  if (!ohlcvList?.length) return ohlcvList;
  const live = parseFloat(livePrice);
  if (!Number.isFinite(live)) return ohlcvList;

  const next = ohlcvList.map((c) => [...c]);
  const last = next[next.length - 1];
  last[2] = Math.max(last[2], live);
  last[3] = Math.min(last[3], live);
  last[4] = live;
  return next;
}

function buildSeries(ohlcvList) {
  if (!ohlcvList?.length) {
    return {
      points: [],
      volumeBars: [],
      yMin: 0,
      yMax: 1,
      isUp: true,
      changePct: 0,
      high: null,
      low: null,
      volume: 0,
    };
  }

  const closes = ohlcvList.map((c) => c[4]);
  const min = Math.min(...closes);
  const max = Math.max(...closes);
  const span = max - min || max * 0.02 || 0.000001;
  const pad = span * 0.1;
  const yMin = min - pad;
  const yMax = max + pad;

  const innerW = CHART.w - CHART.pad.left - CHART.pad.right;
  const innerH = CHART.h - CHART.pad.top - CHART.pad.bottom;
  const volH = 36;
  const priceH = innerH - volH - 8;
  const last = ohlcvList.length - 1;
  const maxVol = Math.max(...ohlcvList.map((c) => c[5] || 0), 1);
  const barW = Math.max(2, innerW / ohlcvList.length - 1);

  const points = ohlcvList.map((candle, i) => {
    const close = candle[4];
    const open = candle[1];
    const x = CHART.pad.left + (i / last) * innerW;
    const y = CHART.pad.top + (1 - (close - yMin) / (yMax - yMin)) * priceH;
    return {
      x,
      y,
      close,
      open,
      high: candle[2],
      low: candle[3],
      volume: candle[5],
      timestamp: candle[0],
      isUpCandle: close >= open,
    };
  });

  const volBase = CHART.h - CHART.pad.bottom;
  const volumeBars = points.map((p, i) => ({
    x: p.x - barW / 2,
    y: volBase - ((ohlcvList[i][5] || 0) / maxVol) * volH,
    w: barW,
    h: ((ohlcvList[i][5] || 0) / maxVol) * volH,
    up: i === 0 ? true : ohlcvList[i][4] >= ohlcvList[i - 1][4],
  }));

  const first = closes[0];
  const lastClose = closes[closes.length - 1];

  return {
    points,
    volumeBars,
    yMin,
    yMax,
    isUp: lastClose >= first,
    changePct: first ? ((lastClose - first) / first) * 100 : 0,
    high: Math.max(...ohlcvList.map((c) => c[2])),
    low: Math.min(...ohlcvList.map((c) => c[3])),
    volume: ohlcvList.reduce((sum, c) => sum + (c[5] || 0), 0),
  };
}

function smoothLinePath(points) {
  if (points.length < 2) return "";
  if (points.length === 2) {
    return `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)} L ${points[1].x.toFixed(2)} ${points[1].y.toFixed(2)}`;
  }

  let d = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[i - 1] || points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }
  return d;
}

function areaPath(points) {
  if (!points.length) return "";
  const base = CHART.h - CHART.pad.bottom;
  const line = smoothLinePath(points);
  const last = points[points.length - 1];
  const first = points[0];
  return `${line} L ${last.x.toFixed(2)} ${base} L ${first.x.toFixed(2)} ${base} Z`;
}

function tooltipStyle(point) {
  const pct = (point.x / CHART.w) * 100;
  return { left: `clamp(88px, ${pct}%, calc(100% - 88px))` };
}

function winPopupStyle(point) {
  const pct = (point.x / CHART.w) * 100;
  return {
    left: `clamp(130px, ${pct}%, calc(100% - 12px))`,
    top: `${(point.y / CHART.h) * 100}%`,
  };
}

function SonChartSection() {
  const {
    pair,
    pairAddress,
    priceUsd,
    change24h,
    tickDir,
    priceTick,
    priceFlash,
    priceHistory,
    lastUpdated,
  } = useSonPrice();
  const [range, setRange] = useState("24h");
  const [ohlcv, setOhlcv] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hoverIndex, setHoverIndex] = useState(null);
  const [showWinning, setShowWinning] = useState(false);
  const [agoLabel, setAgoLabel] = useState("just now");
  const svgRef = useRef(null);
  const ohlcvCacheRef = useRef({});

  useEffect(() => {
    if (tickDir === "up") {
      setShowWinning(true);
    } else if (tickDir === "down") {
      setShowWinning(false);
    }
  }, [priceTick, tickDir]);

  const fetchOhlcv = useCallback(async (addr, rangeId) => {
    if (!addr) return false;

    const cfg = RANGES.find((r) => r.id === rangeId) || RANGES[2];
    const qs = new URLSearchParams({
      aggregate: String(cfg.aggregate),
      limit: String(cfg.limit),
    });
    const url = `/api/gecko/networks/solana/pools/${addr}/ohlcv/${cfg.timeframe}?${qs}`;

    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error("Chart data unavailable");
      const json = await res.json();
      const list = json?.data?.attributes?.ohlcv_list || [];
      if (!list.length) throw new Error("No candle data");

      ohlcvCacheRef.current[rangeId] = list;
      setOhlcv(list);
      setError(null);
      return true;
    } catch {
      const cached = ohlcvCacheRef.current[rangeId];
      if (cached?.length) {
        setOhlcv(cached);
        setError(null);
        return true;
      }
      return false;
    }
  }, []);

  useEffect(() => {
    if (!pairAddress) return;

    let cancelled = false;

    const boot = async () => {
      setLoading(true);
      const ok = await fetchOhlcv(pairAddress, range);
      if (!cancelled && !ok) {
        setError(null);
      }
      if (!cancelled) setLoading(false);
    };

    boot();
    return () => {
      cancelled = true;
    };
  }, [range, pairAddress, fetchOhlcv]);

  useEffect(() => {
    if (!pairAddress) return;

    const ohlcvId = setInterval(() => {
      fetchOhlcv(pairAddress, range).catch(() => {});
    }, OHLCV_POLL_MS);

    return () => clearInterval(ohlcvId);
  }, [range, pairAddress, fetchOhlcv]);

  useEffect(() => {
    const id = setInterval(() => setAgoLabel(formatAgo(lastUpdated)), 1000);
    return () => clearInterval(id);
  }, [lastUpdated]);

  const resolvedOhlcv = useMemo(() => {
    let list = ohlcv;
    if (list.length < 2) {
      list = buildSyntheticOhlcv(priceHistory, range);
    }
    return ensureMinOhlcv(list, priceUsd);
  }, [ohlcv, priceHistory, range, priceUsd]);

  const liveOhlcv = useMemo(
    () => mergeLivePrice(resolvedOhlcv, priceUsd),
    [resolvedOhlcv, priceUsd]
  );

  const series = useMemo(() => buildSeries(liveOhlcv), [liveOhlcv]);
  const { points, volumeBars, isUp, changePct, high, low, volume } = series;
  const lastPoint = points[points.length - 1];
  const activePoint =
    hoverIndex != null ? points[hoverIndex] : lastPoint;
  const isLiveUp = change24h >= 0;
  const Arrow = isLiveUp ? FaArrowUp : FaArrowDown;
  const lineD = smoothLinePath(points);
  const areaD = areaPath(points);
  const liveWinActive =
    showWinning && lastPoint?.isUpCandle && hoverIndex == null;
  const statHigh = high > 0 ? high : parseFloat(priceUsd) || null;
  const statLow = low > 0 ? low : parseFloat(priceUsd) || null;
  const chartPending = points.length < 2 && !priceUsd;
  const plot = {
    x: CHART.pad.left,
    y: CHART.pad.top,
    w: CHART.w - CHART.pad.left - CHART.pad.right,
    h: CHART.h - CHART.pad.top - CHART.pad.bottom,
  };

  const handlePointer = (clientX) => {
    const svg = svgRef.current;
    if (!svg || !points.length) return;
    const rect = svg.getBoundingClientRect();
    const ratio = (clientX - rect.left) / rect.width;
    const x = ratio * CHART.w;
    let nearest = 0;
    let minDist = Infinity;
    points.forEach((p, i) => {
      const dist = Math.abs(p.x - x);
      if (dist < minDist) {
        minDist = dist;
        nearest = i;
      }
    });
    setHoverIndex(nearest);
  };

  const gridLines = useMemo(() => {
    const { yMin, yMax } = series;
    if (!Number.isFinite(yMin) || !Number.isFinite(yMax)) return [];
    const priceH = CHART.h - CHART.pad.top - CHART.pad.bottom - 44;
    return [0, 0.25, 0.5, 0.75, 1].map((t) => {
      const val = yMin + (yMax - yMin) * (1 - t);
      const y = CHART.pad.top + t * priceH;
      return { y, label: formatPrice(val) };
    });
  }, [series]);

  return (
    <section className="son-chart" aria-labelledby="son-chart-heading">
      <div className="son-chart__bg" aria-hidden="true">
        <div className="son-chart__grid" />
        <div className="son-chart__orb son-chart__orb--a" />
        <div className="son-chart__orb son-chart__orb--b" />
      </div>

      <div className="son-chart__inner">
        <motion.header
          className="son-chart__header"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, ease }}
        >
          <div className="son-chart__title-block">
            <p className="son-chart__eyebrow">$SON · LIVE CHART</p>
            <h2 id="son-chart-heading" className="son-chart__title">
              Price Action
            </h2>
          </div>
          <div className="son-chart__header-links">
            <span className="son-chart__sync">
              <span className="son-chart__sync-dot" aria-hidden="true" />
              Updated {agoLabel}
            </span>
            <a
              href={DEX_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="son-chart__link"
            >
              DexScreener ↗
            </a>
            <a
              href={DEXSCAN_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="son-chart__link"
            >
              DexScan ↗
            </a>
          </div>
        </motion.header>

        <motion.div
          className={`son-chart__panel${isLiveUp ? " son-chart__panel--up" : " son-chart__panel--down"}`}
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.65, ease, delay: 0.06 }}
        >
          <span className="son-chart__panel-border" aria-hidden="true" />
          <div className="son-chart__panel-top">
            <div className="son-chart__price-block">
              <span className="son-chart__live-tag">
                <span className="son-chart__live-dot" aria-hidden="true" />
                Live
              </span>
              <AnimatePresence mode="wait">
                <motion.span
                  key={priceUsd || "loading"}
                  className={`son-chart__price${
                    priceFlash && tickDir === "up"
                      ? " son-chart__price--tick-up"
                      : priceFlash && tickDir === "down"
                        ? " son-chart__price--tick-down"
                        : ""
                  }`}
                  initial={{ opacity: 0.6, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, ease }}
                >
                  {formatPrice(priceUsd || activePoint?.close)}
                </motion.span>
              </AnimatePresence>
              <span
                className={`son-chart__change${isLiveUp ? " son-chart__change--up" : " son-chart__change--down"}`}
              >
                <Arrow aria-hidden />
                {formatChange(change24h)} <span>24h</span>
              </span>
            </div>

            <div className="son-chart__ranges" role="tablist" aria-label="Chart time range">
              {RANGES.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  role="tab"
                  aria-selected={range === r.id}
                  className={`son-chart__range${range === r.id ? " son-chart__range--active" : ""}`}
                  onClick={() => {
                    setHoverIndex(null);
                    setRange(r.id);
                    setLoading(true);
                  }}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <div className="son-chart__stats">
            <div className="son-chart__stat son-chart__stat--highlight">
              <span className="son-chart__stat-label">Range</span>
              <span
                className={`son-chart__stat-value${series.isUp ? " son-chart__stat-value--up" : " son-chart__stat-value--down"}`}
              >
                {formatChange(changePct)}
              </span>
            </div>
            <div className="son-chart__stat">
              <span className="son-chart__stat-label">High</span>
              <span className="son-chart__stat-value">
                {statHigh ? formatPrice(statHigh) : "—"}
              </span>
            </div>
            <div className="son-chart__stat">
              <span className="son-chart__stat-label">Low</span>
              <span className="son-chart__stat-value">
                {statLow ? formatPrice(statLow) : "—"}
              </span>
            </div>
            <div className="son-chart__stat">
              <span className="son-chart__stat-label">Vol · 24h</span>
              <span className="son-chart__stat-value">
                {formatCompact(pair?.volume?.h24 ?? volume)}
              </span>
            </div>
            <div className="son-chart__stat">
              <span className="son-chart__stat-label">Liquidity</span>
              <span className="son-chart__stat-value">
                {formatCompact(pair?.liquidity?.usd)}
              </span>
            </div>
          </div>

          <div
            className={`son-chart__canvas${loading ? " son-chart__canvas--loading" : ""}`}
            onMouseLeave={() => setHoverIndex(null)}
          >

            {chartPending ? (
              <p className="son-chart__error son-chart__error--pending">
                Building live chart… collecting price data
              </p>
            ) : error && !points.length ? (
              <p className="son-chart__error">{error}</p>
            ) : (
              <div className="son-chart__plot-frame">
                <svg
                  ref={svgRef}
                  viewBox={`0 0 ${CHART.w} ${CHART.h}`}
                  className="son-chart__svg"
                  preserveAspectRatio="none"
                  onMouseMove={(e) => handlePointer(e.clientX)}
                  onTouchMove={(e) => {
                    if (e.touches[0]) handlePointer(e.touches[0].clientX);
                  }}
                  role="img"
                  aria-label="$SON price chart"
                >
                  <defs>
                    <linearGradient id="son-chart-plot-bg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="rgba(141, 198, 63, 0.08)" />
                      <stop offset="45%" stopColor="rgba(5, 5, 5, 0.15)" />
                      <stop offset="100%" stopColor="rgba(0, 0, 0, 0.55)" />
                    </linearGradient>
                    <linearGradient id="son-chart-live-zone" x1="1" y1="0" x2="0" y2="0">
                      <stop offset="0%" stopColor="rgba(141, 198, 63, 0.14)" />
                      <stop offset="100%" stopColor="rgba(141, 198, 63, 0)" />
                    </linearGradient>
                    <linearGradient id="son-chart-line-grad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#4ade80" />
                      <stop offset="45%" stopColor="#8dc63f" />
                      <stop offset="100%" stopColor="#bef264" />
                    </linearGradient>
                    <linearGradient id="son-chart-line-grad-down" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#fca5a5" />
                      <stop offset="100%" stopColor="#f87171" />
                    </linearGradient>
                    <linearGradient id="son-chart-area-grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="rgba(141, 198, 63, 0.38)" />
                      <stop offset="55%" stopColor="rgba(74, 222, 128, 0.1)" />
                      <stop offset="100%" stopColor="rgba(141, 198, 63, 0)" />
                    </linearGradient>
                    <linearGradient id="son-chart-area-grad-down" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="rgba(248, 113, 113, 0.28)" />
                      <stop offset="100%" stopColor="rgba(248, 113, 113, 0)" />
                    </linearGradient>
                    <linearGradient id="son-chart-vol-up" x1="0" y1="1" x2="0" y2="0">
                      <stop offset="0%" stopColor="rgba(74, 222, 128, 0.12)" />
                      <stop offset="100%" stopColor="rgba(190, 242, 100, 0.55)" />
                    </linearGradient>
                    <linearGradient id="son-chart-vol-down" x1="0" y1="1" x2="0" y2="0">
                      <stop offset="0%" stopColor="rgba(248, 113, 113, 0.12)" />
                      <stop offset="100%" stopColor="rgba(248, 113, 113, 0.42)" />
                    </linearGradient>
                    <filter id="son-chart-glow" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="3.5" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                    <filter id="son-chart-soft-glow" x="-30%" y="-30%" width="160%" height="160%">
                      <feGaussianBlur stdDeviation="6" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                      </feMerge>
                    </filter>
                  </defs>

                  <rect
                    x={plot.x}
                    y={plot.y}
                    width={plot.w}
                    height={plot.h}
                    rx="14"
                    className="son-chart__plot-bg"
                    fill="url(#son-chart-plot-bg)"
                  />
                  <rect
                    x={plot.x + plot.w * 0.72}
                    y={plot.y}
                    width={plot.w * 0.28}
                    height={plot.h}
                    fill="url(#son-chart-live-zone)"
                    className="son-chart__live-zone"
                  />

                  {[0.25, 0.5, 0.75].map((t) => (
                    <line
                      key={`v-${t}`}
                      x1={plot.x + plot.w * t}
                      y1={plot.y}
                      x2={plot.x + plot.w * t}
                      y2={plot.y + plot.h}
                      className="son-chart__grid-line son-chart__grid-line--v"
                    />
                  ))}

                  {gridLines.map((g) => (
                    <g key={g.y}>
                      <line
                        x1={CHART.pad.left}
                        y1={g.y}
                        x2={CHART.w - CHART.pad.right}
                        y2={g.y}
                        className="son-chart__grid-line"
                      />
                      <text x={CHART.w - 10} y={g.y - 6} className="son-chart__grid-label">
                        {g.label}
                      </text>
                    </g>
                  ))}

                  {volumeBars.map((bar, i) => (
                    <rect
                      key={`vol-${i}`}
                      x={bar.x}
                      y={bar.y}
                      width={bar.w}
                      height={bar.h}
                      rx="1"
                      fill={bar.up ? "url(#son-chart-vol-up)" : "url(#son-chart-vol-down)"}
                      className="son-chart__vol-bar"
                    />
                  ))}

                  {points.length > 1 && (
                    <>
                      <path
                        d={areaD}
                        className="son-chart__area-glow"
                        fill={isUp ? "url(#son-chart-area-grad)" : "url(#son-chart-area-grad-down)"}
                        filter="url(#son-chart-soft-glow)"
                      />
                      <path
                        d={areaD}
                        className="son-chart__area"
                        fill={isUp ? "url(#son-chart-area-grad)" : "url(#son-chart-area-grad-down)"}
                      />
                      <path
                        d={lineD}
                        className="son-chart__line-glow"
                        fill="none"
                        stroke={isUp ? "url(#son-chart-line-grad)" : "url(#son-chart-line-grad-down)"}
                        filter="url(#son-chart-soft-glow)"
                      />
                      <path
                        d={lineD}
                        className={`son-chart__line${isUp ? " son-chart__line--up" : " son-chart__line--down"}`}
                        fill="none"
                        stroke={isUp ? "url(#son-chart-line-grad)" : "url(#son-chart-line-grad-down)"}
                        filter="url(#son-chart-glow)"
                      />
                    </>
                  )}

                  {activePoint && (
                    <>
                      <line
                        x1={activePoint.x}
                        y1={CHART.pad.top}
                        x2={activePoint.x}
                        y2={CHART.h - CHART.pad.bottom}
                        className="son-chart__crosshair"
                      />
                      <circle
                        cx={activePoint.x}
                        cy={activePoint.y}
                        r="6"
                        className="son-chart__dot-ring"
                      />
                      <circle
                        cx={activePoint.x}
                        cy={activePoint.y}
                        r="3.5"
                        className={`son-chart__dot${isUp ? " son-chart__dot--up" : " son-chart__dot--down"}`}
                      />
                    </>
                  )}

                  {lastPoint && hoverIndex == null && (
                    <g className="son-chart__live-end" aria-hidden="true">
                      <circle cx={lastPoint.x} cy={lastPoint.y} r="10" className="son-chart__ripple">
                        <animate attributeName="r" values="8;22;8" dur="2.4s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0.55;0;0.55" dur="2.4s" repeatCount="indefinite" />
                      </circle>
                      <circle cx={lastPoint.x} cy={lastPoint.y} r="10" className="son-chart__ripple">
                        <animate attributeName="r" values="8;22;8" dur="2.4s" begin="1.2s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0.55;0;0.55" dur="2.4s" begin="1.2s" repeatCount="indefinite" />
                      </circle>
                    </g>
                  )}
                </svg>

                <AnimatePresence mode="wait">
                  {liveWinActive && lastPoint && (
                    <div
                      className="son-chart__win-popup-anchor"
                      style={winPopupStyle(lastPoint)}
                    >
                      <motion.div
                        key={priceTick}
                        className="son-chart__win-popup"
                        initial={{ opacity: 0, scale: 0.35, y: 20, rotate: -10 }}
                        animate={{
                          opacity: 1,
                          scale: [0.35, 1.12, 1],
                          y: [20, -6, 0],
                          rotate: [-10, 4, 0],
                        }}
                        exit={{ opacity: 0, scale: 0.85, y: -14, filter: "blur(4px)" }}
                        transition={{
                          duration: 0.55,
                          ease: [0.22, 1, 0.36, 1],
                          scale: { times: [0, 0.65, 1], duration: 0.55 },
                          y: { times: [0, 0.55, 1], duration: 0.55 },
                        }}
                      >
                        <motion.span
                          className="son-chart__win-popup-burst"
                          initial={{ scale: 0.6, opacity: 0.8 }}
                          animate={{ scale: 2.2, opacity: 0 }}
                          transition={{ duration: 0.7, ease: "easeOut" }}
                          aria-hidden="true"
                        />
                        <span className="son-chart__win-popup-body">
                          <span className="son-chart__win-popup-icon" aria-hidden="true">
                            ▲
                          </span>
                          <span className="son-chart__win-popup-text">Winning</span>
                        </span>
                      </motion.div>
                    </div>
                  )}
                </AnimatePresence>

                {activePoint && (
                  <motion.div
                    className="son-chart__tooltip"
                    style={tooltipStyle(activePoint)}
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.15 }}
                    key={`${activePoint.timestamp}-${activePoint.close}`}
                  >
                    <span className="son-chart__tooltip-price">
                      {formatPrice(activePoint.close)}
                    </span>
                    <span className="son-chart__tooltip-time">
                      {formatTime(activePoint.timestamp, range)}
                    </span>
                  </motion.div>
                )}

                {loading && !points.length && (
                  <div className="son-chart__skeleton" aria-busy="true" />
                )}
              </div>
            )}
          </div>

          <div className="son-chart__foot">
            <span className="son-chart__contract" title={TOKEN}>
              {TOKEN.slice(0, 6)}…{TOKEN.slice(-4)}
            </span>
            <span>
              Live price every {PRICE_POLL_MS / 1000}s · candles every {OHLCV_POLL_MS / 1000}s · live fallback enabled
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default SonChartSection;
