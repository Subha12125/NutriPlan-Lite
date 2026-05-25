// theme.js - Single source of truth for NutriPlan Lite Theme

class ThemeService {
  static STORAGE_KEY = 'nutriplan-theme';

  static init() {
    // Initial sync
    const currentTheme = this.getTheme();
    this.applyTheme(currentTheme);

    // Watch for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
      // Only auto-switch if the user hasn't explicitly set a preference
      if (!localStorage.getItem(this.STORAGE_KEY)) {
        this.applyTheme(e.matches ? 'dark' : 'light');
      }
    });
  }

  static getTheme() {
    const savedTheme = localStorage.getItem(this.STORAGE_KEY);
    if (savedTheme === 'light' || savedTheme === 'dark') {
      return savedTheme;
    }
    // Fallback to system preference
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return systemDark ? 'dark' : 'light';
  }

  static setTheme(theme) {
    if (theme !== 'light' && theme !== 'dark') return;
    localStorage.setItem(this.STORAGE_KEY, theme);
    this.applyTheme(theme);
  }

  static toggleTheme() {
    const currentTheme = this.getTheme();
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    this.setTheme(newTheme);
    return newTheme;
  }

  static applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    // Dispatch custom event so dynamic components (like charts) can update
    document.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme } }));
  }
}

// Initialize immediately
ThemeService.init();

// Export globally
window.ThemeService = ThemeService;
