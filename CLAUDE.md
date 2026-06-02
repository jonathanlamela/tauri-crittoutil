# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Frontend dev server only (Vite)
npm run dev

# Full Tauri app (dev mode with hot reload)
npx tauri dev

# Build frontend
npm run build

# Build full Tauri app
npx tauri build
```

No test suite is configured. There is no lint script.

## Mobile

```bash
# iOS dev (requires Xcode + provisioning)
npx tauri ios dev

# Android dev (requires Android Studio + NDK)
npx tauri android dev
```

After running `npx tauri android init` or `npx tauri ios init`, patches must be re-applied:

```bash
# Android — icons, adaptive icon XML, Gradle Java home
bash scripts/android-patch.sh

# iOS — correct icons, npm script bridge
cp src-tauri/icons/ios/* src-tauri/gen/apple/Assets.xcassets/AppIcon.appiconset/
```

The file [src-tauri/gen/apple/package.json](src-tauri/gen/apple/package.json) bridges Xcode's `npm run tauri` call to the project root CLI — do not delete it.

Android `gradle.properties` must include `org.gradle.java.home` pointing to Android Studio's JBR (handled by `android-patch.sh`).

## Architecture

CrittoUtil is a **Tauri 2 desktop app** — a Vue 3 frontend communicating with a Rust backend via Tauri's `invoke` IPC bridge.

### Frontend (Vue 3 + Vuetify 4 + Vue Router)

- [src/main.js](src/main.js) — app entry: sets up Vuetify (MD3, custom Blue Grey palette with full light/dark themes), Vue Router (hash history), and i18n
- [src/views/](src/views/) — one view per route: Home, Converter, KeyGenerator, Encrypter, Decrypter
- [src/composables/useCrypto.js](src/composables/useCrypto.js) — all crypto calls go through here; wraps `invoke()` and exports `encrypt()` / `decrypt()` dispatchers plus `validateKey()`
- [src/composables/useKeyHistory.js](src/composables/useKeyHistory.js) — tracks previously used keys
- [src/i18n/](src/i18n/) — English and Italian translations via vue-i18n

### Backend (Rust / Tauri)

- [src-tauri/src/crypto.rs](src-tauri/src/crypto.rs) — all cryptographic logic: MD5 hash, AES-CBC, AES-ECB, DES-CBC, DES-ECB (using `aes`, `des`, `cbc`, `ecb`, `cipher`, `base64`, `rand` crates)
- [src-tauri/src/lib.rs](src-tauri/src/lib.rs) — registers Tauri commands, wires the `generate_key` command and clipboard plugin
- [src-tauri/src/main.rs](src-tauri/src/main.rs) — Tauri entry point

### IPC contract

Every function in `useCrypto.js` maps 1-to-1 to a `#[tauri::command]` in Rust. Keys are passed as raw strings (byte lengths matter: 8 for DES, 16/24/32 for AES). The Rust side returns base64-encoded ciphertext or a hex MD5 digest. Validation of key length happens on the frontend in `validateKey()` before the invoke call.

### Capabilities

[src-tauri/capabilities/default.json](src-tauri/capabilities/default.json) controls which Tauri APIs the frontend can access (currently clipboard-manager is included).
