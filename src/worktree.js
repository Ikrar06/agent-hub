// src/worktree.js
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
const run = promisify(execFile);
const git = (cwd, ...args) => run('git', args, { cwd });

export async function repoKey(repo) {
  const real = await fs.realpath(repo);
  return `${path.basename(real)}-${crypto.createHash('sha1').update(real).digest('hex').slice(0, 8)}`;
}

function stamp() {
  const date = new Date();
  const yyyymmdd = date.toISOString().slice(0, 10).replace(/-/g, '');
  const hhmmss = date.toTimeString().slice(0, 8).replace(/:/g, '');
  return `${yyyymmdd}-${hhmmss}`;
}

export async function createWorktree({ home, repo, runId, slug, base }) {
  const key = await repoKey(repo);
  const dir = path.join(home, 'worktrees', key, runId);
  const branch = `agent/${slug}-${stamp()}`;           // stamp: yyyymmdd-hhmmss
  await fs.mkdir(path.dirname(dir), { recursive: true });
  await git(repo, '-c', 'core.longpaths=true', 'worktree', 'add', '-b', branch, dir, base);
  await git(dir, 'config', 'core.longpaths', 'true');
  return { dir, branch, key };
}