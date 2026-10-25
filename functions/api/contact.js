// Cloudflare Pages Function: POST /api/contact
// Emails the submission to tim@fizzion.ai via Resend.
// Required env var: RESEND_API_KEY
// Optional env vars: CONTACT_TO (default tim@fizzion.ai), CONTACT_FROM (default onboarding@resend.dev)

export async function onRequestPost({ request, env }) {
  try {
    const data = await request.json();

    // Honeypot: real people leave this empty. Bots fill it. Pretend success.
    if (data.company_hp) return json({ ok: true });

    const clean = (v, n) => (v == null ? '' : String(v)).slice(0, n).trim();
    const name = clean(data.name, 200);
    const email = clean(data.email, 200);
    const company = clean(data.company, 200);
    const kind = clean(data.kind, 120);
    const problem = clean(data.problem, 6000);

    if (!email || !problem) return json({ ok: false, error: 'missing_fields' }, 400);

    const key = env.RESEND_API_KEY;
    const to = env.CONTACT_TO || 'tim@fizzion.ai';
    const from = env.CONTACT_FROM || 'Sawtooth Site <onboarding@resend.dev>';
    if (!key) return json({ ok: false, error: 'not_configured' }, 500);

    const subject = `New inquiry: ${name || email}${company ? ' (' + company + ')' : ''}`;
    const text = [
      `Name: ${name || '(not given)'}`,
      `Email: ${email}`,
      `Company: ${company || '(not given)'}`,
      `About: ${kind || '(not given)'}`,
      '',
      'What they are trying to figure out:',
      problem
    ].join('\n');

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: [to], reply_to: email, subject, text })
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      return json({ ok: false, error: 'send_failed', detail: detail.slice(0, 300) }, 502);
    }
    return json({ ok: true });
  } catch (e) {
    return json({ ok: false, error: 'bad_request' }, 400);
  }
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}
