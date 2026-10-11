# CLAUDE.md - agent-hub

## Aturan Lintas Platform
- Gunakan `node:path` dan `os.homedir()` untuk path, hindari path hardcoded.
- Pada Windows, gunakan helper `run()` untuk menyelesaikan eksekabel dan meng-quote argumen.
- Akhir baris file teks: LF (kecuali .cmd/.bat = CRLF).
- Instalasi perintah lewat `package.json` bin field dan `npm link`, tidak edit PATH manual.

## Cara Menjalankan Uji
- Uji unit: `node --test`
- Uji end-to-end mock: `node scripts/e2e-mock.js`
- Pastikan uji berjalan di folder temporary, tidak menyentuh home atau setelan VS Code asli.
- Gunakan variabel lingkungan `AGENT_HUB_HOME` dan `AGENT_HUB_VSCODE_USER_DIR` untuk isolasi.

## Aturan Commit
- Commit kecil per fitur dengan pesan conventional commit (feat, fix, refactor, docs, test, chore, perf, ci).
- Jangan push atau buat remote; Anda yang akan melakukan push.
- Jangan menyimpan secret/token di repo; redaksi token dan pola secret umum di log.

## Sebelum Bekerja
Baca file-file berikut untuk memahami konteks dan rencana:
- `docs/BRIEF.md` - tujuan, konteks, aturan kerja, dan struktur repo.
- `docs/PLAN.md` - arsitektur, keputusan, risiko, dan pertanyaan.
- `docs/TASKS.md` - milestone berurutan dan acceptance check.

Pastikan Anda memahami rencana dan milestone sebelum mulai bekerja.