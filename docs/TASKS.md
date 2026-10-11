# Milestone dan Acceptance Check

## Milestone 1: Rencana dan Persetujuan
- **ID**: M1
- **Judul**: Rencana dan daftar keputusan, tunggu persetujuan
- **File terkait**: docs/PLAN.md, docs/TASKS.md
- **Acceptance check**: 
  - File `docs/PLAN.md` dan `docs/TASKS.md` telah dibuat dan berisi konten yang sesuai.
  - Persetujuan pengguna telah diberikan (melalui proses persetujuan rencana).

## Milestone 2: Skeleton Repositori dan File Dasar
- **ID**: M2
- **Judul**: [x] Menyiapkan struktur repositori dan file dasar
- **File terkait**: 
  - README.md
  - CLAUDE.md
  - package.json
  - .gitattributes
  - .gitignore
  - config.example.json
- **Acceptance check**:
  - Semua file yang tercantum ada di root repositori.
  - `package.json` memiliki field `bin` yang mengarah ke `bin/agent.js`.
  - `README.md` berisi penjelasan singkat tentang agent-hub.
  - Menjalankan `cat package.json | grep '"bin"'` menunjukkan output yang sesuai.

## Milestone 3: Implementasi CLI Agent
- **ID**: M3
- **Judul**: [x] Mengimplementasikan CLI agent
- **File terkait**:
  - bin/agent.js
  - src/cli/ (dan subdirektori terkait)
- **Acceptance check**:
  - File `bin/agent.js` ada dan dapat dieksekusi (izin eksekusi telah diatur).
  - Menjalankan `node bin/agent.js --help` menampilkan informasi bantuan tentang perintah yang tersedia.
  - Perintah seperti `agent doctor`, `agent model`, `agent init`, `agent code`, `agent run` terdaftar dalam output bantuan.

## Milestone 4: Pipeline Multi-Agent dan Isolasi Worktree
- **ID**: M4
- **Judul**: [x] Membuat pipeline multi-agent dan mekanisme isolasi worktree
- **File terkait**:
  - src/pipeline/ (dan file terkait)
  - src/worktree/
  - src/lock/
  - src/runner/
  - src/record/
- **Acceptance check**:
  - Mekanisme lock global dapat diuji dengan mensimulasi dua pipeline berjalan sekaligus (harus satu yang berhasil, satu yang ditolak atau masuk antrean).
  - Isolasi worktree terlihat dari adanya direktori kerja terisolasi di `${AGENT_HUB_HOME}/worktrees/` saat menjalankan `agent run`.
  - Direktori `.agent/` dapat dibuat di worktree untuk menyimpan SPEC.md, TASKS.md, dll.

## Milestone 5: Integrasi dengan OpenCode Agent
- **ID**: M5
- **Judul**: [x] Mengintegrasikan konfigurasi dan agent OpenCode
- **File terkait**:
  - opencode/agents/*.md
  - opencode/opencode.template.json
  - src/ (file yang menangani konfigurasi OpenCode per run)
- **Acceptance check**:
  - Konfigurasi OpenCode dapat dihasilkan per run berdasarkan template dan variabel lingkungan.
  - Agent OpenCode (lead, coder, tester, fixer, reviewer, documenter, pr-writer) dapat dipanggil dengan konfigurasi yang sesuai.
  - Tidak ada hardcoding path ke OpenCode global dalam kode agent-hub.

## Milestone 6: Monitor Web
- **ID**: M6
- **Judul**: Membangun monitor web untuk transparansi
- **File terkait**:
  - monitor/server.js
  - monitor/public/ (index.html, run.html, aset lokal)
- **Acceptance check**:
  - Monitor dapat dijalankan dengan perintah `agent monitor`.
  - Monitor mengikat ke http://127.0.0.1:3777 dan menampilkan halaman daftar run yang aktif dan yang membutuhkan perhatian.
  - Halaman detail run dapat diakses dan menampilkan timeline tahap, agent aktif, dan log.

## Milestone 7: Dokumentasi Serah Terima dan README
- **ID**: M7
- **Judul**: Menyelesaikan dokumentasi serah terima ke PC dan README
- **File terkait**:
  - docs/SETUP-PC.md
  - docs/PC-VERIFY.md
  - README.md (diperbarui jika perlu)
- **Acceptance check**:
  - `docs/SETUP-PC.md` berisi panduan lengkap untuk menginstal dependencies di Windows (Git for Windows, Node LTS, GitHub CLI, VS Code, OpenCode, llama.cpp, dll.).
  - `docs/PC-VERIFY.md` berisi checklist hal yang harus diverifikasi di PC dengan perintah dan hasil yang diharapkan.
  - `README.md` memiliki maksimal 2 halaman dan mencakup instalasi, lima menit pertama, alur penggunaan, dan troubleshooting.

## Milestone 8: Uji End-to-End
- **ID**: M8
- **Judul**: Melakukan uji end-to-end dengan scenario mock dan nyata
- **File terkait**:
  - test/ (fixture repo dan uji node:test)
  - scripts/e2e-mock.js
  - .github/workflows/ci.yml
- **Acceptance check**:
  - Menjalankan `node --test` dan `node scripts/e2e-mock.js` lulus di macOS.
  - Uji end-to-end mock di dua repo git sementara berlaku: semua tahap, kedua gate, resume, worktree, --in-place, lock/antrean, skenario gagal dan stalled.
  - Rekaman transparansi terverifikasi pada satu run mock: monitor menampilkan respons tiap agent, diff per stage, dan hasil tes.

## Milestone 9: Laporan Akhir dan Persiapan Rilis
- **ID**: M9
- **Judul**: Membuat laporan akhir dan menyiapkan untuk verifikasi akhir
- **File terkait**: Tidak ada file baru, tetapi dokumentasi existentes diperbarui jika perlu.
- **Acceptance check**:
  - Laporan akhir yang mencakup apa yang telah diuji (dan di OS mana), apa yang belum dan menunggu PC, dan apa yang tidak bisa direkam karena batasan OpenCode telah dibuat.
  - Semua kriteria selesai dari BRIEF.md telah terpenuhi:
    - `node --test` dan `node scripts/e2e-mock.js` lulus di macOS.
    - Workflow CI terdefinisi untuk tiga OS (belum dijalankan karena belum ada remote).
    - Uji end-to-end mock lulus.
    - Verifikasi transparansi sukses.
    - Isolasi menggunakan `AGENT_HUB_HOME` dan `AGENT_HUB_VSCODE_USER_DIR` terbukti.
    - README maksimal 2 halaman selesai.
    - Laporan akhir telah disusun.

# Cara Menjalankan Acceptance Check
Setiap acceptance check di atas dapat dijalankan sebagai perintah atau serangkaian perintah di terminal.
Pastikan Anda berada dalam direktori root agent-hub sebelum menjalankan check.
Untuk check yang memerlukan keadaan tertentu (misalnya, setelah suatu milestone selesai), jalankan check setelah milestone tersebut dianggap selesai.

Contoh:
- Untuk M2: `ls -la README.md CLAUDE.md package.json .gitattributes .gitignore config.example.json`
- Untuk M3: `node bin/agent.js --help`
- Untuk M4: Jalankan dua terminal dan coba jalankan `agent run "test"` pada keduanya, amati bahwa hanya satu yang berjalan sedang yang lain mengantre atau ditolak.