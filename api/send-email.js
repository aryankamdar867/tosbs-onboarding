/**
 * api/send-email.js
 * Vercel Serverless Function to proxy email sending via Resend.
 * Bypasses browser CORS restrictions by making the API call server-side from Node.js.
 */

export default async function handler(req, res) {
  // CORS & Security headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        // use as is
      }
    }

    const { to, subject, html, from, replyTo, apiKey } = body || {};

    if (!to) {
      return res.status(400).json({ error: 'Missing recipient email address (to).' });
    }
    if (!subject) {
      return res.status(400).json({ error: 'Missing email subject.' });
    }
    if (!html) {
      return res.status(400).json({ error: 'Missing email HTML content.' });
    }

    // Prioritize provided apiKey, then server environment variables
    const resendKey =
      (apiKey && apiKey.trim()) ||
      process.env.VITE_RESEND_API_KEY ||
      process.env.RESEND_API_KEY;

    if (!resendKey) {
      return res.status(500).json({ error: 'Resend API key is not configured.' });
    }

    const senderEmail =
      from ||
      process.env.VITE_RESEND_FROM_EMAIL ||
      process.env.RESEND_FROM_EMAIL ||
      'onboarding@resend.dev';

    const recipients = Array.isArray(to) ? to : [to.trim()];

    const payload = {
      from: senderEmail,
      to: recipients,
      subject: subject,
      html: html,
    };

    const hrReplyTo = replyTo || process.env.VITE_HR_EMAIL || process.env.HR_EMAIL || 'hrtosbs@gmail.com';
    if (hrReplyTo) {
      payload.reply_to = hrReplyTo;
    }

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendKey.trim()}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await resendResponse.json().catch(() => ({}));

    if (!resendResponse.ok) {
      const errorMsg = data?.message || data?.error?.message || `Resend API returned error status ${resendResponse.status}`;
      return res.status(resendResponse.status).json({
        error: errorMsg,
        details: data,
      });
    }

    return res.status(200).json({
      success: true,
      data: data,
    });
  } catch (err) {
    console.error('api/send-email error:', err);
    return res.status(500).json({
      error: err.message || 'Internal server error while dispatching email.',
    });
  }
}
