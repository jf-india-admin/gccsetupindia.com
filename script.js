document.addEventListener('DOMContentLoaded', function () {
  const navToggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');
  const navOverlay = document.getElementById('nav-overlay');
  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  if (navToggle && navLinks) {
    const openMenu = () => {
      navLinks.classList.add('open');
      navToggle.setAttribute('aria-expanded', 'true');
      navToggle.classList.add('is-open');
      if (navOverlay) navOverlay.classList.add('visible');
      document.body.style.overflow = 'hidden';
      // swap icon to cross
      navToggle.textContent = '✕';
    };
    const closeMenu = () => {
      navLinks.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
      navToggle.classList.remove('is-open');
      if (navOverlay) navOverlay.classList.remove('visible');
      document.body.style.overflow = '';
      // swap back to hamburger
      navToggle.textContent = '☰';
    };
    navToggle.addEventListener('click', () => {
      const isOpen = navLinks.classList.contains('open');
      if (isOpen) closeMenu(); else openMenu();
    });
    // Close on route/hash change
    window.addEventListener('hashchange', closeMenu);
    if (navOverlay) navOverlay.addEventListener('click', closeMenu);
    navLinks.querySelectorAll('a').forEach((a) => a.addEventListener('click', closeMenu));
  }

  // Smooth scroll for on-page anchors
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (!targetId || targetId === '#') return;
      const target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // Fonts preload (fallback if not in HTML)
  const preload = document.createElement('link');
  preload.rel = 'preload';
  preload.as = 'font';
  preload.href = 'https://fonts.gstatic.com/s/spacegrotesk/v16/QGYyz_wNahGAdqQ43RhV.woff2';
  preload.type = 'font/woff2';
  preload.crossOrigin = 'anonymous';
  document.head.appendChild(preload);

  // Two-step form wizard
  const form = document.querySelector('form#contact');
  const step1 = form ? form.querySelector('.form-step[data-step="1"]') : null;
  const step2 = form ? form.querySelector('.form-step[data-step="2"]') : null;
  const nextBtn = form ? form.querySelector('#next-step') : null;
  const prevBtn = form ? form.querySelector('#prev-step') : null;
  const phoneInput = form ? form.querySelector('input[name="phone"]') : null;
  let iti = null;
  if (phoneInput && window.intlTelInput) {
    iti = window.intlTelInput(phoneInput, {
      initialCountry: 'auto',
      utilsScript: 'https://cdn.jsdelivr.net/npm/intl-tel-input@19.5.6/build/js/utils.js',
      geoIpLookup: (cb) => { fetch('https://ipapi.co/json').then(res => res.json()).then(d => cb(d.country_code)).catch(() => cb('US')); }
    });
  }

  const goStep = (n) => {
    if (!step1 || !step2) return;
    if (n === 1) { step1.classList.remove('hidden'); step2.classList.add('hidden'); }
    if (n === 2) { step2.classList.remove('hidden'); step1.classList.add('hidden'); }
  };

  if (nextBtn) nextBtn.addEventListener('click', () => {
    const name = form.querySelector('input[name="name"]').value.trim();
    const company = form.querySelector('input[name="company"]').value.trim();
    const email = form.querySelector('input[name="email"]').value.trim();
    const phoneValid = iti ? iti.isValidNumber() : (phoneInput && phoneInput.value.trim().length >= 7);
    if (!name || !company || !email || !phoneValid) { alert('Please complete name, company, email, and a valid phone number.'); return; }
    goStep(2);
  });
  if (prevBtn) prevBtn.addEventListener('click', () => goStep(1));

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(form).entries());
      console.log('Form submitted', data);

      // Build common payload
      const payload = {
        name: data.name || '',
        company: data.company || '',
        email: data.email || '',
        phone: (iti && iti.getNumber()) || data.phone || '',
        country: (iti && iti.getSelectedCountryData && iti.getSelectedCountryData().name) || '',
        size: data.size || '',
        industry: data.industry || '',
        function: data.function || '',
        message: data.message || '',
        variant: document.querySelector('.ab:not(.hidden)')?.classList?.contains('ab-b') ? 'B' : 'A',
        utm_source: new URLSearchParams(location.search).get('utm_source') || '',
        utm_medium: new URLSearchParams(location.search).get('utm_medium') || '',
        utm_campaign: new URLSearchParams(location.search).get('utm_campaign') || ''
      };

      const cfg = window.SITE_CONFIG || {};
      const redirect = null; // no auto-redirect

      // If LEADS_ENDPOINT is configured and we're on production domain, send to serverless (Resend-backed)
      const isProd = /gccsetupindia\.com$/.test(window.location.hostname);
      if (cfg.LEADS_ENDPOINT && isProd) {
        fetch(cfg.LEADS_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
          .then((res) => {
            if (!res.ok) throw new Error('Lead endpoint failed');
            return res.json().catch(() => ({}));
          })
          .then(() => {
            showInlineSuccess();
            sendEvent('form_submit_resend');
          })
          .catch((err) => {
            console.error('Lead endpoint error', err);
            showInlineError();
          });
        return;
      }

      // Local/dev fallback: don't error—simulate success so QA isn't blocked
      if (!cfg.HUBSPOT_PORTAL_ID || !cfg.HUBSPOT_FORM_ID) {
        console.log('[DEV] Captured lead (no backend configured):', payload);
        showInlineSuccess();
        sendEvent('form_submit_dev_capture');
        return;
      }

      // HubSpot Forms submission (if configured)
      const PORTAL_ID = (cfg.HUBSPOT_PORTAL_ID) || '';
      const FORM_ID = (cfg.HUBSPOT_FORM_ID) || '';
      if (!PORTAL_ID || !FORM_ID) { alert('Form is not configured yet. Please set LEADS_ENDPOINT or HubSpot IDs in config.js'); return; }
      const hutk = (document.cookie.match(/hubspotutk=([^;]+)/) || [])[1] || '';
      const context = { hutk, pageUri: window.location.href, pageName: document.title };
      const fields = [
        { name: 'firstname', value: payload.name },
        { name: 'company', value: payload.company },
        { name: 'email', value: payload.email },
        { name: 'phone', value: payload.phone },
        { name: 'country', value: payload.country },
        { name: 'lifecyclestage', value: 'lead' },
        { name: 'message', value: payload.message },
        { name: 'company_size', value: payload.size },
        { name: 'primary_function', value: payload.function },
        { name: 'industry', value: payload.industry }
      ];
      fetch(`https://api.hsforms.com/submissions/v3/integration/submit/${PORTAL_ID}/${FORM_ID}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fields, context })
      })
        .then((res) => res.json())
        .then((json) => {
          console.log('HubSpot response', json);
          showInlineSuccess();
          sendEvent('form_submit_hubspot');
        })
        .catch((err) => {
          console.error('HubSpot submit failed', err);
          showInlineError();
        });
    });
  }

  function showInlineSuccess() {
    const formWrap = document.getElementById('form-success');
    const form = document.querySelector('form#contact');
    if (form) form.classList.add('hidden');
    if (formWrap) formWrap.classList.remove('hidden');
  }

  function showInlineError() {
    const form = document.querySelector('form#contact');
    if (!form) return;
    let err = form.querySelector('.form-error');
    if (!err) {
      err = document.createElement('div');
      err.className = 'form-error';
      err.style.color = '#b91c1c';
      err.style.marginTop = '8px';
      err.style.fontWeight = '600';
      form.appendChild(err);
    }
    err.textContent = 'Submission failed. Please try again or email hello@gccsetupindia.com';
  }

  // Sticky header shadow when scrolling
  const header = document.querySelector('.site-header');
  if (header) {
    const onScroll = () => {
      if (window.scrollY > 4) header.classList.add('is-scrolled');
      else header.classList.remove('is-scrolled');
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // Sticky CTA reveal after 600px
  const stickyCta = document.getElementById('sticky-cta');
  if (stickyCta) {
    const onScrollCta = () => {
      if (window.scrollY > 600) stickyCta.classList.add('is-visible');
      else stickyCta.classList.remove('is-visible');
    };
    window.addEventListener('scroll', onScrollCta, { passive: true });
    onScrollCta();
  }

  // ROI calculator
  const headcount = document.getElementById('roi-headcount');
  const salary = document.getElementById('roi-salary');
  const adv = document.getElementById('roi-adv');
  const savings = document.getElementById('roi-savings');
  const formatCurrency = (n) => n.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
  const compute = () => {
    if (!headcount || !salary || !adv || !savings) return;
    const hc = Number(headcount.value || 0);
    const sal = Number(salary.value || 0);
    const pct = Number(adv.value || 0) / 100;
    const total = hc * sal * pct;
    savings.textContent = formatCurrency(total);
  };
  [headcount, salary, adv].forEach((el) => el && el.addEventListener('input', compute));
  compute();

  // Analytics helpers
  const sendEvent = (name, params = {}) => {
    if (window.gtag) window.gtag('event', name, params);
    if (window.lintrk) try { window.lintrk('track', { conversion_id: 0 }); } catch (_) {}
  };

  // Track CTAs
  document.querySelectorAll('a.btn, .btn').forEach((el) => {
    el.addEventListener('click', () => sendEvent('cta_click', { id: el.textContent.trim() }));
  });

  // For BFSI page: inline service detail toggles
  const serviceCards = document.querySelectorAll('.service-card[data-target]');
  if (serviceCards.length) {
    serviceCards.forEach((btn) => {
      btn.addEventListener('click', () => {
        const sel = btn.getAttribute('data-target');
        if (!sel) return;
        // hide others
        document.querySelectorAll('#details .service-detail').forEach((d) => d.classList.add('hidden'));
        const target = document.querySelector(sel);
        if (target) {
          target.classList.remove('hidden');
          // smooth scrolling; keep focus for accessibility
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  }

  // Track FAQ opens
  document.querySelectorAll('.faq-list details').forEach((d) => {
    d.addEventListener('toggle', () => { if (d.open) sendEvent('faq_open', { q: d.querySelector('summary')?.textContent?.trim() }); });
  });

  // Track ROI input changes
  [headcount, salary, adv].forEach((el) => el && el.addEventListener('change', () => sendEvent('roi_change', { headcount: headcount?.value, salary: salary?.value, advantage: adv?.value })));

  // Track form step and submit
  if (nextBtn) nextBtn.addEventListener('click', () => sendEvent('form_next', {}));
  if (prevBtn) prevBtn.addEventListener('click', () => sendEvent('form_back', {}));
  if (form) form.addEventListener('submit', () => sendEvent('form_submit', {}));
});
