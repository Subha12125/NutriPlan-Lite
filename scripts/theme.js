window.ThemeManager = (() => {
  function getTheme() {
    return localStorage.getItem('theme');
  }

  function setTheme(theme) {
    localStorage.setItem('theme', theme);
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

  function initializeTheme() {
    let saved = getTheme();
    if (!saved) {
      // System preference only used on first visit
      const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
      saved = prefersLight ? 'light' : 'dark';
      // We explicitly don't save to localStorage yet until they toggle, 
      // but applying it right away is fine. Actually, safer to save it:
      localStorage.setItem('theme', saved);
    }
    setTheme(saved);
  }

  // Apply immediately during page load
  initializeTheme();

  return { getTheme, setTheme, initializeTheme };
})();
