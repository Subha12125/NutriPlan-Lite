// scripts/animations/footer.js

export function initFooter(mm) {
  mm.add({
    reduceMotion: '(prefers-reduced-motion: reduce)',
    noPreference: '(prefers-reduced-motion: no-preference)'
  }, (context) => {
    const { reduceMotion } = context.conditions;

    const footerTl = gsap.timeline({
      scrollTrigger: {
        trigger: '.landing-footer',
        start: 'top 95%',
        toggleActions: 'play none none none'
      }
    });

    // Reveal the main container
    footerTl.from('.landing-footer', {
      opacity: 0,
      duration: 0.6,
      ease: 'power2.out',
      clearProps: 'all'
    });

    // Staggered reveal of columns
    footerTl.from('.footer-col-brand > *, .footer-nav-col > *', {
      y: reduceMotion ? 0 : 15,
      opacity: 0,
      duration: 0.5,
      stagger: 0.05,
      ease: 'power2.out',
      clearProps: 'all'
    }, '-=0.3');
  });
}
