/* ================================================================
   THE MELTING BOT — App Logic (Enhanced)
   ================================================================ */

'use strict';

/* ----------------------------------------------------------------
   0. REDUCED MOTION CHECK
   ---------------------------------------------------------------- */

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;


/* ----------------------------------------------------------------
   0.5 LOADING SCREEN ANIMATION
   ---------------------------------------------------------------- */

(function initLoader() {
  const loader  = document.getElementById('loader');
  const bot     = document.getElementById('loaderBot');
  if (!loader || !bot) return;

  // Add loading class to body to pause hero animations
  document.body.classList.add('loading');

  if (prefersReducedMotion) {
    // Skip animation, just remove immediately
    loader.style.display = 'none';
    document.body.classList.remove('loading');
    return;
  }

  // Timeline:
  // 0.0s - 0.8s : Bot fades in (CSS animation: loaderFadeIn, 0.2s delay + 0.6s)
  // 0.5s - 1.3s : Drips draw in (CSS animation: loaderDripDraw)
  // 1.4s        : Start melt animation
  // 1.4s - 2.6s : Bot melts/dissolves (CSS animation: loaderMelt, 1.2s)
  // 2.6s - 3.2s : Loader fades out (CSS transition: 0.6s)

  setTimeout(() => {
    bot.classList.add('melting');
  }, 1400);

  setTimeout(() => {
    loader.classList.add('fade-out');
    document.body.classList.remove('loading');
  }, 2500);

  // Remove loader from DOM after fade completes
  setTimeout(() => {
    loader.style.display = 'none';
  }, 3200);
})();


/* ----------------------------------------------------------------
   1. CUSTOM CURSOR
   ---------------------------------------------------------------- */

const cursor     = document.getElementById('cursor');
const cursorGlow = document.getElementById('cursorGlow');

let mouseX = window.innerWidth  / 2;
let mouseY = window.innerHeight / 2;
let glowX  = mouseX;
let glowY  = mouseY;

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
    requestAnimationFrame(animateGlow);
  }
  animateGlow();

  // Hover state
  const interactiveSelectors = 'a, button, [role="button"], .skill-tag, .glass-card, .contact-btn, .tmb-badge, #contact input, #contact textarea, #contact select';
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
   2. HERO CANVAS — Enhanced Particle Field
   ---------------------------------------------------------------- */

const heroCanvas = document.getElementById('heroCanvas');
const heroCtx    = heroCanvas ? heroCanvas.getContext('2d') : null;

