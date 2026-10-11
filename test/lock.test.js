// test/lock.test.js
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { acquire, release, isAlive } from '../src/lock.js';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
const exec = promisify(execFile);

describe('lock', () => {
  it('should allow one acquire and release, and block second', async () => {
    const home = join(tmpdir(), 'agent-hub-lock-test-' + Date.now());
    const info = { run_id: 'test-1', repo: '.' };

    // First acquire should succeed
    const lock1 = await acquire(home, info);
    assert.ok(lock1.file);
    assert.equal(lock1.run_id, 'test-1');

    // Second acquire should fail with ELOCKED
    let err2;
    try {
      await acquire(home, { run_id: 'test-2', repo: '.' });
    } catch (e) {
      err2 = e;
    }
    assert.ok(err2);
    assert.equal(err2.code, 'ELOCKED');
    assert.equal(err2.holder.pid, process.pid); // holder should be the first lock's pid

    // Release first lock
    await release(lock1);

    // After release, second acquire should succeed
    const lock2 = await acquire(home, { run_id: 'test-2', repo: '.' });
    assert.ok(lock2.file);
    assert.equal(lock2.run_id, 'test-2');

    // Clean up
    await release(lock2);
  });

  it('should handle stale lock (pid dead)', async () => {
    const home = join(tmpdir(), 'agent-hub-lock-test-stale-' + Date.now());
    const info = { run_id: 'test-stale', repo: '.' };

    // Create a lock file with a dead PID (we can use a fake PID that is unlikely to be alive)
    const lockFile = join(home, 'locks', 'pipeline.lock');
    await mkdir(join(home, 'locks'), { recursive: true });
    await writeFile(lockFile, JSON.stringify({ pid: 99999, run_id: 'stale', repo: '.', started_at: new Date().toISOString() }));

    // Acquire should succeed and remove the stale lock
    const lock = await acquire(home, info);
    assert.ok(lock.file);
    assert.equal(lock.run_id, 'test-stale');

    // After acquiring, the lock file should contain our pid
    const content = await readFile(lock.file, 'utf8');
    const parsed = JSON.parse(content);
    assert.equal(parsed.pid, process.pid);

    // Release
    await release(lock);
  });

  it('should handle concurrent lock acquisition attempts', async () => {
    const home = join(tmpdir(), 'agent-hub-lock-test-concurrent-' + Date.now());

    // Start multiple concurrent acquire attempts
    const promises = [];
    for (let i = 0; i < 5; i++) {
      promises.push(
        acquire(home, { run_id: `test-${i}`, repo: '.' })
          .then(lock => ({ lock, error: null }))
          .catch(error => ({ lock: null, error }))
      );
    }

    const results = await Promise.all(promises);

    // Exactly one should succeed, others should fail with ELOCKED
    const successful = results.filter(r => r.lock !== null);
    const failed = results.filter(r => r.lock === null);

    assert.equal(successful.length, 1);
    assert.equal(failed.length, 4);

    // All failed attempts should have ELOCKED error
    for (const result of failed) {
      assert.ok(result.error);
      assert.equal(result.error.code, 'ELOCKED');
    }

    // Clean up the successful lock
    await release(successful[0].lock);
  });

  it('should properly report lock status via isAlive', async () => {
    const home = join(tmpdir(), 'agent-hub-lock-test-alive-' + Date.now());
    const info = { run_id: 'test-alive', repo: '.' };

    // Initially, no lock should exist
    assert.equal(await isAlive(home), false);

    // After acquiring lock, isAlive should return true
    const lock = await acquire(home, info);
    assert.equal(await isAlive(home), true);

    // After releasing lock, isAlive should return false
    await release(lock);
    assert.equal(await isAlive(home), false);
  });
});