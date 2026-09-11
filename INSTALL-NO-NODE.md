# INSTALL TANPA NODE.JS / TERMINAL

## A. Siapkan repository dari browser

1. Extract `JOPUJA-LIVE-CONNECT-CLOUDFLARE-ONECLICK-v2.1.0.zip`.
2. Login GitHub dari browser.
3. Buat repository baru, misalnya `jopuja-live-connect`.
4. Upload **isi folder project**, bukan file ZIP-nya. Root repository harus langsung berisi:
   - `package.json`
   - `wrangler.jsonc`
   - `src/`
   - `public/`
   - `README.md`
5. Commit upload.

> Kalau memakai GitHub connector di ChatGPT, repository bisa disiapkan lebih praktis tanpa upload satu-satu dari HP.

## B. Deploy dari Cloudflare Dashboard

1. Login Cloudflare.
2. Buka **Workers & Pages**.
3. Klik **Create application**.
4. Pilih **Import a repository / Connect to Git** untuk Worker.
5. Hubungkan GitHub bila diminta, lalu pilih repository `jopuja-live-connect`.
6. Root directory: `/`.
7. Build command: **kosong**.
8. Deploy command: `npx wrangler deploy`.
9. Klik **Deploy**.

Cloudflare membaca `wrangler.jsonc` dan memprovision:

- D1 → `DB`
- R2 → `UPLOADS`
- Durable Object → `LIVE_HUB`
- Durable Object → `AUTH_CRYPTO`
- Cron trigger
- Static assets

Resource ID tidak perlu dimasukkan manual.

## C. Jalankan installer aplikasi

Setelah deployment sukses, buka URL Worker, misalnya:

`https://jopuja-live-connect.NAMA-SUBDOMAIN.workers.dev`

Jika belum ada Super Admin, aplikasi otomatis mengarah ke `/install`.

Isi:

- Nama Admin
- Email Admin
- Password Admin minimal 10 karakter, huruf besar, kecil, angka

Klik **Install Sekarang**.

Pada tahap ini schema database dan paket Bronze/Silver/Gold sudah dibuat otomatis.

## D. Pasang Bot Autentikasi Telegram

1. Buat bot di `@BotFather`.
2. Salin token bot.
3. Login Super Admin LIVE CONNECT.
4. **Admin → Settings → Bot Autentikasi**.
5. Paste token. Username bot akan diambil otomatis dari Telegram `getMe`.
6. Klik **Simpan & Pasang Webhook**.
7. Sistem otomatis menjalankan `setWebhook` ke URL Worker.
8. Klik **Hubungkan Telegram Admin** bila ingin Telegram admin dipairing.

## E. Test register user

1. Logout Super Admin atau buka incognito.
2. Buka `/register`.
3. Isi nama, email, username Telegram, password.
4. Tekan **Daftar & Hubungkan Telegram**.
5. Tekan **Buka Bot Telegram**.
6. Telegram app dicoba lebih dulu melalui `tg://`, lalu fallback ke `https://t.me/`.
7. Tekan **Start** pada bot.
8. Website mendeteksi pairing.
9. OTP 6 digit masuk ke Telegram.
10. Masukkan OTP → dashboard user terbuka.

## F. Tambah domain

1. User → **Domains**.
2. Tambah hostname tanpa path, contoh `tokogame.com`.
3. Sistem membuat verification token + Site Key.
4. Verifikasi dengan salah satu metode yang ditampilkan:
   - file `.well-known/jopuja-live-connect.txt`, atau
   - meta tag di homepage.
5. Klik **Verify** sampai status `active`.

## G. Tambah bot live-chat domain

1. User → **Telegram**.
2. Tambah nama bot + token bot dari BotFather.
3. Sistem menjalankan `getMe` dan memasang webhook otomatis.
4. Tekan **Hubungkan Bot ke Telegram** lalu Start pada bot agar Chat ID tujuan notifikasi tersimpan.
5. Mapping bot ke domain yang benar.
6. Satu bot hanya dapat dipetakan ke satu domain.

## H. Pasang widget

1. User → **Widget**.
2. Pilih domain.
3. Atur title, welcome message, theme, accent, posisi, FAB icon, form nama/telepon/email, business hours.
4. Copy script widget.
5. Tempel sebelum `</body>` website target.
6. Buka website target dan test chat.

Flow test:

`Visitor website → Worker → D1 → Bot domain → Telegram Agent → Reply → Worker → LIVE_HUB WebSocket → Visitor`

## I. Jika ada error

Buka **Diagnostics** lebih dulu. Cek semua harus hijau:

- Runtime Worker
- D1
- R2
- Realtime Durable Object
- Security Vault
- HTTPS

Untuk Telegram:

- token harus valid di `getMe`
- bot harus sudah Start untuk mendapatkan Chat ID
- webhook harus menunjuk ke URL Worker final
- jika baru ganti custom domain, simpan ulang bot agar webhook diperbarui

## J. Yang TIDAK perlu dilakukan

- Tidak perlu Node.js di HP/PC.
- Tidak perlu Termux.
- Tidak perlu PHP.
- Tidak perlu MySQL/phpMyAdmin.
- Tidak perlu membuat D1 manual.
- Tidak perlu membuat R2 bucket manual.
- Tidak perlu membuat Durable Object manual.
- Tidak perlu membuat APP_SECRET.
