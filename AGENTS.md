# AGENTS.md — Project Manifest

> This file helps AI agents understand and work with this project effectively.

## Project Overview
- **Name**: antigravity-mobile
- **Type**: Node.js Server App (Express + WebSocket + CDP bridge)
- **Version**: 2.0.0
- **Purpose**: Mobile dashboard & admin panel for Antigravity IDE — monitor conversations, manage AI agent, get Telegram notifications, remote control

## Commands
- `npm start` — Start HTTP server (`src/http-server.mjs`)
- `npm run server` — Same as start
- `npm run launch` — Full startup: server + CDP auto-detect + IDE launch
- `npm test` — Run all tests (vitest)
- `npm run test:gate` — Pre-deploy test gate (verbose)

## Tech Stack
- **Runtime**: Node.js 18+ (ES Modules)
- **Server**: Express 4 + WebSocket (`ws`)
- **Protocols**: Chrome DevTools Protocol (CDP), REST API, WebSocket
- **AI**: Ollama (local LLM) for Supervisor AI
- **Notifications**: Telegram Bot API
- **Tunneling**: Cloudflare Quick Tunnels (`cloudflared`)
- **Database**: sql.js (SQLite in-memory for activity logs)
- **Frontend**: Vanilla HTML/CSS/JS, PWA-enabled

## Project Structure
```
src/                          — Backend (ES Modules)
  http-server.mjs             — Express server, API endpoints, WebSocket bridge (main entry)
  cdp-client.mjs              — Chrome DevTools Protocol client (screenshots, input injection, DOM)
  chat-stream.mjs             — CDP-based live chat capture, auto-accept, notification triggers
  supervisor-service.mjs      — AI supervisor — autonomous monitoring, error recovery, task queue
  ollama-client.mjs           — Thin wrapper around Ollama REST API
  telegram-bot.mjs            — Telegram Bot API — alerts for agent events
  tunnel.mjs                  — Cloudflare quick tunnel management
  config.mjs                  — Persistent JSON config store (data/config.json)
  quota-service.mjs           — Language server quota polling (Windows only)
  launcher.mjs                — Orchestrates startup: server, CDP, Antigravity launch

public/                       — Frontend (served by Express)
  index.html                  — Mobile dashboard (chat, files, settings, assist tabs)
  admin.html                  — Admin panel (localhost-only, 142KB)
  minimal.html                — Lite mode (chat only, low bandwidth)
  manifest.json               — PWA manifest
  sw.js                       — Service worker
  css/
    variables.css              — CSS custom properties & theme tokens
    layout.css                 — Page layout, topbar, panels
    components.css             — Buttons, cards, forms, modals
    themes.css                 — Theme overrides (dark, light, pastel, rainbow, slate)
    chat.css                   — Chat message styling
    files.css                  — File browser styling
    settings.css               — Settings panel styling
    assist.css                 — Supervisor assist tab styling
  js/
    app.js                     — App initialization
    api.js                     — API client helpers
    websocket.js               — WebSocket connection manager
    navigation.js              — Tab navigation & routing
    chat.js                    — Chat rendering & history
    chat-live.js               — Live chat streaming
    files.js                   — File browser & syntax highlighting
    settings.js                — Settings panel logic
    theme.js                   — Theme switching
    icons.js                   — SVG icon helper
    assist.js                  — Supervisor assist chat
    task-queue.js              — Task queue UI

scripts/                      — Start/stop scripts (Windows + macOS/Linux)
tests/                        — Test files (vitest)
data/                         — Runtime config & session data (gitignored)
docs/                         — Technical documentation (Vietnamese)
```

## Code Conventions
- **Module System**: ES Modules (`.mjs` extension, `"type": "module"`)
- **CSS**: Use design tokens from `variables.css`. Never raw hex colors — use `var(--token-name)`
- **Themes**: 4 themes defined via CSS classes (`.light-theme`, `.pastel-theme`, `.rainbow-theme`, default = dark)
- **API Pattern**: Express routes in `http-server.mjs`, handlers call service modules
- **Config**: Centralized via `config.mjs` — dot-path access (`getConfig('telegram.botToken')`)
- **Error Handling**: Try-catch with JSON error responses `{ error: message }`
- **Commits**: Conventional format — `feat:`, `fix:`, `docs:`, `test:`, `chore:`

## Architecture Notes
- **CDP Bridge**: Server connects to Antigravity IDE via Chrome DevTools Protocol on ports 9222, 9333, 9000-9003
- **WebSocket Events**: `chat_update`, `screenshot`, `activity`, `supervisor_action`, `supervisor_status`, `tunnel_status`, `error`
- **Security**: PIN auth (SHA-256 hash), localhost-only admin, rate limiting (Telegram: 15/min, Supervisor: 10/min)
- **Admin Panel**: Only accessible from `localhost`/`127.0.0.1` — enforced by middleware

## Important Rules
1. All user-facing strings are currently hardcoded (i18n planned)
2. `data/` directory is gitignored — runtime state only
3. Admin endpoints check `req.ip` for localhost — do not remove this guard
4. Telegram bot token and chat ID are stored in `data/config.json` — never commit this file
5. CDP connection is local only — never expose CDP port externally
6. Supervisor AI uses Ollama — requires local Ollama server running
7. `quota-service.mjs` only works on Windows (PowerShell dependent)
8. Run tests before any deploy: `npm run test:gate`
