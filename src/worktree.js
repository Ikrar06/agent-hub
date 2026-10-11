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

export async function removeWorktree({ home, dir }) {
  // Find the repo associated with this worktree by looking in the worktree metadata
  // For simplicity, we'll use git worktree remove which requires the worktree directory
  try {
    // We need to find the git repo that contains this worktree
    // The worktree directory should have a link to the git dir in .git file
    const gitFilePath = path.join(dir, '.git');
    let gitDirPath;
    try {
      const gitFileContent = await fs.readFile(gitFilePath, 'utf8');
      // .git file in worktree looks like: "gitdir: /path/to/main/repo/.git"
      if (gitFileContent.startsWith('gitdir: ')) {
        gitDirPath = gitFileContent.slice(8).trim();
      }
    } catch (e) {
      // If we can't read the .git file, we'll try to find the repo by looking up from home
      // This is a fallback
      const worktreeRelativePath = path.relative(home, dir);
      if (worktreeRelativePath.startsWith('worktrees/')) {
        // Extract the key from worktrees/<key>/<runId>/...
        const parts = worktreeRelativePath.split(path.sep);
        if (parts.length >= 2) {
          const key = parts[1];
          // Now we need to find which repo this key belongs to
          // For simplicity in this mock/test environment, we'll assume we can derive it
          // In a real implementation, we might store this mapping
          gitDirPath = path.join(home, '.git'); // Fallback
        }
      }
    }

    // If we still don't have a git dir, try to find a .git directory in parent directories
    if (!gitDirPath) {
      let currentDir = dir;
      while (currentDir && currentDir !== path.parse(currentDir).root) {
        try {
          await fs.access(path.join(currentDir, '.git'));
          gitDirPath = currentDir;
          break;
        } catch (e) {
          currentDir = path.dirname(currentDir);
        }
      }
    }

    if (gitDirPath) {
      // Use git worktree remove to remove the worktree
      await git(gitDirPath, 'worktree', 'remove', dir);
    } else {
      // Fallback: just remove the directory if we can't find the git repo
      await fs.rm(dir, { recursive: true, force: true });
    }
  } catch (e) {
    // If git worktree remove fails, try to remove the directory directly
    try {
      await fs.rm(dir, { recursive: true, force: true });
    } catch (e2) {
      // If both fail, we'll log but not throw in cleanup code
      console.warn(`Failed to remove worktree ${dir}:`, e.message);
    }
  }
}