/* ═══════════════════════════════════════════════════════════
   ROCKY GLEN: THE DRAGON'S FORGE
   script.js — Interactions, SVG map, Ember particles
   ═══════════════════════════════════════════════════════════ */

'use strict';

/* ── Nav scroll behavior ──────────────────────────────────── */
(function initNav() {
  const nav = document.getElementById('site-nav');
  const toggle = document.getElementById('nav-toggle');
  const links = document.getElementById('nav-links');

  // Scroll-triggered background
  const onScroll = () => {
    if (window.scrollY > 60) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Mobile menu toggle
  if (toggle && links) {
    toggle.addEventListener('click', () => {
      const isOpen = links.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(isOpen));
    });

    // Close on link click
    links.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        links.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }
})();


/* ── Ember Particle System ────────────────────────────────── */
(function initEmbers() {
  const canvas = document.getElementById('ember-canvas');
  if (!canvas) return;

  // Respect reduced motion
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const ctx = canvas.getContext('2d');
  let width, height;
  let animFrame;

  // Particle pool
  const particles = [];
  const MAX_PARTICLES = 60;

  function resize() {
    width = canvas.width = canvas.offsetWidth;
    height = canvas.height = canvas.offsetHeight;
  }

  window.addEventListener('resize', resize, { passive: true });
  resize();

  // Particle class
  class Ember {
    constructor() {
      this.reset();
    }

    reset() {
      // Spawn along the bottom third, random x
      this.x = Math.random() * width;
      this.y = height * (0.6 + Math.random() * 0.4);
      this.size = 1 + Math.random() * 3;
      this.speedX = (Math.random() - 0.5) * 0.8;
      this.speedY = -(0.4 + Math.random() * 1.2); // upward
      this.life = 0;
      this.maxLife = 150 + Math.random() * 180;
      this.wobble = Math.random() * Math.PI * 2;
      this.wobbleSpeed = 0.02 + Math.random() * 0.03;

      // Color: ember orange to gold
      const t = Math.random();
      if (t < 0.5) {
        this.hue = 20 + Math.random() * 10;   // orange
        this.sat = 90 + Math.random() * 10;
        this.lit = 50 + Math.random() * 20;
      } else if (t < 0.8) {
        this.hue = 35 + Math.random() * 15;   // amber/gold
        this.sat = 80 + Math.random() * 15;
        this.lit = 55 + Math.random() * 20;
      } else {
        this.hue = 0 + Math.random() * 10;    // deep red
        this.sat = 80 + Math.random() * 10;
        this.lit = 40 + Math.random() * 15;
      }
    }

    update() {
      this.life++;
      this.wobble += this.wobbleSpeed;
      this.x += this.speedX + Math.sin(this.wobble) * 0.4;
      this.y += this.speedY;

      // Slow down near end of life
      const lifeRatio = this.life / this.maxLife;
      this.speedY *= 0.999;

      // Shrink as they die
      this.currentSize = this.size * (1 - lifeRatio * 0.5);

      if (this.life >= this.maxLife || this.y < -20) {
        this.reset();
      }
    }

    draw() {
      const lifeRatio = this.life / this.maxLife;
      let opacity;

      // Fade in, stay bright, fade out
      if (lifeRatio < 0.1) {
        opacity = lifeRatio / 0.1;
      } else if (lifeRatio > 0.7) {
        opacity = (1 - lifeRatio) / 0.3;
      } else {
        opacity = 1;
      }

      opacity *= 0.85; // max opacity

      ctx.save();
      ctx.globalAlpha = opacity;

      // Glow effect
      const glowSize = this.currentSize * 4;
      const gradient = ctx.createRadialGradient(
        this.x, this.y, 0,
        this.x, this.y, glowSize
      );
      gradient.addColorStop(0, `hsla(${this.hue}, ${this.sat}%, ${this.lit}%, 1)`);
      gradient.addColorStop(0.4, `hsla(${this.hue}, ${this.sat}%, ${this.lit}%, 0.4)`);
      gradient.addColorStop(1, `hsla(${this.hue}, ${this.sat}%, ${this.lit}%, 0)`);

      ctx.beginPath();
      ctx.arc(this.x, this.y, glowSize, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      // Core dot
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.currentSize, 0, Math.PI * 2);
      ctx.fillStyle = `hsl(${this.hue}, ${this.sat}%, ${this.lit + 20}%)`;
      ctx.fill();

      ctx.restore();
    }
  }

  // Initialize pool
  for (let i = 0; i < MAX_PARTICLES; i++) {
    const p = new Ember();
    // Stagger initial positions
    p.life = Math.random() * p.maxLife;
    p.y = height * (0.2 + Math.random() * 0.8);
    particles.push(p);
  }

  // Animation loop
  function animate() {
    ctx.clearRect(0, 0, width, height);

    for (const p of particles) {
      p.update();
      p.draw();
    }

    // Occasionally spawn a brighter burst
    if (Math.random() < 0.02) {
      const burst = particles[Math.floor(Math.random() * particles.length)];
      burst.size = 3 + Math.random() * 3;
      burst.speedY = -(1.5 + Math.random() * 1);
      burst.life = 0;
      burst.y = height * (0.75 + Math.random() * 0.25);
      burst.x = width * (0.2 + Math.random() * 0.6);
    }

    animFrame = requestAnimationFrame(animate);
  }

  animate();

  // Pause when tab hidden
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cancelAnimationFrame(animFrame);
    } else {
      animate();
    }
  });

  // Pause when hero is out of view
  const hero = document.getElementById('hero');
  if (hero && 'IntersectionObserver' in window) {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) {
          cancelAnimationFrame(animFrame);
        } else {
          animate();
        }
      });
    }, { threshold: 0.01 });
    obs.observe(hero);
  }
})();


