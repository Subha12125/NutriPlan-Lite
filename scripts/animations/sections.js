// scripts/animations/sections.js

export function initSections(mm) {
  mm.add({
    reduceMotion: '(prefers-reduced-motion: reduce)',
    noPreference: '(prefers-reduced-motion: no-preference)'
  }, (context) => {
    const { reduceMotion } = context.conditions;

    // Feature Section Title
    gsap.from('.section-header > *', {
      scrollTrigger: {
        trigger: '.landing-features',
        start: 'top 85%',
        toggleActions: 'play none none none'
      },
      y: reduceMotion ? 0 : 20,
      opacity: 0,
      duration: 0.8,
      stagger: 0.1,
      ease: 'power2.out',
      clearProps: 'all'
    });

    // Feature Cards Progressive Stagger
    gsap.from('.feature-card', {
      scrollTrigger: {
        trigger: '.features-grid',
        start: 'top 85%',
        toggleActions: 'play none none none'
      },
      y: reduceMotion ? 0 : 40,
      opacity: 0,
      duration: 0.8,
      stagger: 0.1,
      ease: 'power2.out',
      clearProps: 'all'
    });

    // CTA Panel Reveal
    gsap.from('.cta-panel', {
      scrollTrigger: {
        trigger: '.landing-cta',
        start: 'top 80%',
        toggleActions: 'play none none none'
      },
      y: reduceMotion ? 0 : 30,
      opacity: 0,
      duration: 0.8,
      ease: 'power3.out',
      clearProps: 'all'
    });

    // Staggered Badges inside CTA
    gsap.from('.cta-badge-item', {
      scrollTrigger: {
        trigger: '.cta-right',
        start: 'top 85%',
        toggleActions: 'play none none none'
      },
      x: reduceMotion ? 0 : 20,
      opacity: 0,
      duration: 0.6,
      stagger: 0.1,
      ease: 'power2.out',
      clearProps: 'all'
    });
    
    // Parallax background blobs inside CTA
    if (!reduceMotion) {
      gsap.to('.cta-panel::before', {
        scrollTrigger: {
          trigger: '.cta-panel',
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1
        },
        y: 100,
        ease: 'none'
      });
    }
  });
}
