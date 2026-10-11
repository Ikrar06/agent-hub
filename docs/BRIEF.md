# TUJUAN
Bangun "agent-hub": toolkit CLI lintas platform (dikembangkan di macOS Apple Silicon, dipakai terutama di Windows 10/11) untuk menjalankan pipeline multi-agent coding lokal (OpenCode + llama.cpp) di repo mana pun, terintegrasi dengan VS Code, plus halaman mission control web yang transparan: saya bisa melihat agent mana yang bekerja, respons tiap agent, kode dan dokumentasi yang diubah (diff), serta hasil tes dan review. Satu instalasi, dipakai di semua repo tanpa menaruh file toolkit di repo target.

# KONTEKS DAN LINGKUNGAN
- Mesin pengembangan sekarang: MacBook Air M4, macOS, zsh. Tidak ada GPU NVIDIA di sini.
- Mesin target: PC Windows 10/11 dengan RTX 3060 12GB, RAM 32GB, terminal Windows PowerShell 5.1 atau cmd. Tanpa admin, tanpa WSL. Saya akan clone repo ini ke PC setelah selesai.
- Karena itu: seluruh logika ditulis dalam Node.js 20+ (ESM atau CJS, pilih satu dan konsisten), TANPA dependency npm runtime dan tanpa skrip PowerShell/bash sebagai logika utama. Uji memakai `node:test` bawaan Node.
- Model server di PC: llama.cpp `llama-server` (OpenAI-compatible) di http://127.0.0.1:8080/v1. Bukan Ollama. Model utama: Qwen3.6-35B-A3B Q4 (UD-Q4_K_M, sekitar 20.6 GiB) dengan `--n-cpu-moe` (expert MoE ke RAM). Opsional: Gemma 4 12B QAT Q4_0 untuk reviewer. Dua model tidak boleh dimuat bersamaan. Semua lokal dan gratis, tanpa API cloud saat agent berjalan.
- Agent runtime: OpenCode. Sintaks config berbeda antar versi. SEBELUM menulis config, baca dokumentasi resmi terbaru (opencode.ai/docs: agents, permissions, config, providers, cli, server). Jika `opencode` terpasang di mesin ini, jalankan `opencode --help` dan `opencode run --help` untuk verifikasi flag, dan periksa apakah ada output JSON/event atau API sesi (`opencode serve`) untuk merekam respons dan tool call per agent. Jika tidak terpasang atau tidak ada, pakai stdout plus git diff, dan catat item itu di docs/PC-VERIFY.md. Verifikasi flag llama-server dari `llama-server --help` bila tersedia, kalau tidak catat juga di PC-VERIFY.
- Saya berpindah-pindah repo dan stack tidak tetap. Saya membuka repo dengan `code .`. Toolkit tidak boleh mengasumsikan stack.
- Teks untuk saya: bahasa Indonesia, ringkas, tanpa em dash.

# ATURAN KERJA
1. Mulai dengan rencana (struktur, keputusan, risiko, hal yang perlu saya putuskan). Tunggu persetujuan saya sebelum menulis file.
2. Kerja hanya di folder repo ini. Jangan sentuh repo lain.
3. Jangan mengunduh model, llama.cpp, OpenCode, atau installer besar. Tulis petunjuknya saja.
4. Isolasi uji: semua uji dan mock memakai folder sementara. Dukung env `AGENT_HUB_HOME` (default: ~/.agent-hub) dan `AGENT_HUB_VSCODE_USER_DIR` untuk mengalihkan data dan lokasi settings VS Code, supaya uji tidak menyentuh home saya, PATH, atau settings VS Code asli.
5. Perubahan di luar repo (instal global, task VS Code level user) hanya lewat perintah eksplisit pengguna, dengan tampilan rencana, backup bertimestamp (jangan menimpa), merge bukan replace, idempotent, dan ada jalur uninstall.
6. Commit kecil per fitur dengan pesan conventional commit. JANGAN push dan jangan buat remote. Saya yang push.
7. Jangan menyimpan secret/token di repo. Redact token dan pola secret umum di log, rekaman, dan UI.
8. Jalankan dan uji sendiri. Laporkan hasil nyata. Jangan klaim sesuatu berhasil di Windows atau dengan GPU jika hanya diuji di macOS.
9. Buat CLAUDE.md di root repo: konvensi kode, cara uji, aturan lintas platform di bawah, dan aturan di atas, agar sesi berikutnya (termasuk di PC) konsisten.

