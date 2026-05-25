// scripts/animations/hero.js

import { makeMagnetic } from './utils.js';

export function initHero(mm) {
  mm.add({
    reduceMotion: '(prefers-reduced-motion: reduce)',
    noPreference: '(prefers-reduced-motion: no-preference)'
  }, (context) => {
    const { reduceMotion } = context.conditions;
    
    const heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    // Staged typography reveal
    if (!reduceMotion) {
      heroTl.from('.reveal-text', {
        yPercent: 100,
        opacity: 0,
        duration: 1,
        stagger: 0.15,
        clearProps: 'all'
      });
    } else {
      heroTl.from('.reveal-text', {
        opacity: 0,
        duration: 1,
        stagger: 0.1,
        clearProps: 'all'
      });
    }

    // Buttons
    heroTl.from('.hero-cta > *', {
      y: reduceMotion ? 0 : 20,
      opacity: 0,
      duration: 0.6,
      stagger: 0.1,
      clearProps: 'all'
    }, '-=0.6');
    
    // Magnetic buttons
    if (!reduceMotion) {
      makeMagnetic(document.querySelectorAll('.hero-cta > *'));
    }

    // Visual Mock Cards
    heroTl.from('.mock-card', {
      y: reduceMotion ? 0 : 40,
      opacity: 0,
      duration: 1.2,
      stagger: 0.2,
      ease: 'back.out(1.2)',
      clearProps: 'all'
    }, '-=0.6');

    // Continuous floating motion
    if (!reduceMotion) {
      gsap.to('.mock-card', {
        y: -8,
        duration: 2.5,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
        stagger: {
          each: 0.4,
          from: 'start'
        }
      });
    }

    // Scroll Indicator
    heroTl.to('.scroll-indicator', {
      opacity: 1,
      duration: 0.5
    }, '-=0.4');

    // Number counter animation (92/100)
    const counterSpan = document.querySelector('.animated-counter');
    if (counterSpan) {
      gsap.to(counterSpan, {
        innerText: 92,
        duration: 1.5,
        snap: { innerText: 1 },
        ease: 'power2.out',
        delay: 0.8 // Wait for cards to slide in
      });
    }
  });
}