/* ── SVG Map Interactions ─────────────────────────────────── */
(function initMap() {
  const svg = document.getElementById('site-map');
  if (!svg) return;

  const tooltip = document.getElementById('map-tooltip');

  const zoneData = {
    gateway: {
      title: 'The Gateway',
      subtitle: 'Miner\'s Welcome Station',
      detail: 'Zone I · Mile 0.0 · Heritage entrance gate'
    },
    spine: {
      title: 'The Dragon\'s Spine',
      subtitle: 'The 140ft Ascent',
      detail: 'Zone II · 140ft vertical climb · Rope & stairs'
    },
    falls: {
      title: 'Dragon\'s Tears Falls',
      subtitle: 'Waterfall & The Forge',
      detail: 'Zone III · "Miniature Starved Rock" · Blacksmith shop'
    },
    lair: {
      title: 'The Dragon\'s Lair',
      subtitle: 'Coal Mine & Museum',
      detail: 'Zone IV · Mile 0.6 · Gated mine shaft · Dragon\'s maw'
    },
    nest: {
      title: 'The Dragon\'s Nest',
      subtitle: 'Fantasy Playground',
      detail: 'Zone V · "The Bowl" · Climbable dragon · Castle tower'
    },
    village: {
      title: 'Dragon\'s Forge Village',
      subtitle: 'Horseshoe Bottoms Heritage Village',
      detail: 'Zone VI · 8 buildings · Dragon\'s Breath Railway'
    },
    watch: {
      title: 'Dragon\'s Watch',
      subtitle: 'Ridge Overlooks',
      detail: 'Zone VII · Mine tipple platforms · Panoramic views'
    }
  };

  const regions = svg.querySelectorAll('.zone-region');

  regions.forEach(region => {
    const zoneKey = region.dataset.zone;
    const data = zoneData[zoneKey];
    if (!data) return;

    // Hover: show tooltip
    region.addEventListener('mouseenter', (e) => {
      if (!tooltip) return;
      tooltip.innerHTML = `
        <strong style="display:block; margin-bottom:2px; color: #e8dcc8;">${data.title}</strong>
        <span style="display:block; font-size:0.8em; color: #9a9488; font-style:italic; margin-bottom:4px;">${data.subtitle}</span>
        <span style="display:block; font-size:0.75em; color: #5a5448;">${data.detail}</span>
      `;
      tooltip.classList.add('visible');
      positionTooltip(e);
    });

    region.addEventListener('mousemove', positionTooltip);

    region.addEventListener('mouseleave', () => {
      if (tooltip) tooltip.classList.remove('visible');
    });

    // Click / keyboard: scroll to zone card
    region.addEventListener('click', scrollToTarget.bind(null, region));
    region.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        scrollToTarget(region);
      }
    });
  });

  function positionTooltip(e) {
    if (!tooltip) return;
    const mapRect = svg.parentElement.getBoundingClientRect();
    const svgRect = svg.getBoundingClientRect();

    // Position relative to SVG container
    const x = e.clientX - svgRect.left + 12;
    const y = e.clientY - svgRect.top + 12;

    // Keep tooltip in bounds
    const tw = 230;
    const th = 80;
    const left = Math.min(x, svgRect.width - tw - 10);
    const top = Math.min(y, svgRect.height - th - 10);

    tooltip.style.left = left + 'px';
    tooltip.style.top = top + 'px';
  }

  function scrollToTarget(region) {
    const targetId = region.dataset.target;
    if (!targetId) return;
    const target = document.querySelector(targetId);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Briefly highlight the card
      target.classList.add('zone-highlighted');
      setTimeout(() => target.classList.remove('zone-highlighted'), 2000);
    }
  }
})();


