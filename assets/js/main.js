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
  // Absolute paths: header/footer are injected on nested pages too
  // (/activewear/classic-tee), where a relative "assets/…" would 404.
  const LOGO_DARK = '/assets/img/activelabs-logo.svg';
  const LOGO_LIGHT = '/assets/img/activelabs-logo-light.svg';

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
    ['/', 'How it works'],
    ['/what-we-test', 'What we test'],
    ['/longevity-lab', 'Longevity Lab'],
    ['/membership', 'Membership'],
    ['/for-teams', 'For teams'],
    { label: 'Community', children: [
      ['/recipes', 'Recipes'],
      ['/active-newsroom', 'Active newsroom'],
      ['/active-events', 'Active events'],
      ['/activewear', 'Activewear'],
    ] },
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

    // Stagger the mobile menu in. Done here, not in CSS, so the sequence keeps
    // working however many nav links there are.
    header.querySelectorAll('.mobile-menu > *').forEach((el, i) => {
      el.style.transitionDelay = (0.08 + i * 0.06).toFixed(2) + 's';
    });

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
    const setMenu = (open) => {
      document.body.classList.toggle('nav-open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.body.style.overflow = open ? 'hidden' : '';
      if (headerSync) headerSync();  // the bar sits on the cream menu while it's open
    };
    toggle.addEventListener('click', () => setMenu(!document.body.classList.contains('nav-open')));
    header.querySelectorAll('.mobile-menu a').forEach(a => a.addEventListener('click', () => setMenu(false)));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && document.body.classList.contains('nav-open')) { setMenu(false); toggle.focus(); }
    });

    // Scroll condense + over-dark-hero chrome. While the header floats over
    // the (always-dark) hero band it renders light-on-dark; once it condenses
    // onto the page background it reverts to theme-driven styling.
    const hasDarkHero = !!document.querySelector('.hero-centered');
    const sync = () => {
      const scrolled = window.scrollY > 20;
      header.classList.toggle('scrolled', scrolled);
      // An open mobile menu covers the hero, so the bar goes back to dark-on-light
      const overDark = hasDarkHero && !scrolled && !document.body.classList.contains('nav-open');
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
              <li><a href="/what-we-test">What we test</a></li>
              <li><a href="/membership">Membership</a></li>
              <li><a href="/for-teams">For teams</a></li>
              <li><a href="/recipes">Recipes</a></li>
              <li><a href="/active-newsroom">Active newsroom</a></li>
              <li><a href="/active-events">Active events</a></li>
              <li><a href="/activewear">Activewear</a></li>
              <li><a href="/about">About</a></li>
            </ul>
          </div>
          <div class="footer-col">
            <h4>Visit</h4>
            <ul>
              <li>Central Brighton &amp; Hove, coming soon</li>
              <li>Mon–Sat, by appointment</li>
              <li><a href="mailto:hello@activelabs.health">hello@activelabs.health</a></li>
              <li><a href="tel:+441273000000">+44 (0)1273 000 000</a></li>
            </ul>
          </div>
          <div class="footer-col">
            <h4>Follow</h4>
            <ul>
              <li><a href="#" rel="noopener">Instagram</a></li>
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
          <!-- Company details required on the website by the Company, LLP and Business
               (Names and Trading Disclosures) Regulations 2015: registered name, number,
               part of the UK where registered, and registered office address. -->
          <p class="footer-legal">Active Labs Health Ltd · Registered in England and Wales No. 17490364 · Registered office: 71-75 Shelton Street, Covent Garden, London WC2H 9JQ</p>
          <span class="footer-legal-links">
            <a href="/privacy">Privacy</a><a href="mailto:hello@activelabs.health">hello@activelabs.health</a>
          </span>
        </div>
      </div>
    `;
    document.body.appendChild(footer);
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
  // Placeholder data: the composite score is a weighted mean of the
  // per-marker scores and lands on 82. Every marker shown here must be in the
  // Comprehensive panel (see /what-we-test), and the blurbs are visitor-facing
  // copy, so they follow the house rules: no em dashes and no claims to
  // diagnose, treat or prevent anything.
  const ORBIT_RINGS = { r: [230, 340, 410], w: [3, 2, 1], base: [-90, -30, -60] };
  const ORBIT_DATA = [
    // inner ring (weight 3)
    { id: 'apob', label: 'ApoB', full: 'Apolipoprotein B', value: 65, unit: 'mg/dL', range: '< 90', ring: 0, status: 'in', score: 90, blurb: 'A count of the cholesterol-carrying particles in your blood that can enter artery walls. Many researchers see it as a clearer guide to cardiovascular risk than standard cholesterol alone, which is why we give it extra weight.' },
    { id: 'hba1c', label: 'HbA1c', full: 'Glycated haemoglobin', value: 5.9, unit: '%', range: '4.8–5.6', ring: 0, status: 'act', score: 68, blurb: 'Sugar attaches to your red blood cells as they circulate, and this measures how much: a three-month average of your blood glucose. It shows how your blood sugar is trending over time, not just on the day of the test.' },
    { id: 'crp', label: 'hs-CRP', full: 'High-sensitivity C-reactive protein', value: 2.4, unit: 'mg/L', range: '< 1.0', ring: 0, status: 'act', score: 62, blurb: 'A protein your liver releases when there is inflammation in the body. A low-level rise can reflect things like poor sleep, stress or a recent illness, so we always read it alongside your other results.' },
    // middle ring (weight 2)
    { id: 'ferritin', label: 'Ferritin', full: 'Serum ferritin', value: 95, unit: 'µg/L', range: '30–300', ring: 1, status: 'in', score: 92, blurb: 'Your body\'s store of iron. Levels vary a lot from person to person, and inflammation can raise it as well as iron, so we read it alongside the rest of your iron profile.' },
    { id: 'cortisol', label: 'Cortisol', full: 'Morning cortisol', value: 410, unit: 'nmol/L', range: '170–500', ring: 1, status: 'in', score: 94, blurb: 'Your main stress hormone, measured in the morning when it naturally peaks. It follows a daily rhythm shaped by sleep, training and stress, so a single reading is always read in context.' },
    { id: 'testo', label: 'Testosterone', full: 'Total testosterone', value: 18, unit: 'nmol/L', range: '10–30', ring: 1, status: 'in', score: 90, blurb: 'Supports muscle, bone, red blood cells, mood and drive. Levels tend to drift with age, sleep and stress, and tracking them over time shows what is normal for you.' },
    // outer ring (weight 1)
    { id: 'lpa', label: 'Lp(a)', full: 'Lipoprotein(a)', value: 40, unit: 'nmol/L', range: '< 75', ring: 2, status: 'in', score: 94, blurb: 'A cholesterol particle largely set by your genes, so diet and exercise barely move it. Because it stays fairly stable through life, a single reading gives a useful long-term picture.' },
    { id: 'vitd', label: 'Vit D', full: 'Vitamin D (25-hydroxy)', value: 68, unit: 'nmol/L', range: '75–125', ring: 2, status: 'act', score: 68, blurb: 'Made in your skin from sunlight, and closer to a hormone than a vitamin. It plays a part in bone, muscle and immune function, and many people in the UK run low through the winter months.' },
    { id: 'tsh', label: 'TSH', full: 'Thyroid-stimulating hormone', value: 2.1, unit: 'mIU/L', range: '0.4–4.0', ring: 2, status: 'in', score: 94, blurb: 'The signal your brain sends to your thyroid, which sets the pace of your metabolism. Read with free T3 and T4, it shows how your thyroid is working, and changes can affect energy, weight, mood and heart rate.' },
  ];

  /* ---------- Starfield behind the hero (always-dark band) ---------- */
  // A static night sky in three depth layers: a haze of faint far stars, a
  // scatter of mid stars and a few bright near ones, over a faint Milky Way
  // band. Seeded, so it is the same sky on every visit. Star counts scale with
  // the hero's area; mid and near stars keep clear of the headline, copy and
  // buttons, and near stars keep off the orbit. Redrawn when the hero changes
  // size (rotation, resize, late font swap). No motion.
  function initStars() {
    const hero = document.querySelector('.hero-centered');
    if (!hero) return;

    const NS = 'http://www.w3.org/2000/svg';
    const el = (tag, attrs) => {
      const n = document.createElementNS(NS, tag);
      for (const k in attrs) n.setAttribute(k, attrs[k]);
      return n;
    };
    const svg = el('svg', { class: 'hero-stars', 'aria-hidden': 'true', focusable: 'false' });
    hero.prepend(svg);

    // Small seeded PRNG (mulberry32): same numbers in, same sky out.
    const seeded = seed => () => {
      seed = (seed + 0x6D2B79F5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    const gauss = rnd => Math.sqrt(-2 * Math.log(1 - rnd())) * Math.cos(2 * Math.PI * rnd());
    // Mostly neutral white; a few faintly blue-white or warm, as real stars are.
    const tint = c => (c < 0.16 ? '#D3DDEF' : c < 0.27 ? '#F1DEC4' : '#EEEAE2');
    // Stars per 10,000 px² of hero. The area is clamped so a phone still gets
    // a full sky and a very wide screen doesn't draw thousands of nodes.
    const DENSITY = { far: 1.9, mid: 0.58, near: 0.08 };
    // Layout boxes relative to the hero, ignoring the .hero-fade entrance
    // transform (offset* values are untransformed).
    const origin = n => { let x = 0, y = 0; for (let e = n; e; e = e.offsetParent) { x += e.offsetLeft; y += e.offsetTop; } return [x, y]; };

    let lastW = 0, lastH = 0;
    function draw(force) {
      const W = hero.clientWidth, H = hero.clientHeight;
      if (!W || !H) return;
      if (!force && W === lastW && Math.abs(H - lastH) < 2) return;
      lastW = W; lastH = H;
      const area = Math.min(Math.max(W * H, 550000), 2600000) / 10000;

      const [hx, hy] = origin(hero);
      const pad = 18;
      const text = [...hero.querySelectorAll('.hero-intro .eyebrow, .hero-intro .display, .hero-body, .hero-actions')]
        .map(n => { const [x, y] = origin(n); return { l: x - hx - pad, t: y - hy - pad, r: x - hx + n.offsetWidth + pad, b: y - hy + n.offsetHeight + pad }; });
      const inText = (x, y) => text.some(b => x > b.l && x < b.r && y > b.t && y < b.b);
      const orbitEl = hero.querySelector('.orbit');
      let orbit = null;
      if (orbitEl) {
        const [ox, oy] = origin(orbitEl);
        orbit = { x: ox - hx + orbitEl.offsetWidth / 2, y: oy - hy + orbitEl.offsetHeight / 2, r: orbitEl.offsetWidth * 0.42 };
      }
      const inOrbit = (x, y) => !!orbit && Math.hypot(x - orbit.x, y - orbit.y) < orbit.r;

      // Milky Way band: a diagonal strip through the middle of the hero,
      // steeper on portrait screens so it still crosses the width.
      const deg = W < H ? -58 : -20, ang = deg * Math.PI / 180;
      const dx = Math.cos(ang), dy = Math.sin(ang);
      const cx = W / 2, cy = H / 2, len = Math.hypot(W, H);
      const spread = Math.min(W, H) * 0.09;
      const point = (rnd, banded) => {
        if (!banded) return [rnd() * W, rnd() * H];
        const t = (rnd() - 0.5) * len, o = gauss(rnd) * spread;
        return [cx + dx * t - dy * o, cy + dy * t + dx * o];
      };

      const frag = document.createDocumentFragment();
      const defs = el('defs', {});
      const grad = (id, color, op) => {
        const g = el('radialGradient', { id });
        g.append(el('stop', { offset: '0%', 'stop-color': color, 'stop-opacity': op }),
                 el('stop', { offset: '100%', 'stop-color': color, 'stop-opacity': '0' }));
        defs.appendChild(g);
      };
      grad('starHalo', '#EEEAE2', '0.45');
      grad('skyDust', '#C8D2E4', '1');
      frag.appendChild(defs);

      // A soft glow along the band, in three overlapping patches so it
      // doesn't read as one neat stripe.
      [[0.5, 0.42, 2.6, 0.045], [0.3, 0.16, 1.8, 0.035], [0.74, 0.14, 1.5, 0.03]].forEach(([at, rx, ry, op]) => {
        const t = (at - 0.5) * len, x = cx + dx * t, y = cy + dy * t;
        frag.appendChild(el('ellipse', {
          cx: x.toFixed(1), cy: y.toFixed(1), rx: (len * rx).toFixed(1), ry: (spread * ry).toFixed(1),
          transform: `rotate(${deg} ${x.toFixed(1)} ${y.toFixed(1)})`, fill: 'url(#skyDust)', opacity: op,
        }));
      });

      const dot = (x, y, r, c, o) => el('circle', { cx: x.toFixed(1), cy: y.toFixed(1), r: r.toFixed(2), fill: tint(c), opacity: o.toFixed(2) });
      const layer = (name, seed, bandShare, avoid, make) => {
        const rnd = seeded(seed);
        const n = Math.round(DENSITY[name] * area);
        for (let i = 0, tries = 0; i < n && tries < n * 5; tries++) {
          const banded = rnd() < bandShare;
          const [x, y] = point(rnd, banded);
          const m = rnd(), c = rnd();
          if (x < 0 || x > W || y < 0 || y > H || (avoid && avoid(x, y))) continue;
          make(x, y, m, c);
          i++;
        }
      };
      // Far: tiny and faint, the haze that gives the sky its depth.
      layer('far', 11, 0.45, null, (x, y, m, c) => {
        const k = Math.pow(m, 1.6);
        frag.appendChild(dot(x, y, 0.5 + k * 0.35, c, 0.22 + k * 0.33));
      });
      // Mid: small, medium brightness.
      layer('mid', 23, 0.25, inText, (x, y, m, c) => {
        const k = Math.pow(m, 1.4);
        frag.appendChild(dot(x, y, 0.75 + k * 0.45, c, 0.45 + k * 0.3));
      });
      // Near: a handful of bright stars, most with a soft halo.
      layer('near', 37, 0, (x, y) => inText(x, y) || inOrbit(x, y), (x, y, m, c) => {
        if (m > 0.3) frag.appendChild(el('circle', { cx: x.toFixed(1), cy: y.toFixed(1), r: (5 + m * 3).toFixed(1), fill: 'url(#starHalo)' }));
        frag.appendChild(dot(x, y, 1.1 + m * 0.5, c, 0.85 + m * 0.15));
      });

      svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
      svg.replaceChildren(frag);
    }

    draw(true);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => draw(true));
    if ('ResizeObserver' in window) {
      let raf = 0;
      new ResizeObserver(() => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => draw(false)); }).observe(hero);
    }
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

  /* ---------- What We Test: biomarker explorer ---------- */
  // Every marker card is already in the HTML. This filters the cards by panel,
  // body system and search, and copies a card's hidden .mx-detail block into the
  // side drawer (a <dialog>: Esc-to-close and a focus trap for free).
  function initMarkers() {
    const root = document.querySelector('[data-mx]');
    if (!root) return;
    const items = [...root.querySelectorAll('.mx-item')];
    const groups = [...root.querySelectorAll('.mx-group')];
    const panels = [...root.querySelectorAll('.mx-panel[data-panel]')];
    const chips = [...root.querySelectorAll('.mx-chip')];
    const input = root.querySelector('#mxSearch');
    const clear = root.querySelector('.mx-clear');
    const count = root.querySelector('.mx-count');
    const empty = root.querySelector('.mx-empty');
    const panelName = { foundation: 'Foundation Panel', comprehensive: 'Comprehensive Panel' };
    const state = { panel: 'comprehensive', cat: 'all', q: '' };

    // Same normalising as the data-search attributes: lower case, no accents,
    // punctuation to spaces, so "lp(a)" finds Lipoprotein(a) and "b12" finds both B12s.
    const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, ' ').trim();
    const esc = (s) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
    const names = items.map((it) => {
      const el = it.querySelector('.mx-card-name');
      return { el, text: el.textContent };
    });
    // Search matches the start of words, so "vit" finds vitamins but not "sensitivity"
    const hay = items.map((it) => it.dataset.search.split(' '));
    // Highlight the typed text in the marker name, when it appears there as typed
    const mark = ({ el, text }, raw) => {
      const i = raw ? text.toLowerCase().indexOf(raw.toLowerCase()) : -1;
      if (i < 0) { if (el.childElementCount) el.textContent = text; return; }
      el.innerHTML = esc(text.slice(0, i)) + '<mark>' + esc(text.slice(i, i + raw.length)) + '</mark>' + esc(text.slice(i + raw.length));
    };

    const apply = () => {
      const raw = state.q.trim();
      const words = norm(raw).split(' ').filter(Boolean);
      const inPanel = {};
      const matched = {};
      let total = 0;
      let shown = 0;
      items.forEach((it, i) => {
        const cat = it.dataset.cat;
        const okPanel = it.dataset.panels.split(' ').includes(state.panel);
        const okSearch = words.every((w) => hay[i].some((h) => h.startsWith(w)));
        if (okPanel) inPanel[cat] = (inPanel[cat] || 0) + 1;
        if (okPanel && okSearch) { matched[cat] = (matched[cat] || 0) + 1; total++; }
        const hit = okPanel && okSearch && (state.cat === 'all' || cat === state.cat);
        it.hidden = !hit;
        if (hit) shown++;
        mark(names[i], hit ? raw : '');
      });
      // A body system the chosen panel doesn't cover can't stay selected
      if (state.cat !== 'all' && !inPanel[state.cat]) { setCat('all'); return; }

      // Chips: hide systems the panel doesn't cover, grey out ones the search rules out
      chips.forEach((chip) => {
        const c = chip.dataset.cat;
        const n = c === 'all' ? total : (matched[c] || 0);
        chip.querySelector('.mx-chip-n').textContent = n;
        chip.hidden = c !== 'all' && !inPanel[c];
        chip.disabled = n === 0 && c !== state.cat;
      });
      groups.forEach((g) => {
        const n = g.querySelectorAll('.mx-item:not([hidden])').length;
        g.hidden = n === 0;
        g.querySelector('.mx-group-n').textContent = n;
      });
      const catName = state.cat === 'all' ? '' : chips.find((c) => c.dataset.cat === state.cat).dataset.name;
      const n = (k, one, many) => `${k} ${k === 1 ? one : many}`;
      if (raw) count.textContent = `${n(shown, 'result', 'results')} for ‘${raw}’${catName ? ' in ' + catName : ''}`;
      else if (catName) count.textContent = `${n(shown, 'marker', 'markers')} in ${catName}`;
      else count.textContent = `${n(shown, 'marker', 'markers')} in the ${panelName[state.panel]}`;
      empty.hidden = shown > 0;
      root.dataset.panel = state.panel;
    };
    const setCat = (cat) => {
      state.cat = cat;
      chips.forEach((c) => {
        const on = c.dataset.cat === cat;
        c.classList.toggle('active', on);
        c.setAttribute('aria-pressed', on);
      });
      apply();
    };
    const setQuery = (q) => {
      input.value = state.q = q;
      clear.hidden = !q;
    };

    panels.forEach((b) => b.addEventListener('click', () => {
      state.panel = b.dataset.panel;
      panels.forEach((p) => p.setAttribute('aria-pressed', p === b));
      apply();
    }));
    chips.forEach((c) => c.addEventListener('click', () => setCat(c.dataset.cat)));
    input.addEventListener('input', () => { setQuery(input.value); apply(); });
    clear.addEventListener('click', () => { setQuery(''); apply(); input.focus(); });
    root.querySelectorAll('.mx-pop').forEach((b) => b.addEventListener('click', () => {
      setQuery(b.textContent);
      setCat('all');
    }));
    root.querySelector('.mx-reset').addEventListener('click', () => {
      setQuery('');
      setCat('all');
      input.focus();
    });
    apply();

    // Detail drawer
    const drawer = document.getElementById('mxDrawer');
    if (!drawer) return;
    const body = drawer.querySelector('.mx-drawer-body');
    const open = (id) => {
      const item = document.getElementById(id);
      if (!item || !item.classList.contains('mx-item')) return;
      body.innerHTML = item.querySelector('.mx-detail').innerHTML;
      const title = body.querySelector('h2');
      if (title) title.id = 'mxDrawerTitle';
      if (!drawer.open) drawer.showModal();
      body.scrollTop = 0;
      // Deep-linkable: /what-we-test#ferritin reopens the same marker
      history.replaceState(null, '', '#' + id);
    };
    drawer.addEventListener('close', () => {
      // The close event is queued, so it can land after a quick reopen: leave that one alone
      if (drawer.open) return;
      history.replaceState(null, '', location.pathname + location.search);
      body.innerHTML = '';
    });
    // A click on the backdrop lands on the dialog element itself
    drawer.addEventListener('click', (e) => { if (e.target === drawer) drawer.close(); });
    drawer.querySelector('.mx-drawer-close').addEventListener('click', () => drawer.close());
    root.addEventListener('click', (e) => {
      const card = e.target.closest('.mx-card');
      if (card) open(card.closest('.mx-item').id);
    });
    const openFromHash = () => {
      const id = decodeURIComponent(location.hash.slice(1));
      if (id) open(id);
    };
    openFromHash();
    window.addEventListener('hashchange', openFromHash);
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
    initMarkers();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
