// scripts/animations/utils.js

export function initMatchMedia() {
  if (typeof gsap === 'undefined') return null;
  // Use GSAP's matchMedia for responsive & accessibility breakpoints
  return gsap.matchMedia();
}

export function cleanupScrollTriggers() {
  if (typeof ScrollTrigger !== 'undefined') {
    ScrollTrigger.getAll().forEach(t => t.kill());
  }
}

export function makeMagnetic(elements) {
  if (!elements || elements.length === 0) return;
  
  elements.forEach(el => {
    el.addEventListener('mousemove', (e) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      
      gsap.to(el, {
        x: x * 0.4,
        y: y * 0.4,
        duration: 0.4,
        ease: 'power2.out'
      });
    });

    el.addEventListener('mouseleave', () => {
      gsap.to(el, {
        x: 0,
        y: 0,
        duration: 0.7,
        ease: 'elastic.out(1, 0.3)'
      });
    });
  });
}
