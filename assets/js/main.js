/* ============================================================
   ACTIVE LABS — interactions
   Dependency-free · performant · reduced-motion aware
   ============================================================ */
(function () {
  'use strict';

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Logo assets (real brand SVG) ---------- */
  const LOGO_DARK = 'assets/img/activelabs-logo.svg';
  const LOGO_LIGHT = 'assets/img/activelabs-logo-light.svg';

  /* ---------- Nav links (single source of truth) ---------- */
  const NAV = [
    ['index.html', 'Home'],
    ['science.html', 'The Science'],
    ['testing.html', 'Testing'],
    ['membership.html', 'Membership'],
    ['about.html', 'About'],
  ];

  const page = (document.body.getAttribute('data-page') || 'index').toLowerCase();

  /* ---------- Build header ---------- */
  function buildHeader() {
    const links = NAV.map(([href, label]) => {
      const active = href.replace('.html', '') === page ? ' class="active"' : '';
      return `<a href="${href}"${active}>${label}</a>`;
    }).join('');
    const mlinks = NAV.map(([href, label]) => `<a href="${href}">${label}</a>`).join('');
    // (waitlist CTA appended in mobile menu below)

    const header = document.createElement('header');
    header.className = 'site-header';
    header.innerHTML = `
      <div class="container container-wide">
        <nav class="nav">
          <a href="index.html" class="brand" aria-label="Active Labs home">
            <img class="brand-logo" src="${LOGO_DARK}" alt="Active Labs" width="150" height="48">
          </a>
          <div class="nav-links">${links}</div>
          <div class="nav-cta">
            <a href="book.html" class="btn btn-primary">Join the waitlist <span class="arrow" aria-hidden="true">→</span></a>
            <button class="nav-toggle" aria-label="Toggle menu" aria-expanded="false">
              <span></span><span></span><span></span>
            </button>
          </div>
        </nav>
      </div>
      <div class="mobile-menu">${mlinks}<a href="book.html" class="btn btn-primary" style="font-family:var(--font-body);font-size:1rem">Join the waitlist</a></div>
    `;
    document.body.prepend(header);

    const toggle = header.querySelector('.nav-toggle');
    toggle.addEventListener('click', () => {
      const open = document.body.classList.toggle('nav-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.body.style.overflow = open ? 'hidden' : '';
    });
    header.querySelectorAll('.mobile-menu a').forEach(a =>
      a.addEventListener('click', () => {
        document.body.classList.remove('nav-open');
        document.body.style.overflow = '';
        toggle.setAttribute('aria-expanded', 'false');
      })
    );

    // Scroll condense
    const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 20);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------- Build footer ---------- */
  function buildFooter() {
    const footer = document.createElement('footer');
    footer.className = 'site-footer';
    footer.innerHTML = `
      <div class="container container-wide">
        <div class="footer-top">
          <div class="footer-brand">
            <a href="index.html" class="brand" aria-label="Active Labs home">
              <img class="footer-logo" src="${LOGO_LIGHT}" alt="Active Labs" width="188" height="60">
            </a>
            <p>Preventive &amp; longevity medicine for Brighton &amp; Hove. Comprehensive bloodwork, clinician-led protocols, and a partnership in your long-term health.</p>
          </div>
          <div class="footer-col">
            <h4>Explore</h4>
            <ul>
              <li><a href="science.html">The Science</a></li>
              <li><a href="testing.html">Testing &amp; Panels</a></li>
              <li><a href="membership.html">Membership</a></li>
              <li><a href="about.html">About</a></li>
            </ul>
          </div>
          <div class="footer-col">
            <h4>Visit</h4>
            <ul>
              <li>Central Brighton &amp; Hove</li>
              <li>Mon–Sat, by appointment</li>
              <li><a href="mailto:hello@activelabs.health">hello@activelabs.health</a></li>
              <li><a href="tel:+441273000000">+44 (0)1273 000 000</a></li>
            </ul>
          </div>
          <div class="footer-col">
            <h4>Follow</h4>
            <ul>
              <li><a href="#" rel="noopener">Instagram</a></li>
              <li><a href="#" rel="noopener">The Active Labs Podcast</a></li>
              <li><a href="#" rel="noopener">Newsletter</a></li>
            </ul>
          </div>
        </div>
        <p class="footer-disclaimer">
          Active Labs provides private preventive-health and optimisation services and is not a substitute for NHS emergency or acute care.
          Diagnostic testing and any therapies are provided under clinical governance by GMC-registered clinicians and appropriate prescribers.
          All pricing shown is indicative and for illustration only. Nothing on this site constitutes medical advice.
        </p>
        <div class="footer-bottom">
          <span>© <span data-year></span> Active Labs Ltd · Brighton &amp; Hove, UK</span>
          <span style="display:flex;gap:1.5rem;flex-wrap:wrap">
            <a href="#">Privacy</a><a href="#">Terms</a><a href="#">Clinical governance</a><a href="#">CQC</a>
          </span>
        </div>
      </div>
    `;
    document.body.appendChild(footer);
    const y = footer.querySelector('[data-year]');
    if (y) y.textContent = new Date().getFullYear();
  }

  /* ---------- Scroll reveal ---------- */
  function initReveal() {
    const items = document.querySelectorAll('[data-reveal], [data-reveal-stagger]');
    if (reduce || !('IntersectionObserver' in window)) {
      items.forEach(el => el.classList.add('in'));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        if (el.hasAttribute('data-reveal-stagger')) {
          const step = parseInt(el.getAttribute('data-stagger') || '90', 10);
          [...el.children].forEach((child, i) => { child.style.transitionDelay = (i * step) + 'ms'; });
        }
        el.classList.add('in');
        io.unobserve(el);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    items.forEach(el => io.observe(el));
  }

  /* ---------- Count-up ---------- */
  function initCounters() {
    const nums = document.querySelectorAll('[data-count]');
    if (!nums.length) return;
    const animate = (el) => {
      const target = parseFloat(el.getAttribute('data-count'));
      const suffix = el.getAttribute('data-suffix') || '';
      const prefix = el.getAttribute('data-prefix') || '';
      const dec = (el.getAttribute('data-count').split('.')[1] || '').length;
      if (reduce) { el.textContent = prefix + target.toFixed(dec) + suffix; return; }
      const dur = 1500; const start = performance.now();
      const tick = (now) => {
        const p = Math.min((now - start) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = prefix + (target * eased).toFixed(dec) + suffix;
        if (p < 1) requestAnimationFrame(tick);
        else el.textContent = prefix + target.toFixed(dec) + suffix;
      };
      requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { animate(e.target); io.unobserve(e.target); } });
    }, { threshold: 0.5 });
    nums.forEach(n => io.observe(n));
  }

  /* ---------- Hero progression chart + fade-in ---------- */
  function initHeroChart() {
    const card = document.getElementById('progressChart');
    if (card) {
      const line = card.querySelector('.chart-line');
      if (line) {
        const len = Math.ceil(line.getTotalLength());
        line.style.setProperty('--len', len);
      }
      const draw = () => card.classList.add('is-drawn');
      if (reduce) { draw(); }
      else if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver((entries) => {
          entries.forEach(e => { if (e.isIntersecting) { setTimeout(draw, 250); io.disconnect(); } });
        }, { threshold: 0.3 });
        io.observe(card);
      } else { draw(); }
    }
    // Fade-in hero content
    document.querySelectorAll('.hero-fade').forEach((el, i) => {
      if (reduce) { el.classList.add('in'); return; }
      el.style.transitionDelay = (i * 0.09 + 0.1) + 's';
      requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('in')));
    });
  }

  /* ---------- Accordion panels ---------- */
  function initPanels() {
    document.querySelectorAll('.panel-head').forEach(head => {
      head.addEventListener('click', () => {
        const row = head.closest('.panel-row');
        const open = row.classList.contains('open');
        head.setAttribute('aria-expanded', open ? 'false' : 'true');
        row.classList.toggle('open');
      });
    });
  }

  /* ---------- Subtle parallax on hero chips ---------- */
  function initParallax() {
    if (reduce) return;
    const chips = document.querySelectorAll('[data-parallax]');
    if (!chips.length) return;
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        chips.forEach(c => {
          const speed = parseFloat(c.getAttribute('data-parallax')) || 0.05;
          c.style.transform = `translateY(${y * speed}px)`;
        });
        ticking = false;
      });
    }, { passive: true });
  }

  /* ---------- Booking form ---------- */
  function initForm() {
    const form = document.querySelector('form[data-booking]');
    if (!form) return;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      let valid = true;
      form.querySelectorAll('[required]').forEach(input => {
        const field = input.closest('.field');
        const ok = input.type === 'email'
          ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim())
          : input.value.trim() !== '';
        if (field) field.classList.toggle('err', !ok);
        if (!ok && valid) { valid = false; input.focus(); }
      });
      if (!valid) return;

      const btn = form.querySelector('button[type="submit"]');
      const errEl = form.querySelector('.form-submit-error');
      if (errEl) errEl.hidden = true;
      if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }

      const showSuccess = () => {
        form.style.display = 'none';
        const success = document.querySelector('.form-success');
        if (success) success.classList.add('show');
      };
      const showError = () => {
        if (btn) { btn.disabled = false; btn.textContent = 'Request my consultation'; }
        if (errEl) errEl.hidden = false;
      };

      // Encode all fields (incl. form-name + multiple checkboxes) for Netlify Forms.
      const body = new URLSearchParams(new FormData(form)).toString();

      // On localhost there is no Netlify backend — simulate success so the preview works.
      const isLocal = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname) || location.protocol === 'file:';
      if (isLocal) { setTimeout(showSuccess, 700); return; }

      fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body })
        .then((res) => { if (!res.ok) throw new Error('Bad status ' + res.status); showSuccess(); })
        .catch(showError);
    });
    form.querySelectorAll('input, select, textarea').forEach(input => {
      input.addEventListener('input', () => {
        const field = input.closest('.field');
        if (field && field.classList.contains('err')) field.classList.remove('err');
      });
    });
  }

  /* ---------- Init ---------- */
  function init() {
    buildHeader();
    buildFooter();
    initReveal();
    initCounters();
    initHeroChart();
    initPanels();
    initParallax();
    initForm();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
