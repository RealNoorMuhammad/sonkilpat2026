/**
 * walletBridge — ask the React parent page to connect Phantom on mobile.
 * Used when the game runs inside the stickman-fighter iframe.
 */

export function isEmbeddedInApp() {
    try {
        return window.parent !== window;
    } catch {
        return false;
    }
}

/** Opens Phantom via the parent page (mobile deeplink flow). */
export function openPhantomViaParent() {
    if (!isEmbeddedInApp()) return false;
    window.parent.postMessage({ type: 'stickman:connect-phantom' }, '*');
    return true;
}

/**
 * Desktop: ask parent to open the Solana wallet picker.
 * @returns {Promise<string>} connected wallet address (base58)
 */
export function requestWalletViaParent() {
    return new Promise((resolve, reject) => {
        if (!isEmbeddedInApp()) {
            reject(new Error('Wallet adapter not available.'));
            return;
        }

        const timeoutMs = 120000;
        const timeout = setTimeout(() => {
            window.removeEventListener('message', onResponse);
            reject(new Error('Wallet connection timed out.'));
        }, timeoutMs);

        const onResponse = (event) => {
            if (event.source !== window.parent) return;
            const data = event.data;
            if (!data || typeof data !== 'object') return;

            if (data.type === 'stickman:wallet-connected') {
                clearTimeout(timeout);
                window.removeEventListener('message', onResponse);
                if (data.address) resolve(data.address);
                else reject(new Error('Could not read your wallet address.'));
                return;
            }

            if (data.type === 'stickman:wallet-error') {
                clearTimeout(timeout);
                window.removeEventListener('message', onResponse);
                reject(new Error(data.error || 'Could not connect wallet.'));
            }
        };

        window.addEventListener('message', onResponse);
        window.parent.postMessage({ type: 'stickman:connect-wallet' }, '*');
    });
}
