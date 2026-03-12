/**
 * Backend Proxy Server for Peta Gudang
 * Proxies API requests to pemetaan-lahan.portalkdkmp.id to avoid CORS.
 */
import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3001;

const TARGET_BASE = 'https://pemetaan-lahan.portalkdkmp.id';

// Allow requests from Vite dev server and GitHub Pages
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:4173',
    'https://diperma.github.io'
  ],
}));

/**
 * Proxy handler — forwards request to the target, copying relevant headers.
 */
async function proxyRequest(targetUrl, req, res) {
  try {
    // Build headers to forward
    const forwardHeaders = {
      'Accept': req.headers['accept'] || 'application/json',
      'User-Agent': req.headers['user-agent'] || 'PetaGudang-Proxy/1.0',
    };

    // Forward Inertia headers if present
    if (req.headers['x-inertia']) {
      forwardHeaders['X-Inertia'] = req.headers['x-inertia'];
    }
    if (req.headers['x-inertia-version']) {
      forwardHeaders['X-Inertia-Version'] = req.headers['x-inertia-version'];
    }

    const response = await fetch(targetUrl, {
      method: req.method,
      headers: forwardHeaders,
    });

    // Forward response status
    res.status(response.status);

    // Forward content-type
    const contentType = response.headers.get('content-type');
    if (contentType) {
      res.set('Content-Type', contentType);
    }

    // Read body and send
    const body = await response.text();
    res.send(body);
  } catch (error) {
    console.error(`Proxy error for ${targetUrl}:`, error.message);
    res.status(502).json({ error: 'Proxy request failed', detail: error.message });
  }
}

/**
 * /api/* — proxy to TARGET_BASE/api/*
 */
app.all('/api/*', (req, res) => {
  const targetPath = req.originalUrl; // e.g. /api/filters/provinsi?...
  const targetUrl = `${TARGET_BASE}${targetPath}`;
  console.log(`[PROXY] ${req.method} ${targetPath} -> ${targetUrl}`);
  proxyRequest(targetUrl, req, res);
});

/**
 * /proxy/dashboard-lahan — proxy to TARGET_BASE/dashboard-lahan
 * Used for the Inertia dashboard endpoint.
 */
app.all('/proxy/dashboard-lahan', (req, res) => {
  const queryString = req.originalUrl.split('?')[1] || '';
  const targetUrl = `${TARGET_BASE}/dashboard-lahan${queryString ? '?' + queryString : ''}`;
  console.log(`[PROXY] ${req.method} /proxy/dashboard-lahan -> ${targetUrl}`);
  proxyRequest(targetUrl, req, res);
});

// IMPORTANT: Export app for Vercel Serverless Functions
export default app;

// Only listen locally if not running on Vercel
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`✅ Backend proxy running on http://localhost:${PORT}`);
    console.log(`   Proxying requests to ${TARGET_BASE}`);
  });
}
