// src/agentDir.js
import { promisify } from 'node:util';
import fs from 'node:fs/promises';
import path from 'node:path';
const { execFile } = require('node:child_process');
const run = promisify(execFile);
const git = (cwd, ...args) => run('git', args, { cwd });

export async function prepareAgentDir(dir, templatesDir) {
  const out = (await git(dir, 'rev-parse', '--git-path', 'info/exclude')).stdout.trim();
  const exclude = path.resolve(dir, out);               // hasil bisa relatif
  await fs.mkdir(path.dirname(exclude), { recursive: true });
  const cur = await fs.readFile(exclude, 'utf8').catch(() => '');
  if (!/^\.agent\/?$/m.test(cur))
    await fs.appendFile(exclude, (cur && !cur.endsWith('\n') ? '\n' : '') + '.agent/\n');
  await fs.mkdir(path.join(dir, '.agent'), { recursive: true });
  for (const f of ['SPEC.md', 'TASKS.md'])
    await fs.copyFile(path.join(templatesDir, f), path.join(dir, '.agent', f));
}