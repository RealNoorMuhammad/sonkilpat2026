/**
 * phantomWallet — wrapper around the Phantom wallet provider.
 *
 * Desktop: uses the provider injected by the Phantom browser extension
 *          (window.phantom.solana).
 * Mobile:  a normal mobile browser has no injected provider, so we deep-link
 *          into Phantom's in-app browser (which DOES inject the provider) using
 *          Phantom's universal "browse" link. Once the page reopens inside
 *          Phantom, connecting works the same as on desktop.
 *
 * Note: the deep link must point at a publicly reachable URL — "localhost"
 * won't resolve on the phone, so mobile testing needs a deployed build.
 */

/** @returns {any|null} the Phantom Solana provider, or null if unavailable. */
export function getPhantomProvider() {
    if (typeof window === 'undefined') return null;
    const injected = window.phantom?.solana;
    if (injected?.isPhantom) return injected;
    if (window.solana?.isPhantom) return window.solana;
    return null;
}

export function isPhantomAvailable() {
    return !!getPhantomProvider();
}

export function isMobile() {
    if (typeof navigator === 'undefined') return false;
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * The provider can be injected slightly after page load. Poll for it briefly.
 * @returns {Promise<any|null>}
 */
export function waitForPhantomProvider(timeoutMs = 2500) {
    return new Promise(resolve => {
        const found = getPhantomProvider();
        if (found) return resolve(found);
        const interval = 100;
        let elapsed = 0;
        const timer = setInterval(() => {
            const provider = getPhantomProvider();
            if (provider) { clearInterval(timer); resolve(provider); return; }
            elapsed += interval;
            if (elapsed >= timeoutMs) { clearInterval(timer); resolve(null); }
        }, interval);
    });
}

/** The page URL to reopen inside Phantom (prefer the top window if in an iframe). */
function currentTopUrl() {
    try {
        if (window.top && window.top.location?.href) return window.top.location.href;
    } catch { /* cross-origin top — fall back below */ }
    return window.location.href;
}

/** Build Phantom's universal browse link for a target URL. */
export function getPhantomBrowseLink(targetUrl = currentTopUrl()) {
    const url = encodeURIComponent(targetUrl);
    const ref = encodeURIComponent(window.location.origin);
    return `https://phantom.app/ul/browse/${url}?ref=${ref}`;
}

/** Redirect a mobile browser into Phantom's in-app browser. */
export function openInPhantom(targetUrl = currentTopUrl()) {
    window.location.href = getPhantomBrowseLink(targetUrl);
}

/**
 * Prompt the user to connect their Phantom wallet.
 *
 * On mobile without the in-app provider, this redirects into the Phantom app
 * and throws a friendly message (the page will reload inside Phantom).
 *
 * @returns {Promise<string>} the connected Solana address (base58).
 */
export async function connectPhantom() {
    const provider = await waitForPhantomProvider();

    if (provider) {
        try {
            const resp = await provider.connect();
            const address = resp?.publicKey?.toString?.() ?? provider.publicKey?.toString?.();
            if (!address) throw new Error('Could not read your wallet address.');
            return address;
        } catch (err) {
            if (err?.code === 4001) throw new Error('Wallet connection was cancelled.');
            throw new Error(err?.message || 'Could not connect to Phantom.');
        }
    }

    // No provider available.
    if (isMobile()) {
        openInPhantom();
        throw new Error('Opening Phantom… approve there, then tap Connect again.');
    }
    throw new Error('Phantom not found. Install the Phantom extension, then reload.');
}

export async function disconnectPhantom() {
    const provider = getPhantomProvider();
    try { await provider?.disconnect?.(); } catch { /* ignore */ }
}

/** Shorten an address for display, e.g. "7Xk9…4ab2". */
export function shortAddress(address) {
    if (!address || address.length <= 10) return address || '';
    return `${address.slice(0, 4)}…${address.slice(-4)}`;
}
