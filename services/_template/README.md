# Service Template

Salin folder ini ke `services/<nama-service>` sebelum mulai mengembangkan service baru.

## Endpoint awal

- `GET /api/health` - health check service.
- Endpoint domain ditambahkan di `public/index.php`.

## Menjalankan

```bash
php -S localhost:4100 -t public
```

Salin template ini lalu ubah `SERVICE_NAME` dan `SERVICE_PORT` di
`config/config.php` sesuai kebutuhan service baru.