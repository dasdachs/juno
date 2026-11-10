# Juno - Private Period Tracker

A secure, privacy-focused period tracking application built with React, TypeScript, and Vite. Your data stays on your device, encrypted and secure.

## Features

- **Privacy First**: All data is encrypted and stored locally on your device
- **Offline Ready**: Works fully offline as a Progressive Web App (PWA)
- **Secure**: End-to-end encryption with password protection
- **Fast**: Instant load times with cached assets
- **Mobile Optimized**: Standalone app experience on mobile devices

## Tech Stack

- **Frontend**: React 18 with TypeScript
- **Build Tool**: Vite with HMR support
- **Styling**: Tailwind CSS
- **PWA**: Vite PWA Plugin with Workbox
- **Encryption**: libsodium for secure data encryption
- **Testing**: Vitest with jsdom

## PWA Updates

Juno is a Progressive Web App that updates automatically in the background. Here's how updates are handled:

### Update Flow

1. **Automatic Detection**: The app checks for updates periodically
2. **Background Installation**: New version is downloaded and installed in the background
3. **User Notification**: When an update is available, a notification banner appears
4. **User Action**: Users can click "Reload Now" to apply the update immediately
5. **Immediate Activation**: With `skipWaiting: true` and `clientsClaim: true`, the new service worker takes over immediately

### Update Configuration

The PWA is configured in `vite.config.ts` with:

- **registerType**: `'autoUpdate'` - Service worker updates automatically
- **skipWaiting**: `true` - New service worker doesn't wait for old ones to close
- **clientsClaim**: `true` - New service worker claims all tabs immediately
- **Update Notification**: A banner appears when updates are available (`UpdateNotification` component)

### User Experience

When an update is available:
1. A banner appears at the bottom of the screen
2. Users are notified that a new version is available
3. Users can choose to "Reload Now" to apply the update
4. The app reloads and uses the latest version

### For Developers

Updates are triggered by:
- Browser refresh/reload
- Regular update checks (configured in `vite-plugin-pwa`)
- Deploying new code to production

The update process is non-disruptive - users can continue working while the new version is downloaded in the background.

## Deployment

For detailed deployment instructions including free cloud hosting and self-hosted options, see [DEPLOYMENT.md](./DEPLOYMENT.md).

**Quick start:**
- **Free Cloud**: `npx vercel` (requires Vercel account)
- **Self-hosted**: See DEPLOYMENT.md for Nginx, Docker, and Apache configurations
- **Automated Deployment**: Pushes to `main` branch are automatically deployed to Cloudflare Pages via GitHub Actions.

**Requirements:**
- HTTPS is mandatory for PWA functionality
- Service worker must not be cached by CDN/server
