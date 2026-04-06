# 🚀 Deployment Guide: SSH & Docker

This guide outlines the professional workflow for deploying the **GeoAI Hackathon Platform** to the production server at **cegs.kmitl.ac.th**.

---

## 1. ⚙️ Server Preparation

Before deploying, ensure the remote server has the following installed:

1. **Docker & Docker Compose**:
   ```bash
   sudo apt update
   sudo apt install docker.io docker-compose-v2 -y
   sudo usermod -aG docker geoai
   ```

2. **SSH Key Access**: Ensure you can SSH into the server without a password.
   ```bash
   ssh-copy-id geoai@cegs.kmitl.ac.th
   ```

---

## 2. 🛠️ Method 1: The "Simple SSH" Deployment

This is the most direct method. You SSH into the server, pull the code, and run Docker Compose.

### Step 1: Create a Production Environment File

On the server, in your project directory (`~/geoai`):

```bash
cp .env.example .env.production
nano .env.production
```

*Fill in your real secrets (Google OAuth, JWT, Minio keys).*

For Admin quick-access links in the UI, set server-side management URLs (not `NEXT_PUBLIC_*`):

```bash
DATABASE_MANAGEMENT_URL=https://cegs.kmitl.ac.th/geoai-2026/admin/prisma-studio
STORAGE_MANAGEMENT_URL=https://cegs.kmitl.ac.th/geoai-2026/admin/minio
```

`STORAGE_MANAGEMENT_URL` must point to MinIO Console (`:9001`) and not MinIO API (`:9000`).

### Prisma Studio service alignment (SSH jump server)

Run Prisma Studio as a persistent background service on production (Docker Compose service or PM2).

Docker Compose option (recommended in this repo):

```bash
sudo docker compose --env-file .env.production -f docker-compose.prod.yml up -d prisma-studio
```

PM2 option (if running outside Docker):

```bash
pm2 start "npm run db:studio:ssh" --name prisma-studio --cwd ~/geoai/backend
pm2 save
```

If you rely on SSH tunneling instead of public domain routes, terminate tunnels on the jump host and expose them via your reverse proxy path, then set `DATABASE_MANAGEMENT_URL` and `STORAGE_MANAGEMENT_URL` to those proxied URLs.

### Role protection for Prisma/MinIO routes

`/geoai-2026/admin/prisma-studio` and `/geoai-2026/admin/minio` are protected via Nginx `auth_request` calling backend endpoint `/api/v1/admin/tools-access`.
Only users with `ADMIN` or `MODERATOR` role can access these routes.

### Step 2: Deployment Script (`deploy.sh`)

Use `./deploy.sh` in your local project root for one-click updates:

```bash
./deploy.sh
```

This script now also runs `npm run db:grant-admins` on the server, so allowlisted admin emails receive `ADMIN` on production.

### Step 3: Grant Admins On Production (SSH)

If you need to run admin grants manually (without full deploy), use:

```bash
./grant-admins-prod.sh
```

This runs the grant command on the production host over SSH using:

```bash
sudo docker compose --env-file .env -f docker-compose.prod.yml run --rm backend npm run db:grant-admins
```

### Step 4: Email-Based Admin Auto-Grant On Login

Set `ADMIN_EMAIL_ALLOWLIST` in root `.env` (comma-separated emails). Any matching user will be granted `ADMIN` role automatically when they log in.

---

## 3. 🛡️ Method 2: Docker Contexts (Recommended)

This is the "Pro" way. You control the remote Docker engine directly from your local machine.

1. **Create a Docker Context**:
   ```bash
   docker context create kmitl-prod --docker "host=ssh://geoai@cegs.kmitl.ac.th"
   ```

2. **Switch to the Production Context**:
   ```bash
   docker context use kmitl-prod
   ```

3. **Deploy Directly**:
   Now, when you run `docker compose up`, it runs **on the server**:
   ```bash
   docker compose -f docker-compose.prod.yml up -d --build
   ```

---

## 🤖 Method 3: GitHub Actions (Automated)

If your code is on GitHub, use this workflow to deploy on every push to `main`.

**Create `.github/workflows/deploy.yml`:**

```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Deploy via SSH
        uses: appleboy/ssh-action@master
        with:
          host: cegs.kmitl.ac.th
          username: geoai
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd ~/geoai
            git pull origin main
            docker compose -f docker-compose.prod.yml down
            docker compose -f docker-compose.prod.yml up -d --build
```

---

## 🔒 Security Checklist

1. **Firewall**: Only expose ports `80` (HTTP), `443` (HTTPS), and `22` (SSH).
2. **SSL**: Use **Nginx Proxy Manager** or **Traefik** to handle SSL (Let's Encrypt).
3. **Backups**: Set up a cron job to backup the `postgres_data_prod` volume.
4. **Minio API**: Ensure port `9000` is protected or restricted to the frontend/backend bridge.

## 🌐 Nginx Root-Domain Redirect (cegs -> iono)

If `https://cegs.kmitl.ac.th` shows the Nginx welcome page, requests are being handled by Nginx before Next.js middleware. Configure redirect at Nginx level.

1. Copy the provided site config template from this repo:
  - `nginx/cegs.kmitl.ac.th.conf`

2. Install and enable it on server:

```bash
sudo cp ~/geoai/nginx/cegs.kmitl.ac.th.conf /etc/nginx/sites-available/cegs.kmitl.ac.th.conf
sudo ln -sf /etc/nginx/sites-available/cegs.kmitl.ac.th.conf /etc/nginx/sites-enabled/cegs.kmitl.ac.th.conf
sudo rm -f /etc/nginx/sites-enabled/default
```

3. Validate and reload Nginx:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

4. Verify behavior:

```bash
curl -I https://cegs.kmitl.ac.th/
curl -I https://cegs.kmitl.ac.th/geoai-2026
```

Expected:
- `/` returns `301` to `https://iono-gnss.kmitl.ac.th/`
- `/geoai-2026` stays served by GeoAI app

---

> [!TIP]
> Since you are using **Fastify** and **Next.js** with `basePath: /geoai-2026`, set `NEXT_PUBLIC_API_URL` to `https://cegs.kmitl.ac.th/geoai-2026` (without `/api/v1`).
> The frontend already appends `/api/v1` to requests, so using `/api/v1` in `NEXT_PUBLIC_API_URL` will produce broken paths like `/api/v1/api/v1/...`.
