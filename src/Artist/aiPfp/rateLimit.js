const STORAGE_KEY = "son_ai_pfp_last_generation";
const COOLDOWN_MS = 24 * 60 * 60 * 1000;

export function getCooldownStatus() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return { allowed: true, remainingMs: 0 };
  }

  const lastUsed = Number.parseInt(raw, 10);
  if (Number.isNaN(lastUsed)) {
    localStorage.removeItem(STORAGE_KEY);
    return { allowed: true, remainingMs: 0 };
  }

  const elapsed = Date.now() - lastUsed;
  if (elapsed >= COOLDOWN_MS) {
    return { allowed: true, remainingMs: 0 };
  }

  return { allowed: false, remainingMs: COOLDOWN_MS - elapsed };
}

export function recordGeneration() {
  localStorage.setItem(STORAGE_KEY, String(Date.now()));
}

export function formatCooldown(ms) {
  const hours = Math.floor(ms / 3_600_000);
  const minutes = Math.floor((ms % 3_600_000) / 60_000);
  const seconds = Math.floor((ms % 60_000) / 1000);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}
