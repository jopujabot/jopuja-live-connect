# Feature Map — JOPUJA LIVE CONNECT Cloudflare Native v2.1.0

BY JOPUJA FOUNDER • Credit Jopuja Digital™

Versi Cloudflare ini mempertahankan fungsi aplikasi dan mengganti lapisan runtime agar seluruh backend berjalan di ekosistem Cloudflare.

| Fitur | Implementasi Cloudflare |
|---|---|
| Landing/Register/Login/Reset | Worker router + D1 session/auth |
| Telegram pairing + OTP | Worker Telegram gateway + encrypted token |
| Password security | PBKDF2-SHA256 310k di AuthCrypto Durable Object |
| Multi tenant | D1 tenant_id isolation |
| Dashboard mobile-first | Workers Static Assets + server rendered Worker HTML |
| Dark/Light/System | user_preferences di D1 |
| Live Chat Inbox | D1 chats/messages + Durable Object WebSocket |
| Reply Telegram → Website | Telegram webhook → D1 → Durable Object broadcast |
| Reply Dashboard → Website | Dashboard API → D1 → Durable Object broadcast |
| Domain connection | D1 domains + verification token |
| Widget JS/FAB | /widget.js Static Asset + Site Key + Origin validation |
| Widget designer | D1 widget_settings + R2 custom FAB icon |
| Multi bot per tenant | D1 encrypted bot registry |
| Bot unik per domain | UNIQUE(bot_id) pada domain_bots |
| Traffic/visitor realtime | D1 visitors/pageviews + heartbeat/WebSocket |
| Analytics | D1 aggregate queries |
| Team access | D1 team_members + role/permission checks |
| Bronze/Silver/Gold | D1 plans/subscriptions + admin plan builder |
| Upgrade subscription | D1 upgrade_requests + admin approval |
| Notification sound per user | D1 preference + R2 custom audio |
| Quick reply | D1 quick_replies |
| Automation | D1 automation_rules |
| API keys | SHA-256 hashed keys di D1 |
| Outbound webhook | AES-GCM secret + HMAC-SHA256 signature |
| Admin tracking bot | D1 admin_bots + event router |
| Audit log | D1 hash-chain audit_logs |
| Diagnostics | Worker health checks + D1 diagnostics |
| Cleanup/maintenance | Cloudflare Cron Triggers |
| Uploaded private media | R2 melalui authenticated Worker route |
| Realtime scaling | Durable Objects + WebSocket Hibernation |

## Runtime yang tidak lagi dipakai

Tidak ada PHP, Apache, LiteSpeed, Nginx, MySQL, atau file SQLite lokal yang dibutuhkan oleh versi ini.

Database aplikasi adalah **Cloudflare D1**, file media adalah **Cloudflare R2**, realtime adalah **Durable Objects**, dan backend HTTP adalah **Cloudflare Workers**.
