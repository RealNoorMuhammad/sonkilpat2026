import React, { useEffect, useMemo, useRef } from "react";
import { ConnectionProvider, WalletProvider, useWallet } from "@solana/wallet-adapter-react";
import { WalletModalProvider, useWalletModal } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import { SolflareWalletAdapter } from "@solana/wallet-adapter-solflare";
import { clusterApiUrl } from "@solana/web3.js";

import "@solana/wallet-adapter-react-ui/styles.css";
import "./StickmanWalletProvider.css";

function WalletBridge({ iframeRef }) {
  const { setVisible, visible } = useWalletModal();
  const { publicKey, connected, connecting } = useWallet();
  const pendingRef = useRef(null);
  const wasVisibleRef = useRef(false);

  useEffect(() => {
    const onMessage = (event) => {
      if (event.origin !== window.location.origin) return;
      const iframeWindow = iframeRef.current?.contentWindow;
      if (!iframeWindow || event.source !== iframeWindow) return;
      if (event.data?.type !== "stickman:connect-wallet") return;

      pendingRef.current = iframeWindow;
      setVisible(true);
    };

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [iframeRef, setVisible]);

  useEffect(() => {
    if (connected && publicKey && pendingRef.current) {
      pendingRef.current.postMessage(
        {
          type: "stickman:wallet-connected",
          address: publicKey.toBase58(),
        },
        window.location.origin
      );
      pendingRef.current = null;
    }
  }, [connected, publicKey]);

  useEffect(() => {
    if (visible) {
      wasVisibleRef.current = true;
      return;
    }

    if (!wasVisibleRef.current || !pendingRef.current) return;
    if (connected || connecting) return;

    pendingRef.current.postMessage(
      {
        type: "stickman:wallet-error",
        error: "Wallet connection was cancelled.",
      },
      window.location.origin
    );
    pendingRef.current = null;
    wasVisibleRef.current = false;
  }, [visible, connected, connecting]);

  return null;
}

export default function StickmanWalletProvider({ children, iframeRef }) {
  const endpoint = useMemo(() => clusterApiUrl("mainnet-beta"), []);
  const wallets = useMemo(
    () => [new PhantomWalletAdapter(), new SolflareWalletAdapter()],
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect={false}>
        <WalletModalProvider>
          {children}
          <WalletBridge iframeRef={iframeRef} />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
