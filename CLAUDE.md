# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

선풍건설산업 (Sunpoong Construction) company website — static HTML/JS site wrapped in a Capacitor Android app.

- **GitHub:** https://github.com/wangun1004/sunpoong-site.git
- **App ID:** `com.bige.calculator` / App Name: `선풍건설산업`

## Dev Commands

```bash
npm run dev      # browser-sync on port 3000 + file watcher (recommended for development)
npm run serve    # serve only on port 3000 (0.0.0.0)
npm run build    # sync to www/ then run capacitor android build
```

Or directly: `start-server.bat` (serves on port 5500 via `npx serve`)

## Architecture

**Static site** — no build step for web. HTML files live at the root; `scripts/sync-www.js` mirrors them to `/www/` for Capacitor.

```
root HTML files      → served directly in browser
/www/               → auto-generated (Capacitor webDir, do not edit manually)
/js/
  config.js         → Supabase URL/key, company info constants
  db.js             → all Supabase DB + auth functions (adminLogin, isAdminLoggedIn, etc.)
  app.js            → shared utilities (toast, nav, formatting)
/admin/             → Supabase-based admin dashboard (separate auth from root admin-login.html)
```

## Two Auth Systems

| File | Method | Protects |
|------|--------|---------|
| `admin-login.html` | `sessionStorage('sp_admin','ok')` / hardcoded credentials | `demolition.html`, `calculator.html`, `illustration.html` |
| `admin/index.html` | Supabase Auth (email/password) | `admin/dashboard.html` |

`admin-login.html` supports `?redirect=<page>` query param — login redirects to that page instead of default `demolition.html`.

## Supabase

Config in `js/config.js`. Falls back to localStorage dev mode when Supabase is not configured. DB tables: `inquiries`, `board_posts`, `projects`.

## Android

Capacitor v8. After editing web files run `npm run build` to sync. `capacitor.config.json` sets `androidScheme: https` with cleartext allowed.
