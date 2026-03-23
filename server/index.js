import cors from 'cors';
import express from 'express';
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

const app = express();
const port = Number(process.env.PORT || 4321);
const host = process.env.HOST || '0.0.0.0';

app.use(cors());
app.use(express.json({ limit: '1mb' }));

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
  app.use(express.static(distDir));

  app.get('/', (_, response) => {
    response.sendFile(path.join(distDir, 'index.html'));
  });

  app.get(/^(?!\/api\/).*/, (request, response, next) => {
    if (path.extname(request.path)) {
      next();
      return;
    }

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