/**
 * Phantom mobile connect deeplink for the React parent page.
 * Opens the Phantom app to approve, then returns to this browser tab.
 */
import nacl from "tweetnacl";
import bs58 from "bs58";

const SECRET_KEY = "phantomDappSecret";

const RESPONSE_PARAMS = [
  "phantom_encryption_public_key",
  "nonce",
  "data",
  "errorCode",
  "errorMessage",
];

function getDappKeyPair() {
  try {
    const saved = localStorage.getItem(SECRET_KEY);
    if (saved) {
      const secret = bs58.decode(saved);
      if (secret.length === 32) return nacl.box.keyPair.fromSecretKey(secret);
    }
  } catch {
    /* generate a new pair */
  }
  const kp = nacl.box.keyPair();
  try {
    localStorage.setItem(SECRET_KEY, bs58.encode(kp.secretKey));
  } catch {
    /* ignore */
  }
  return kp;
}

export function isMobileDevice() {
  if (typeof navigator === "undefined") return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

export function getRedirectLink() {
  const url = new URL(window.location.href);
  RESPONSE_PARAMS.forEach((p) => url.searchParams.delete(p));
  return url.toString();
}

export function buildPhantomConnectLink(redirectLink = getRedirectLink()) {
  const kp = getDappKeyPair();
  const params = new URLSearchParams({
    dapp_encryption_public_key: bs58.encode(kp.publicKey),
    cluster: "mainnet-beta",
    app_url: window.location.origin,
    redirect_link: redirectLink,
  });
  return `https://phantom.app/ul/v1/connect?${params.toString()}`;
}

export function openPhantomConnect() {
  window.location.href = buildPhantomConnectLink();
}

export function parsePhantomConnectResponse(search = "") {
  const params = new URLSearchParams(search);
  if (params.get("errorCode")) {
    return {
      error: params.get("errorMessage") || "Phantom connection was rejected.",
    };
  }

  const phantomPub = params.get("phantom_encryption_public_key");
  const nonce = params.get("nonce");
  const data = params.get("data");
  if (!phantomPub || !nonce || !data) return null;

  try {
    const kp = getDappKeyPair();
    const shared = nacl.box.before(bs58.decode(phantomPub), kp.secretKey);
    const decrypted = nacl.box.open.after(
      bs58.decode(data),
      bs58.decode(nonce),
      shared
    );
    if (!decrypted) return { error: "Could not decrypt the Phantom response." };

    const payload = JSON.parse(new TextDecoder().decode(decrypted));
    if (!payload?.public_key) {
      return { error: "Phantom did not return a wallet address." };
    }
    return { address: payload.public_key, session: payload.session };
  } catch (e) {
    return { error: e?.message || "Could not read the Phantom response." };
  }
}

export function clearPhantomConnectParams() {
  const url = new URL(window.location.href);
  let changed = false;
  RESPONSE_PARAMS.forEach((p) => {
    if (url.searchParams.has(p)) {
      url.searchParams.delete(p);
      changed = true;
    }
  });
  if (changed) window.history.replaceState({}, "", url.toString());
}
