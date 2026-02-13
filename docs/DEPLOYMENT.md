# Deployment Guide

This guide covers deploying Juno with full PWA functionality, including both free cloud hosting and self-hosted options.

## Prerequisites

- Node.js and npm installed
- Built application (`npm run build` creates the `dist` folder)
- **HTTPS is mandatory** - PWA service workers require secure contexts

## Free Cloud Hosting

### Option 1: Vercel (Recommended - Simplest)

**Quickest deployment:**

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

**Features:**
- Zero configuration required
- Automatic HTTPS with CDN
- Perfect PWA support out of the box
- Automatic deployments from Git
- Free tier: 100GB bandwidth/month

**Alternative: Web UI**
1. Visit [vercel.com](https://vercel.com)
2. Import your Git repository
3. Vercel auto-detects Vite and deploys

### Option 2: Netlify

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Build the app
npm run build

# Deploy to production
netlify deploy --prod --dir=dist
```

**Add SPA routing support:**

Create `netlify.toml` in project root:

```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

**Features:**
- Drag-and-drop deployment option
- Automatic HTTPS
- Free tier: 100GB bandwidth/month
- Built-in CI/CD

### Option 3: Cloudflare Pages

**Via Web UI:**
1. Go to [pages.cloudflare.com](https://pages.cloudflare.com)
2. Connect your GitHub repository
3. Configure build:
   - Build command: `npm run build`
   - Output directory: `dist`
4. Deploy

**Features:**
- Global CDN (fastest edge network)
- Generous free tier: Unlimited bandwidth
- Automatic HTTPS
- Best performance globally

### Option 4: GitHub Pages

**Setup:**

```bash
# Install gh-pages
npm i -D gh-pages

# Add script to package.json
"scripts": {
  "deploy": "npm run build && gh-pages -d dist"
}

# Deploy
npm run deploy
```

**Important:** If not using a custom domain, update `vite.config.ts`:

```typescript
export default defineConfig({
  base: '/your-repo-name/',
  // ... rest of config
})
```

**Features:**
- Free with GitHub
- Automatic HTTPS
- Best for open-source projects

## Self-Hosted Deployment

### Option 1: Nginx (Recommended for VPS)

**1. Build and copy files:**

```bash
# Build the app
npm run build

# Copy to server
scp -r dist/* user@server:/var/www/juno/dist/
```

**2. Configure Nginx:**

Create `/etc/nginx/sites-available/juno`:

```nginx
# HTTPS server
server {
    listen 443 ssl http2;
    server_name juno.yourdomain.com;

    # SSL certificates (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/juno.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/juno.yourdomain.com/privkey.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    root /var/www/juno/dist;
    index index.html;

    # SPA routing - serve index.html for all routes
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets for 1 year
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|wasm)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Service worker - never cache (critical for updates)
    location /sw.js {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
        expires 0;
    }

    # Web manifest
    location /manifest.webmanifest {
        add_header Cache-Control "no-cache";
        expires 0;
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name juno.yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

**3. Setup SSL with Let's Encrypt:**

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d juno.yourdomain.com

# Enable site
sudo ln -s /etc/nginx/sites-available/juno /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

**4. Auto-renew certificates:**

```bash
# Test renewal
sudo certbot renew --dry-run

# Certbot automatically sets up cron job for renewal
```

### Option 2: Docker + Nginx (Easiest Self-Hosted)

**1. Create Dockerfile:**

```dockerfile
FROM nginx:alpine

# Copy built app
COPY dist /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

**2. Create `nginx.conf`:**

```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|wasm)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Service worker - never cache
    location /sw.js {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        expires 0;
    }
}
```

**3. Docker Compose with SSL (using Caddy):**

```yaml
# docker-compose.yml
version: '3.8'

services:
  juno:
    build: .
    container_name: juno-app
    networks:
      - web

  caddy:
    image: caddy:alpine
    container_name: juno-caddy
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data
      - caddy_config:/config
    networks:
      - web

networks:
  web:

volumes:
  caddy_data:
  caddy_config:
```

**4. Create `Caddyfile` (automatic HTTPS):**

```
juno.yourdomain.com {
    reverse_proxy juno:80
}
```

**5. Deploy:**

```bash
npm run build
docker-compose up -d
```

Caddy automatically provisions SSL certificates from Let's Encrypt.

### Option 3: Apache

**1. Configure Apache:**

Create `/etc/apache2/sites-available/juno.conf`:

```apache
<VirtualHost *:443>
    ServerName juno.yourdomain.com
    DocumentRoot /var/www/juno/dist

    SSLEngine on
    SSLCertificateFile /etc/letsencrypt/live/juno.yourdomain.com/fullchain.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/juno.yourdomain.com/privkey.pem

    <Directory /var/www/juno/dist>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted

        # SPA routing
        FallbackResource /index.html
    </Directory>

    # Cache static assets
    <FilesMatch "\.(js|css|png|jpg|jpeg|gif|ico|svg|wasm)$">
        Header set Cache-Control "max-age=31536000, public, immutable"
    </FilesMatch>

    # Don't cache service worker
    <Files "sw.js">
        Header set Cache-Control "no-cache, no-store, must-revalidate"
    </Files>
</VirtualHost>

<VirtualHost *:80>
    ServerName juno.yourdomain.com
    Redirect permanent / https://juno.yourdomain.com/
</VirtualHost>
```

**2. Enable and restart:**

```bash
sudo a2enmod ssl headers rewrite
sudo a2ensite juno
sudo systemctl reload apache2
```

## PWA-Specific Configuration

### Critical Requirements

1. **HTTPS is mandatory** - Service workers only work over HTTPS (or localhost)
2. **Service worker must not be cached** - Critical for app updates
3. **Proper MIME types** - Ensure `.wasm` files serve as `application/wasm`
4. **SPA routing** - All routes must serve `index.html`

### Verifying PWA Installation

After deployment, test your PWA:

1. **Chrome DevTools:**
   - Open DevTools → Application tab
   - Check "Manifest" - should show Juno details
   - Check "Service Workers" - should show active worker
   - Check "Cache Storage" - should show precached assets

2. **Lighthouse:**
   - Run Lighthouse audit (DevTools → Lighthouse)
   - PWA score should be 100%
   - Check "Installable" criteria

3. **Installation:**
   - Desktop: Click install icon in address bar
   - Mobile: "Add to Home Screen" prompt should appear

### Update Deployment

When deploying updates:

1. Build new version: `npm run build`
2. Deploy to hosting (replaces old `dist` files)
3. Service worker detects new `sw.js` on next page load
4. Users see update notification banner
5. Users click "Reload Now" to get latest version

**Important:** Service worker caching means users may not see updates immediately. The update notification system handles this gracefully.

### Cache Configuration

The app caches:
- **Precached (install-time):** All JS, CSS, HTML, images, WASM files
- **Runtime cached:**
  - JS/CSS: Stale-while-revalidate (1 week max)
  - WASM: Cache-first (30 days max)

Cache is automatically cleaned up when new versions deploy (via `cleanupOutdatedCaches: true`).

## Troubleshooting

### PWA Not Installing

- Verify HTTPS is working
- Check browser console for service worker errors
- Ensure manifest.webmanifest is served with correct MIME type
- Verify all required manifest fields are present

### Updates Not Showing

- Check that `sw.js` is NOT cached by CDN/server
- Verify service worker is registered in DevTools
- Force refresh (Ctrl+Shift+R) to bypass cache
- Check browser console for update errors

### Service Worker Registration Failed

- Ensure HTTPS is configured correctly
- Check Content Security Policy allows workers
- Verify `sw.js` is accessible at root path
- Check nginx/server logs for 404 errors

## Recommendations

| Use Case | Recommended Option |
|----------|-------------------|
| Quick demo/testing | Vercel |
| Production app (managed) | Cloudflare Pages |
| Full control needed | Docker + Caddy |
| Existing VPS | Nginx + Let's Encrypt |
| Open source project | GitHub Pages |

## Security Checklist

Before deploying to production:

- [ ] HTTPS enabled and working
- [ ] SSL certificate auto-renewal configured
- [ ] Content Security Policy headers configured (already in `index.html`)
- [ ] Service worker not cached by CDN
- [ ] CORS headers configured if using external APIs
- [ ] Security headers configured (X-Frame-Options, etc.)
- [ ] Regular dependency updates scheduled

## Monitoring

Since all data is client-side, traditional server monitoring isn't needed. Consider:

- **Uptime monitoring:** UptimeRobot, Pingdom (free tiers available)
- **Error tracking:** Sentry browser SDK (optional)
- **Analytics:** Privacy-focused options like Plausible (optional)

Note: This app is designed for privacy - avoid analytics that track user data.
