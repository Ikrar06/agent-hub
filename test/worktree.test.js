// test/worktree.test.js
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createWorktree, removeWorktree } from '../src/worktree.js';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdir, writeFile } from 'node:fs/promises';
import { realpathSync } from 'node:fs';
const exec = promisify(execFile);

describe('worktree', () => {
  it('should create worktree with correct properties', async () => {
    // Create a temporary directory for the repo
    const repo = join(tmpdir(), 'agent-hub-worktree-test-' + Date.now());
    // Create a temporary directory for the agent home (where worktrees will be created)
    const home = join(tmpdir(), 'agent-hub-home-' + Date.now());
    await mkdir(home, { recursive: true });

    // Initialize a git repo
    await exec('git', ['init', repo]);
    await exec('git', ['-C', repo, 'config', 'user.email', 'test@example.com']);
    await exec('git', ['-C', repo, 'config', 'user.name', 'Test User']);
    await exec('git', ['-C', repo, 'checkout', '-b', 'main']);
    // Add an initial commit
    await writeFile(join(repo, 'initial.txt'), 'initial content\n');
    await exec('git', ['-C', repo, 'add', 'initial.txt']);
    await exec('git', ['-C', repo, 'commit', '-m', 'initial commit']);

    // Create an untracked dirty file
    await writeFile(join(repo, 'dirty.txt'), 'dirty content\n');

    // Call createWorktree
    const runId = 'test-run-1';
    const slug = 'test-slug';
    const base = 'main';
    const result = await createWorktree({ home, repo, runId, slug, base });

    // Assertions
    // 1. result should have dir, branch, key
    assert.ok(result.dir);
    assert.ok(result.branch);
    assert.ok(result.key);
    // 2. worktree directory should exist
    const dirStat = await import('node:fs/promises').then(({ stat }) => stat(result.dir)).catch(() => false);
    assert.ok(dirStat);
    // 3. branch name should match pattern: agent/<slug>-<yyyyMMdd-HHmmss>
    assert.ok(/^agent\/test-slug-\d{8}-\d{6}$/.test(result.branch));
    // 4. git worktree list --porcelain should include the worktree path
    const worktreeList = await exec('git', ['-C', repo, 'worktree', 'list', '--porcelain']);
    const worktreeDir = realpathSync(result.dir).replace(/\\/g, '/');
    const found = worktreeList.stdout.split('\n').some(line => {
      const trimmed = line.trim();
      if (!trimmed.startsWith('worktree ')) return false;
      const pathPart = trimmed.slice('worktree '.length).trim();
      const pathPartNormalized = pathPart.replace(/\\/g, '/');
      return pathPartNormalized === worktreeDir;
    });
    assert.ok(found);
    // 5. Original repo's HEAD should still be main
    const headResult = await exec('git', ['-C', repo, 'rev-parse', '--abbrev-ref', 'HEAD']);
    assert.equal(headResult.stdout.trim(), 'main');
    // 6. Original repo's status should show dirty.txt as untracked and no other changes
    const statusResult = await exec('git', ['-C', repo, 'status', '--porcelain']);
    // Expect: ?? dirty.txt
    const statusLines = statusResult.stdout.trim().split('\n').filter(line => line.trim() !== '');
    assert.equal(statusLines.length, 1);
    assert.equal(statusLines[0], '?? dirty.txt');

    // Clean up: remove the worktree
    await removeWorktree({ home, dir: result.dir });
  });

  it('should handle base branch that is not main', async () => {
    // Create a temporary directory for the repo
    const repo = join(tmpdir(), 'agent-hub-worktree-test-base-' + Date.now());
    // Create a temporary directory for the agent home (where worktrees will be created)
    const home = join(tmpdir(), 'agent-hub-home-base-' + Date.now());
    await mkdir(home, { recursive: true });

    // Initialize a git repo
    await exec('git', ['init', repo]);
    await exec('git', ['-C', repo, 'config', 'user.email', 'test@example.com']);
    await exec('git', ['-C', repo, 'config', 'user.name', 'Test User']);
    await exec('git', ['-C', repo, 'checkout', '-b', 'develop']);
    // Add an initial commit
    await writeFile(join(repo, 'initial.txt'), 'initial content\n');
    await exec('git', ['-C', repo, 'add', 'initial.txt']);
    await exec('git', ['-C', repo, 'commit', '-m', 'initial commit']);

    // Create another branch
    await exec('git', ['-C', repo, 'checkout', '-b', 'feature']);
    await writeFile(join(repo, 'feature.txt'), 'feature content\n');
    await exec('git', ['-C', repo, 'add', 'feature.txt']);
    await exec('git', ['-C', repo, 'commit', '-m', 'feature commit']);

    // Go back to develop branch
    await exec('git', ['-C', repo, 'checkout', 'develop']);

    // Call createWorktree with feature branch as base
    const runId = 'test-run-2';
    const slug = 'test-slug-base';
    const base = 'feature';
    const result = await createWorktree({ home, repo, runId, slug, base });

    // Assertions
    assert.ok(result.dir);
    assert.ok(result.branch);
    assert.ok(result.key);
    // Branch name should be based on the feature branch
    assert.ok(/^agent\/test-slug-base-\d{8}-\d{6}$/.test(result.branch));

    // Original repo's HEAD should still be develop
    const headResult = await exec('git', ['-C', repo, 'rev-parse', '--abbrev-ref', 'HEAD']);
    assert.equal(headResult.stdout.trim(), 'develop');

    // Clean up: remove the worktree
    await removeWorktree({ home, dir: result.dir });
  });

  it('should fail gracefully when repo is not a git repository', async () => {
    // Create a temporary directory that is not a git repo
    const repo = join(tmpdir(), 'agent-hub-worktree-test-not-git-' + Date.now());
    // Create a temporary directory for the agent home
    const home = join(tmpdir(), 'agent-hub-home-not-git-' + Date.now());
    await mkdir(home, { recursive: true });
    await mkdir(repo, { recursive: true });

    // Try to create worktree in non-git directory
    const runId = 'test-run-3';
    const slug = 'test-slug-fail';
    const base = 'main';

    try {
      await createWorktree({ home, repo, runId, slug, base });
      assert.fail('Expected createWorktree to throw for non-git repository');
    } catch (error) {
      // Should fail because git init fails
      assert.ok(error);
    }
  });
});