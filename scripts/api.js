// ================================================================
// api.js — Centralized API Service Layer
// NutriPlan-Lite
//
// All backend communication is routed through this module.
// It provides:
//  - A configured fetch wrapper with timeout + error normalization
//  - Namespaced method groups: ApiService.auth.*, .food.*, .water.*, .profile.*
//  - Automatic Bearer-token injection from Session (loaded later)
// ================================================================

window.ApiService = (() => {
  // ── Config ─────────────────────────────────────────────────────
  // Resolution order: runtime window override → build-time env var → localhost fallback
  const API_BASE =
    (typeof window !== 'undefined' && window.NUTRIPLAN_API_BASE) ||
    (typeof process !== 'undefined' && process.env && (process.env.NUTRIPLAN_API_BASE || process.env.REACT_APP_API_BASE)) ||
    'http://localhost:4000/api/v1';
  const DEFAULT_TIMEOUT_MS = 8000;

  // ── ApiError ────────────────────────────────────────────────────
  /**
   * Structured error class for API failures.
   * Extends Error so stack traces are preserved, while carrying
   * the HTTP status code and raw response payload.
   */
  class ApiError extends Error {
    constructor(message, { status = 0, data = {} } = {}) {
      super(message);
      this.name = 'ApiError';
      this.status = status;
      this.data = data;
    }
  }

  // ── Core fetch wrapper ─────────────────────────────────────────
  /**
   * Internal fetch with timeout, auth headers, and normalised errors.
   * Throws an { status, message, data } object on failure.
   */
  async function request(method, endpoint, body = null, extraHeaders = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

    try {
      // Token is retrieved lazily — Session module loads after this one
      const token = window.Session ? window.Session.getToken() : localStorage.getItem('nutriplan_token');

      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...extraHeaders
      };

      const fetchOptions = {
        method,
        headers,
        signal: controller.signal
      };

      if (body !== null) {
        fetchOptions.body = JSON.stringify(body);
      }

      const res = await fetch(`${API_BASE}${endpoint}`, fetchOptions);

      // Try to parse JSON regardless of status for error messages
      let payload;
      try { payload = await res.json(); } catch { payload = {}; }

      if (!res.ok) {
        throw new ApiError(
          payload.message || `HTTP ${res.status} — ${res.statusText}`,
          { status: res.status, data: payload }
        );
      }

      return payload;

    } catch (err) {
      // Re-throw ApiErrors as-is; wrap network/timeout errors
      if (err instanceof ApiError) throw err;
      // Structured plain-object (legacy path — kept for safety)
      if (err && err.status) throw new ApiError(err.message || 'API error', { status: err.status, data: err.data || {} });
      if (err && err.name === 'AbortError') {
        throw new ApiError('Request timed out. Backend may be offline.', { status: 0, data: {} });
      }
      throw new ApiError(err.message || 'Network error. Backend may be offline.', { status: 0, data: {} });
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // ── Convenience HTTP methods ────────────────────────────────────
  const get    = (ep, headers)    => request('GET',    ep, null,  headers);
  const post   = (ep, body, h)    => request('POST',   ep, body,  h);
  const put    = (ep, body, h)    => request('PUT',    ep, body,  h);
  const del    = (ep, body, h)    => request('DELETE', ep, body,  h);

  // ── Auth endpoints ──────────────────────────────────────────────
  const auth = {
    /**
     * POST /auth/login
     * @param {string} email
     * @param {string} password
     * @returns {Promise<{token: string, user: object}>}
     */
    login(email, password) {
      return post('/auth/login', { email, password });
    },

    /**
     * POST /auth/register
     * @param {string} email
     * @param {string} password
     * @returns {Promise<{token: string, user: object}>}
     */
    register(email, password) {
      return post('/auth/register', { email, password });
    },

    /**
     * GET /auth/profile  (requires token)
     * @returns {Promise<{status: string, data: {profile: object}}>}
     */
    profile() {
      return get('/auth/profile');
    }
  };

  // ── Profile endpoints ───────────────────────────────────────────
  const profile = {
    /**
     * GET /auth/profile  (alias for auth.profile)
     */
    get() {
      return get('/auth/profile');
    },

    /**
     * PUT /auth/profile
     * @param {object} updates  Backend-shaped profile fields
     */
    update(updates) {
      return put('/auth/profile', updates);
    }
  };

  // ── Food log endpoints ──────────────────────────────────────────
  const food = {
    /**
     * GET /food-logs
     * @param {string} [date]  Optional YYYY-MM-DD filter
     */
    get(date) {
      const qs = date ? `?date=${date}` : '';
      return get(`/food-logs${qs}`);
    },

    /**
     * POST /food-logs
     * @param {object} entry  Backend-shaped food log entry
     */
    create(entry) {
      return post('/food-logs', entry);
    },

    /**
     * PUT /food-logs/:id
     * @param {string} id
     * @param {object} entry  Backend-shaped food log entry
     */
    update(id, entry) {
      return put(`/food-logs/${id}`, entry);
    },

    /**
     * DELETE /food-logs/:id
     * @param {string} id
     */
    delete(id) {
      return del(`/food-logs/${id}`);
    }
  };

  // ── Water log endpoints ─────────────────────────────────────────
  const water = {
    /**
     * GET /water-logs
     * @param {string} [date]  Optional YYYY-MM-DD filter
     */
    get(date) {
      const qs = date ? `?date=${date}` : '';
      return get(`/water-logs${qs}`);
    },

    /**
     * POST /water-logs
     * @param {number} amount_ml
     * @param {string} log_date  YYYY-MM-DD
     */
    create(amount_ml, log_date) {
      return post('/water-logs', { amount_ml, log_date });
    },

    /**
     * DELETE /water-logs/reset?date=YYYY-MM-DD
     * Removes all water log entries for a given date.
     * @param {string} date  YYYY-MM-DD
     */
    reset(date) {
      return del(`/water-logs/reset?date=${date}`);
    }
  };

  // ── Health check ────────────────────────────────────────────────
  /**
   * Lightweight ping to check if the backend is reachable.
   * Resolves true / false without throwing.
   */
  async function ping() {
    try {
      await get('/health');
      return true;
    } catch {
      return false;
    }
  }

  // ── Public API ──────────────────────────────────────────────────
  return { auth, profile, food, water, ping, get, post, put, del };

})();
