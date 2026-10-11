# agent-hub

Toolkit CLI lintas platform untuk menjalankan pipeline multi-agent coding lokal (OpenCode + llama.cpp) di repository mana pun, terintegrasi dengan VS Code, dan dilengkapi dengan halaman mission control web untuk transparansi.

## Instalasi

Lihat [docs/SETUP-PC.md](docs/SETUP-PC.md) untuk panduan instalasi lengkap di Windows.
Untuk macOS/Linux, pastikan Anda memiliki:
- Git
- Node.js LTS
- VS Code
- OpenCode (ikut dokumentasi resmi)
- llama.cpp dengan model GGUF yang sesuai

Setelah dependencies terinstal, jalankan:
```bash
git clone https://github.com/Ikrar06/agent-hub.git
cd agent-hub
npm link   # membuat perintah global `agent`
```

## Lima Menit Pertama

Setelah instalasi:
1. Buka terminal baru dan jalankan `agent doctor` untuk memastikan semua komponen terdeteksi.
2. Jalankan `agent model start` untuk menjalankan llama-server.
3. Pilih sebuah repositori target dan jalankan:
   ```bash
   agent code /path/to/repo
   ```
   Ini akan membuka VS Code di repositori tersebut.
4. Di terminal VS Code, jalankan:
   ```bash
   agent run "Tambahkan fitur X"
   ```
   Tahap pipeline akan berjalan otomatis (intake, perencanaan, coding, testing, dll.).
5. Jalankan `agent vscode-install --extension` untuk menginstal ekstensi VS Code Agent Hub.
6. Buka monitor web di http://127.0.0.1:3777 untuk melihat progres run secara real-time.

## Ekstensi VS Code `agent-hub-vscode`

Agent Hub juga menyediakan ekstensi VSCode yang memberikan panel sidebar untuk mengontrol agent runs. Untuk menginstal ekstensi ini:

1. Pastikan Anda telah menjalankan `agent vscode-install --extension` setelah instalasi agent-hub
2. Buka VS Code dan pastikan panel "Agent Hub" terlihat di sidebar
3. Panel ini menyediakan:
   - Kotak prompt untuk memulai agent run ( Cmd/Ctrl+Enter untuk menjalankan)
   - Daftar run real-time langsung dari monitor web (klik untuk membuka detail run)
   - Status, progress bar, dan timeline aktivitas agent
   - Kontrol gate (waiting_gate/blocked) dengan callout peringatan
   - Tombol stop/resume untuk mengontrol agent
4. URL monitor dapat diubah melalui setting VS Code `agentHub.monitorUrl` (default `http://127.0.0.1:3777`)

## Alur Kerja Umum

1. **Persiapan**: Pastikan `agent doctor` tidak menunjukkan kesalahan kritial.
2. **Inisialisasi di repositori target**: Jalankan `agent init /path/to/repo` (opsional, biasanya dilakukan otomatis oleh `agent code`).
3. **Menjalankan pekerjaan**: Gunakan `agent run "<prompt>"` untuk memulai pipeline baru.
4. **Memantau progres**: Buka monitor web atau jalankan `agent status` di terminal.
5. **Intervensi**: Jika run terhambat (waiting_gate/blocked), Anda dapat memberikan input melalui terminal atau membatalkan dan menjalankan ulang.
6. **Pembersihan**: Setelah selesai, jalankan `agent clean` untuk menghapus worktree yang sudah selesai (jika diperlukan).

## Pemecahan Masalah Umum

- **agent doctor menunjukkan kesalahan**: Periksa bahwa semua komponen (Git, Node, OpenCode, llama-server) terinstal dan tersedia di PATH.
- **llama-server tidak menjalankan model**: Pastikan path ke file GGUF benar di ${AGENT_HUB_HOME}/config.json dan cukup RAM/VRAM tersedia.
- **Monitor tidak terbuka**: Pastikan port 3777 tidak digunakan oleh aplikasi lain dan perintah `agent monitor` tidak menunjukkan kesalahan.
- **Worktree tidak terisolasi**: Pastikan variabel lingkungan `AGENT_HUB_HOME` disetel dengan benar dan tidak ada konflik path.
- **Gagal mengirim PR**: Pastikan Anda telah login ke GitHub CLI (`gh auth login`) dan memiliki akses ke repositori target.

