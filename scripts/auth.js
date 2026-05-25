// ================================================================
// auth.js — Authentication module for NutriPlan-Lite
//
// Delegates to:
//   - ApiService  (all HTTP calls)
//   - Session     (JWT / credential persistence)
//
// Provides:
//   - Auth drawer UI (login / register tabs)
//   - Auth widget rendering in header containers
//   - init() called on DOMContentLoaded
// ================================================================

window.Auth = (() => {
  let activeTab = 'login';

  // ── Public helpers (re-exported from Session) ──────────────────

  function getToken()         { return window.Session ? window.Session.getToken()         : null; }
  function isAuthenticated()  { return window.Session ? window.Session.isAuthenticated()  : false; }
  function getCurrentUser()   { return { email: window.Session ? window.Session.getEmail() : null }; }

  // ── Modal control ───────────────────────────────────────────────

  function openModal() {
    const modal = document.getElementById('auth-modal');
    if (modal) modal.classList.remove('hidden');
    switchTab('login');
  }

  function closeModal() {
    const modal = document.getElementById('auth-modal');
    if (modal) modal.classList.add('hidden');
  }

  function switchTab(tab) {
    activeTab = tab;
    const loginBtn    = document.getElementById('auth-tab-login');
    const registerBtn = document.getElementById('auth-tab-register');
    const submitBtn   = document.getElementById('auth-submit-btn');

    if (!loginBtn || !registerBtn || !submitBtn) return;

    if (tab === 'login') {
      loginBtn.classList.add('active');    loginBtn.setAttribute('aria-selected', 'true');
      registerBtn.classList.remove('active'); registerBtn.setAttribute('aria-selected', 'false');
      submitBtn.textContent = 'Sign In';
    } else {
      registerBtn.classList.add('active');    registerBtn.setAttribute('aria-selected', 'true');
      loginBtn.classList.remove('active'); loginBtn.setAttribute('aria-selected', 'false');
      submitBtn.textContent = 'Register';
    }
  }

  // ── Auth actions ────────────────────────────────────────────────

  async function login(email, password) {
    _setSubmitLoading(true, 'Signing In…');
    try {
      const data = await ApiService.auth.login(email, password);
      const token = data.token;
      if (!token) throw { message: 'No token returned from server.' };

      // Persist credentials via Session
      window.Session.save(token, email);

      Toast.show('Successfully signed in!', 'success');
      closeModal();
      renderAuthWidgets();

      // Full sync from server then refresh UI
      await Storage.sync();
      if (window.App) window.App.refresh();

    } catch (err) {
      console.error('[Auth] login failed:', err);
      Toast.show(`Sign In Failed: ${err.message || 'Unknown error'}`, 'error');
    } finally {
      _setSubmitLoading(false, activeTab === 'login' ? 'Sign In' : 'Register');
    }
  }

  async function register(email, password) {
    _setSubmitLoading(true, 'Registering…');
    try {
      const data = await ApiService.auth.register(email, password);
      const token = data.token;
      if (!token) throw { message: 'No token returned from server.' };

      window.Session.save(token, email);

      Toast.show('Successfully registered & signed in!', 'success');
      closeModal();
      renderAuthWidgets();

      await Storage.sync();
      if (window.App) window.App.refresh();

    } catch (err) {
      console.error('[Auth] register failed:', err);
      Toast.show(`Registration Failed: ${err.message || 'Unknown error'}`, 'error');
    } finally {
      _setSubmitLoading(false, 'Register');
    }
  }

  function logout() {
    window.Session.clear();

    // Reset local DB to go back to demo defaults
    localStorage.removeItem('nutriplan_v2');

    Toast.show('Signed out. Local Demo mode active.', 'info');
    renderAuthWidgets();

    if (window.App) window.App.refresh();
    window.location.reload();
  }

  // ── Loading state helper ────────────────────────────────────────

  function _setSubmitLoading(loading, label) {
    const btn = document.getElementById('auth-submit-btn');
    if (!btn) return;
    btn.disabled = loading;
    btn.textContent = label;
  }

  // ── Auth widget rendering ───────────────────────────────────────

  function renderAuthWidgets() {
    const containers = [
      document.getElementById('auth-status-container'),
      document.getElementById('landing-auth-status-container')
    ];

    const token = getToken();
    const email = getCurrentUser().email;

    containers.forEach(container => {
      if (!container) return;

      if (token && email) {
        container.innerHTML = '';

        const emailSpan = document.createElement('span');
        emailSpan.className = 'auth-user-email';
        emailSpan.textContent = email;
        emailSpan.setAttribute('title', email);

        const signOutBtn = document.createElement('button');
        signOutBtn.id = `auth-signout-btn-${container.id}`;
        signOutBtn.className = 'secondary-button';
        signOutBtn.style.cssText = 'min-height:36px;padding:0 0.8rem;font-weight:800;cursor:pointer;';
        signOutBtn.type = 'button';
        signOutBtn.textContent = 'Sign Out';
        signOutBtn.addEventListener('click', () => logout());

        container.appendChild(emailSpan);
        container.appendChild(signOutBtn);
      } else {
        container.innerHTML = '';

        const signInBtn = document.createElement('button');
        signInBtn.id = `auth-signin-trigger-${container.id}`;
        signInBtn.className = 'secondary-button';
        signInBtn.style.cssText = 'min-height:36px;padding:0 0.8rem;font-weight:800;cursor:pointer;';
        signInBtn.type = 'button';
        signInBtn.textContent = 'Sign In';
        signInBtn.addEventListener('click', () => openModal());

        container.appendChild(signInBtn);
      }
    });
  }

  // ── Init ────────────────────────────────────────────────────────

  function init() {
    const closeBackdrop = document.getElementById('close-auth-backdrop');
    const closeX        = document.getElementById('close-auth-x');
    const loginBtn      = document.getElementById('auth-tab-login');
    const registerBtn   = document.getElementById('auth-tab-register');
    const form          = document.getElementById('auth-form');

    if (closeBackdrop) closeBackdrop.addEventListener('click', closeModal);
    if (closeX)        closeX.addEventListener('click', closeModal);
    if (loginBtn)      loginBtn.addEventListener('click', () => switchTab('login'));
    if (registerBtn)   registerBtn.addEventListener('click', () => switchTab('register'));

    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email    = document.getElementById('auth-email')?.value.trim();
        const password = document.getElementById('auth-password')?.value.trim();
        if (activeTab === 'login') {
          await login(email, password);
        } else {
          await register(email, password);
        }
      });
    }

    renderAuthWidgets();
  }

  // ── Public API ──────────────────────────────────────────────────
  return {
    init,
    getToken,
    isAuthenticated,
    getCurrentUser,
    logout,
    openModal,
    closeModal,
    renderAuthWidgets
  };
})();

// Initialize Auth module when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.Auth.init();
});