/* ── Zone card highlight from map click ───────────────────── */
(function initZoneHighlight() {
  const style = document.createElement('style');
  style.textContent = `
    .zone-highlighted {
      animation: zone-flash 0.5s ease-out forwards;
    }
    @keyframes zone-flash {
      0%   { box-shadow: 0 0 0 4px rgba(232,98,26,0.8), 0 0 40px rgba(232,98,26,0.4); }
      100% { box-shadow: 0 12px 40px rgba(0,0,0,0.6); }
    }
  `;
  document.head.appendChild(style);
})();


/* ── Smooth scroll for all anchor links ───────────────────── */
(function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (href === '#') return;
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
})();


/* ── Active nav link highlighting ─────────────────────────── */
(function initActiveNav() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link');

  if (!sections.length || !navLinks.length) return;

  const obs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        navLinks.forEach(link => {
          const href = link.getAttribute('href');
          if (href === '#' + id) {
            link.style.color = 'var(--color-ember)';
          } else {
            link.style.color = '';
          }
        });
      }
    });
  }, {
    rootMargin: '-30% 0px -65% 0px',
    threshold: 0
  });

  sections.forEach(section => obs.observe(section));
})();


/* ── Quest step stagger animation fallback ─────────────────── */
(function initQuestStagger() {
  // For browsers that don't support CSS animation-timeline
  if (CSS.supports && CSS.supports('animation-timeline: scroll()')) return;

  const steps = document.querySelectorAll('.quest-step');
  if (!steps.length) return;

  const obs = new IntersectionObserver(entries => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => {
          entry.target.style.opacity = '1';
          entry.target.style.transition = 'opacity 600ms ease';
        }, i * 80);
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  steps.forEach(step => {
    step.style.opacity = '0';
    obs.observe(step);
  });
})();


/* ── Zone card fallback fade-in ───────────────────────────── */
(function initCardFadeIn() {
  if (CSS.supports && CSS.supports('animation-timeline: scroll()')) return;

  const cards = document.querySelectorAll('.zone-card');
  if (!cards.length) return;

  const obs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transition = 'opacity 700ms ease';
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08 });

  cards.forEach(card => {
    card.style.opacity = '0';
    obs.observe(card);
  });
})();


/* ── Gear decoration parallax (subtle) ───────────────────── */
(function initGearParallax() {
  const gearLeft = document.querySelector('.hero-gear-left');
  const gearRight = document.querySelector('.hero-gear-right');
  if (!gearLeft && !gearRight) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (window.innerWidth < 768) return;

  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    const speed = 0.15;
    if (gearLeft) {
      gearLeft.style.transform = `translateY(calc(-50% + ${y * speed}px))`;
    }
    if (gearRight) {
      gearRight.style.transform = `translateY(${y * -speed * 0.6}px)`;
    }
  }, { passive: true });
})();


/* ── Hero stat number count-up animation ─────────────────── */
(function initCountUp() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const stats = document.querySelectorAll('.stat-number');
  if (!stats.length) return;

  const obs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;

      const el = entry.target;
      const text = el.textContent;
      const match = text.match(/^(\d+)/);
      if (!match) return;

      const target = parseInt(match[1], 10);
      if (target < 2) return; // Don't animate tiny numbers

      let start = 0;
      const duration = 1200;
      const startTime = performance.now();

      function update(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // Ease-out
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(start + (target - start) * eased);

        // Preserve any suffix (e.g. "s" in "1870s")
        const suffix = text.replace(/^\d+/, '');
        el.textContent = current + suffix;

        if (progress < 1) {
          requestAnimationFrame(update);
        }
      }

      requestAnimationFrame(update);
      obs.unobserve(el);
    });
  }, { threshold: 0.5 });

  stats.forEach(stat => obs.observe(stat));
})();
