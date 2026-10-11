// monitor/server.js
import { createServer } from 'node:http';
import { stat, readdir, realpath } from 'node:fs/promises';
import { join, parse, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = parse(__filename).dir;
const PUBLIC_DIR = join(__dirname, 'public');
const PORT = 3777;
const RUNS_BASE_DIR = process.env.AGENT_HUB_HOME ? join(process.env.AGENT_HUB_HOME, 'runs') : join(process.env.HOME, '.agent-hub', 'runs');

const server = createServer(async (req, res) => {
  const { method, url } = req;
  const path = new URL(`http://localhost:8080${url}`).pathname; // dummy host to make URL valid

  // Serve static files from public directory
  if (method === 'GET' && path.startsWith('/')) {
    let filePath = join(PUBLIC_DIR, path === '/' ? 'index.html' : path);
    try {
      await stat(filePath);
      // Prevent directory traversal attacks
      const resolvedPath = await realpath(filePath);
      if (!resolvedPath.startsWith(PUBLIC_DIR + (PUBLIC_DIR.endsWith('/') || PUBLIC_DIR.endsWith('\\') ? '' : '/'))) {
        res.writeHead(403, { 'Content-Type': 'text/plain' });
        res.end('Forbidden');
        return;
      }
      // Serve file
      const ext = extname(filePath).toLowerCase();
      let contentType = 'text/html';
      if (ext === '.js') contentType = 'application/javascript';
      else if (ext === '.css') contentType = 'text/css';
      else if (ext === '.json') contentType = 'application/json';
      else if (ext === '.png') contentType = 'image/png';
      else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
      res.writeHead(200, { 'Content-Type': contentType });
      const file = await import('node:fs/promises').then(({ readFile }) => readFile(filePath));
      res.end(file);
    } catch (err) {
      if (err.code === 'ENOENT') {
        // Try to serve as SPA: return index.html for client-side routing
        try {
          await stat(join(PUBLIC_DIR, 'index.html'));
          res.writeHead(200, { 'Content-Type': 'text/html' });
          const file = await import('node:fs/promises').then(({ readFile }) => readFile(join(PUBLIC_DIR, 'index.html')));
          res.end(file);
        } catch (e) {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('Not Found');
        }
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Internal Server Error');
      }
      return;
    }
    return;
  }

  // API endpoints
  if (method === 'GET' && path === '/api/runs') {
    try {
      const runsDir = await stat(RUNS_BASE_DIR);
      if (!runsDir.isDirectory()) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify([]));
        return;
      }
      const entries = await readdir(RUNS_BASE_DIR, { withFileTypes: true });
      const runDirs = entries.filter(entry => entry.isDirectory()).map(entry => entry.name);
      const runs = [];
      for (const runId of runDirs) {
        const runPath = join(RUNS_BASE_DIR, runId);
        const statusPath = join(runPath, 'status.json');
        try {
          const statusStat = await stat(statusPath);
          if (statusStat.isFile()) {
            const statusContent = await import('node:fs/promises').then(({ readFile }) => readFile(statusPath, 'utf8'));
            const status = JSON.parse(statusContent);
            runs.push({ id: runId, ...status });
          }
        } catch (e) {
          // skip if status.json not found or invalid
        }
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(runs));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  if (method === 'GET' && path.startsWith('/api/runs/')) {
    const runId = path.split('/')[3];
    if (!runId) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Missing run ID' }));
      return;
    }
    try {
      const runPath = join(RUNS_BASE_DIR, runId);
      const statusPath = join(runPath, 'status.json');
      const statusStat = await stat(statusPath);
      if (!statusStat.isFile()) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Run not found' }));
        return;
      }
      const statusContent = await import('node:fs/promises').then(({ readFile }) => readFile(statusPath, 'utf8'));
      const status = JSON.parse(statusContent);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(status));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // Default 404
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

server.listen(PORT, () => {
  console.log(`Monitor server running at http://127.0.0.1:${PORT}/`);
});
