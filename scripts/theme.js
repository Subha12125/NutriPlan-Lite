// theme.js — Theme Management & Persistence
window.ThemeService = (() => {
  function injectTransitionCSS() {
    const style = document.createElement('style');
    style.textContent = `
      *, *::before, *::after {
        transition: background-color 240ms ease, border-color 240ms ease, color 240ms ease, fill 240ms ease, stroke 240ms ease, box-shadow 240ms ease !important;
      }
      .progress-fill {
        transition: width 550ms cubic-bezier(0.22, 1, 0.36, 1), background-color 240ms ease !important;
      }
      .chart-bar {
        transition: height 500ms cubic-bezier(0.22, 1, 0.36, 1), background-color 240ms ease !important;
      }
    `;
    document.head.appendChild(style);
  }

  function getTheme() {
    return localStorage.getItem('theme');
  }

  function updateThemeIcons() {
    const theme = getTheme() || (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
    document.querySelectorAll('.theme-btn, #theme-toggle, #theme-toggle-landing').forEach(btn => {
      btn.textContent = theme === 'light' ? '🌙' : '☀️';
    });
  }

  function applyTheme(theme) {
    if (theme === 'light') {
      document.documentElement.classList.add('light-mode');
    } else {
      document.documentElement.classList.remove('light-mode');
    }
    updateThemeIcons();
  }

  function setTheme(theme) {
    localStorage.setItem('theme', theme);
    if (window.Storage && window.Storage.saveSettings) {
      window.Storage.saveSettings({ theme });
    }
    applyTheme(theme);
  }

  function restoreTheme() {
    let saved = getTheme();
    if (!saved && window.Storage && window.Storage.getSettings) {
      const settings = window.Storage.getSettings();
      saved = settings ? settings.theme : null;
    }
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
    // Inject transition properties after DOM load to prevent transitions on page startup
    setTimeout(injectTransitionCSS, 80);
    restoreTheme();
    updateThemeIcons();

    // Listen for OS appearance changes (prefers-color-scheme)
    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', (e) => {
        // Only override if the user has NOT explicitly chosen a theme
        if (!getTheme()) {
          applyTheme(e.matches ? 'light' : 'dark');
        }
      });
    }
  }

  // Apply immediately during page load to prevent flash of wrong theme
  restoreTheme();

  // Call init to attach transitions and listen for changes
  window.addEventListener('DOMContentLoaded', initializeTheme);

  return { initializeTheme, toggleTheme, saveTheme: setTheme, restoreTheme, getTheme, setTheme, updateThemeIcons };
})();
