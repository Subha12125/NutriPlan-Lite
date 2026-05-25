window.AnimationManager = (() => {
  const contexts = new Map();
  let prefersReducedMotion = false;

  function init() {
    if (typeof gsap === 'undefined') return;
    prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    // Set default config
    gsap.config({
      nullTargetWarn: false,
    });
  }

  function registerContext(name, setupFunc) {
    if (prefersReducedMotion) return null; // Skip if user prefers reduced motion
    
    // Clear existing context with the same name to avoid duplicate animations
    if (contexts.has(name)) {
      contexts.get(name).revert();
    }
    
    const ctx = gsap.context(() => {
      setupFunc();
    });
    
    contexts.set(name, ctx);
    return ctx;
  }

  function clearAll() {
    contexts.forEach(ctx => ctx.revert());
    contexts.clear();
  }

  return { init, registerContext, clearAll };
})();
