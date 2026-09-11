# JOPUJA LIVE CONNECT — Cloudflare One‑Click Edition v2.1.0

**BY JOPUJA FOUNDER**  
Credit **Jopuja Digital™**

Versi ini dibuat khusus supaya pemilik project **tidak perlu memasang Node.js, Termux, PHP, MySQL, VPS, atau menjalankan terminal di HP/PC**. Cloudflare yang menjalankan proses build dan provisioning resource dari repository GitHub/GitLab.

> Penting: aplikasi ini dideploy sebagai **Cloudflare Workers + Static Assets**, bukan Pages Drag & Drop klasik. Di dashboard Cloudflare tetap berada di menu **Workers & Pages**. Alasannya: live chat ini memerlukan backend, D1, R2, Durable Objects, WebSocket, Cron, dan webhook Telegram.

## Yang dibuat otomatis saat deploy

- Cloudflare Worker backend + frontend static assets.
- D1 database binding `DB`.
- R2 bucket binding `UPLOADS`.
- Durable Object `LIVE_HUB` untuk realtime WebSocket.
- Durable Object `AUTH_CRYPTO` untuk password KDF + **Security Vault**.
- Cron trigger maintenance.
- Schema database, index, Bronze/Silver/Gold dibuat otomatis pada request pertama.
- Master encryption key dibuat otomatis di Durable Object Security Vault saat pertama digunakan. Tidak ada lagi `APP_SECRET` yang harus diisi manual.

## Fitur utama tetap ada

- Landing page, register, login, lupa/reset password.
- Pairing Telegram dan OTP register/login/reset.
- Dashboard mobile-first + dark/light/system mode.
- Multi-tenant isolation.
- Bronze / Silver / Gold + harga dan limit dapat diubah Super Admin.
- Multi-domain + domain verification + Site Key.
- Bot Telegram berbeda per domain, satu bot tidak dapat dipakai dua domain sekaligus.
- Visitor website → Telegram → balasan Telegram → visitor website.
- Inbox dashboard → visitor website.
- Durable Object WebSocket realtime + polling fallback.
- Live visitors, traffic/pageview analytics dan report.
- Widget designer: posisi, warna, tema, icon, custom icon, lead form, welcome/offline message, business hours.
- Upload custom icon dan notification sound via R2.
- Team/agent + role/permission.
- Notifikasi per user.
- Quick replies + automation rules.
- API keys + signed outbound webhooks.
- Admin tracking bots.
- Audit hash chain.
- Diagnostics/troubleshooting.
- Cron cleanup sessions/OTP/visitor/history.

## Cara pasang TANPA Node.js di perangkat

Lihat `INSTALL-NO-NODE.md`. Ringkasnya:

1. Extract ZIP project.
2. Buat repository GitHub.
3. Upload isi folder project ke repository.
4. Cloudflare → **Workers & Pages** → **Create application** → **Import a repository**.
5. Pilih repository tadi.
6. Build command: kosong.
7. Deploy command: `npx wrangler deploy` (biasanya otomatis terisi).
8. Klik **Deploy**.
9. Cloudflare otomatis memprovision D1/R2/Durable Objects dari `wrangler.jsonc`.
10. Buka URL `*.workers.dev` yang muncul → `/install` otomatis terbuka.
11. Buat Super Admin.
12. Admin → Settings → masukkan token bot autentikasi → Simpan & Pasang Webhook.

Tidak perlu membuat database, bucket, Durable Object, schema, atau secret secara manual.

## Security Vault tanpa secret manual

Bot token dan outbound webhook secret tidak disimpan plaintext di D1. `AUTH_CRYPTO` Durable Object membuat random 256-bit master key sekali dan menyimpannya di Durable Object storage, lalu mengenkripsi secret dengan AES-GCM. IP visitor disimpan sebagai keyed digest, bukan raw IP pada tabel visitor.

## Catatan Telegram

Bot Telegram tidak dapat memulai chat ke user yang belum menekan **Start**. Karena itu pairing menggunakan deep-link bot, lalu setelah Start berhasil server menyimpan Telegram User ID + Chat ID dan mengirim OTP.

## Widget

Setelah domain aktif, dashboard memberi script seperti:

```html
<script src="https://YOUR-WORKER.workers.dev/widget.js" data-site="site_pk_xxxxxxxxx" async></script>
```

Tempel sebelum `</body>` website target.

## Custom domain

Boleh memakai `*.workers.dev` terlebih dahulu. Jika kemudian memasang custom domain untuk LIVE CONNECT, buka kembali Admin → Settings dan simpan ulang bot autentikasi, lalu simpan ulang bot live-chat agar URL webhook Telegram memakai domain final.

## Upgrade dari v2.0.0

v2.1.0 memakai Security Vault Durable Object dan **tidak membutuhkan `APP_SECRET`**. Untuk instalasi baru gunakan v2.1.0 langsung. Jika sudah punya database produksi v2.0.0 dengan bot token terenkripsi memakai APP_SECRET, lakukan migrasi khusus dan jangan sekadar menghubungkan database lama ke v2.1.0.