if (heroCanvas && heroCtx && !prefersReducedMotion) {
  let W = heroCanvas.width  = window.innerWidth;
  let H = heroCanvas.height = window.innerHeight;

  // More particles for density; cap for performance
  const PARTICLE_COUNT = Math.min(Math.floor((W * H) / 8000), 120);
  const CONNECTION_DIST = 140;
  const MOUSE_RADIUS = 180;
  const MOUSE_FORCE = 0.08;

  // Track mouse position within the hero
  let heroMouseX = W / 2;
  let heroMouseY = H / 2;
  let mouseActive = false;

  heroCanvas.addEventListener('mousemove', (e) => {
    const rect = heroCanvas.getBoundingClientRect();
    heroMouseX = e.clientX - rect.left;
    heroMouseY = e.clientY - rect.top;
    mouseActive = true;
  });

  heroCanvas.addEventListener('mouseleave', () => {
    mouseActive = false;
  });

  class Particle {
    constructor() { this.init(true); }

    init(scatter = false) {
      this.x  = Math.random() * W;
      this.y  = scatter ? Math.random() * H : H + Math.random() * 40;
      this.size = Math.random() * 2 + 0.5;

      // Base velocity — slow ambient drift
      this.baseVX = (Math.random() - 0.5) * 0.3;
      this.baseVY = -(Math.random() * 0.5 + 0.1);

      // Actual velocity (affected by mouse)
      this.vx = this.baseVX;
      this.vy = this.baseVY;

      // Visual
      this.hue = Math.random() > 0.35 ? 186 : 260; // cyan or violet
      this.alpha = Math.random() * 0.5 + 0.15;
      this.alphaTarget = this.alpha;
      this.pulseSpeed = 0.002 + Math.random() * 0.004;
      this.pulsePhase = Math.random() * Math.PI * 2;
    }

    update(time) {
      // Mouse reactivity — push particles away from cursor
      if (mouseActive) {
        const dx = this.x - heroMouseX;
        const dy = this.y - heroMouseY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < MOUSE_RADIUS && dist > 0) {
          const force = (1 - dist / MOUSE_RADIUS) * MOUSE_FORCE;
          const angle = Math.atan2(dy, dx);
          this.vx += Math.cos(angle) * force;
          this.vy += Math.sin(angle) * force;
        }
      }

      // Damping — return to base velocity over time
      this.vx += (this.baseVX - this.vx) * 0.02;
      this.vy += (this.baseVY - this.vy) * 0.02;

      this.x += this.vx;
      this.y += this.vy;

      // Pulsing alpha
      this.alpha = 0.15 + Math.sin(time * this.pulseSpeed + this.pulsePhase) * 0.25 + 0.15;

      // Wrap horizontally, reset from bottom when off top
      if (this.x < -20) this.x = W + 20;
      if (this.x > W + 20) this.x = -20;
      if (this.y < -20) this.init();
    }

    draw(ctx) {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      if (this.hue === 186) {
        ctx.fillStyle = `rgba(0, 240, 255, ${this.alpha})`;
      } else {
        ctx.fillStyle = `rgba(123, 97, 255, ${this.alpha})`;
      }
      ctx.fill();
    }
  }

  const particles = Array.from({ length: PARTICLE_COUNT }, () => new Particle());

  function drawHero(time) {
    heroCtx.clearRect(0, 0, W, H);

    // Update all particles
    for (let i = 0; i < particles.length; i++) {
      particles[i].update(time);
    }

    // Draw connection lines (batch by opacity for fewer state changes)
    heroCtx.lineWidth = 0.5;
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const distSq = dx * dx + dy * dy;
        const maxSq = CONNECTION_DIST * CONNECTION_DIST;

        if (distSq < maxSq) {
          const dist = Math.sqrt(distSq);
          const opacity = 0.08 * (1 - dist / CONNECTION_DIST);

          // Lines near mouse glow brighter
          let lineOpacity = opacity;
          if (mouseActive) {
            const midX = (particles[i].x + particles[j].x) / 2;
            const midY = (particles[i].y + particles[j].y) / 2;
            const mouseDist = Math.sqrt(
              (midX - heroMouseX) ** 2 + (midY - heroMouseY) ** 2
            );
            if (mouseDist < MOUSE_RADIUS * 1.5) {
              lineOpacity += 0.06 * (1 - mouseDist / (MOUSE_RADIUS * 1.5));
            }
          }

          heroCtx.beginPath();
          heroCtx.moveTo(particles[i].x, particles[i].y);
          heroCtx.lineTo(particles[j].x, particles[j].y);
          heroCtx.strokeStyle = `rgba(0, 240, 255, ${lineOpacity})`;
          heroCtx.stroke();
        }
      }
    }

    // Draw particles on top
    for (let i = 0; i < particles.length; i++) {
      particles[i].draw(heroCtx);
    }

    // Draw a subtle glow around the mouse position
    if (mouseActive) {
      const gradient = heroCtx.createRadialGradient(
        heroMouseX, heroMouseY, 0,
        heroMouseX, heroMouseY, MOUSE_RADIUS
      );
      gradient.addColorStop(0, 'rgba(0, 240, 255, 0.03)');
      gradient.addColorStop(1, 'rgba(0, 240, 255, 0)');
      heroCtx.fillStyle = gradient;
      heroCtx.fillRect(0, 0, W, H);
    }

    requestAnimationFrame(drawHero);
  }
  requestAnimationFrame(drawHero);

  // Throttled resize
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      W = heroCanvas.width  = window.innerWidth;
      H = heroCanvas.height = window.innerHeight;
    }, 150);
  });
}


/* ----------------------------------------------------------------
   3. ANIMATED GRID BACKGROUND
   ---------------------------------------------------------------- */

const gridCanvas = document.getElementById('gridCanvas');
const gridCtx    = gridCanvas ? gridCanvas.getContext('2d') : null;

