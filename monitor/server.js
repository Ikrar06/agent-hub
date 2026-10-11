// monitor/server.js
import { createServer } from 'node:http';
import { stat, readdir, realpath, readFile } from 'node:fs/promises';
import { realpathSync } from 'node:fs';
import { join, parse, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = parse(__filename).dir;
// Resolve symlinks (e.g. /tmp -> /private/tmp on macOS) so realpath comparisons match.
const PUBLIC_DIR = realpathSync(join(__dirname, 'public'));

// `agent monitor --port 3778` passes the flag through as a CLI argument.
const argvPortIndex = process.argv.indexOf('--port');
const PORT = Number(process.env.AGENT_HUB_MONITOR_PORT)
  || (argvPortIndex !== -1 ? Number(process.argv[argvPortIndex + 1]) : 0)
  || 3777;
const RUNS_BASE_DIR = process.env.AGENT_HUB_HOME ? join(process.env.AGENT_HUB_HOME, 'runs') : join(process.env.HOME, '.agent-hub', 'runs');

// Extra files a run directory may expose beyond status.json.
// Whitelist keeps the path traversal-safe.
const RUN_FILES = ['events.jsonl', 'agent.log'];

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.jsonl': 'text/plain; charset=utf-8',
  '.log': 'text/plain; charset=utf-8',
};

function sendJSON(res, code, obj) {
  res.writeHead(code, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'no-store',
  });
  res.end(JSON.stringify(obj));
}

function sendText(res, code, text, type = 'text/plain; charset=utf-8') {
  res.writeHead(code, {
    'Content-Type': type,
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'no-store',
  });
  res.end(text);
}

function sendError(res, code, message) {
  sendJSON(res, code, { error: message });
}

async function readStatus(runId) {
  const statusPath = join(RUNS_BASE_DIR, runId, 'status.json');
  const statusStat = await stat(statusPath);
  if (!statusStat.isFile()) throw Object.assign(new Error('not a file'), { code: 'ENOENT' });
  return JSON.parse(await readFile(statusPath, 'utf8'));
}

async function handleApi(req, res, path) {
  const { method } = req;

  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    res.end();
    return;
  }

  if (method !== 'GET') {
    sendError(res, 405, 'Method not allowed');
    return;
  }

  // GET /api/runs — list all runs, newest first
  if (path === '/api/runs') {
    try {
      const runsDir = await stat(RUNS_BASE_DIR);
      if (!runsDir.isDirectory()) {
        sendJSON(res, 200, []);
        return;
      }
      const entries = await readdir(RUNS_BASE_DIR, { withFileTypes: true });
      const runs = [];
      for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        try {
          const status = await readStatus(entry.name);
          runs.push({ id: entry.name, ...status });
        } catch (e) {
          // skip runs with missing or invalid status.json
        }
      }
      runs.sort((a, b) => {
        const ta = a.started_at ? new Date(a.started_at).getTime() : 0;
        const tb = b.started_at ? new Date(b.started_at).getTime() : 0;
        return tb - ta;
      });
      sendJSON(res, 200, runs);
    } catch (err) {
      if (err.code === 'ENOENT') sendJSON(res, 200, []);
      else sendError(res, 500, err.message);
    }
    return;
  }

  // GET /api/runs/:id — single run status
  // GET /api/runs/:id/:file — raw events.jsonl / agent.log
  const runMatch = path.match(/^\/api\/runs\/([^/]+)(?:\/([^/]+))?$/);
  if (runMatch) {
    const runId = decodeURIComponent(runMatch[1]);
    const file = runMatch[2] ? decodeURIComponent(runMatch[2]) : null;

    if (file) {
      if (!RUN_FILES.includes(file)) {
        sendError(res, 404, 'Not found');
        return;
      }
      try {
        const filePath = join(RUNS_BASE_DIR, runId, file);
        const runDirResolved = await realpath(join(RUNS_BASE_DIR, runId));
        const resolved = await realpath(filePath);
        if (!resolved.startsWith(runDirResolved + '/')) {
          sendError(res, 403, 'Forbidden');
          return;
        }
        sendText(res, 200, await readFile(resolved, 'utf8'));
      } catch (err) {
        if (err.code === 'ENOENT') sendError(res, 404, `${file} not found for run ${runId}`);
        else sendError(res, 500, err.message);
      }
      return;
    }

    try {
      sendJSON(res, 200, { id: runId, ...(await readStatus(runId)) });
    } catch (err) {
      if (err.code === 'ENOENT') sendError(res, 404, 'Run not found');
      else if (err instanceof SyntaxError) sendError(res, 500, 'Invalid status.json');
      else sendError(res, 500, err.message);
    }
    return;
  }

  sendError(res, 404, 'Not found');
}

async function handleStatic(res, path) {
  let filePath = join(PUBLIC_DIR, path === '/' ? 'index.html' : path);
  try {
    const fileStat = await stat(filePath);
    if (fileStat.isDirectory()) filePath = join(filePath, 'index.html');
    // Prevent directory traversal attacks
    const resolvedPath = await realpath(filePath);
    if (!resolvedPath.startsWith(PUBLIC_DIR + (PUBLIC_DIR.endsWith('/') || PUBLIC_DIR.endsWith('\\') ? '' : '/'))) {
      sendText(res, 403, 'Forbidden');
      return;
    }
    const contentType = MIME[extname(resolvedPath).toLowerCase()] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType, 'Cache-Control': 'no-cache' });
    res.end(await readFile(resolvedPath));
  } catch (err) {
    if (err.code === 'ENOENT') {
      // SPA fallback: serve index.html for client-side routing
      try {
        res.writeHead(200, { 'Content-Type': MIME['.html'], 'Cache-Control': 'no-cache' });
        res.end(await readFile(join(PUBLIC_DIR, 'index.html')));
      } catch (e) {
        sendText(res, 404, 'Not Found');
      }
    } else {
      sendText(res, 500, 'Internal Server Error');
    }
  }
}

const server = createServer(async (req, res) => {
  const { method, url } = req;
  const path = new URL(`http://localhost:8080${url}`).pathname; // dummy host to make URL valid

  try {
    if (path === '/api' || path.startsWith('/api/')) {
      await handleApi(req, res, path);
      return;
    }
    if (method === 'GET' || method === 'HEAD') {
      await handleStatic(res, path);
      return;
    }
    sendError(res, 405, 'Method not allowed');
  } catch (err) {
    if (!res.headersSent) sendError(res, 500, err.message);
    else res.end();
  }
});

server.listen(PORT, () => {
  console.log(`Monitor server running at http://127.0.0.1:${PORT}/`);
});
