const rateLimit = require('express-rate-limit');

/**
 * Custom MemoryStore with automatic TTL-based cleanup.
 *
 * express-rate-limit v7 defines a modern async store contract:
 *   - increment(key)  → async, returns { totalHits, resetTime }
 *   - decrement(key)  → async
 *   - resetKey(key)   → async
 *   - resetAll()      → async (optional)
 *
 * The old callback-based increment(key, cb) signature is the *legacy* interface
 * (detected by the presence of `incr`, not `increment`). Defining `increment`
 * with a second `cb` parameter caused v7 to call it as a modern store, pass no
 * callback, and then crash with "cb is not a function" when cb() was invoked.
 *
 * This implementation uses the v7 async-return contract and additionally prunes
 * expired TTL entries on every increment to prevent unbounded Map growth.
 */
class CleaningMemoryStore {
  constructor(windowMs, pruneInterval) {
    this.windowMs = windowMs;
    // How often (ms) to run a prune sweep; defaults to windowMs
    this.pruneInterval = pruneInterval !== undefined ? pruneInterval : windowMs;
    // Timestamp of the last prune sweep (0 = never pruned)
    this._lastPrune = 0;
    // Map<ip, { hits: number, resetTime: number }>
    this._store = new Map();
  }

  /** Remove all entries whose window has already expired. */
  _prune() {
    const now = Date.now();
    for (const [key, record] of this._store.entries()) {
      if (now >= record.resetTime) {
        this._store.delete(key);
      }
    }
  }

  /**
   * Called by express-rate-limit v7 on every incoming request.
   * Must be async and return { totalHits: number, resetTime: Date }.
   *
   * @param {string} key - IP or custom key
   * @returns {Promise<{ totalHits: number, resetTime: Date }>}
   */
  async increment(key) {
    // Throttled prune: only sweep when enough time has elapsed
    const now = Date.now();
    if (now - this._lastPrune >= this.pruneInterval) {
      this._prune();
      this._lastPrune = now;
    }

    const existing = this._store.get(key);

    if (!existing || now >= existing.resetTime) {
      // First request in this window, or previous window has expired
      const record = { hits: 1, resetTime: now + this.windowMs };
      this._store.set(key, record);
      return { totalHits: 1, resetTime: new Date(record.resetTime) };
    }

    existing.hits += 1;
    return { totalHits: existing.hits, resetTime: new Date(existing.resetTime) };
  }

  /**
   * Decrement the hit count for a key.
   * Used by express-rate-limit when skipFailedRequests or skipSuccessfulRequests is set.
   *
   * @param {string} key
   * @returns {Promise<void>}
   */
  async decrement(key) {
    const record = this._store.get(key);
    if (record && record.hits > 0) {
      record.hits -= 1;
    }
  }

  /**
   * Reset the hit count for a specific key.
   *
   * @param {string} key
   * @returns {Promise<void>}
   */
  async resetKey(key) {
    this._store.delete(key);
  }

  /**
   * Reset the entire store.
   * Called by express-rate-limit when the window rolls over.
   *
   * @returns {Promise<void>}
   */
  async resetAll() {
    this._store.clear();
  }
}

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Rate limiter middleware for authentication routes (register and login).
 * Limits requests from a single IP to 100 attempts per 15-minute window.
 * Uses CleaningMemoryStore to prevent unbounded memory growth via TTL pruning.
 */
const authLimiter = rateLimit({
  windowMs: WINDOW_MS,
  max: 100, // limit each IP to 100 requests per windowMs
  store: new CleaningMemoryStore(WINDOW_MS),
  message: {
    status: 'fail',
    message: 'Too many requests from this IP, please try again after 15 minutes.'
  },
  standardHeaders: true,  // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false,   // Disable the `X-RateLimit-*` headers
});

module.exports = {
  authLimiter
};
