# Agent Hub for VS Code

Sidebar panel untuk memantau dan mengontrol pipeline multi-agent [agent-hub](https://github.com/Ikrar06/agent-hub) langsung dari VS Code.

## Fitur

- **Kotak prompt** — mulai agent run dari sidebar (Cmd/Ctrl+Enter)
- **Daftar run real-time** — ditarik dari monitor web (`agent monitor`), klik run untuk membuka halaman detailnya
- **Status & progress** — pill status berwarna, progress bar per task, indikator live/offline
- **Callout gate** — peringatan saat ada run `waiting_gate`/`blocked` yang menunggu input
- **Timeline aktivitas** — jejak aksi Anda dan pipeline
- **Tombol Stop / Resume** — kontrol jalannya pipeline

## Instalasi

Cara termudah — dari repo agent-hub:

```bash
agent vscode-install --extension
```

Perintah ini otomatis mem-build file `.vsix` (bila belum ada) lalu meng-install-nya ke VS Code.

Instalasi manual dari file `.vsix` (misal dari GitHub Releases):

```bash
code --install-extension agent-hub-vscode-1.0.0.vsix
```

Atau lewat UI VS Code: panel Extensions → menu `…` → **Install from VSIX…**.

Untuk uninstall:

```bash
agent vscode-uninstall --extension
```

## Konfigurasi

| Setting | Default | Keterangan |
|---|---|---|
| `agentHub.monitorUrl` | `http://127.0.0.1:3777` | URL server monitor agent-hub |

Jalankan `agent monitor` agar panel menampilkan data run live.

## Pengembangan

Mode development tanpa install:

```bash
code --extensionDevelopmentPath=/path/ke/agent-hub/extension /path/ke/repo-target
```

Build paket `.vsix`:

```bash
cd extension
npm run package
```

## Lisensi

[MIT](./LICENSE)