## Dokumen Utama

- [BRIEF.md](docs/BRIEF.md) - Tujuan, kontekst, aturan kerja, dan struktur repo.
- [PLAN.md](docs/PLAN.md) - Arsitektur, keputusan, risiko, dan pertanyaan.
- [TASKS.md](docs/TASKS.md) - Milestone berurutan dan acceptance check.

## Laporan Akhir

### Apa yang Sudah Diuji (macOS)

Berikut adalah項 yang telah berhasil diuji pada platform macOS:

1. **Unit Tests**: `node --test` lulus - semua tes unit untuk lock, worktree, dan OpenCode configuration berjalan sukses
2. **End-to-End Mock Tests**: `node scripts/e2e-mock.js` lulus - mencakup:
   - Semua tahap pipeline (intake, planning, coding, testing, fixing, reviewing, documentation, PR)
   - Kedua gate (waiting_gate dan blocked)
   - Fungsi resume
   - Isolasi worktree
   - Operasi --in-place
   - Mekanisme lock/antrean (queue)
   - Skenario gagal dan stalled
   - Verifikasi transparansi melalui monitor web
3. **Isolasi Lingkungan**: Verifikasi bahwa variabel lingkungan `AGENT_HUB_HOME` dan `AGENT_HUB_VSCODE_USER_DIR` berfungsi untuk mengisolasi data runtime
4. **Perintah Dasar CLI**: Semua perintah agent (doctor, model, init, code, run, resume, status, stop, open, diff, clean, monitor, vscode-install) merespon dengan sesuai dalam mode mock

### Apa yang Belum dan Menunggu PC

Berikut adalah項 yang masih perlu diverifikasi pada PC Windows:

1. **Eksekusi Sungguhan**: Uji dengan llama-server dan OpenCode yang sebenarnya (bukan mock)
2. **Integasi GPU**: Verifikasi bahwa llama.cpp dapat menggunakan akselerasi GPU NVIDIA bila tersedia
3. **Penggunaan Model Besar**: Test dengan model GGUF sebenarnya (Qwen3.6-35B-A3B Q4 UD-Q4_K_M atau serupa)
4. **Pembuatan PR Sungguhan**: Verifikasi bahwa `gh pr create` dan `gh pr merge` berfungsi dengan benar
5. **Performance di Windows**: Uji kinerja keseluruhan sistem pada hardware Windows yang ditargetkan
6. **Kompatibilitas Driver**: Verifikasi bahwa driver NVIDIA dan CUDA berfungsi dengan baik bersama llama.cpp

### Apa yang Tidak Bisa Direkam karena Batasan OpenCode

Berikut adalah aspek yang tidak dapat sepenuhnya direkam atau diverifikasi karena batasan dari OpenCode itu sendiri:

1. **Kualitas Respons LLM**: Isi sebenarnya dari respons agent coder, tester, fixer, dll. tergantung pada kualitas model lokal yang digunakan
2. **Kecepatan Eksekusi Model**: Waktu respons dari llama-server tergantung pada hardware dan alokasi resource yang tersedia
3. **Detail Internal OpenCode**: Beberapa aspek internal dari agent OpenCode yang tidak diekspos melalui API atau event yang tersedia
4. **Interaksi Model dengan Tools**: Seperti model menggunakan alat bantu (tools) dalam proses reasoning-nya, tergantung pada implementasi spesifik versi OpenCode
5. **Variasi Output Akibat Stochasticity**: Output LLM secara bertahap bervariasi meskipun dengan prompt dan parameter yang sama

### Kesimpulan

Implementasi agent-hub telah menyelesaikan semua kriteria yang ditetapkan dalam BRIEF.md untuk platform pengembangan (macOS). Semua komponen inti telah teruji dan berfungsi dengan baik dalam mode mock. Untuk verifikasi penuh pada PC Windows, diperlukan:

1. Instalasi lengkap sesuai [docs/SETUP-PC.md](docs/SETUP-PC.md)
2. Verifikasi menggunakan checklist [docs/PC-VERIFY.md](docs/PC-VERIFY.md)
3. Uji bersungguhan dengan model lokal dan GPU yang sesuai

MIT