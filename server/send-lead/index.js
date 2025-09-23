// AWS Lambda handler for sending lead emails via Resend
// Environment variables required:
// RESEND_API_KEY, TO_EMAIL, FROM_EMAIL, ALLOW_ORIGIN (optional)

const RESEND_API = 'https://api.resend.com/emails';

function json(statusCode, body, origin) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': origin || '*',
      'Access-Control-Allow-Methods': 'POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
    body: JSON.stringify(body),
  };
}

exports.handler = async (event) => {
  const origin = process.env.ALLOW_ORIGIN || '*';
  if (event.requestContext && event.requestContext.http && event.requestContext.http.method === 'OPTIONS') {
    return json(200, { ok: true }, origin);
  }

  try {
    const data = typeof event.body === 'string' ? JSON.parse(event.body || '{}') : (event.body || {});
    const { name, company, email, phone, country, size, industry, function: primaryFunction, message, variant, utm_source, utm_medium, utm_campaign } = data;

    if (!name || !company || !email || !phone) {
      return json(400, { ok: false, error: 'Missing required fields' }, origin);
    }

    const html = `
      <div style="font-family:Inter,Arial,sans-serif;line-height:1.5;color:#0f172a">
        <h2 style="margin:0 0 8px">New GCCSETUPINDIA Lead</h2>
        <p style="margin:0 0 12px">Variant: <strong>${variant || ''}</strong></p>
        <table style="border-collapse:collapse;min-width:520px">
          <tr><td><strong>Name</strong></td><td>${escapeHtml(name)}</td></tr>
          <tr><td><strong>Company</strong></td><td>${escapeHtml(company)}</td></tr>
          <tr><td><strong>Email</strong></td><td>${escapeHtml(email)}</td></tr>
          <tr><td><strong>Phone</strong></td><td>${escapeHtml(phone)} ${country ? '(' + escapeHtml(country) + ')' : ''}</td></tr>
          <tr><td><strong>Company size</strong></td><td>${escapeHtml(size || '')}</td></tr>
          <tr><td><strong>Industry</strong></td><td>${escapeHtml(industry || '')}</td></tr>
          <tr><td><strong>Primary function</strong></td><td>${escapeHtml(primaryFunction || '')}</td></tr>
          <tr><td><strong>Message</strong></td><td>${escapeHtml(message || '')}</td></tr>
        </table>
        <p style="margin-top:12px;color:#475569">UTM: ${escapeHtml(utm_source || '')} / ${escapeHtml(utm_medium || '')} / ${escapeHtml(utm_campaign || '')}</p>
      </div>`;

    const subject = `New lead: ${name} — ${company}`;

    const resp = await fetch(RESEND_API, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: process.env.FROM_EMAIL,
        to: [process.env.TO_EMAIL],
        subject,
        html
      })
    });

    if (!resp.ok) {
      const text = await resp.text();
      console.error('Resend error', text);
      return json(502, { ok: false, error: 'Email send failed' }, origin);
    }

    return json(200, { ok: true }, origin);
  } catch (err) {
    console.error('Handler error', err);
    return json(500, { ok: false, error: 'Internal error' }, origin);
  }
};

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
