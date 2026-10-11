#!/usr/bin/env node
import { spawn, execFileSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readdirSync, existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const args = process.argv.slice(2);

if (args.length === 0 || args.includes('--help')) {
  printHelp();
  process.exit(0);
}

const command = args[0];
const commandArgs = args.slice(1);
const EXTENSION_ID = 'agent-hub.agent-hub-vscode';
const EXTENSION_PATH = join(__dirname, '..', 'extension');

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
} else if (command === 'chat') {
  // Mock implementation for chat command
  const mockMode = commandArgs.includes('--mock');
  const yesFlag = commandArgs.includes('--yes');
  const repoIndex = commandArgs.indexOf('--repo');
  let repoPath = '.';

  if (repoIndex !== -1 && repoIndex + 1 < commandArgs.length) {
    repoPath = commandArgs[repoIndex + 1];
  }

  if (mockMode) {
    console.log(`[MOCK] Starting agent chat in repository: ${repoPath}`);
    console.log(`[MOCK] Mock mode: ${mockMode}`);
    console.log(`[MOCK] Yes flag: ${yesFlag}`);

    // Simulate some processing time
    const startTime = Date.now();
    while (Date.now() - startTime < 1000) {
      // Busy wait for 1 second to simulate work
    }

    console.log('[MOCK] Agent chat completed successfully (mock mode)');
    process.exit(0);
  } else {
    console.log(`[ERROR] Real mode not implemented for 'chat' command yet.`);
    console.log(`[INFO] Use --mock flag for testing purposes.`);
    process.exit(1);
  }
} else if (command === 'doctor') {
  // Mock implementation for doctor command
  const mockMode = commandArgs.includes('--mock');

  if (mockMode) {
    console.log('[MOCK] Running doctor check...');

    // Simulate some processing time
    const startTime = Date.now();
    while (Date.now() - startTime < 1500) {
      // Busy wait for 1.5 seconds to simulate work
    }

    console.log('[MOCK] Doctor check completed successfully (mock mode)');
    console.log('[MOCK] All systems OK');
    process.exit(0);
  } else {
    console.log(`[ERROR] Real mode not implemented for 'doctor' command yet.`);
    console.log(`[INFO] Use --mock flag for testing purposes.`);
    process.exit(1);
  }
} else if (command === 'code') {
  // Handle code command - open VS Code and optionally auto-launch chat
  const pathIndex = 0;
  let repoPath = '.';

  // Check if a path was provided
  if (commandArgs.length > 0 && !commandArgs[0].startsWith('--')) {
    repoPath = commandArgs[0];
  }

  // Check for --no-chat flag to disable auto-launch
  const noChatFlag = commandArgs.includes('--no-chat');

  // Initialize the repository (create .agent/ if needed, run OpenCode init)
  console.log(`[INFO] Initializing repository: ${repoPath}`);

  // In a real implementation, this would:
  // 1. Create .agent directory and add to .git/info/exclude
  // 2. Run /init OpenCode if AGENTS.md doesn't exist
  // For now, we'll simulate this with a simple message
  console.log(`[INFO] Repository initialized`);

  // Open VS Code
  console.log(`[INFO] Opening VS Code at: ${repoPath}`);
  const codeProcess = spawn('code', [repoPath], {
    stdio: 'inherit'
  });

  codeProcess.on('error', (err) => {
    console.error(`Failed to open VS Code: ${err.message}`);
    // Continue anyway to potentially launch chat
  });

  codeProcess.on('close', (code) => {
    if (code !== 0) {
      console.error(`VS Code exited with code ${code}`);
    }
    // Continue to potentially launch chat regardless of VS Code exit code
  });

  // Auto-launch agent chat after VS Code opens (unless --no-chat is specified)
  if (!noChatFlag) {
    // Give VS Code a moment to start
    setTimeout(() => {
      console.log(`[INFO] Auto-launching agent chat...`);
      const chatProcess = spawn('node', [__dirname + '/agent.js', 'chat', ...commandArgs.filter(arg => arg !== '--no-chat')], {
        stdio: 'inherit'
      });

      chatProcess.on('error', (err) => {
        console.error(`Failed to start agent chat: ${err.message}`);
        process.exit(1);
      });

      chatProcess.on('close', (code) => {
        if (code !== 0) {
          console.error(`Agent chat exited with code ${code}`);
          process.exit(code);
        }
      });
    }, 1500); // 1.5 second delay to let VS Code start
  }
} else if (command === 'vscode-install' || command === 'vscode-uninstall') {
  const uninstall = command === 'vscode-uninstall';
  const extensionFlag = commandArgs.includes('--extension');

  if (!extensionFlag) {
    if (uninstall) {
      console.log('[INFO] Task-level uninstall belum diimplementasikan. Gunakan: agent vscode-uninstall --extension');
    } else {
      console.log('[INFO] Task-level install belum diimplementasikan. Gunakan: agent vscode-install --extension');
    }
    process.exit(1);
  }

  handleVscodeExtension(uninstall);
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
    code [path]           init (jika belum), lalu code <path>. Tambahkan --no-chat untuk mencegah peluncuran otomatis agent chat
    run <prompt>          jalankan agent dengan prompt
    resume [<run-id>]     melanjutkan dari tahap terakhir yang selesai
    status                lihat status agent yang sedang berjalan
    stop <run-id>         menghentikan agent yang sedang berjalan
    open <run-id>         buka worktree run itu di VS Code
    diff <run-id> [--stage <id>]   diff di terminal (total atau per tahap)
    clean                 hapus worktree run yang selesai
    vscode-install --extension    build .vsix (bila perlu) lalu install ekstensi VS Code agent-hub
    vscode-uninstall --extension  hapus ekstensi VS Code agent-hub
    chat                  mulai obrolan agent
  `);
}

// ---------------------------------------------------------------------------
// vscode-install --extension / vscode-uninstall --extension
// ---------------------------------------------------------------------------

function findCodeCli() {
  const candidates = [
    process.env.AGENT_HUB_CODE_CLI,
    ...(process.platform === 'win32' ? ['code.cmd', 'code'] : ['code', 'code-insiders', 'codium'])
  ].filter(Boolean);

  for (const candidate of candidates) {
    try {
      execFileSync(candidate, ['--version'], { stdio: 'ignore' });
      return candidate;
    } catch (err) {
      // try next candidate
    }
  }
  return null;
}

function findExistingVsix() {
  if (!existsSync(EXTENSION_PATH)) return null;
  const vsixFiles = readdirSync(EXTENSION_PATH)
    .filter(f => /^agent-hub-vscode-[\d.]+\.vsix$/.test(f))
    .sort();
  return vsixFiles.length ? join(EXTENSION_PATH, vsixFiles[vsixFiles.length - 1]) : null;
}

function packageVsix() {
  const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  console.log('[INFO] .vsix belum ada, mem-build paket extension...');
  execFileSync(npx, ['--yes', '@vscode/vsce', 'package', '--no-dependencies'], {
    cwd: EXTENSION_PATH,
    stdio: 'inherit'
  });
}

function handleVscodeExtension(uninstall) {
  const codeCli = findCodeCli();
  if (!codeCli) {
    console.error('[ERROR] CLI VS Code (`code`) tidak ditemukan di PATH.');
    console.error(`[INFO] Pastikan "Shell Command: Install 'code' command in PATH" sudah dijalankan dari VS Code,`);
    console.error(`[INFO] atau set AGENT_HUB_CODE_CLI ke path binary code Anda.`);
    process.exit(1);
  }

  if (uninstall) {
    console.log(`[INFO] Meng-uninstall ekstensi ${EXTENSION_ID}...`);
    try {
      execFileSync(codeCli, ['--uninstall-extension', EXTENSION_ID], { stdio: 'inherit' });
      console.log('[OK] Ekstensi di-uninstall.');
    } catch (err) {
      console.error(`[ERROR] Gagal uninstall: ${err.message}`);
      process.exit(1);
    }
    return;
  }

  let vsixPath = findExistingVsix();
  if (!vsixPath) {
    try {
      packageVsix();
    } catch (err) {
      console.error('[ERROR] Build .vsix gagal.');
      console.error('[INFO] Pastikan Node.js/npm tersedia dan jaringan aktif (vsce diunduh via npx),');
      console.error('[INFO] atau letakkan file .vsix dari GitHub Releases ke folder extension/.');
      process.exit(1);
    }
    vsixPath = findExistingVsix();
    if (!vsixPath) {
      console.error('[ERROR] Build selesai tapi file .vsix tidak ditemukan di ' + EXTENSION_PATH);
      process.exit(1);
    }
  }

  console.log(`[INFO] Menginstall ekstensi dari: ${vsixPath}`);
  try {
    execFileSync(codeCli, ['--install-extension', vsixPath], { stdio: 'inherit' });
    console.log(`[OK] Ekstensi ${EXTENSION_ID} terpasang. Buka panel "Agent Hub" di activity bar VS Code.`);
    console.log('[INFO] Jalankan `agent monitor` agar panel menampilkan data run live.');
  } catch (err) {
    console.error(`[ERROR] Gagal install ekstensi: ${err.message}`);
    process.exit(1);
  }
}