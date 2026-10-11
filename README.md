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
5. Buka monitor web di http://127.0.0.1:3777 untuk melihat progres run secara real-time.

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

## Lisensi

MIT