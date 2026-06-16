// scripts/animations/navbar.js

import { makeMagnetic } from './utils.js';

export function initNavbar(mm) {
  // Reveal the navbar smoothly on load
  const header = document.querySelector('.landing-header-container');
  if (header) {
    gsap.from(header.children, {
      y: -20,
      opacity: 0,
      duration: 0.8,
      stagger: 0.1,
      ease: 'power3.out',
      clearProps: 'all'
    });
  }

  // Hide/Reveal on scroll
  const navContainer = document.querySelector('.landing-header');
  if (navContainer) {
    let lastScroll = window.scrollY;
    
    window.addEventListener('scroll', () => {
      const currentScroll = window.scrollY;
      if (currentScroll > lastScroll && currentScroll > 100) {
        // Scrolling down -> hide
        gsap.to(navContainer, { y: -100, opacity: 0, duration: 0.3, ease: 'power2.out' });
      } else {
        // Scrolling up -> show
        gsap.to(navContainer, { y: 0, opacity: 1, duration: 0.4, ease: 'power2.out' });
      }
      lastScroll = currentScroll;
    }, { passive: true });
  }

  // Magnetic CTA buttons
  const ctas = document.querySelectorAll('.landing-header-actions .cta-launch');
  // Only apply magnetic effect if not prefers-reduced-motion
  mm.add('(prefers-reduced-motion: no-preference)', () => {
    makeMagnetic(ctas);
  });
}
