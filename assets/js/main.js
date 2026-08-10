/* ============================================================
   ACTIVE LABS — interactions
   Dependency-free · performant · reduced-motion aware
   ============================================================ */
(function () {
  'use strict';

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Logo assets (real brand SVG) ---------- */
  // LOGO_DARK = dark ink wordmark (for light backgrounds)
  // LOGO_LIGHT = cream wordmark (for dark backgrounds)
  const LOGO_DARK = 'assets/img/activelabs-logo.svg';
  const LOGO_LIGHT = 'assets/img/activelabs-logo-light.svg';

  /* ---------- Theme ---------- */
  // Default light; only "dark" is persisted. The <head> inline script applies
  // the saved theme before paint — here we just wire the toggle + keep the
  // header logo in sync with the current background.
  const THEME_KEY = 'al-theme';
  const themeToggleIcons =
    '<svg class="icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/></svg>' +
    '<svg class="icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.2M12 19.3v2.2M4.6 4.6l1.6 1.6M17.8 17.8l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.6 19.4l1.6-1.6M17.8 6.2l1.6-1.6"/></svg>';

  const currentTheme = () =>
    document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';

  // Set by buildHeader(); re-syncs header chrome (logo, over-hero state).
  let headerSync = null;

  function applyTheme(theme) {
    const dark = theme === 'dark';
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    // Header wordmark must invert with the background (theme + hero overlay).
    if (headerSync) headerSync();
    document.querySelectorAll('.theme-toggle').forEach(btn => {
      btn.setAttribute('aria-pressed', dark ? 'true' : 'false');
      btn.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
    });
  }

  function initTheme() {
    document.querySelectorAll('.theme-toggle').forEach(btn => {
      btn.addEventListener('click', () => {
        const next = currentTheme() === 'dark' ? 'light' : 'dark';
        try { localStorage.setItem(THEME_KEY, next); } catch (e) { /* private mode */ }
        applyTheme(next);
      });
    });
    // Sync toggle state + logo with whatever the head script already applied.
    applyTheme(currentTheme());
  }

  /* ---------- Members portal ---------- */
  // Where the "Log in" button sends existing members.
  // Local dev (incl. opening the file directly via file://) → the
  // patient-dashboard app on :5180.
  // Production → the members portal on the "app." subdomain of whatever
  // domain the site is served from (activelabs.health → app.activelabs.health).
  // NOTE: app.* goes live once the patient dashboard is deployed there.
  const host = location.hostname; // "" for file:// pages
  const isLocal =
    location.protocol === 'file:' ||
    host === '' ||
    /^(localhost|127\.0\.0\.1|\[::1\])$/.test(host);
  const PORTAL_URL = isLocal
    ? 'http://localhost:5180'
    : `https://app.${host.replace(/^www\./, '')}`;

  /* ---------- Nav links (single source of truth) ---------- */
  // A plain [href, label] pair renders as a link; an entry with `children`
  // renders as a dropdown (desktop) and as flat links in the mobile menu.
  const NAV = [
    ['/', 'How it Works'],
    ['/what-we-test', 'What We Test'],
    ['/longevity-lab', 'Longevity Lab'],
    ['/membership', 'Membership'],
    ['/for-teams', 'For Teams'],
    { label: 'Community', children: [['/recipes', 'Recipes'], ['/active-updates', 'Active Updates']] },
  ];

  const page = (document.body.getAttribute('data-page') || 'index').toLowerCase();

  /* ---------- Build header ---------- */
  function buildHeader() {
    // Clean URLs: '/' is the home page (data-page "index"), '/x' matches data-page "x".
    const slugOf = (href) => href === '/' ? 'index' : href.slice(1);
    const link = ([href, label]) =>
      `<a href="${href}"${slugOf(href) === page ? ' class="active"' : ''}>${label}</a>`;
    const links = NAV.map((item) => {
      if (Array.isArray(item)) return link(item);
      // Dropdown entry. The trigger is a real <button> (keyboard + touch);
      // CSS opens the panel on hover/focus-within, JS toggles .open on click.
      const parentActive = item.children.some(([href]) => slugOf(href) === page);
      return `<div class="nav-drop">
        <button type="button"${parentActive ? ' class="active"' : ''} aria-expanded="false" aria-haspopup="true">${item.label}
          <svg class="chev" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="m6 9 6 6 6-6" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
        <div class="nav-drop-panel">${item.children.map(link).join('')}</div>
      </div>`;
    }).join('');
    const mlinks = NAV.flatMap((item) => Array.isArray(item) ? [item] : item.children)
      .map(([href, label]) => `<a href="${href}">${label}</a>`).join('');
    // (waitlist CTA appended in mobile menu below)

    const header = document.createElement('header');
    header.className = 'site-header';
    header.innerHTML = `
      <div class="container container-wide">
        <nav class="nav">
          <a href="/" class="brand" aria-label="Active Labs home">
            <img class="brand-logo" src="${currentTheme() === 'dark' ? LOGO_LIGHT : LOGO_DARK}" alt="Active Labs" width="150" height="48">
          </a>
          <div class="nav-links">${links}</div>
          <div class="nav-cta">
            <button class="theme-toggle" type="button" aria-label="Switch to dark theme" aria-pressed="false" title="Toggle theme">${themeToggleIcons}</button>
            <a href="${PORTAL_URL}" class="nav-login">Log in</a>
            <a href="/book" class="btn btn-primary">Join the waitlist <span class="arrow" aria-hidden="true">→</span></a>
            <button class="nav-toggle" aria-label="Toggle menu" aria-expanded="false">
              <span></span><span></span><span></span>
            </button>
          </div>
        </nav>
      </div>
      <div class="mobile-menu">${mlinks}<a href="${PORTAL_URL}" class="btn btn-ghost" style="font-family:var(--font-body);font-size:1rem">Log in</a><a href="/book" class="btn btn-primary" style="font-family:var(--font-body);font-size:1rem">Join the waitlist</a></div>
    `;
    document.body.prepend(header);

    // Dropdown: click toggles (touch devices have no hover); outside click closes.
    header.querySelectorAll('.nav-drop').forEach(drop => {
      const btn = drop.querySelector('button');
      btn.addEventListener('click', () => {
        const open = drop.classList.toggle('open');
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
    });
    document.addEventListener('click', (e) => {
      header.querySelectorAll('.nav-drop.open').forEach(drop => {
        if (!drop.contains(e.target)) {
          drop.classList.remove('open');
          drop.querySelector('button').setAttribute('aria-expanded', 'false');
        }
      });
    });

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

    // Scroll condense + over-dark-hero chrome. While the header floats over
    // the (always-dark) hero band it renders light-on-dark; once it condenses
    // onto the page background it reverts to theme-driven styling.
    const hasDarkHero = !!document.querySelector('.hero-centered');
    const sync = () => {
      const scrolled = window.scrollY > 20;
      header.classList.toggle('scrolled', scrolled);
      const overDark = hasDarkHero && !scrolled;
      header.classList.toggle('on-dark', overDark);
      const logo = header.querySelector('.brand-logo');
      if (logo) logo.src = (overDark || currentTheme() === 'dark') ? LOGO_LIGHT : LOGO_DARK;
    };
    headerSync = sync;
    sync();
    window.addEventListener('scroll', sync, { passive: true });
  }

  /* ---------- Build footer ---------- */
  function buildFooter() {
    const footer = document.createElement('footer');
    footer.className = 'site-footer';
    footer.innerHTML = `
      <div class="container container-wide">
        <div class="footer-top">
          <div class="footer-brand">
            <a href="/" class="brand" aria-label="Active Labs home">
              <img class="footer-logo" src="${LOGO_LIGHT}" alt="Active Labs" width="188" height="60">
            </a>
            <p>Preventive &amp; longevity medicine for Brighton &amp; Hove. Comprehensive bloodwork, clinician-led protocols, and a partnership in your long-term health.</p>
          </div>
          <div class="footer-col">
            <h4>Explore</h4>
            <ul>
              <li><a href="/longevity-lab">Longevity Lab</a></li>
              <li><a href="/what-we-test">What We Test</a></li>
              <li><a href="/membership">Membership</a></li>
              <li><a href="/for-teams">For Teams</a></li>
              <li><a href="/recipes">Recipes</a></li>
              <li><a href="/active-updates">Active Updates</a></li>
              <li><a href="/about">About</a></li>
            </ul>
          </div>
          <div class="footer-col">
            <h4>Visit</h4>
            <ul>
              <li>Central Brighton &amp; Hove — coming soon</li>
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
          Active Labs is preparing to open a private preventive-health and optimisation service in Brighton &amp; Hove. It will not be a substitute for NHS emergency or acute care.
          All clinical services will be delivered by GMC-registered clinicians under a documented governance framework.
          Our CQC registration application is in progress; we will not provide regulated services before it is granted, and we will not open until our Medical Director is appointed.
          All pricing shown is indicative and for illustration only. Nothing on this site constitutes medical advice.
        </p>
        <div class="footer-bottom">
          <!-- No "Ltd" until Companies House registration completes: using it before
               incorporation is an offence under Companies Act 2006 s.1194. -->
          <span>© <span data-year></span> Active Labs · Brighton &amp; Hove, UK</span>
          <span style="display:flex;gap:1.5rem;flex-wrap:wrap">
            <a href="/privacy">Privacy</a><a href="#">Terms</a><a href="#">Clinical governance</a>
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

  /* ---------- Patient dashboard showcase ---------- */
  function initDashboard() {
    const section = document.getElementById('dashboard');
    if (!section) return;
    const stack = section.querySelector('.dash-screens');
    const steps = [...section.querySelectorAll('.dash-step')];
    const screens = [...section.querySelectorAll('.dash-screen')];
    if (!stack || !steps.length || !screens.length) return;

    const screenFor = (i) => screens.find(s => s.dataset.screen === String(i));
    const setActive = (i) => {
      steps.forEach(st => st.classList.toggle('is-active', st.dataset.step === String(i)));
      screens.forEach(sc => sc.classList.toggle('is-active', sc.dataset.screen === String(i)));
    };

    // Responsive layout: mobile nests each screen under its step; desktop keeps
    // them stacked in the sticky media column. Single source of markup.
    const mq = window.matchMedia('(max-width: 899px)');
    let mode = null;
    const applyLayout = () => {
      const want = mq.matches ? 'mobile' : 'desktop';
      if (want === mode) return;
      mode = want;
      if (want === 'mobile') {
        steps.forEach(st => { const sc = screenFor(st.dataset.step); if (sc) st.appendChild(sc); });
      } else {
        screens
          .slice()
          .sort((a, b) => a.dataset.screen - b.dataset.screen)
          .forEach(sc => stack.appendChild(sc));
        setActive(0);
      }
    };
    applyLayout();
    if (mq.addEventListener) mq.addEventListener('change', applyLayout);
    else if (mq.addListener) mq.addListener(applyLayout);

    // Desktop: whichever step's centre is nearest the viewport centre drives the
    // active screen. Deterministic (no step can be skipped on a fast scroll) and
    // rAF-throttled for performance.
    let ticking = false, current = -1;
    const update = () => {
      ticking = false;
      if (mode !== 'desktop') return;
      const cy = window.innerHeight / 2;
      let best = Infinity, idx = 0;
      steps.forEach((st, i) => {
        const r = st.getBoundingClientRect();
        const d = Math.abs((r.top + r.height / 2) - cy);
        if (d < best) { best = d; idx = i; }
      });
      if (idx !== current) { current = idx; setActive(idx); }
    };
    window.addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    }, { passive: true });
    update();
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
        // Checkboxes must be tested with .checked — an unticked box still
        // reports value "on", so the text test below would wrongly pass it.
        const ok = input.type === 'checkbox'
          ? input.checked
          : input.type === 'email'
            ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim())
            : input.value.trim() !== '';
        if (field) field.classList.toggle('err', !ok);
        if (!ok && valid) { valid = false; input.focus(); }
      });
      if (!valid) return;

      const btn = form.querySelector('button[type="submit"]');
      const errEl = form.querySelector('.form-submit-error');
      const btnLabel = btn ? btn.textContent : '';
      if (errEl) errEl.hidden = true;
      if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }

      const showSuccess = () => {
        form.style.display = 'none';
        const success = document.querySelector('.form-success');
        if (success) success.classList.add('show');
      };
      const showError = () => {
        if (btn) { btn.disabled = false; btn.textContent = btnLabel; }
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
      const clear = () => {
        const field = input.closest('.field');
        if (field && field.classList.contains('err')) field.classList.remove('err');
      };
      input.addEventListener('input', clear);
      input.addEventListener('change', clear); // checkboxes / selects
    });
  }

  /* ---------- Longevity Orbit (hero visual) ---------- */
  // Nine biomarkers on three weighted rings (inner = highest weight).
  // Placeholder data — the composite score is a weighted mean of the
  // per-marker scores and lands on 86. Swap values freely later.
  const ORBIT_RINGS = { r: [230, 340, 410], w: [3, 2, 1], base: [-90, -30, -60] };
  const ORBIT_DATA = [
    // inner ring (weight 3)
    { id: 'apob', label: 'ApoB', full: 'Apolipoprotein B', value: 65, unit: 'mg/dL', range: '< 90', ring: 0, status: 'in', score: 90, blurb: 'A count of every cholesterol particle capable of entering your artery walls. It predicts heart disease better than standard cholesterol tests, which is why we weight it so heavily — and why keeping it low buys you decades.' },
    { id: 'hba1c', label: 'HbA1c', full: 'Glycated haemoglobin', value: 5.9, unit: '%', range: '4.8–5.6', ring: 0, status: 'act', score: 68, blurb: 'Sugar coats your red blood cells as they circulate, and this measures how much — a three-month average of your blood glucose. Rising levels flag insulin resistance years before diabetes, while it is still easy to reverse.' },
    { id: 'crp', label: 'hs-CRP', full: 'High-sensitivity C-reactive protein', value: 2.4, unit: 'mg/L', range: '< 1.0', ring: 0, status: 'act', score: 62, blurb: 'A protein your liver releases when anything in the body is inflamed. Quiet, persistent inflammation accelerates ageing in arteries, joints and brain — finding the source and settling it is one of the highest-value moves in prevention.' },
    // middle ring (weight 2)
    { id: 'insulin', label: 'Insulin', full: 'Fasting insulin', value: 6, unit: 'µIU/mL', range: '2–8', ring: 1, status: 'in', score: 92, blurb: 'The hormone that shepherds sugar out of your blood. When cells stop listening, the pancreas quietly shouts — insulin climbs long before glucose does, making this one of the earliest warnings of metabolic trouble.' },
    { id: 'vo2', label: 'VO₂ max', full: 'Maximal oxygen uptake', value: 42, unit: 'mL/kg/min', range: '> 38', ring: 1, status: 'in', score: 94, blurb: 'The most oxygen your heart, lungs and muscles can use flat-out — your engine size. Large studies rank it among the strongest single predictors of lifespan, and unlike your genes, training raises it at any age.' },
    { id: 'testo', label: 'Testosterone', full: 'Total testosterone', value: 18, unit: 'nmol/L', range: '10–30', ring: 1, status: 'in', score: 90, blurb: 'Builds and maintains muscle, bone, red blood cells, mood and drive. Levels drift down with age, sleep debt and stress — tracking it separates normal ageing from a fixable deficiency.' },
    // outer ring (weight 1)
    { id: 'lpa', label: 'Lp(a)', full: 'Lipoprotein(a)', value: 40, unit: 'nmol/L', range: '< 75', ring: 2, status: 'in', score: 94, blurb: 'A cholesterol particle set almost entirely by your genes — diet barely moves it. One in five people carry high levels without knowing, which silently multiplies heart risk; everyone should measure it at least once.' },
    { id: 'vitd', label: 'Vit D', full: 'Vitamin D (25-hydroxy)', value: 68, unit: 'nmol/L', range: '75–125', ring: 2, status: 'act', score: 68, blurb: 'Made in your skin from sunlight, and a hormone more than a vitamin — it steers immune defence, bone strength and muscle function. Most people at UK latitudes run low for half the year without feeling it.' },
    { id: 'tsh', label: 'TSH', full: 'Thyroid-stimulating hormone', value: 2.1, unit: 'mIU/L', range: '0.4–4.0', ring: 2, status: 'in', score: 94, blurb: 'The signal your brain sends to your thyroid, which sets the tempo of every cell\'s metabolism. Drifting levels quietly reshape energy, weight, mood and heart rate — and are simple to correct once seen.' },
  ];

  /* ---------- Starfield behind the hero (always-dark band) ---------- */
  // Static, "real"-looking night sky: many faint stars, a few bright ones
  // with a soft halo, clustered irregularly rather than evenly spread.
  function initStars() {
    const hero = document.querySelector('.hero-centered');
    if (!hero) return;
    const NS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'hero-stars');
    svg.setAttribute('aria-hidden', 'true');
    const frag = document.createDocumentFragment();
    const star = (x, y, r, o) => {
      const c = document.createElementNS(NS, 'circle');
      c.setAttribute('cx', x + '%'); c.setAttribute('cy', y + '%');
      c.setAttribute('r', r); c.setAttribute('fill', '#EDE7DA');
      c.setAttribute('opacity', o.toFixed(2));
      return c;
    };
    for (let i = 0; i < 170; i++) {
      // Two overlapping distributions give gentle clustering.
      const x = (Math.random() * 100 + Math.random() * 100) / 2;
      const y = (Math.random() * 100 + Math.random() * 100) / 2;
      // Mostly dim pinpricks; occasionally brighter.
      const mag = Math.pow(Math.random(), 2.2);
      frag.appendChild(star(x, y, 0.4 + mag * 1.1, 0.12 + mag * 0.55));
    }
    for (let i = 0; i < 7; i++) {
      const x = Math.random() * 100, y = Math.random() * 100;
      const halo = star(x, y, 4.5, 0.10);          // soft glow
      const core = star(x, y, 1.5, 0.95);          // bright core
      frag.append(halo, core);
    }
    svg.appendChild(frag);
    hero.prepend(svg);
  }

  function initOrbit() {
    const orbit = document.getElementById('orbit');
    if (!orbit) return;
    const NS = 'http://www.w3.org/2000/svg';
    const el = (t, a) => { const e = document.createElementNS(NS, t); for (const k in a) e.setAttribute(k, a[k]); return e; };
    const ringsG = orbit.querySelector('.orbit-rings');
    const coreG = orbit.querySelector('.orbit-core');
    const spinG = orbit.querySelector('.orbit-spin');
    const tip = document.getElementById('orbitTip');
    const srList = document.getElementById('orbitSr');

    // Composite = weighted mean of per-marker scores (weights by ring).
    let ws = 0, wsum = 0;
    ORBIT_DATA.forEach(d => { ws += d.score * ORBIT_RINGS.w[d.ring]; wsum += ORBIT_RINGS.w[d.ring]; });
    const composite = Math.round(ws / wsum);

    // Screen-reader alternative to the visual.
    if (srList) {
      srList.textContent =
        `${composite} percent optimised, from nine weighted biomarkers. ` +
        ORBIT_DATA.map(d => `${d.label} ${d.value} ${d.unit}, reference ${d.range}, ${d.status === 'in' ? 'in range' : 'act on'}.`).join(' ');
    }

    // Sun glow — radial warmth from the core outwards (colours per theme).
    const svg = orbit.querySelector('.orbit-svg');
    const defs = el('defs', {});
    const grad = el('radialGradient', { id: 'sunGlow', cx: '50%', cy: '50%', r: '50%' });
    [['0%', 'var(--glow-core)', 1], ['45%', 'var(--glow-mid)', 1], ['100%', 'var(--glow-mid)', 0]]
      .forEach(([offset, color, op]) => {
        const s = el('stop', { offset, 'stop-opacity': op });
        s.style.stopColor = color;
        grad.appendChild(s);
      });
    defs.appendChild(grad);
    svg.insertBefore(defs, ringsG);
    svg.insertBefore(el('circle', { cx: 0, cy: 0, r: 330, fill: 'url(#sunGlow)' }), ringsG);

    // Rings
    ORBIT_RINGS.r.forEach(r => ringsG.appendChild(el('circle', { class: 'orbit-ring', cx: 0, cy: 0, r })));

    // Core dial + score readout — number first, caption beneath it.
    const Rp = 130, C = 2 * Math.PI * Rp;
    coreG.appendChild(el('circle', { class: 'orbit-track', cx: 0, cy: 0, r: Rp, 'stroke-width': 5 }));
    const prog = el('circle', { class: 'orbit-prog', cx: 0, cy: 0, r: Rp, 'stroke-width': 5, transform: 'rotate(-90)' });
    prog.style.strokeDasharray = C;
    prog.style.strokeDashoffset = C;
    coreG.appendChild(prog);
    // y=32 puts the digits' measured ink centre (32px above the baseline at
    // this size) exactly on the orbit centre — where the spokes intersect.
    // dominant-baseline is deliberately not used: it centres the font's em
    // box, whose middle doesn't match the visible middle of lining digits.
    const scoreText = el('text', { class: 'orbit-score', x: 0, y: 32, 'text-anchor': 'middle', 'font-size': 96 });
    const scoreNum = el('tspan', {});
    scoreNum.textContent = '0';
    const scorePct = el('tspan', { 'font-size': 54, dx: 4 });
    scorePct.textContent = '%';
    scoreText.append(scoreNum, scorePct);
    coreG.appendChild(scoreText);
    const caption = el('text', { class: 'orbit-eyebrow', x: 0, y: 64, 'text-anchor': 'middle', 'font-size': 16, 'letter-spacing': '3.5' });
    caption.textContent = 'Optimised';
    coreG.appendChild(caption);

    // Markers
    const LBLOFF = 40;
    const markers = ORBIT_DATA.map((d, i) => {
      const within = ORBIT_DATA.filter(x => x.ring === d.ring).indexOf(d);
      const baseAngle = ORBIT_RINGS.base[d.ring] + within * 120;
      const g = el('g', {
        class: 'orb-marker', tabindex: '0', role: 'button', 'data-status': d.status,
        'aria-label': `${d.full} (${d.label}): ${d.value} ${d.unit}. Reference ${d.range}. ${d.status === 'in' ? 'In range' : 'Act on'}. ${d.blurb}`,
      });
      const spoke = el('line', { class: 'orbit-spoke', x1: 0, y1: 0, x2: 0, y2: 0 });
      const hit = el('circle', { class: 'orb-hit', cx: 0, cy: 0, r: 34, fill: 'transparent' });
      const dot = el('circle', { class: 'orb-dot', cx: 0, cy: 0, r: 11, fill: `var(--orbit-${d.status === 'in' ? 'in' : 'act'})` });
      const label = el('text', { class: 'orb-label', x: 0, y: 0, 'text-anchor': 'middle', 'font-size': 24 });
      label.textContent = d.label;
      const value = el('text', { class: 'orb-value', x: 0, y: 0, 'text-anchor': 'middle', 'font-size': 27 });
      const valueNum = el('tspan', {});
      valueNum.textContent = d.value;
      const valueUnit = el('tspan', { class: 'orb-unit', 'font-size': 12, dx: 4 });
      valueUnit.textContent = d.unit;
      value.append(valueNum, valueUnit);
      g.append(spoke, hit, dot, label, value);
      g.style.transitionDelay = (0.5 + i * 0.08) + 's';
      spinG.appendChild(g);
      return { d, R: ORBIT_RINGS.r[d.ring], baseAngle, spoke, hit, dot, label, value, g };
    });

    const place = (gAngle) => {
      markers.forEach(m => {
        const a = (m.baseAngle + gAngle) * Math.PI / 180;
        const cx = m.R * Math.cos(a), cy = m.R * Math.sin(a);
        m.spoke.setAttribute('x2', cx); m.spoke.setAttribute('y2', cy);
        m.hit.setAttribute('cx', cx); m.hit.setAttribute('cy', cy);
        m.dot.setAttribute('cx', cx); m.dot.setAttribute('cy', cy);
        m.label.setAttribute('x', cx); m.label.setAttribute('y', cy + LBLOFF);
        m.value.setAttribute('x', cx); m.value.setAttribute('y', cy + LBLOFF + 34);
      });
    };
    place(0);

    // Corner caption — live counts from the data
    const nIn = ORBIT_DATA.filter(d => d.status === 'in').length;
    const nAct = ORBIT_DATA.length - nIn;
    const capBl = document.createElement('div');
    capBl.className = 'orbit-cap cap-bl';
    capBl.setAttribute('aria-hidden', 'true');
    capBl.innerHTML =
      `<span><i class="cap-dot in"></i>In range · ${nIn} markers</span>` +
      `<span><i class="cap-dot act"></i>Act on · ${nAct} markers</span>`;
    orbit.append(capBl);

    // Rotation (recompute positions each frame; labels never rotate → upright)
    let gAngle = 0, paused = false, last = null;
    const SPEED = 360 / 120000; // deg per ms → ~120s / revolution
    const frame = (now) => {
      if (last == null) last = now;
      const dt = now - last; last = now;
      if (!paused) { gAngle = (gAngle + dt * SPEED) % 360; place(gAngle); }
      requestAnimationFrame(frame);
    };

    // Interactions
    let pinned = null;
    const showTip = (m) => {
      const d = m.d;
      tip.innerHTML =
        `<div class="t-head"><span class="t-name">${d.full}</span>` +
        `<span class="t-status ${d.status}">${d.status === 'in' ? 'In range' : 'Act on'}</span></div>` +
        `<div class="t-range">Reference ${d.range} ${d.unit}</div>` +
        `<div class="t-blurb">${d.blurb}</div>`;
      tip.hidden = false;
      const orb = orbit.getBoundingClientRect(), dr = m.dot.getBoundingClientRect();
      let center = dr.left - orb.left + dr.width / 2;
      const half = tip.offsetWidth / 2;
      center = Math.max(half + 4, Math.min(orb.width - half - 4, center));
      tip.style.left = center + 'px';
      tip.style.top = (dr.top - orb.top) + 'px';
    };
    const activate = (m) => {
      paused = true;
      orbit.classList.add('is-dim');
      markers.forEach(x => { x.g.classList.toggle('is-active', x === m); });
      m.dot.setAttribute('r', 15);
      showTip(m);
    };
    const deactivate = () => {
      if (pinned) return;
      paused = false;
      orbit.classList.remove('is-dim');
      markers.forEach(x => { x.g.classList.remove('is-active'); x.dot.setAttribute('r', 11); });
      tip.hidden = true;
    };
    markers.forEach(m => {
      m.g.addEventListener('pointerenter', () => { if (!pinned) activate(m); });
      m.g.addEventListener('pointerleave', () => deactivate());
      m.g.addEventListener('focus', () => activate(m));
      m.g.addEventListener('blur', () => { if (pinned !== m) deactivate(); });
      m.g.addEventListener('click', () => {
        if (pinned === m) { pinned = null; deactivate(); }
        else { pinned = m; markers.forEach(x => x.g.classList.remove('is-active')); activate(m); }
      });
      m.g.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); m.g.click(); }
      });
    });

    // Reveal sequence
    const reveal = () => {
      orbit.classList.add('is-live');
      prog.style.strokeDashoffset = C * (1 - composite / 100);
      if (reduce) {
        scoreNum.textContent = composite;
        return; // no count-up, no rotation
      }
      const dur = 1200, start = performance.now();
      const tick = (now) => {
        const p = Math.min((now - start) / dur, 1);
        const e = 1 - Math.pow(1 - p, 3);
        scoreNum.textContent = Math.round(composite * e);
        if (p < 1) requestAnimationFrame(tick);
        else scoreNum.textContent = composite;
      };
      requestAnimationFrame(tick);
      setTimeout(() => { last = null; requestAnimationFrame(frame); }, 1700); // spin after markers settle
    };

    // The orbit is above the fold, so reveal at once if it's already on
    // screen; otherwise wait until it scrolls into view.
    const inView = () => {
      const r = orbit.getBoundingClientRect();
      return r.bottom > 0 && r.top < (window.innerHeight || document.documentElement.clientHeight);
    };
    if (inView() || !('IntersectionObserver' in window)) {
      reveal();
    } else {
      const io = new IntersectionObserver((entries) => {
        entries.forEach(e => { if (e.isIntersecting) { reveal(); io.disconnect(); } });
      }, { threshold: 0.25 });
      io.observe(orbit);
    }
  }

  /* ---------- Community (recipes + active updates) ---------- */
  // One system for both pages: cards carry data-tags (space-separated),
  // filter chips carry data-filter, unlocked cards carry data-detail pointing
  // at a hidden detail block rendered into the shared <dialog>.
  function initCommunity() {
    const grid = document.querySelector('[data-comm-grid]');
    if (!grid) return;
    const cards = [...grid.querySelectorAll('[data-tags]')];
    const chips = [...document.querySelectorAll('.filter-chip')];
    const count = document.querySelector('.comm-count');
    const noun = grid.getAttribute('data-comm-grid') || 'items';

    const apply = (filter) => {
      let shown = 0;
      cards.forEach(card => {
        const hit = filter === 'all' || card.getAttribute('data-tags').split(' ').includes(filter);
        card.hidden = !hit;
        if (hit) shown++;
      });
      if (count) count.textContent = `${shown} ${noun}`;
    };
    chips.forEach(chip => chip.addEventListener('click', () => {
      chips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      apply(chip.getAttribute('data-filter'));
    }));
    apply('all');

    // Detail dialog. <dialog> gives us Esc-to-close and a focus trap for free.
    const dialog = document.getElementById('commModal');
    if (dialog) {
      const inner = dialog.querySelector('.comm-modal-inner');
      const open = (id) => {
        const tpl = document.getElementById(id);
        if (!tpl) return;
        inner.innerHTML = tpl.innerHTML;
        dialog.showModal();
        // Deep-linkable: /recipes#chilli-con-carne reopens the same detail.
        history.replaceState(null, '', '#' + id);
      };
      const close = () => {
        dialog.close();
      };
      dialog.addEventListener('close', () => {
        history.replaceState(null, '', location.pathname);
        inner.innerHTML = '';
      });
      // Click on the backdrop (the dialog element itself) closes.
      dialog.addEventListener('click', (e) => { if (e.target === dialog) close(); });
      dialog.querySelector('.modal-close').addEventListener('click', close);
      grid.querySelectorAll('[data-detail]').forEach(card =>
        card.addEventListener('click', () => open(card.getAttribute('data-detail'))));
      const openFromHash = () => {
        const id = location.hash.slice(1);
        if (id && document.getElementById(id) && !dialog.open) open(id);
      };
      openFromHash();
      // Covers same-document hash navigation (a shared link pasted over the
      // current page) — scripts don't re-run in that case.
      window.addEventListener('hashchange', openFromHash);
    }
  }

  /* ---------- Init ---------- */
  function init() {
    buildHeader();
    buildFooter();
    initTheme();
    initReveal();
    initCounters();
    initHeroChart();
    initStars();
    initOrbit();
    initPanels();
    initParallax();
    initDashboard();
    initForm();
    initCommunity();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
