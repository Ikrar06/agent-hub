// src/lock.js
import fs from 'node:fs/promises';
import path from 'node:path';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export const isAlive = (pid) => {
  try { process.kill(pid, 0); return true; }
  catch (e) { return e.code === 'EPERM'; }
};

export async function acquire(home, info) {
  const file = path.join(home, 'locks', 'pipeline.lock');
  await fs.mkdir(path.dirname(file), { recursive: true });
  for (let i = 0; i < 5; i++) {
    try {
      const fh = await fs.open(file, 'wx');          // gagal jika file sudah ada
      await fh.writeFile(JSON.stringify({ pid: process.pid, ...info, started_at: new Date().toISOString() }));
      await fh.close();
      return { file, run_id: info.run_id };
    } catch (e) { if (e.code !== 'EEXIST') throw e; }
    let holder = null;
    try { holder = JSON.parse(await fs.readFile(file, 'utf8')); } catch {}
    if (!holder) { await sleep(50); continue; }      // file baru dibuat, isi belum tertulis
    if (isAlive(holder.pid)) {
      const err = new Error('pipeline sedang berjalan'); err.code = 'ELOCKED'; err.holder = holder; throw err;
    }
    await fs.rm(file, { force: true });              // basi: pemegang sudah mati
  }
  throw new Error('gagal mendapatkan lock');
}

export async function release(lock) {
  try {
    const h = JSON.parse(await fs.readFile(lock.file, 'utf8'));
    if (h.run_id === lock.run_id) await fs.rm(lock.file, { force: true });
  } catch {}
}