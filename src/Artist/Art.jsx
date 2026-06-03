import React, { useEffect, useState } from 'react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { motion } from 'framer-motion';
import { LucideSparkles, LucideClock } from 'lucide-react';

// NOTE: This file is a single-file React app component intended as a starter.
// It uses TailwindCSS for styling, Framer Motion for subtle animations, and
// @solana/wallet-adapter-react for wallet connections. Replace placeholder
// fetch functions with real Supabase + on-chain logic.

export default function App() {
  const [timeLeft, setTimeLeft] = useState(0);
  const [pot, setPot] = useState('0.00');
  const [winners, setWinners] = useState([]);
  const [loading, setLoading] = useState(true);

  // placeholder: fetch raffle meta from your Supabase / backend
  async function fetchRaffleMeta() {
    // Replace with: fetch from your Supabase edge function / REST API
    // Example response shape:
    // { nextDrawTimestamp: 1710000000, potLamports: 1200000000 }
    return {
      nextDrawTimestamp: Math.floor(Date.now() / 1000) + 3600,
      potLamports: 500000000,
    };
  }

  async function fetchWinners() {
    // Replace with real fetch from Supabase table 'winners'
    return [
      { address: '9AbC...xyz', prize: '1000 SOVL', time: 'Aug 10, 2025' },
      { address: '7XyZ...abc', prize: '500 SOVL', time: 'Aug 9, 2025' },
    ];
  }

  useEffect(() => {
    let timer;
    (async () => {
      setLoading(true);
      const meta = await fetchRaffleMeta();
      const winners = await fetchWinners();
      setWinners(winners);

      const now = Math.floor(Date.now() / 1000);
      const left = Math.max(0, meta.nextDrawTimestamp - now);
      setTimeLeft(left);
      setPot((meta.potLamports / 1e9).toFixed(4)); // show SOVL assuming 9 decimals
      setLoading(false);

      timer = setInterval(() => {
        setTimeLeft((t) => Math.max(0, t - 1));
      }, 1000);
    })();

    return () => clearInterval(timer);
  }, []);

  function formatTime(seconds) {
    const h = Math.floor(seconds / 3600)
      .toString()
      .padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60)
      .toString()
      .padStart(2, '0');
    const s = Math.floor(seconds % 60)
      .toString()
      .padStart(2, '0');
    return `${h}:${m}:${s}`;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-zinc-900 text-white p-6">
      <header className="max-w-6xl mx-auto flex items-center justify-between py-6">
        <div className="flex items-center gap-4">
          <div className="rounded-2xl bg-gradient-to-br from-pink-600 via-purple-600 to-cyan-400 p-1">
            <div className="bg-black rounded-xl px-4 py-2 shadow-lg flex items-center gap-3">
              <LucideSparkles className="w-6 h-6 text-white" />
              <div>
                <div className="text-sm font-semibold">SovLana</div>
                <div className="text-xs text-gray-300">SOVL — Meme Raffle Token</div>
              </div>
            </div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">LuckyBags Raffle — SovLana</h1>
        </div>

        <div className="flex items-center gap-4">
          <a
            className="hidden sm:inline-block px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-sm"
            href="#howitworks"
          >
            How it works
          </a>
          <WalletMultiButton />
        </div>
      </header>

      <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left column: big raffle card */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="lg:col-span-2 bg-gradient-to-br from-zinc-800/60 to-black/40 rounded-2xl p-6 shadow-2xl"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-extrabold">Next Raffle</h2>
              <p className="text-sm text-gray-300 mt-1">Hourly draws — 1 winner — 10,000 SOVL = 1 ticket</p>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-400">Current Pot</div>
              <div className="text-2xl font-bold">{pot} SOVL</div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-zinc-900/50">
              <div className="text-xs text-gray-400">Countdown</div>
              <div className="text-xl font-semibold mt-2 flex items-center gap-2">
                <LucideClock className="w-4 h-4 text-gray-300" /> {formatTime(timeLeft)}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-zinc-900/50">
              <div className="text-xs text-gray-400">Ticket Price</div>
              <div className="text-xl font-semibold mt-2">10,000 SOVL</div>
            </div>

            <div className="p-4 rounded-xl bg-zinc-900/50 flex flex-col justify-between">
              <div className="text-xs text-gray-400">Your Tickets</div>
              <div className="text-xl font-semibold mt-2">0</div>
              <div className="mt-4">
                <a
                  className="inline-block w-full text-center px-4 py-2 rounded-lg bg-gradient-to-r from-pink-500 to-indigo-500 font-semibold shadow-lg"
                  href="#buy"
                >
                  Buy SOVL (Jupiter)
                </a>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="text-lg font-semibold">How it works</h3>
            <ol className="list-decimal list-inside mt-3 text-gray-300">
              <li>We snapshot balances hourly (10,000 SOVL = 1 ticket).</li>
              <li>Switchboard VRF selects a winner on-chain.</li>
              <li>Smart contract pays out the pot to the winner automatically.</li>
            </ol>
          </div>
        </motion.div>

        {/* Right column: winners history */}
        <motion.aside
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45 }}
          className="bg-zinc-900/50 rounded-2xl p-4 shadow-lg"
        >
          <h4 className="text-lg font-semibold">Past Winners</h4>
          <div className="mt-3 space-y-3">
            {loading ? (
              <div className="text-sm text-gray-400">Loading...</div>
            ) : winners.length === 0 ? (
              <div className="text-sm text-gray-400">No winners yet</div>
            ) : (
              winners.map((w, i) => (
                <div key={i} className="p-3 bg-black/20 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{w.address}</div>
                      <div className="text-xs text-gray-400">{w.time}</div>
                    </div>
                    <div className="text-sm font-semibold">{w.prize}</div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-4 text-center text-xs text-gray-500">Transparent on-chain draws • Devnet first</div>
        </motion.aside>
      </main>

      <footer className="max-w-6xl mx-auto mt-12 text-center text-sm text-gray-500">
        Built with ❤️ for SovLana — Demo UI. Connect a wallet to participate.
      </footer>
    </div>
  );
}
