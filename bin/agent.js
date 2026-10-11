#!/usr/bin/env node
const args = process.argv.slice(2);
if (args.includes('--help') || args.length === 0) {
  printHelp();
  process.exit(0);
}
// TODO: implement commands
console.log('Command not implemented yet:');
printHelp();
process.exit(1);

function printHelp() {
  console.log(`
  Usage: agent <command> [options]

  Commands:
    doctor        check git, gh (auth), node 20+, opencode, code CLI, llama-server terjangkau, GPU, RAM bebas, bentrok nama perintah
    model <action>                    kelola llama-server dari config.json
    init [path]                     idempotent. Tambahkan .agent/ ke info/exclude git, jalankan /init OpenCode bila AGENTS.md belum ada
    code [path]                     init (jika belum), lalu code <path>
    run <prompt>                    jalankan agent dengan prompt
    resume [<run-id>]               melanjutkan dari tahap terakhir yang selesai
    status                          lihat status agent yang sedang berjalan
    stop <run-id>                   menghentikan agent yang sedang berjalan
    open <run-id>                   buka worktree run itu di VS Code
    diff <run-id> [--stage <id>]    diff di terminal (total atau per tahap)
    clean                           hapus worktree run yang selesai
    monitor [--port <port>] [--no-browser]   jalankan monitor web
    vscode-install                  pasang task level user (lihat bagian VS Code)
  `);
}