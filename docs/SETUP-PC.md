# Panduan Setup untuk PC

Document ini berisi langkah-langkah untuk menginstal semua dependensi yang diperlukan untuk menjalankan agent-hub di PC Windows.

## Prasyarat

Pastikan Anda memiliki koneksi internet dan hak administrator untuk menginstal perangkat lunak.

## Langkah-langkah Instalasi

### 1. Instal Git for Windows
- Unduh dari https://git-scm.com/download/win
- Jalankan installer dengan pilihan default ( atau sesuaikan sesuai kebutuhan )
- Pastikan untuk memilih opsi "Use Git from the Windows Command Prompt" atau "Use Git from Git Bash only" sesuai preferensi Anda.
- Setelah instalasi, buka Command Prompt atau PowerShell dan jalankan `git --version` untuk memastikan terinstal.

### 2. Instal Node.js LTS
- Unduh dari https://nodejs.org/en/download/
- Pilih versi LTS (Long Term Support) saat ini.
- Jalankan installer dengan pilihan default.
- Setelah instalasi, buka Command Prompt atau PowerShell dan jalankan `node --version` dan `npm --version` untuk memastikan terinstal.

### 3. Instal GitHub CLI
- Unduh dari https://cli.github.com/
- Jalankan installer dengan pilihan default.
- Setelah instalasi, buka Command Prompt atau PowerShell dan jalankan `gh --version` untuk memastikan terinstal.
- Lakukan autentikasi dengan GitHub menggunakan `gh auth login` dan ikuti petunjuk layar.

### 4. Instal Visual Studio Code
- Unduh dari https://code.visualstudio.com/
- Jalankan installer dengan pilihan default.
- Setelah instalasi, buka VS Code dan pastikan dapat menjalankan perintah `code` dari terminal (jika belum, buka Command Palette (Ctrl+Shift+P) dan ketikkan "Shell Command: Install 'code' command in PATH").

### 5. Instal OpenCode
Ikuti dokumentasi resmi OpenCode untuk instalasi:
- Unduh dari https://opencode.ai/
- Jalankan installer sesuai instruksi.
- Setelah instalasi, buka Command Prompt atau PowerShell dan jalankan `opencode --version` untuk memastikan terinstal.

### 6. Unduh dan Siapkan llama.cpp
- Unduh repo llama.cpp dari https://github.com/ggerganov/llama.cpp
- Ikuti instruksi pembangunan untuk Windows dengan dukungan CUDA (jika Anda memiliki GPU NVIDIA) atau hanya CPU.
- Pastikan Anda dapat menjalankan `llama-server` dari command line.
- Unduh model GGUF yang sesuai (misalnya Qwen3.6-35B-A3B Q4 UD-Q4_K_M) dan letakkan di lokasi yang dikenal.
- Buat file konfigurasi `${AGENT_HUB_HOME}/config.json` dengan konten:
  ```json
  {
    "llamaServerPath": "C:\\path\\to\\llama-server.exe",
    "ggufPath": "C:\\path\\to\\model.Q4_K_M.gguf",
    "modelProfile": "qwen",
    "nCpuMoe": 4,
    "ctx": 32768
  }
  ```
  Sesuaikan path sesuai lokasi file Anda.

### 7. Clone Repository agent-hub
- Buka Command Prompt atau PowerShell.
- Jalankan perintah berikut untuk mengclone repositori:
  ```
  git clone https://github.com/Ikrar06/agent-hub.git
  cd agent-hub
  ```
- Instal dependensi Node.js (jika ada) dengan `npm install` (meski agent-hub dirancang tanpa dependensi npm runtime, beberapa alat development mungkin memerlukannya).

### 8. Link Perintah agent
- Dalam direktori agent-hub, jalankan:
  ```
  npm link
  ```
- Ini akan membuat perintah global `agent` yang terhubung ke `bin/agent.js` dalam repositori ini.
- Verifikasi dengan menjalankan `agent --help` untuk melihat daftar perintah yang tersedia.

### 9. Verifikasi Instalasi
- Jalankan `agent doctor` untuk memeriksa bahwa semua komponen yang diperlukan tersedia dan berfungsi.
- Ikuti rekomendasi perbaikan jika ada yang tidak terdeteksi.

### 10. Instal Ekstensi VS Code `agent-hub-vscode`
- Dalam direktori agent-hub, jalankan:
  ```
  agent vscode-install --extension
  ```
- Ini akan membuat ekstensi VS Code `agent-hub-vscode` yang terinstal.
- Ekstensi ini menyediakan panel sidebar untuk mengontrol agent runs dengan fitur:
  - Kotak prompt untuk input user
  - Timeline tahap agent yang sedang berjalan
  - Kontrol gate (waiting_gate/blocked)
  - Kotak steering untuk input selama proses
  - Tombol stop/resume untuk mengontrol agent
- Verifikasi dengan membuka VS Code dan melihat apakah panel Agent Hub muncul di sidebar.

## Catatan Penting

- Pastikan variabel lingkungan `AGENT_HUB_HOME` dan `AGENT_HUB_VSCODE_USER_DIR` tidak disetelah jika Anda ingin menggunakan nilai default (`~/.agent-hub` dan `~/.vscode` masing-masing). Jika Anda ingin mengisolasi data, setel variabel lingkungan ini sebelum menjalankan perintah agent.
- Untuk penggunaan di berbagai repositori, Anda tidak perlu menyalin repositori agent-hub ke setiap target; cukup gunakan perintah `agent` dari mana saja setelah terinstal secara global.
- Jika Anda mengalami masalah dengan panjang path pada Windows, pastikan Anda mengaktifkan `core.longpaths=true` dalam konfigurasi Git global atau per repositori.

## Pemecahan Masalah Umum

- **Perintah tidak ditemukan**: Pastikan direktori tempat `npm link` membuat shim ada di PATH Anda.
- **Git tidak mengenali perintah**: Pastikan Git terinstal dan path ke `git.exe` ada di PATH.
- **VS Code tidak terbuka dari terminal**: Pastikan perintah `code` terdaftar dalam PATH (lihat langkah 4).
- **OpenCode tidak terdeteksi**: Pastikan OpenCode terinstal dan path ke eksekutablenya ada dalam PATH.
- **llama-server tidak menjalankan model**: Pastikan path ke file GGUF benar dan cukup RAM/VRAM tersedia.

## Lisensi

MIT