if (gridCanvas && gridCtx && !prefersReducedMotion) {
  let GW = gridCanvas.width  = window.innerWidth;
  let GH = gridCanvas.height = document.documentElement.scrollHeight;

  const GRID_SIZE = 60;
  const GRID_BASE_ALPHA = 0.025;
  const GRID_PULSE_AMPLITUDE = 0.02;
  const GRID_PULSE_SPEED = 0.0004; // Slow pulse cycle

  function drawGrid(time) {
    gridCtx.clearRect(0, 0, GW, GH);

    // Pulsing global alpha
    const pulse = GRID_BASE_ALPHA + Math.sin(time * GRID_PULSE_SPEED) * GRID_PULSE_AMPLITUDE;

    // Draw vertical lines
    gridCtx.strokeStyle = `rgba(0, 240, 255, ${pulse})`;
    gridCtx.lineWidth = 1;

    gridCtx.beginPath();
    for (let x = 0; x <= GW; x += GRID_SIZE) {
      gridCtx.moveTo(x + 0.5, 0);
      gridCtx.lineTo(x + 0.5, GH);
    }
    gridCtx.stroke();

    // Draw horizontal lines with a slightly different phase for depth
    const pulse2 = GRID_BASE_ALPHA + Math.sin(time * GRID_PULSE_SPEED + 1.5) * GRID_PULSE_AMPLITUDE;
    gridCtx.strokeStyle = `rgba(0, 240, 255, ${pulse2})`;

    gridCtx.beginPath();
    for (let y = 0; y <= GH; y += GRID_SIZE) {
      gridCtx.moveTo(0, y + 0.5);
      gridCtx.lineTo(GW, y + 0.5);
    }
    gridCtx.stroke();

    // Intersection glow — very subtle bright dots at grid intersections near a slow-moving "wave"
    const waveCenterY = (GH / 2) + Math.sin(time * 0.0003) * (GH * 0.3);
    const waveCenterX = (GW / 2) + Math.cos(time * 0.0002) * (GW * 0.3);
    const waveRadius = 400;

    for (let x = 0; x <= GW; x += GRID_SIZE) {
      for (let y = 0; y <= GH; y += GRID_SIZE) {
        const dx = x - waveCenterX;
        const dy = y - waveCenterY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < waveRadius) {
          const intensity = (1 - dist / waveRadius) * 0.08;
          gridCtx.fillStyle = `rgba(0, 240, 255, ${intensity})`;
          gridCtx.fillRect(x - 1, y - 1, 2, 2);
        }
      }
    }

    requestAnimationFrame(drawGrid);
  }
  requestAnimationFrame(drawGrid);

  // Update grid height on scroll/resize (page height can change)
  let gridResizeTimeout;
  function updateGridSize() {
    clearTimeout(gridResizeTimeout);
    gridResizeTimeout = setTimeout(() => {
      GW = gridCanvas.width  = window.innerWidth;
      GH = gridCanvas.height = document.documentElement.scrollHeight;
    }, 200);
  }
  window.addEventListener('resize', updateGridSize);

  // Observe body size changes (in case dynamic content changes page height)
  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(updateGridSize).observe(document.body);
  }
}


/* ----------------------------------------------------------------
   4. SCROLL REVEAL — Staggered Entrance Animations
   ---------------------------------------------------------------- */

// Define reveal groups: elements within each section animate in sequence
const revealSections = [
  {
    selector: '#about',
    children: ['.section-heading', '.about-text', '.about-stats']
  },
  {
    selector: '#skills',
    children: ['.section-heading', '.skills-grid .skill-tag']
  },
  {
    selector: '#projects',
    children: ['.section-heading', '.project-card']
  },
  {
    selector: '#contact',
    children: ['.section-heading', '.contact-text', '.contact-form']
  }
];

const STAGGER_BASE = 80; // ms between each element in a group
const REVEAL_DURATION = 700; // ms

