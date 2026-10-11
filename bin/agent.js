#!/usr/bin/env node
import { spawn } from 'child_process';

const args = process.argv.slice(2);

if (args.length === 0 || args.includes('--help')) {
  printHelp();
  process.exit(0);
}

const command = args[0];
const commandArgs = args.slice(1);

if (command === 'monitor') {
  // Start the monitor server
  const monitor = spawn('node', ['monitor/server.js', ...commandArgs], {
    stdio: 'inherit'
  });

  monitor.on('error', (err) => {
    console.error(`Failed to start monitor: ${err.message}`);
    process.exit(1);
  });

  monitor.on('close', (code) => {
    if (code !== 0) {
      console.error(`Monitor server exited with code ${code}`);
      process.exit(code);
    }
  });
} else {
  console.log(`Command '${command}' is not implemented yet.`);
  printHelp();
  process.exit(1);
}

function printHelp() {
  console.log(`
  Usage: agent <command> [options]

  Commands:
    monitor               Jalankan monitor web untuk transparansi
    doctor                check git, gh (auth), node 20+, opencode, code CLI, llama-server terjangkau, GPU, RAM bebas, bentrok nama perintah
    model <action>        kelola llama-server dari config.json
    init [path]           idempotent. Tambahkan .agent/ ke info/exclude git, jalankan /init OpenCode bila AGENTS.md belum ada
    code [path]           init (jika belum), lalu code <path>
    run <prompt>          jalankan agent dengan prompt
    resume [<run-id>]     melanjutkan dari tahap terakhir yang selesai
    status                lihat status agent yang sedang berjalan
    stop <run-id>         menghentikan agent yang sedang berjalan
    open <run-id>         buka worktree run itu di VS Code
    diff <run-id> [--stage <id>]   diff di terminal (total atau per tahap)
    clean                 hapus worktree run yang selesai
    vscode-install        pasang task level user (lihat bagian VS Code)
  `);
}