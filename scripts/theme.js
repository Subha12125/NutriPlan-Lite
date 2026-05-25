window.ThemeService = (() => {
  function injectTransitionCSS() {
    const style = document.createElement('style');
    style.textContent = `
      *, *::before, *::after {
        transition: background-color 200ms ease, border-color 200ms ease, color 200ms ease, fill 200ms ease, stroke 200ms ease, box-shadow 200ms ease !important;
      }
      .progress-fill {
        transition: width 550ms cubic-bezier(0.22, 1, 0.36, 1), background-color 200ms ease !important;
      }
      .chart-bar {
        transition: height 500ms cubic-bezier(0.22, 1, 0.36, 1), background-color 200ms ease !important;
      }
    `;
    document.head.appendChild(style);
  }

  function getTheme() {
    return localStorage.getItem('theme');
  }

  function applyTheme(theme) {
    if (theme === 'light') {
      document.documentElement.classList.add('light-mode');
    } else {
      document.documentElement.classList.remove('light-mode');
    }
    // Update all theme toggles if they exist in the DOM
    document.querySelectorAll('.theme-btn, #theme-toggle, #theme-toggle-landing').forEach(btn => {
      btn.textContent = theme === 'light' ? '🌙' : '☀️';
    });
  }

  function setTheme(theme) {
    localStorage.setItem('theme', theme);
    applyTheme(theme);
  }

  function restoreTheme() {
    const saved = getTheme();
    if (saved) {
      applyTheme(saved);
    } else {
      const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
      applyTheme(prefersLight ? 'light' : 'dark');
    }
  }

  function toggleTheme() {
    const saved = getTheme();
    let currentTheme;
    if (saved) {
      currentTheme = saved;
    } else {
      currentTheme = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    }
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  }

  function initializeTheme() {
    // Inject global transition AFTER initial load to prevent FOUC on first paint
    setTimeout(injectTransitionCSS, 50);
    restoreTheme();
  }

  // Apply immediately during page load to prevent flash of wrong theme
  restoreTheme();
  // Call init to attach transitions
  window.addEventListener('DOMContentLoaded', initializeTheme);

  return { initializeTheme, toggleTheme, saveTheme: setTheme, restoreTheme, getTheme, setTheme };
})();
