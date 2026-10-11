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
} else if (command === 'run') {
  // Mock implementation for testing purposes
  const mockMode = commandArgs.includes('--mock');
  const yesFlag = commandArgs.includes('--yes');
  const repoIndex = commandArgs.indexOf('--repo');
  let repoPath = '.';

  if (repoIndex !== -1 && repoIndex + 1 < commandArgs.length) {
    repoPath = commandArgs[repoIndex + 1];
  }

  const inPlaceFlag = commandArgs.includes('--in-place');

  if (mockMode) {
    console.log(`[MOCK] Running agent in repository: ${repoPath}`);
    console.log(`[MOCK] Prompt: "${commandArgs.slice(0, commandArgs.indexOf('--mock')).join(' ')}"`);
    console.log(`[MOCK] Mock mode: ${mockMode}`);
    console.log(`[MOCK] Yes flag: ${yesFlag}`);
    console.log(`[MOCK] In-place: ${inPlaceFlag}`);

    // Simulate some processing time
    const startTime = Date.now();
    while (Date.now() - startTime < 1000) {
      // Busy wait for 1 second to simulate work
    }

    console.log('[MOCK] Agent run completed successfully (mock mode)');
    process.exit(0);
  } else {
    console.log(`[ERROR] Real mode not implemented for 'run' command yet.`);
    console.log(`[INFO] Use --mock flag for testing purposes.`);
    process.exit(1);
  }
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