if (!prefersReducedMotion) {
  // Mark all revealable elements
  revealSections.forEach(group => {
    const section = document.querySelector(group.selector);
    if (!section) return;

    let index = 0;
    group.children.forEach(childSel => {
      const elements = section.querySelectorAll(childSel);
      elements.forEach(el => {
        el.classList.add('reveal');
        el.style.transitionDelay = (index * STAGGER_BASE) + 'ms';
        el.style.transitionDuration = REVEAL_DURATION + 'ms';
        index++;
      });
    });
  });

  // Observe each section; when it enters, reveal all children at once (stagger via CSS delay)
  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;

        const section = entry.target;
        const revealEls = section.querySelectorAll('.reveal');
        revealEls.forEach(el => el.classList.add('visible'));

        sectionObserver.unobserve(section);
      });
    },
    { threshold: 0.08, rootMargin: '0px 0px -60px 0px' }
  );

  revealSections.forEach(group => {
    const section = document.querySelector(group.selector);
    if (section) sectionObserver.observe(section);
  });
}


/* ----------------------------------------------------------------
   5. STAT COUNTER ANIMATION
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
        // Ease out cubic
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
   6. CARD GLOW — Mouse Tracking
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
   6.5 CONTACT FORM — Web3Forms (same access key as whatsmybaseworth)
   ---------------------------------------------------------------- */

(function initContactForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;

  const WEB3FORMS_ACCESS_KEY = '0cf4a704-6a32-48eb-87ec-467ae5be13f5';
  const statusEl = document.getElementById('contactFormStatus');
  const submitBtn = document.getElementById('contactSubmit');
  const errName = document.getElementById('contactErrName');
  const errEmail = document.getElementById('contactErrEmail');
  const errMessage = document.getElementById('contactErrMessage');

  function clearErrors() {
    if (errName) errName.textContent = '';
    if (errEmail) errEmail.textContent = '';
    if (errMessage) errMessage.textContent = '';
  }

  function validateEmail(s) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
  }

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    clearErrors();
    if (statusEl) {
      statusEl.textContent = '';
      statusEl.classList.remove('is-success', 'is-error');
    }

    const nameInput = form.querySelector('[name="name"]');
    const emailInput = form.querySelector('[name="email"]');
    const topicInput = form.querySelector('[name="topic"]');
    const messageInput = form.querySelector('[name="message"]');
    const honeypot = form.querySelector('[name="botcheck"]');

    const n = (nameInput && nameInput.value ? nameInput.value : '').trim();
    const em = (emailInput && emailInput.value ? emailInput.value : '').trim();
    const topic = topicInput && topicInput.value ? topicInput.value : 'General';
    const msg = (messageInput && messageInput.value ? messageInput.value : '').trim();

    if (honeypot && honeypot.value) return;

    let ok = true;
    if (!n) {
      if (errName) errName.textContent = 'Name is required';
      ok = false;
    }
    if (!em) {
      if (errEmail) errEmail.textContent = 'Email is required';
      ok = false;
    } else if (!validateEmail(em)) {
      if (errEmail) errEmail.textContent = 'Enter a valid email';
      ok = false;
    }
    if (!msg) {
      if (errMessage) errMessage.textContent = 'Message is required';
      ok = false;
    }
    if (!ok) return;

    if (submitBtn) submitBtn.disabled = true;

    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_key: WEB3FORMS_ACCESS_KEY,
          subject: '[themeltingbot.com] ' + topic + ' — ' + n,
          from_name: 'The Melting Bot — Portfolio',
          name: n,
          email: em,
          topic: topic,
          message: msg,
        }),
      });
      const data = await res.json();
      if (data.success) {
        if (statusEl) {
          statusEl.textContent =
            'Thanks — your message was sent. We\'ll get back to you soon.';
          statusEl.classList.add('is-success');
        }
        form.reset();
      } else {
        if (statusEl) {
          statusEl.textContent =
            'Something went wrong. Please try again or email jt@themeltingbot.com directly.';
          statusEl.classList.add('is-error');
        }
      }
    } catch (err) {
      if (statusEl) {
        statusEl.textContent =
          'Network error. Please try again or email jt@themeltingbot.com directly.';
        statusEl.classList.add('is-error');
      }
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });
})();


/* ----------------------------------------------------------------
   7. SCROLL INDICATOR FADE
   ---------------------------------------------------------------- */

const scrollIndicator = document.getElementById('scrollIndicator');
if (scrollIndicator) {
  window.addEventListener('scroll', () => {
    const scrolled = window.scrollY;
    scrollIndicator.style.opacity = Math.max(0, 1 - scrolled / 200).toString();
  }, { passive: true });
}
