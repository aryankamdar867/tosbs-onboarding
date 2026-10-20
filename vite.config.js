import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Local dev middleware to handle /api/send-email during `npm run dev`
const localEmailDevPlugin = () => ({
  name: 'local-email-dev-plugin',
  configureServer(server) {
    server.middlewares.use(async (req, res, next) => {
      if (req.url === '/api/send-email' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => {
          body += chunk;
        });
        req.on('end', async () => {
          try {
            const parsed = JSON.parse(body || '{}');
            const apiKey =
              parsed.apiKey ||
              process.env.VITE_RESEND_API_KEY;

            const payload = {
              from: parsed.from || 'onboarding@resend.dev',
              to: Array.isArray(parsed.to) ? parsed.to : [parsed.to],
              subject: parsed.subject,
              html: parsed.html,
            };

            if (parsed.replyTo) {
              payload.reply_to = parsed.replyTo;
            }

            const response = await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey.trim()}`,
              },
              body: JSON.stringify(payload),
            });

            const data = await response.json().catch(() => ({}));
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = response.status;
            res.end(
              JSON.stringify(
                response.ok
                  ? { success: true, data }
                  : { error: data?.message || 'Resend error', details: data }
              )
            );
          } catch (err) {
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = 500;
            res.end(JSON.stringify({ error: err.message || 'Server error' }));
          }
        });
      } else {
        next();
      }
    });
  },
});

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), localEmailDevPlugin()],
})
