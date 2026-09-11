# Arsitektur Cloudflare One-Click v2.1.0

JOPUJA LIVE CONNECT berjalan sebagai satu Worker full-stack:

- Worker: router, auth, admin/user dashboard, API, Telegram gateway.
- Static Assets: CSS/JS/widget.
- D1: application database.
- R2: custom widget icon dan notification sound.
- `LIVE_HUB` Durable Object: WebSocket realtime per domain.
- `AUTH_CRYPTO` Durable Object: password KDF + Security Vault.
- Cron: maintenance.

## Security Vault

`AUTH_CRYPTO` membuat random master key 256-bit ketika pertama dipakai dan menyimpannya di Durable Object storage. Secret aplikasi seperti bot token dan outbound webhook secret disimpan ke D1 hanya dalam bentuk AES-GCM ciphertext. Tidak dibutuhkan Worker Secret manual.

## Isolasi live chat

Routing chat Telegram selalu mengikat bot/domain/chat. `domain_bots.bot_id` memiliki UNIQUE constraint, jadi bot yang sama tidak dapat dipetakan ke dua domain sekaligus.

## Realtime

Setiap domain menggunakan instance `LIVE_HUB` yang berbeda (`idFromName("domain:<id>")`). Visitor dan agent terhubung melalui WebSocket, dengan polling sebagai fallback dari frontend.
