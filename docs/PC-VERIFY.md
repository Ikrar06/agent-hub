# Checklist Verifikasi untuk PC

Document ini berisi daftar hal yang harus diverifikasi di PC Windows untuk memastikan agent-hub berfungsi dengan baik. Setiap item mencakup perintah yang harus dijalankan dan hasil yang diharapkan.

## 1. Verifikasi Instalasi Git
- **Perintah**: `git --version`
- **Hasil yang Diharapkan**: Menampilkan versi Git (misalnya `git version 2.45.0.windows.1`)

## 2. Verifikasi Instalasi Node.js dan npm
- **Perintah**: `node --version`
- **Hasil yang Diharapkan**: Menampilkan versi Node.js LTS (misalnya `v20.15.0`)
- **Perintah**: `npm --version`
- **Hasil yang Diharapkan**: Menampilkan versi npm (misalnya `10.7.0`)

## 3. Verifikasi Instalasi GitHub CLI
- **Perintah**: `gh --version`
- **Hasil yang Diharapkan**: Menampilkan versi GitHub CLI (misalnya `gh version 2.58.0-windows`)

## 4. Verifikasi Instalasi Visual Studio Code
- **Perintah**: `code --version`
- **Hasil yang Diharapkan**: Menampilkan versi VS Code (misalnya `1.92.0`)
- **Perintah Tambahan**: `code --list-extensions` untuk melihat ekstensi yang terinstal (opsional)

## 5. Verifikasi Instalasi OpenCode
- **Perintah**: `opencode --version`
- **Hasil yang Diharapkan**: Menampilkan versi OpenCode (misalnya `0.12.0`)

## 6. Verifikasi Instalasi dan Konfigurasi llama.cpp
### 6.1. Verifikasi llama-server dapat dijalankan
- **Perintah**: `llama-server --help`
- **Hasil yang Diharapkan**: Menampilkan bantuan usage untuk llama-server

### 6.2. Verifikasi Model GGUF Tersedia
- **Perintah**: `dir /path/to/model.Q4_K_M.gguf` (ganti dengan path sebenarnya)
- **Hasil yang Diharapkan**: Menampilkan informasi file model GGUF dengan ukuran yang sesuai (sekitar 20.6 GiB untuk Qwen3.6-35B-A3B Q4 UD-Q4_K_M)

### 6.3. Verifikasi Konfigurasi agent-hub
- **Perintah**: `type %AGENT_HUB_HOME%\config.json` (jika variabel lingkungan disetel) atau buka file langsung
- **Hasil yang Diharapkan**: Menampilkan konfigurasi JSON dengan field:
  - `llamaServerPath`: path lengkap ke llama-server.exe
  - `ggufPath`: path lengkap ke file model GGUF
  - `modelProfile`: "qwen" (sesuai model yang digunakan)
  - `nCpuMoe`: angka integer positif (misalnya 4)
  - `ctx`: 32768 atau 65536 (sesuai pengaturan)

## 7. Verifikasi Perintah agent-hub Dasar
- **Perintah**: `agent --help`
- **Hasil yang Diharapkan**: Menampilkan daftar perintah yang tersedia (doctor, model, init, code, run, resume, status, stop, open, diff, clean, monitor, vscode-install)

## 8. Verifikasi Perintah agent doctor
- **Perintah**: `agent doctor`
- **Hasil yang Diharapkan**: Menampilkan output pemeriksaan komponen dengan status OK atau peringatan untuk komponen yang tidak terdeteksi (dalam mode mock, komponen seperti OpenCode atau llama-server mungkin hanya menunjukkan peringatan)

## 9. Verifikasi Perintah agent model
- **Perintah**: `agent model status`
- **Hasil yang Diharapkan**: Menampilkan status llama-server (berjalan atau tidak) dan konfigurasi yang sedang digunakan

## 10. Verifikasi Isolasi Lingkungan (Opsional)
- **Perintah**: `echo %AGENT_HUB_HOME%`
- **Hasil yang Diharapkan**: Menampilkan path direktori untuk data runtime agent-hub (default: `%USERPROFILE%\.agent-hub`)
- **Perintah**: `echo %AGENT_HUB_VSCODE_USER_DIR%`
- **Hasil yang Diharapkan**: Menampilkan path direktori untuk setelan VS Code (default: `%APPDATA%\Code\User`)

## 11. Verifikasi Pembuatan Worktree (Opsional, membutuhkan repositori git target)
- **Perintah**: `agent run "test perintah sederhana" --mock --yes`
- **Hasil yang Diharapkan**: 
  - Sebuah worktree baru dibuat di `%AGENT_HUB_HOME%\worktrees\<repo-key>\<run-id>`
  - Direktori `.agent/` terbentuk di dalam worktree dengan berkas SPEC.md dan TASKS.md
  - Setelah run selesai, worktree tetap ada (jika tidak menggunakan `--purge` pada agent clean)
  - Repositori asli tidak berubah (branch dan file tidak termodifikasi)

## 12. Verifikasi Monitor Web (Opsional)
- **Perintah**: `agent monitor --port 3777`
- **Hasil yang Diharapkan**: 
  - Muncul pesan: "Monitor server running at http://127.0.0.1:3777/"
  - Buka browser dan akses http://127.0.0.1:3777/ untuk melihat daftar run (kosong jika belum ada run)
  - Jalankan sebuah run mock: `agent run "test" --mock --yes` dalam terminal lain, lalu refresh halaman monitor untuk melihat run terdaftar

## Catatan Penting
- Beberapa verifikasi menjalankan perintah yang mungkin memakan waktu (seperti agent doctor atau agent run). Sabar dan ikuti output yang ditampilkan.
- Jika variabel lingkungan `AGENT_HUB_HOME` atau `AGENT_HUB_VSCODE_USER_DIR` disetel ke nilai kustom, sesuaikan verifikasi sesuai dengan nilai tersebut.
- Untuk verifikasi yang melibatkan file besar (seperti model GGUF), pastikan Anda memiliki cukup ruang disk dan akses baca ke file tersebut.
- Dalam mode mock (`--mock`), komponen seperti llama-server dan OpenCode tidak sebenarnya dijalankan, sehingga verifikasi terkait ketersediaan komponen tersebut hanya akan menunjukkan bahwa perintah dapat dijalankan (bukan bahwa komponen benar-benar berjalan).

## Lisensi

MIT