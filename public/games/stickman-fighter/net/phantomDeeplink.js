/**
 * phantomDeeplink — Phantom "connect" deeplink protocol for mobile browsers.
 *
 * Unlike the `browse` deeplink (which reopens the dapp inside Phantom's in-app
 * browser — locked to portrait, breaking our landscape game), this flow keeps
 * the user in their normal browser (Chrome/Safari):
 *
 *   1. We generate an x25519 keypair and build a connect universal link.
 *   2. The user taps it → Phantom opens only to approve the connection.
 *   3. Phantom redirects back to our `redirect_link` (in the same browser),
 *      appending an encrypted payload to the URL.
 *   4. We decrypt it here to recover the wallet's public key.
 *
 * See: https://docs.phantom.com/phantom-deeplinks/provider-methods/connect
 */
import nacl from 'https://esm.sh/tweetnacl@1.0.3';
import bs58 from 'https://esm.sh/bs58@5.0.0';

const SECRET_KEY = 'phantomDappSecret'; // persists the dapp keypair across the redirect
const RESPONSE_PARAMS = [
    'phantom_encryption_public_key',
    'nonce',
    'data',
    'errorCode',
    'errorMessage',
];

/** Reuse the stored dapp keypair (needed to decrypt after the redirect reload). */
function getDappKeyPair() {
    try {
        const saved = localStorage.getItem(SECRET_KEY);
        if (saved) {
            const secret = bs58.decode(saved);
            if (secret.length === 32) return nacl.box.keyPair.fromSecretKey(secret);
        }
    } catch { /* fall through to generate a new pair */ }
    const kp = nacl.box.keyPair();
    try { localStorage.setItem(SECRET_KEY, bs58.encode(kp.secretKey)); } catch { /* ignore */ }
    return kp;
}

/** The browser URL Phantom should return to (the top window, minus any prior params). */
export function getRedirectLink() {
    let href;
    try { href = window.top?.location?.href; } catch { href = null; }
    if (!href) href = window.location.href;
    try {
        const url = new URL(href);
        RESPONSE_PARAMS.forEach(p => url.searchParams.delete(p));
        return url.toString();
    } catch {
        return href;
    }
}

/** Build the Phantom connect universal link (open it via a real user tap). */
export function buildConnectDeeplink(redirectLink = getRedirectLink()) {
    const kp = getDappKeyPair();
    const params = new URLSearchParams({
        dapp_encryption_public_key: bs58.encode(kp.publicKey),
        cluster: 'mainnet-beta',
        app_url: window.location.origin,
        redirect_link: redirectLink,
    });
    return `https://phantom.app/ul/v1/connect?${params.toString()}`;
}

/**
 * Parse a connect response from a URL query string.
 * @returns {null | { error: string } | { address: string, session?: string }}
 */
export function parseConnectResponse(search) {
    const params = new URLSearchParams(search || '');
    if (params.get('errorCode')) {
        return { error: params.get('errorMessage') || 'Phantom connection was rejected.' };
    }
    const phantomPub = params.get('phantom_encryption_public_key');
    const nonce = params.get('nonce');
    const data = params.get('data');
    if (!phantomPub || !nonce || !data) return null;

    try {
        const kp = getDappKeyPair();
        const shared = nacl.box.before(bs58.decode(phantomPub), kp.secretKey);
        const decrypted = nacl.box.open.after(bs58.decode(data), bs58.decode(nonce), shared);
        if (!decrypted) return { error: 'Could not decrypt the Phantom response.' };
        const payload = JSON.parse(new TextDecoder().decode(decrypted));
        if (!payload?.public_key) return { error: 'Phantom did not return a wallet address.' };
        return { address: payload.public_key, session: payload.session };
    } catch (e) {
        return { error: e?.message || 'Could not read the Phantom response.' };
    }
}

/** Read the connect response off the current (top) URL, if any. */
export function readConnectResponseFromUrl() {
    let search = '';
    try { search = window.top?.location?.search || ''; } catch { search = ''; }
    if (!search) search = window.location.search || '';
    return parseConnectResponse(search);
}

/** Strip the Phantom response params from the address bar after handling them. */
export function clearConnectResponseFromUrl() {
    try {
        const top = window.top || window;
        const url = new URL(top.location.href);
        let changed = false;
        RESPONSE_PARAMS.forEach(p => {
            if (url.searchParams.has(p)) { url.searchParams.delete(p); changed = true; }
        });
        if (changed) top.history.replaceState({}, '', url.toString());
    } catch { /* ignore */ }
}
