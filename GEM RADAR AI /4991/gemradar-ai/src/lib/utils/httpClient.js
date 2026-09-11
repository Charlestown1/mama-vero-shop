import axios from "axios";

// Shared HTTP client for all outbound crypto-data provider calls. A single
// place to set a sane timeout and a small retry policy for transient
// failures — provider modules should use this instead of calling axios
// directly, so reliability behavior stays consistent across CoinGecko,
// Dexscreener, and any future provider.
const DEFAULT_TIMEOUT_MS = 8000;
const MAX_RETRIES = 1;

export const httpClient = axios.create({ timeout: DEFAULT_TIMEOUT_MS });

function isRetryable(err) {
  if (!err.response) return true; // network error / timeout
  return err.response.status >= 500 || err.response.status === 429;
}

// Wraps a single outbound call with one retry on a transient failure
// (network error, timeout, 5xx, or 429). Never retries on a 4xx client
// error other than 429 — that would just repeat a request that can't succeed.
export async function requestWithRetry(config) {
  let lastErr;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await httpClient.request(config);
    } catch (err) {
      lastErr = err;
      if (attempt === MAX_RETRIES || !isRetryable(err)) throw err;
    }
  }
  throw lastErr;
}
