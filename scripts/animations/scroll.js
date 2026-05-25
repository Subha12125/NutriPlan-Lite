window.ScrollAnimations = (() => {
  function init() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

    window.AnimationManager.registerContext('scroll', () => {
      
      // Features Grid Stagger
      if (document.querySelector('.landing-features')) {
        gsap.from('.feature-card', {
          scrollTrigger: {
            trigger: '.landing-features',
            start: 'top 80%',
            toggleActions: 'play none none reverse'
          },
          y: 50,
          opacity: 0,
          duration: 0.8,
          stagger: 0.15,
          ease: 'power2.out',
          clearProps: 'all'
        });
      }

      // Bottom CTA Panel
      if (document.querySelector('.landing-cta')) {
        gsap.from('.cta-panel', {
          scrollTrigger: {
            trigger: '.landing-cta',
            start: 'top 85%',
            toggleActions: 'play none none reverse'
          },
          y: 40,
          opacity: 0,
          scale: 0.98,
          duration: 0.8,
          ease: 'power3.out',
          clearProps: 'all'
        });
      }

      // Footer Elements
      if (document.querySelector('.landing-footer')) {
        gsap.from('.landing-footer', {
          scrollTrigger: {
            trigger: '.landing-footer',
            start: 'top 95%',
            toggleActions: 'play none none reverse'
          },
          y: 20,
          opacity: 0,
          duration: 0.8,
          ease: 'power2.out',
          clearProps: 'all'
        });
      }
      
      // Navbar blur/hide on scroll
      const nav = document.querySelector('.landing-header');
      if (nav) {
        ScrollTrigger.create({
          start: 'top -80',
          onUpdate: (self) => {
            if (self.direction === 1) {
              // Scrolling down
              gsap.to(nav, { y: '-150%', duration: 0.3, ease: 'power2.inOut' });
            } else {
              // Scrolling up
              gsap.to(nav, { y: '0%', duration: 0.3, ease: 'power2.inOut' });
              nav.classList.add('scrolled');
            }
          },
          onLeaveBack: () => {
            nav.classList.remove('scrolled');
          }
        });
      }
    });
  }

  return { init };
})();
