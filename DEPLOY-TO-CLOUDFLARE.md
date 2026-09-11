# Deploy to Cloudflare Button

Setelah source ini berada di repository GitHub/GitLab yang dapat dibaca Cloudflare, gunakan URL:

```text
https://deploy.workers.cloudflare.com/?url=https://github.com/USERNAME/NAMA-REPO
```

Ganti `USERNAME/NAMA-REPO` dengan repository milik Anda.

Cloudflare akan membaca `wrangler.jsonc`, membuat project Worker, memprovision D1/R2/Durable Objects, menghubungkan static assets, dan menjalankan deployment. Tidak dibutuhkan Node.js pada HP/PC pemilik project.

Jika repository private, gunakan flow Cloudflare Dashboard → Workers & Pages → Create application → Import repository, lalu pilih repo tersebut melalui Git integration.