# ATURAN LINTAS PLATFORM (WAJIB)
- Path: `node:path` dan `os.homedir()`, tidak ada path hardcoded. Aman untuk spasi dan karakter non-ASCII. Pada Windows, worktree memakai path pendek dan `core.longpaths=true` di worktree agar tidak kena batas 260 karakter.
- Proses: `child_process.spawn` dengan array argumen, tanpa shell string. Pada Windows, pemanggilan `.cmd`/`.bat` (npm, opencode, code) butuh penanganan khusus (Node menolak spawn langsung tanpa shell pada versi baru): buat satu helper `run()` yang me-resolve eksekutabel dan meng-quote argumen dengan benar, lalu uji dengan argumen berspasi.
- Mematikan proses: Windows `taskkill /PID <pid> /T /F`; macOS/Linux grup proses (spawn detached lalu kill grup). Satu helper untuk keduanya.
- Cek PID hidup untuk lock: `process.kill(pid, 0)` dengan penanganan error lintas OS.
- Akhir baris: file teks LF. Tambahkan `.gitattributes` (`* text=auto eol=lf`, kecuali .cmd/.bat = crlf). Parser membaca CRLF maupun LF.
- Instalasi perintah: `package.json` dengan field `bin`; instal lewat `npm link` (uninstall `npm unlink -g`). Tidak mengedit PATH manual dan tidak memakai `setx`. Windows otomatis mendapat shim .cmd dari npm. Nama perintah default `agent`; `doctor` mendeteksi bentrok nama dengan perintah lain.
- Lokasi VS Code user tasks.json: macOS `~/Library/Application Support/Code/User/tasks.json`, Windows `%APPDATA%\Code\User\tasks.json`, Linux `~/.config/Code/User/tasks.json`. Verifikasi format task dan dukungan `inputs` di dokumentasi VS Code terbaru.
- Lapisan platform terpisah (`src/platform/`): GPU (nvidia-smi bila ada; di macOS laporkan "tidak ada NVIDIA, normal di Mac"), memori (`os.freemem`), pengelolaan `llama-server`, pencarian `code` CLI (fallback lokasi default Code.exe di Windows dan /Applications di macOS). Windows adalah target utama, macOS best-effort.
- Konfigurasi spesifik mesin (path llama-server, path GGUF, profil model, `--n-cpu-moe`, ctx) ada di ${AGENT_HUB_HOME}/config.json, bukan di repo. Sediakan `config.example.json` dengan placeholder.

