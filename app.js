/* ================================================================
   THE MELTING BOT — App Logic
   ================================================================ */

'use strict';

/* ----------------------------------------------------------------
   1. CUSTOM CURSOR
   ---------------------------------------------------------------- */

const cursor     = document.getElementById('cursor');
const cursorGlow = document.getElementById('cursorGlow');

let mouseX = window.innerWidth  / 2;
let mouseY = window.innerHeight / 2;
let glowX  = mouseX;
let glowY  = mouseY;
let rafId  = null;

if (cursor && cursorGlow) {
  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;

    cursor.style.left = mouseX + 'px';
    cursor.style.top  = mouseY + 'px';
  });

  // Smooth glow follow
  function animateGlow() {
    glowX += (mouseX - glowX) * 0.12;
    glowY += (mouseY - glowY) * 0.12;
    cursorGlow.style.left = glowX + 'px';
    cursorGlow.style.top  = glowY + 'px';
    rafId = requestAnimationFrame(animateGlow);
  }
  animateGlow();

  // Hover state
  const interactiveSelectors = 'a, button, [role="button"], .skill-tag, .glass-card, .contact-btn';
  document.querySelectorAll(interactiveSelectors).forEach(el => {
    el.addEventListener('mouseenter', () => {
      cursor.classList.add('hovering');
      cursorGlow.classList.add('hovering');
    });
    el.addEventListener('mouseleave', () => {
      cursor.classList.remove('hovering');
      cursorGlow.classList.remove('hovering');
    });
  });

  // Hide on leave, show on enter
  document.addEventListener('mouseleave', () => {
    cursor.style.opacity = '0';
    cursorGlow.style.opacity = '0';
  });
  document.addEventListener('mouseenter', () => {
    cursor.style.opacity = '1';
    cursorGlow.style.opacity = '1';
  });
}


/* ----------------------------------------------------------------
   2. HERO CANVAS — Particle Field
   ---------------------------------------------------------------- */

const canvas = document.getElementById('heroCanvas');
const ctx    = canvas ? canvas.getContext('2d') : null;

if (canvas && ctx) {
  let W = canvas.width  = window.innerWidth;
  let H = canvas.height = window.innerHeight;

  const PARTICLE_COUNT = Math.min(Math.floor(W * H / 12000), 80);
  const COLORS = ['rgba(0,240,255,', 'rgba(123,97,255,'];

  class Particle {
    constructor() { this.reset(true); }

    reset(initial = false) {
      this.x    = Math.random() * W;
      this.y    = initial ? Math.random() * H : H + 10;
      this.size = Math.random() * 1.5 + 0.5;
      this.speedY = -(Math.random() * 0.4 + 0.1);
      this.speedX =  (Math.random() - 0.5) * 0.2;
      this.color  = COLORS[Math.floor(Math.random() * COLORS.length)];
      this.alpha  = Math.random() * 0.5 + 0.1;
      this.alphaDir = (Math.random() > 0.5) ? 0.003 : -0.003;
    }

    update() {
      this.x += this.speedX;
      this.y += this.speedY;
      this.alpha += this.alphaDir;
      if (this.alpha <= 0.05 || this.alpha >= 0.6) this.alphaDir *= -1;
      if (this.y < -10) this.reset();
    }

    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = this.color + this.alpha + ')';
      ctx.fill();
    }
  }

  const particles = Array.from({ length: PARTICLE_COUNT }, () => new Particle());

  // Subtle parallax on mousemove
  let pMouseX = 0, pMouseY = 0;
  window.addEventListener('mousemove', (e) => {
    pMouseX = (e.clientX / W - 0.5) * 10;
    pMouseY = (e.clientY / H - 0.5) * 10;
  });

  function drawFrame() {
    ctx.clearRect(0, 0, W, H);

    // Very faint connection lines
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(0,240,255,${0.04 * (1 - dist / 120)})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }

    particles.forEach(p => { p.update(); p.draw(); });
    requestAnimationFrame(drawFrame);
  }
  drawFrame();

  // Resize
  window.addEventListener('resize', () => {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  });
}


/* ----------------------------------------------------------------
   3. SCROLL REVEAL
   ---------------------------------------------------------------- */

const revealEls = document.querySelectorAll(
  '.section-heading, .about-text, .about-stats, .skills-grid, .project-card, .contact-text, .contact-btn'
);

revealEls.forEach(el => el.classList.add('reveal'));

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
);

revealEls.forEach(el => revealObserver.observe(el));


/* ----------------------------------------------------------------
   4. STAT COUNTER ANIMATION
   ---------------------------------------------------------------- */

const statNumbers = document.querySelectorAll('.stat-number[data-target]');

const counterObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el     = entry.target;
      const target = parseInt(el.dataset.target, 10);
      const duration = 1200;
      const start    = performance.now();

      function tick(now) {
        const elapsed  = now - start;
        const progress = Math.min(elapsed / duration, 1);
        // Ease out quad
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(eased * target);
        if (progress < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
      counterObserver.unobserve(el);
    });
  },
  { threshold: 0.5 }
);

statNumbers.forEach(el => counterObserver.observe(el));


/* ----------------------------------------------------------------
   5. CARD GLOW — Mouse Tracking
   ---------------------------------------------------------------- */

document.querySelectorAll('.glass-card').forEach(card => {
  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width)  * 100;
    const y = ((e.clientY - rect.top)  / rect.height) * 100;
    card.style.setProperty('--mouse-x', x + '%');
    card.style.setProperty('--mouse-y', y + '%');
  });
});


/* ----------------------------------------------------------------
   6. SCROLL INDICATOR FADE
   ---------------------------------------------------------------- */

const scrollIndicator = document.getElementById('scrollIndicator');
if (scrollIndicator) {
  window.addEventListener('scroll', () => {
    const scrolled = window.scrollY;
    scrollIndicator.style.opacity = Math.max(0, 1 - scrolled / 200).toString();
  }, { passive: true });
}
