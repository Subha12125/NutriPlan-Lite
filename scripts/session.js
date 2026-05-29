// ================================================================
// session.js — JWT Session Manager
// NutriPlan-Lite
//
// Responsibilities:
//   - Store / restore JWT from localStorage
//   - Track user profile in localStorage
//   - Guest (demo) mode detection
//   - Logout: clear all auth keys
//   - Token refresh stub (ready for future implementation)
// ================================================================

window.Session = (() => {
  // ── Storage keys ───────────────────────────────────────────────
  const TOKEN_KEY   = 'nutriplan_token';
  const EMAIL_KEY   = 'nutriplan_user_email';
  const PROFILE_KEY = 'nutriplan_user_profile';

  // ── Token management ────────────────────────────────────────────

  /** Returns the stored JWT or null. */
  function getToken() {
    return localStorage.getItem(TOKEN_KEY) || null;
  }

  /** Persists a new JWT to localStorage. */
  function setToken(token) {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  }

  // ── Authentication state ────────────────────────────────────────

  /**
   * True when a valid, non-expired JWT is present in storage.
   *
   * The check decodes the token payload (without verifying the signature,
   * which is a server-side concern) and compares the exp claim against the
   * current time. If the token is expired the stored credentials are cleared
   * immediately so the app does not keep presenting protected UI and
   * generating 401 errors until the user manually signs out.
   */
  function isAuthenticated() {
    const token = getToken();
    if (!token) return false;

    try {
      // JWT payload is the second dot-delimited segment, base64url-encoded.
      const payloadBase64 = token.split('.')[1];
      if (!payloadBase64) return false;

      // base64url uses - and _ instead of + and /; atob requires standard base64.
      const jsonStr = atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/'));
      const payload = JSON.parse(jsonStr);

      if (payload.exp && Math.floor(Date.now() / 1000) >= payload.exp) {
        // Token is expired: wipe stored credentials so the UI resets to
        // guest/demo mode rather than silently generating 401 errors.
        clear();
        return false;
      }

      return true;
    } catch {
      // Malformed token: treat as unauthenticated and clean up.
      clear();
      return false;
    }
  }

  /** Returns the decoded email from storage (not from JWT payload). */
  function getEmail() {
    return localStorage.getItem(EMAIL_KEY) || null;
  }

  // ── User profile cache ──────────────────────────────────────────

  /**
   * Cache a server-side profile snapshot locally.
   * @param {object} profile  Raw backend profile shape
   */
  function setProfile(profile) {
    if (profile) {
      try {
        localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
      } catch {
        // Quota exceeded — non-fatal
      }
    }
  }

  /**
   * Retrieve the cached server profile snapshot.
   * Returns null in guest/demo mode.
   */
  function getCachedProfile() {
    try {
      const raw = localStorage.getItem(PROFILE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  // ── Session persistence ─────────────────────────────────────────

  /**
   * Persist credentials after a successful login or register.
   * @param {string} token
   * @param {string} email
   */
  function save(token, email) {
    setToken(token);
    if (email) localStorage.setItem(EMAIL_KEY, email);
  }

  /**
   * Restore session from storage at app boot.
   * Returns the current session object (token may be null for guest mode).
   */
  function restore() {
    return {
      token: getToken(),
      email: getEmail(),
      isAuthenticated: isAuthenticated()
    };
  }

  // ── Logout / Guest mode ─────────────────────────────────────────

  /**
   * Clear all session state and return to demo mode.
   * Does NOT wipe the nutriplan_v2 database key — handled by Auth.logout().
   */
  function clear() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(EMAIL_KEY);
    localStorage.removeItem(PROFILE_KEY);
  }

  /**
   * True when the user has no JWT — running in local demo mode.
   */
  function isGuestMode() {
    return !isAuthenticated();
  }

  // ── Token refresh (stub — extend for refresh-token flow) ────────

  /**
   * Attempt to refresh the JWT using a refresh token endpoint.
   * Currently a no-op stub; wire up when backend supports it.
   * @returns {Promise<boolean>}  true if refreshed, false otherwise
   */
  async function tryRefresh() {
    // TODO: implement when backend exposes POST /auth/refresh
    return false;
  }

  // ── Public API ──────────────────────────────────────────────────
  return {
    getToken,
    setToken,
    isAuthenticated,
    getEmail,
    setProfile,
    getCachedProfile,
    save,
    restore,
    clear,
    isGuestMode,
    tryRefresh
  };
})();
