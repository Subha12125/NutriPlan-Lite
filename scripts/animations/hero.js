window.HeroAnimations = (() => {
  function init() {
    if (typeof gsap === 'undefined') return;

    window.AnimationManager.registerContext('hero', () => {
      const heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      // Navbar items drop down
      heroTl.from('.landing-header-container > *', {
        y: -20,
        opacity: 0,
        duration: 0.8,
        stagger: 0.1,
        clearProps: 'all'
      });

      // Hero text elements float up
      heroTl.from('.landing-title, .landing-subtitle', {
        y: 40,
        opacity: 0,
        duration: 1,
        stagger: 0.15,
        clearProps: 'all'
      }, '-=0.4');

      // Hero buttons pop in
      heroTl.from('.hero-cta > *', {
        y: 20,
        opacity: 0,
        duration: 0.6,
        stagger: 0.1,
        clearProps: 'all'
      }, '-=0.6');

      // Hero visual parallax glow / floating dashboard
      heroTl.from('.mock-card', {
        y: 60,
        opacity: 0,
        rotationX: -15,
        duration: 1.2,
        stagger: 0.2,
        ease: 'back.out(1.2)',
        clearProps: 'all',
        transformPerspective: 1000
      }, '-=0.6');
      
      // Floating infinite effect for mock cards
      gsap.to('.mock-card:first-child', {
        y: -10,
        duration: 4,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1
      });
      gsap.to('.mock-card.ai-mock', {
        y: 10,
        duration: 3.5,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
        delay: 0.5
      });
    });
  }

  return { init };
})();