# STRUKTUR REPO
agent-hub/
  README.md, CLAUDE.md, package.json, .gitattributes, .gitignore, config.example.json
  bin/agent.js
  src/ (cli, pipeline, worktree, lock, runner, record, platform/, status, doctor, vscode)
  opencode/agents/*.md        (lead, coder, tester, fixer, reviewer, documenter, pr-writer, security opsional)
  opencode/opencode.template.json   (provider llama.cpp, model id placeholder)
  templates/ (AGENTS.md, SPEC.md, TASKS.md, PR.md, vscode-tasks.json)
  monitor/server.js, monitor/public/ (index.html, run.html, aset lokal)
  test/ (node:test; fixture repo git sementara dibuat saat uji)
  scripts/e2e-mock.js
  docs/SETUP-PC.md, docs/PC-VERIFY.md
  .github/workflows/ci.yml
Data runtime (di luar repo): ${AGENT_HUB_HOME}/ berisi runs/, worktrees/, locks/, backups/, repos/, config.json.

# CI
.github/workflows/ci.yml: matriks ubuntu-latest, macos-latest, windows-latest, Node 20 dan 22. Langkah: checkout, setup-node, set git user.name/email untuk commit di uji, `node --test`, `node scripts/e2e-mock.js`. CI tidak membutuhkan model, GPU, OpenCode, atau akses jaringan selain instalasi Node.

# PERINTAH CLI `agent`
- agent doctor: cek git, gh (auth), node 20+, opencode, code CLI, llama-server terjangkau, GPU, RAM bebas, bentrok nama perintah. Beri saran perbaikan konkret. Pada -Mock, hal yang tidak ada hanya jadi peringatan.
- agent model start|stop|status [--profile qwen|gemma] [--n-cpu-moe N] [--ctx N]: kelola llama-server dari config.json, matikan seluruh process tree saat stop, tampilkan flag yang dipakai.
- agent init [path]: idempotent. Tambahkan `.agent/` ke info/exclude git, jalankan /init OpenCode bila AGENTS.md belum ada (tanya dulu sebelum membuat file di repo), deteksi perintah install/lint/typecheck/test/build dari file manifest dan simpan ke ${AGENT_HUB_HOME}/repos/<repo-key>/commands.json (bukan di repo). Jika tidak jelas, tanya saya.
- agent code [path]: init (jika belum), lalu `code <path>`. Opsi --monitor membuka monitor. `code .` biasa tidak boleh terganggu.
- agent run "<prompt>" [--repo .] [--base <branch>] [--in-place] [--queue] [--mock] [--yes]
- agent resume [<run-id>] | agent status | agent stop <run-id>
- agent open <run-id>: buka worktree run itu di VS Code.
- agent diff <run-id> [--stage <id>]: diff di terminal (total atau per tahap).
- agent clean: hapus worktree run yang selesai (konfirmasi dulu). Rekaman run TIDAK dihapus kecuali dengan --purge.
- agent monitor [--port 3777] [--no-browser]
- agent vscode-install: pasang task level user (lihat bagian VS Code).

# ISOLASI: WORKTREE (DEFAULT)
- Run bekerja di `git worktree` di ${AGENT_HUB_HOME}/worktrees/<repo-key>/<run-id>, branch `agent/<slug>-<yyyymmdd-hhmm>` dari base (default origin/HEAD; `git fetch` dulu; jangan `pull` atau ubah branch/working tree saya). Jika repo tanpa remote, pakai HEAD saat ini sebagai base.
- Working tree saya tidak boleh disentuh. Perubahan saya yang belum commit tidak masuk run (beri tahu jelas).
- Di worktree: jalankan perintah install dari commands.json. File lokal tak terlacak seperti `.env*`: JANGAN disalin otomatis. Laporkan yang hilang dan tanya saya, per file.
- `--in-place`: bekerja langsung di folder repo saya, wajib working tree bersih (jika kotor, berhenti dan tanya), tetap di branch baru agent/..., tidak pernah di main/master.
- Tidak pernah bekerja di main/master dalam mode apa pun.

# LOCK GLOBAL
- Satu pipeline aktif untuk semua repo (satu GPU, satu model). Lock di ${AGENT_HUB_HOME}/locks/ dengan cek PID hidup (bersihkan lock basi).
- Run kedua: ditolak dengan pesan run mana yang aktif, atau dengan --queue masuk antrean FIFO (state `queued`).

# PIPELINE (urutan diatur KODE, bukan model; satu agent aktif pada satu waktu)
0. Preflight: repo git, gh auth ok (dilewati di mock), model server sehat (jika mati, tawarkan `agent model start`), lock didapat, worktree siap. Catat base_sha.
1. Intake (lead): prompt singkat jadi .agent/SPEC.md (tujuan, cakupan, stack terdeteksi dari repo, asumsi ditandai, acceptance criteria teruji, di luar cakupan). Maksimal 3 pertanyaan, hanya jika mengubah arsitektur.
   GATE 1: tampilkan SPEC, minta persetujuan (y/n/edit). Selama menunggu, state `waiting_gate`.
2. Plan (lead): .agent/TASKS.md berisi 3 sampai 8 task kecil berurutan (id, judul, file terkait, acceptance check).
3. Loop per task, berurutan:
   a. coder mengerjakan hanya task itu.
   b. tester menulis atau memperbarui test. KODE yang menjalankan lint/typecheck/test/build. Exit code adalah kebenaran, bukan klaim LLM.
   c. Gagal: fixer, maksimal 3 putaran.
   d. reviewer (read-only) menilai diff terhadap SPEC dan task. Baris terakhir wajib `VERDICT: PASS` atau `VERDICT: CHANGES_REQUESTED`; setiap temuan wajib file:baris. CHANGES: fixer lalu review ulang, maksimal 2 ronde.
   e. Commit conventional commit per task.
   Batas terlampaui: state=blocked, berhenti, ringkas penyebab. Tidak pernah lanjut diam-diam.
4. Final check: seluruh lint/typecheck/test/build, cek secret (gitleaks bila ada, kalau tidak pola umum), audit dependency bila tersedia.
5. Docs (documenter): hanya boleh mengedit README, docs/**, CHANGELOG*, dan docstring di file yang berubah. Commit `docs:`.
6. PR (pr-writer): .agent/PR.md (ringkasan, perubahan per task, hasil tes, hasil review, risiko, cara uji).
   GATE 2: tampilkan `git diff --stat` dan PR.md, minta persetujuan.
7. Publish (KODE, bukan agent): `git push -u origin <branch>` lalu `gh pr create --draft --title ... --body-file .agent/PR.md`. Larang force push, push ke main/master, dan `gh pr merge`. Simpan URL PR ke status.json. Di mock: dry-run saja.
`resume` melanjutkan dari tahap terakhir yang selesai (state tersimpan, termasuk jika terminal tertutup).

# AGENT OPENCODE
- lead: read-only, tulis hanya .agent/*.md
- coder/fixer: edit dan bash terbatas (build/test/git diff/status). Tanpa git commit/push dan tanpa gh.
- tester: edit hanya file test
- reviewer: edit deny, bash hanya git diff/log/status
- documenter: edit hanya README, docs/**, CHANGELOG*
- pr-writer: tulis hanya .agent/PR.md
- Semua: deny git push, gh pr merge, rm -rf, force push.
System prompt agent dalam bahasa Inggris (lebih andal untuk model lokal), singkat, tegas, output terstruktur. Teks PR dan README mengikuti bahasa repo target. Buat config OpenCode per run (file/env), jangan merusak config OpenCode global saya.

# REKAMAN TRANSPARANSI (WAJIB)
Setiap tahap direkam sebagai "stage". Di ${AGENT_HUB_HOME}/runs/<repo-key>/<run-id>/:
  status.json, events.jsonl, agent.log
  stages/<nn>-<agent>-<label>/
    meta.json (stage_id, agent, model, task_id, round, started_at, ended_at, exit_code, state, sha_before, sha_after, durasi/token bila tersedia)
    prompt.md (prompt lengkap ke agent, secret di-redact)
    response.md (jawaban akhir agent)
    reasoning.md (penalaran model bila tersedia; dapat dimatikan di config)
    tools.jsonl (tool call dan hasil ringkas, hanya jika OpenCode menyediakan)
    stdout.log
    diff.patch (git diff sha_before..sha_after; untuk tahap belum commit, snapshot `git diff` dan `git add -N` untuk file baru)
    files.json (path, status A/M/D/R, baris tambah/hapus, kategori kode/test/docs/config)
    report.md (tester/final check: perintah, exit code, ringkasan keluaran; reviewer: verdict dan temuan)
- Diff total run: total.diff dan total-files.json (base_sha..HEAD), diperbarui tiap commit.
- Rekaman tetap ada setelah worktree dibersihkan.
- Semua rekaman disaring redaksi secret (pola token/key umum dan nilai dari .env yang terdeteksi) sebelum ditulis. Batasi ukuran per file (mis. 2 MB), potong dengan penanda jelas.

# STATUS DAN MONITOR
- status.json: run_id, repo, repo_path, worktree_path, branch, base_sha, mode (worktree|inplace), stage, agent, model, task_index, task_total, fix_round, review_round, state, started_at, last_heartbeat, last_output_at, message, pr_url.
- State: queued, pending, running, waiting_gate, blocked, failed, done. Turunan: stalled (proses hidup tapi tanpa output lebih dari 5 menit, dapat dikonfigurasi). Heartbeat tiap 10 detik.
- Monitor: Node.js tanpa dependency npm, bind 127.0.0.1:3777 saja, read-only (tanpa tombol yang menjalankan perintah). Tanpa CDN, polling 2 detik, aset lokal.
  Halaman daftar (semua repo): run yang butuh perhatian (waiting_gate, blocked, failed, stalled) dan aktif di atas, lalu antrean, lalu riwayat. Tiap baris: repo, branch, tahap, agent dan model aktif, task k/n, putaran fix/review, umur heartbeat, badge state berwarna DAN bertulis. Judul tab menampilkan jumlah run yang butuh perhatian. Panel status model server (/health), GPU/VRAM bila ada, RAM.
  Halaman detail run: (1) timeline tahap, stepper (intake, plan, code, test, fix, review, docs, PR) dan daftar stage dengan state, durasi, putaran; (2) detail stage dengan tab Respons, Penalaran (tertutup default), Prompt, Tool calls (bila ada), Diff, Laporan, Log; (3) tampilan diff: daftar file (status, +/-), diff unified atau side-by-side berwarna dengan nomor baris, filter kategori, ringkasan total; (4) tab "Semua perubahan" (diff total terhadap base); (5) tab "Review dan tes" (verdict per task dengan file:baris, hasil lint/typecheck/test/build); (6) tab dokumen: SPEC.md, TASKS.md, PR.md (read-only) dan link PR.
  Keamanan: hanya baca dari folder runs, whitelist nama file, cegah path traversal, escape semua teks sebelum ke DOM (tidak ada innerHTML dari konten run), batasi ukuran respons, jangan sajikan nilai yang cocok pola secret. Baca diff dari git hanya lewat spawn dengan argumen terpisah.
  Gaya: bersih, minimal, profesional, terang/gelap mengikuti sistem, responsif.

# INTEGRASI VS CODE
- `agent vscode-install` menambah task di tasks.json user VS Code (lokasi per OS di atas, backup dulu, merge dengan task yang ada). Task: "Agent: Run" (input prompt), "Agent: Resume", "Agent: Status", "Agent: Monitor", "Agent: Open Run", "Agent: Diff". Semua memanggil `agent` di folder workspace aktif. Tidak ada file ditambahkan ke repo.
- README menjelaskan membuka monitor lewat "Simple Browser: Show" ke http://127.0.0.1:3777 dan melihat diff run lewat `agent open <run-id>` lalu Source Control.
- Gate dijawab di terminal tempat `agent run` berjalan. Monitor menandai run `waiting_gate` dan `blocked` mencolok.

# MODE MOCK
`--mock` memakai stub agent berskenario (sukses, gagal lalu fix, CHANGES_REQUESTED, stalled, blocked, ditolak lock) yang menulis file nyata di worktree, sehingga rekaman stage, diff, files.json, dan monitor teruji tanpa GPU, tanpa OpenCode, dan tanpa push sungguhan (publish dry-run). Mock harus lulus di macOS, Linux, dan Windows (CI).

# ANTI-OOM (PC)
- Default ctx 32768, opsi 65536 setelah dites.
- Satu model dimuat, tidak ada agent paralel, lock global.
- doctor memperingatkan bila RAM bebas di bawah 8GB atau VRAM terpakai di atas 10.5GB saat model aktif.

# DOKUMEN SERAH TERIMA KE PC
- docs/SETUP-PC.md: instal Git for Windows, Node LTS, GitHub CLI, VS Code, OpenCode (ikuti docs resmi), build llama.cpp CUDA Windows beserta paket cudart yang sesuai, driver NVIDIA, unduh GGUF, isi config.json, `npm link`, `agent doctor`.
- docs/PC-VERIFY.md: checklist hal yang TIDAK bisa diverifikasi di macOS dan harus saya uji di PC, masing-masing dengan perintah dan hasil yang diharapkan: flag llama-server dan `--n-cpu-moe`, VRAM/RAM saat model aktif, spawn .cmd di Windows, taskkill process tree, path VS Code tasks, flag `opencode run` dan format event, perilaku worktree di path Windows, satu run sungguhan di repo kecil. Sertakan juga hal apa pun yang Anda tandai tidak terverifikasi selama pengembangan.

# KRITERIA SELESAI
- `node --test` dan `node scripts/e2e-mock.js` lulus di macOS. Workflow CI terdefinisi untuk tiga OS (belum dijalankan karena belum ada remote; katakan itu).
- Uji end-to-end mock di dua repo git sementara: semua tahap, kedua gate, resume, worktree (working tree saya tidak berubah), --in-place, lock/antrean, skenario gagal dan stalled.
- Verifikasi transparansi pada satu run mock: monitor menampilkan respons tiap agent, diff per stage (kode dan docs), diff total, verdict, hasil tes, dan PR.md; rekaman tetap ada setelah `agent clean`; secret palsu di fixture tidak muncul di UI maupun rekaman.
- Uji bahwa `AGENT_HUB_HOME` dan `AGENT_HUB_VSCODE_USER_DIR` mengisolasi semua efek samping. vscode-install dan uninstall idempotent dengan backup.
- README maksimal 2 halaman: instal, lima menit pertama, alur `agent code .`, pindah repo, membaca monitor, troubleshooting, batasan model lokal.
- Laporan akhir: apa yang sudah diuji (dan di OS mana), apa yang belum dan menunggu PC, dan apa yang tidak bisa direkam karena batasan OpenCode.

# TAMBAHAN v3: VS CODE SEBAGAI UI UTAMA
Tujuan: `agent code .` membuka repo di VS Code dan menyiapkan UI chat/kontrol di dalam VS Code. Panel web (v2 bagian 3) menjadi fallback berprioritas rendah.

## Tahap A: agent code tanpa ekstensi buatan sendiri
- `agent code [path]`: init repo, buka `code <path>`, pastikan ekstensi OpenCode resmi terpasang (cek `code --list-extensions`; pasang hanya dengan persetujuan saya via `code --install-extension <id>`; verifikasi ID di docs OpenCode dan Marketplace), lalu siapkan peluncuran otomatis `agent chat` di terminal terintegrasi.
- Peluncuran otomatis: verifikasi di dokumentasi VS Code terbaru apakah task dengan `runOptions.runOn = "folderOpen"` didukung di tasks.json level user. Jika tidak, pakai `.vscode/tasks.json` workspace yang ditambahkan ke .git/info/exclude (tidak pernah ikut commit; merge dengan file yang ada, backup dulu). Catat di README prompt izin "automatic tasks" satu kali.
- Config OpenCode hub dipasang oleh proses `agent chat` lewat env atau config per proses (verifikasi nama env di docs OpenCode). Jangan mengandalkan env dari `code`, karena instance VS Code yang sudah berjalan mengabaikannya.
- Catat di README batasan jujur: chat tetap berupa TUI di terminal VS Code, bukan panel webview.
- Monitor bisa dibuka di Simple Browser VS Code lewat task opsional.

## Tahap B: ekstensi VS Code `agent-hub-vscode` (milestone baru, terakhir)
- JavaScript polos (CommonJS), tanpa build step dan tanpa dependency runtime. Pemasangan lewat `agent vscode-install --extension` (idempotent, backup, ada uninstall).
- Aktif otomatis saat folder dibuka (onStartupFinished), hanya bila repo terdaftar atau ada run terkait.
- Panel sidebar (webview): (1) kotak prompt untuk memulai `agent run`; (2) timeline bergaya chat per stage: respons agent, status, durasi, putaran; (3) tombol Approve/Reject/Edit pada gate dengan SPEC/PR di samping; (4) kotak arahan (steer) ke agent berikutnya; (5) Stop/Resume.
- Integrasi native: klik file di diff membuka editor diff VS Code (`vscode.diff`) pada worktree atau rekaman, status bar menampilkan state dan agent aktif, notifikasi saat waiting_gate, blocked, atau failed.
- Komunikasi hanya lewat kanal kontrol file dan rekaman run (v2 bagian 2) serta spawn `agent` dengan argumen terpisah. Tidak ada eksekusi perintah arbitrer. Webview memakai CSP ketat, semua teks run di-escape, tidak ada innerHTML dari konten run.
- Opsional, jika `opencode serve` menyediakan API sesi: chat bebas dengan satu agent di panel yang sama. Jika tidak, sediakan tombol "Buka OpenCode di terminal".
- Hormati lock global (satu pemakai model pada satu waktu).
- Uji: pisahkan logika dari API vscode agar bisa diuji dengan node:test. Uji manual masuk docs/PC-VERIFY.md.

# URUTAN
1) Rencana dan daftar keputusan, tunggu persetujuan. 2) Skeleton, CLAUDE.md, platform layer, doctor, CI. 3) Agent dan config OpenCode. 4) Driver, worktree, lock, rekaman stage, dan mock. 5) Integrasi VS Code. 6) Monitor (daftar, lalu detail run dan diff). 7) Dokumen serah terima (SETUP-PC, PC-VERIFY) dan README. 8) Uji end-to-end. 9) Laporan. 10) Tahap A: VS Code tanpa ekstensi buatan sendiri. 11) Tahap B: Ekstensi VS Code `agent-hub-vscode`.