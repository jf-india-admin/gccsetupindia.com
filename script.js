document.addEventListener('DOMContentLoaded', function () {
  const navToggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');
  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      const isOpen = navLinks.style.display === 'flex';
      navLinks.style.display = isOpen ? 'none' : 'flex';
      navToggle.setAttribute('aria-expanded', String(!isOpen));
    });
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
      // HubSpot Forms submission
      const PORTAL_ID = (window.SITE_CONFIG && window.SITE_CONFIG.HUBSPOT_PORTAL_ID) || '';
      const FORM_ID = (window.SITE_CONFIG && window.SITE_CONFIG.HUBSPOT_FORM_ID) || '';
      const hutk = (document.cookie.match(/hubspotutk=([^;]+)/) || [])[1] || '';
      const context = {
        hutk,
        pageUri: window.location.href,
        pageName: document.title
      };
      const fields = [
        { name: 'firstname', value: data.name || '' },
        { name: 'company', value: data.company || '' },
        { name: 'email', value: data.email || '' },
        { name: 'phone', value: (iti && iti.getNumber()) || data.phone || '' },
        { name: 'country', value: (iti && iti.getSelectedCountryData && iti.getSelectedCountryData().name) || '' },
        { name: 'lifecyclestage', value: 'lead' },
        { name: 'message', value: data.message || '' },
        { name: 'company_size__c', value: data.size || '' },
        { name: 'primary_function__c', value: data.function || '' },
        { name: 'industry', value: data.industry || '' }
      ];
      if (!PORTAL_ID || !FORM_ID) { alert('Form is not configured yet. Please set HUBSPOT IDs in config.js'); return; }
      fetch(`https://api.hsforms.com/submissions/v3/integration/submit/${PORTAL_ID}/${FORM_ID}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields, context })
      })
      .then((res) => res.json())
      .then((json) => {
        console.log('HubSpot response', json);
        alert('Thanks! We will reach out within 24 hours.');
        sendEvent('form_submit_hubspot');
        const redirect = (window.SITE_CONFIG && window.SITE_CONFIG.CALENDLY_URL) || 'https://calendly.com/';
        window.location.href = redirect;
      })
      .catch((err) => {
        console.error('HubSpot submit failed', err);
        alert('Submission failed. Please try again or email hello@indgcc.example');
      });
    });
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
