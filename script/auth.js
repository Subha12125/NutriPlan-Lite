// ═══════════════════════════════════════════════════
//  auth.js  —  NutriPlan Lite  (localStorage auth)
//  Works across: index.html, signup.html, login.html,
//                perfect-plan.html, ai-plan.html
// ═══════════════════════════════════════════════════

const AUTH_KEY  = 'np_user';      // stored user object
const REDIR_KEY = 'np_after_login'; // post-login redirect

/* ── helpers ─────────────────────────────────────── */
function getUser() {
    try { return JSON.parse(localStorage.getItem(AUTH_KEY)); } catch { return null; }
}
function isLoggedIn() { return !!getUser(); }

function saveUser(user) {
    localStorage.setItem(AUTH_KEY, JSON.stringify(user));
}

function logout() {
    localStorage.removeItem(AUTH_KEY);
    window.location.href = 'index.html';
}

/* ── navbar renderer ─────────────────────────────── */
function renderNav() {
    const desktopNav = document.getElementById('desktop-nav');
    const mobileNav  = document.getElementById('mobile-nav');
    if (!desktopNav && !mobileNav) return;

    const user = getUser();

    if (user) {
        /* ── logged-in state ── */
        if (desktopNav) desktopNav.innerHTML = `
            <a href="index.html" class="nav-tab px-4 py-2 rounded-xl font-semibold text-white/60 hover:text-white hover:bg-white/5 transition-all">Home</a>
            <a href="#contact"   class="nav-tab px-4 py-2 rounded-xl font-semibold text-white/60 hover:text-white hover:bg-white/5 transition-all">Contact</a>
            <span class="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-black" style="background:rgba(0,255,102,0.10);border:1px solid rgba(0,255,102,0.2);color:#00ff66;">
                <i class="fas fa-user-check text-[10px]"></i>${escHtml(user.name)}
            </span>
            <button onclick="logout()"
                class="nav-tab ml-1 px-4 py-2 rounded-xl font-semibold text-white/50 hover:text-[#ff375f] hover:bg-[#ff375f]/10 transition-all border border-transparent hover:border-[#ff375f]/20">
                <i class="fas fa-right-from-bracket text-xs mr-1"></i>Logout
            </button>`;

        if (mobileNav) mobileNav.innerHTML = `
            <a href="index.html" class="w-9 h-9 flex items-center justify-center rounded-xl text-white/60 hover:text-[#00ff66] hover:bg-[#00ff66]/10 transition-all" title="Home"><i class="fas fa-home text-sm"></i></a>
            <button onclick="logout()" class="w-9 h-9 flex items-center justify-center rounded-xl text-white/60 hover:text-[#ff375f] hover:bg-[#ff375f]/10 transition-all" title="Logout"><i class="fas fa-right-from-bracket text-sm"></i></button>`;
    } else {
        /* ── logged-out state ── */
        if (desktopNav) desktopNav.innerHTML = `
            <a href="index.html" class="nav-tab px-4 py-2 rounded-xl font-semibold text-white/60 hover:text-white hover:bg-white/5 transition-all">Home</a>
            <a href="#contact"   class="nav-tab px-4 py-2 rounded-xl font-semibold text-white/60 hover:text-white hover:bg-white/5 transition-all">Contact</a>
            <a href="signup.html" class="nav-tab px-4 py-2 rounded-xl font-semibold text-white/60 hover:text-white hover:bg-white/5 transition-all">Sign Up</a>
            <a href="login.html"  class="nav-tab px-3 py-2 rounded-xl font-black text-sm transition-all"
               style="background:rgba(0,255,102,0.12);color:#00ff66;border:1px solid rgba(0,255,102,0.25);">
               <i class="fas fa-right-to-bracket text-xs mr-1"></i>Login
            </a>`;

        if (mobileNav) mobileNav.innerHTML = `
            <a href="index.html" class="w-9 h-9 flex items-center justify-center rounded-xl text-white/60 hover:text-[#00ff66] hover:bg-[#00ff66]/10 transition-all" title="Home"><i class="fas fa-home text-sm"></i></a>
            <a href="login.html" class="w-9 h-9 flex items-center justify-center rounded-xl text-white/60 hover:text-[#00ff66] hover:bg-[#00ff66]/10 transition-all" title="Login"><i class="fas fa-user text-sm"></i></a>
            <a href="#contact"   class="w-9 h-9 flex items-center justify-center rounded-xl text-white/60 hover:text-[#00ff66] hover:bg-[#00ff66]/10 transition-all" title="Contact"><i class="fas fa-envelope text-sm"></i></a>`;
    }
}

/* ── sign-up ──────────────────────────────────────── */
async function signUp(name, email, password) {
    try {
        const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });
        const data = await res.json();
        if (data.ok) {
            saveUser({ name: data.user.name, email: data.user.email, token: data.token });
        }
        return data;
    } catch (e) {
        return { ok: false, msg: 'Network error. Please try again later.' };
    }
}

/* ── login ────────────────────────────────────────── */
async function login(email, password) {
    try {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (data.ok) {
            saveUser({ name: data.user.name, email: data.user.email, token: data.token });
        }
        return data;
    } catch (e) {
        return { ok: false, msg: 'Network error. Please try again later.' };
    }
}

/* ── utility ──────────────────────────────────────── */
function escHtml(str) {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* ── auto-render nav on every page ───────────────── */
document.addEventListener('DOMContentLoaded', renderNav);
