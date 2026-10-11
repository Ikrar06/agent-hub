# Arsitektur
agent-hub adalah toolkit CLI lintas platform yang dirancang untuk menjalankan pipeline multi-agent coding lokal (menggunakan OpenCode dan llama.cpp) di repository mana pun, terintegrasi dengan VS Code, dan dilengkapi dengan halaman mission control web untuk transparansi.

Komponen utama:
- CLI (`agent`) sebagai titik masuk.
- Pipeline multi-agent yang mencakup tahap intake, perencanaan, coding, testing, fixing, reviewing, dokumentasi, dan pembuatan pull request.
- Isolasi kerja menggunakan git worktree (default) atau mode in-place.
- Sistem lock global untuk memastikan hanya satu pipeline yang aktif sekaligus (menggunakan satu model dan satu GPU).
- Monitor web berbasis Node.js yang menampilkan status run, antrean, dan riwayat.
- Integrasi VS Code melalui user-level tasks.json.
- Dokumentasi transparansi yang mencatat setiap tahap sebagai stage dengan metadata, prompt, respons, dan diff.

# Keputusan
- Menggunakan Node.js 20+ (ESM atau CJS, konsisten) tanpa dependency npm runtime untuk logika utama.
- Model server di PC: llama.cpp dengan model Qwen3.6-35B-A3B Q4 (UD-Q4_K_M) untuk agent utama dan opsional Gemma 4 12B QAT Q4_0 untuk reviewer.
- Agent runtime: OpenCode.
- Semua dependensi besar (model, llama.cpp, OpenCode) tidak diunduh ke repo; hanya petunjuk instalasi yang diberikan.
- Isolasi uji menggunakan folder sementara dan variabel lingkungan `AGENT_HUB_HOME` dan `AGENT_HUB_VSCODE_USER_DIR`.
- Perubahan di luar repo (instalasi global, task VSCode level user) hanya lewat perintah eksplisit pengguna dengan rencana, backup bertimestamp, dan idempotent.
- Commit kecil per fitur dengan pesan conventional commit, tanpa push ke remote ( pengguna yang melakukan push ).
- Tidak menyimpan secret/token di repo; redaksi token dan pola secret umum di log, rekaman, dan UI.
- Jalankan dan uji sendiri, laporkan hasil nyata, tidak klaim sesuatu berhasil di Windows atau dengan GPU jika hanya diuji di macOS.
- Buat CLAUDE.md di root repo untuk konsistensi sesi berikutnya.
- Aturan lintas platform: penggunaan `node:path` dan `os.homedir()`, penanganan proses lintas OS, akhir baris file teks LF, dan instalasi perintah lewat `package.json` bin field dengan `npm link`.

# Risiko
- Kompatibilitas lintas platform: berbagai perilaku antara macOS dan Windows (misalnya, penanganan proses, path dengan spasi, dan eksekusi file .cmd/.bat).
- Ketergantungan pada model lokal: ketersediaan dan konsistensi model llama.cpp di berbagai mesin Windows.
- Isolasi lingkungan uji: memastikan bahwa uji dan mock tidak menyentuh home pengguna, PATH, atau setelan VS Code asli.
- Konservasi sumber daya: menjaga agar satu model dimuat pada satu waktu untuk menghindari kehabisan memori (OOM) pada PC dengan RAM terbatas.
- Keamanan: redaksi secret yang efektif dalam log, rekaman, dan UI untuk mencegah kebocoran informasi sensitif.
- Akurasi透明시: memastikan bahwa monitor dan rekaman transparansi secara akurat mencerminkan keadaan agent dan alat.
- Penggunaan OpenCode: memastikan konfigurasi OpenCode per run tidak merusak konfigurasi global dan bahwa agent berperilaku sesuai ekspektasi.

# Pertanyaan untuk Saya
1. Apakah ada preferensi khusus untuk struktur direktori atau penamaan perintah CLI oltre yang telah disebutkan dalam BRIEF.md (misalnya, nama default perintah `agent` atau alternatives)?
2. Bagaimana Anda ingin menangani konfigurasian spesifik mesin (seperti path llama-server, path GGUF, profil model, dan `--n-cpu-moe`) di antara berbagai repositori saat menggunakan `AGENT_HUB_HOME`?
3. Apakah ada required tambahan untuk integrasi VS Code oltre tugas level user yang telah dijelaskan (misalnya, debugging, atau custom views)?
4. Sejauh mana Anda ingin kita menguji fitur anti-OOM dan izolasi sumber daya di PC sebelum mengirimkan untuk verifikasi akhir?
5. Apakah ada pertimbangan khusus untuk dokumentasi serah terima ke PC (SETUP-PC.md dan PC-VERIFY.md) yang ingin Anda pastikan tercakup sepenuhnya?