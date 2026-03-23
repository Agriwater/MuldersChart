import cors from 'cors';
import express from 'express';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const bundledDataFile = path.join(rootDir, 'data', 'mulders-graph.json');
const dataFile = process.env.GRAPH_DATA_FILE
  ? path.resolve(process.env.GRAPH_DATA_FILE)
  : bundledDataFile;
const sitePassword = process.env.SITE_PASSWORD || 'Aw26Demo';
const accessCookieName = 'mulders_site_access';
const accessCookieValue = crypto.createHash('sha256').update(sitePassword).digest('hex');

const app = express();
const port = Number(process.env.PORT || 4321);
const host = process.env.HOST || '0.0.0.0';

app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use(express.json({ limit: '1mb' }));

function parseCookies(request) {
  const header = request.headers.cookie;
  if (!header) {
    return {};
  }

  return Object.fromEntries(header.split(';').map((part) => {
    const [name, ...rest] = part.trim().split('=');
    return [name, decodeURIComponent(rest.join('='))];
  }));
}

function hasSiteAccess(request) {
  return parseCookies(request)[accessCookieName] === accessCookieValue;
}

function createCookieHeader(maxAgeSeconds) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `${accessCookieName}=${accessCookieValue}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}${secure}`;
}

function clearCookieHeader() {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `${accessCookieName}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`;
}

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function sendLoginPage(response, message = '') {
  const detail = message ? `<p class="login-error">${escapeHtml(message)}</p>` : '';
  response.setHeader('Cache-Control', 'no-store');
  response.status(401).type('html').send(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Protected Demo</title>
    <style>
      :root {
        color-scheme: dark;
        --bg: #04111d;
        --panel: rgba(6, 24, 37, 0.92);
        --border: rgba(165, 217, 255, 0.16);
        --text: #eef7ff;
        --muted: rgba(238, 247, 255, 0.72);
        --accent: #64dfdf;
        --danger: #ff8f70;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        padding: 20px;
        font-family: Sora, system-ui, sans-serif;
        color: var(--text);
        background:
          radial-gradient(circle at top left, rgba(100, 223, 223, 0.12), transparent 24%),
          radial-gradient(circle at bottom right, rgba(255, 209, 102, 0.14), transparent 20%),
          linear-gradient(160deg, #03101a 0%, #081a28 34%, #0d2538 100%);
      }
      .login-card {
        width: min(100%, 420px);
        padding: 24px;
        border-radius: 24px;
        background: var(--panel);
        border: 1px solid var(--border);
        box-shadow: 0 24px 60px rgba(1, 9, 17, 0.42);
      }
      .eyebrow {
        margin: 0 0 8px;
        text-transform: uppercase;
        letter-spacing: 0.18em;
        color: var(--accent);
        font-size: 0.74rem;
      }
      h1 {
        margin: 0 0 10px;
        font-size: clamp(2rem, 6vw, 2.8rem);
        line-height: 0.95;
      }
      p {
        margin: 0;
        color: var(--muted);
        line-height: 1.5;
      }
      form {
        display: grid;
        gap: 12px;
        margin-top: 20px;
      }
      label {
        display: grid;
        gap: 8px;
      }
      input {
        width: 100%;
        padding: 12px 14px;
        border-radius: 14px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        background: rgba(255, 255, 255, 0.04);
        color: var(--text);
        font: inherit;
      }
      button {
        border: 0;
        border-radius: 999px;
        padding: 12px 16px;
        background: linear-gradient(120deg, #64dfdf 0%, #90e0ef 100%);
        color: #062132;
        font: inherit;
        font-weight: 700;
        cursor: pointer;
      }
      .login-error {
        margin-top: 14px;
        color: var(--danger);
      }
    </style>
  </head>
  <body>
    <main class="login-card">
      <p class="eyebrow">Protected Demo</p>
      <h1>Mulder's Chart</h1>
      <p>Enter the password to access the simulation.</p>
      ${detail}
      <form method="post" action="/auth/login">
        <label>
          <span>Password</span>
          <input type="password" name="password" autocomplete="current-password" required autofocus />
        </label>
        <button type="submit">Unlock site</button>
      </form>
    </main>
  </body>
</html>`);
}

app.post('/auth/login', (request, response) => {
  if (request.body.password !== sitePassword) {
    sendLoginPage(response, 'Incorrect password.');
    return;
  }

  response.setHeader('Set-Cookie', createCookieHeader(60 * 60 * 12));
  response.redirect(302, '/');
});

app.post('/auth/logout', (_, response) => {
  response.setHeader('Set-Cookie', clearCookieHeader());
  response.redirect(302, '/');
});

app.use((request, response, next) => {
  if (request.path === '/api/health' || request.path.startsWith('/auth/')) {
    next();
    return;
  }

  if (hasSiteAccess(request)) {
    next();
    return;
  }

  if (request.path.startsWith('/api/')) {
    response.status(401).json({ message: 'Authentication required.' });
    return;
  }

  if (request.method === 'GET' && !path.extname(request.path)) {
    sendLoginPage(response);
    return;
  }

  response.status(401).type('text/plain').send('Authentication required.');
});

function isValidGraph(payload) {
  if (!payload || !Array.isArray(payload.nodes) || !Array.isArray(payload.edges)) {
    return false;
  }

  return payload.nodes.every((node) => node.id && node.label) && payload.edges.every((edge) => {
    return edge.source && edge.target && ['antagonistic', 'synergistic'].includes(edge.relationshipType);
  });
}

async function ensureGraphFile() {
  try {
    await fs.access(dataFile);
    return;
  } catch {
    await fs.mkdir(path.dirname(dataFile), { recursive: true });
  }

  const bundledGraph = await fs.readFile(bundledDataFile, 'utf8');
  await fs.writeFile(dataFile, bundledGraph, 'utf8');
}

async function readGraphFile() {
  await ensureGraphFile();
  const raw = await fs.readFile(dataFile, 'utf8');
  return JSON.parse(raw);
}

app.get('/api/health', (_, response) => {
  response.json({ ok: true });
});

app.get('/api/graph', async (_, response) => {
  try {
    const graph = await readGraphFile();
    response.json(graph);
  } catch (error) {
    response.status(500).json({ message: 'Failed to read graph data.', detail: String(error) });
  }
});

app.put('/api/graph', async (request, response) => {
  try {
    if (!isValidGraph(request.body)) {
      response.status(400).json({ message: 'Invalid graph payload.' });
      return;
    }

    await fs.mkdir(path.dirname(dataFile), { recursive: true });
    await fs.writeFile(dataFile, `${JSON.stringify(request.body, null, 2)}\n`, 'utf8');
    response.json({ ok: true });
  } catch (error) {
    response.status(500).json({ message: 'Failed to save graph data.', detail: String(error) });
  }
});

try {
  await fs.access(distDir);
  app.use(express.static(distDir, {
    setHeaders: (response, filePath) => {
      if (filePath.endsWith('.html')) {
        response.setHeader('Cache-Control', 'no-store');
        return;
      }

      if (filePath.includes(`${path.sep}assets${path.sep}`)) {
        response.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      }
    },
  }));

  app.get('/', (_, response) => {
    response.setHeader('Cache-Control', 'no-store');
    response.sendFile(path.join(distDir, 'index.html'));
  });

  app.get(/^(?!\/api\/).*/, (request, response, next) => {
    if (path.extname(request.path)) {
      next();
      return;
    }

    response.setHeader('Cache-Control', 'no-store');
    response.sendFile(path.join(distDir, 'index.html'));
  });
} catch {
  app.get('/', (_, response) => {
    response.json({
      name: 'Mulders Chart API',
      message: 'Frontend assets are not built yet. Run npm run dev for local development.',
    });
  });
}

app.listen(port, host, () => {
  console.log(`Mulders Chart server listening on http://${host}:${port}`);
  console.log(`Graph data file: ${dataFile}`);
});