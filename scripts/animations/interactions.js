window.Interactions = (() => {
  function init() {
    if (typeof gsap === 'undefined') return;

    window.AnimationManager.registerContext('interactions', () => {
      // Metric count-up animation
      const metrics = document.querySelectorAll('.metric-main span, .health-score span, #water-percent, #water-consumed-large');
      
      metrics.forEach(metric => {
        // Skip elements that don't just contain numbers initially
        const text = metric.textContent.replace(/[^\d]/g, '');
        if (!text) return;
        
        const targetVal = parseInt(text, 10);
        if (isNaN(targetVal) || targetVal === 0) return;
        
        let obj = { val: 0 };
        gsap.to(obj, {
          val: targetVal,
          duration: 1.5,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: metric,
            start: 'top 90%',
            once: true
          },
          onUpdate: () => {
            if (metric.textContent.includes('%')) {
              metric.textContent = Math.round(obj.val) + '%';
            } else {
              metric.textContent = Math.round(obj.val);
            }
          }
        });
      });

      // Card tilt effect on hover
      const cards = document.querySelectorAll('.glass-panel');
      cards.forEach(card => {
        if (!card.dataset.tiltInit) {
          card.dataset.tiltInit = 'true';
          card.addEventListener('mouseenter', () => {
            gsap.to(card, { y: -4, duration: 0.3, ease: 'power2.out' });
          });
          card.addEventListener('mouseleave', () => {
            gsap.to(card, { y: 0, duration: 0.5, ease: 'power2.out' });
          });
        }
      });
      
      // Magnetic buttons
      const magnets = document.querySelectorAll('.primary-button, .secondary-button, .icon-button');
      magnets.forEach(btn => {
        if (!btn.dataset.magneticInit) {
          btn.dataset.magneticInit = 'true';
          btn.addEventListener('mousemove', (e) => {
            const rect = btn.getBoundingClientRect();
            const x = (e.clientX - rect.left) - rect.width / 2;
            const y = (e.clientY - rect.top) - rect.height / 2;
            
            gsap.to(btn, {
              x: x * 0.2,
              y: y * 0.2,
              duration: 0.4,
              ease: 'power2.out'
            });
          });
          
          btn.addEventListener('mouseleave', () => {
            gsap.to(btn, {
              x: 0,
              y: 0,
              duration: 0.6,
              ease: 'elastic.out(1, 0.3)'
            });
          });
        }
      });
    });
  }

  return { init };
})();
