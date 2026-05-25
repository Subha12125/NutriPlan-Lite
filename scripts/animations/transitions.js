window.Transitions = (() => {
  function init() {
    if (typeof gsap === 'undefined') return;
    
    // Setup page loader fade out
    const loader = document.querySelector('.page-loader');
    if (loader && !loader.classList.contains('hidden')) {
      gsap.to(loader, {
        opacity: 0,
        duration: 0.4,
        ease: 'power2.inOut',
        onComplete: () => loader.classList.add('hidden')
      });
    }

    window.AnimationManager.registerContext('transitions', () => {
      // Fade in main app content
      const content = document.getElementById('app-content');
      if (content) {
        gsap.from(content, {
          opacity: 0,
          y: 10,
          duration: 0.5,
          ease: 'power2.out',
          clearProps: 'all'
        });
      }
    });
  }

  return { init };
})();
