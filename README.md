# CrittoUtil

A desktop app for cryptographic utilities, built with Tauri 2, Vue 3, and Vuetify 4.

## Features

- **Converter** — convert between Text, Binary, and Base64 formats
- **Key Generator** — generate cryptographically secure random keys (64–512 bit), with per-session history
- **Encrypter** — encrypt text with MD5, AES-CBC, AES-ECB, DES-CBC, or DES-ECB
- **Decrypter** — decrypt ciphertext with AES-CBC, AES-ECB, DES-CBC, or DES-ECB

All cryptographic operations run in the Rust backend via Tauri IPC — the frontend never handles raw cipher logic.

## Requirements

- [Node.js](https://nodejs.org/) (LTS)
- [Rust](https://rustup.rs/) + Cargo
- [Tauri prerequisites](https://tauri.app/start/prerequisites/) for your OS

## Development

```bash
npm install
npx tauri dev
```

## Build

```bash
npx tauri build
```

Produces platform-native bundles (`.dmg` on macOS, `.msi`/`.exe` on Windows, `.deb`/`.AppImage` on Linux) in `src-tauri/target/release/bundle/`.

## Tech stack

| Layer | Technology |
| --- | --- |
| Frontend | Vue 3 (`<script setup>`), Vuetify 4 (Material You / MD3), Vue Router 4 |
| Backend | Rust, Tauri 2 |
| Crypto | `aes`, `des`, `cbc`, `ecb`, `cipher`, `md5`, `base64`, `rand` crates |
| i18n | vue-i18n (English, Italian) |
