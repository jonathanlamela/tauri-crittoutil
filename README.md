# CrittoUtil

A desktop app for cryptographic utilities, built with Tauri 2, Vue 3, and Vuetify 4.

## Features

- **Converter** — convert between Text, Binary, and Base64 formats
- **Key Generator** — generate cryptographically secure random keys (64–512 bit), with per-session history
- **Encrypter** — encrypt text with MD5, AES-CBC, AES-ECB, DES-CBC, or DES-ECB
- **Decrypter** — decrypt ciphertext with AES-CBC, AES-ECB, DES-CBC, or DES-ECB

All cryptographic operations run in the Rust backend via Tauri IPC — the frontend never handles raw cipher logic.

## Screenshots

### Phone — English

| Home | Menu | Converter | Key Generator | Encrypter |
|------|------|-----------|---------------|-----------|
| ![Home](docs/screenshots/phone_en_01_home.png) | ![Menu](docs/screenshots/phone_en_02_menu.png) | ![Converter](docs/screenshots/phone_en_03_converter.png) | ![Key Generator](docs/screenshots/phone_en_04_key_generator.png) | ![Encrypter](docs/screenshots/phone_en_05_encrypter.png) |

| Home Dark | Home Dark 2 |
|-----------|-------------|
| ![Home Dark](docs/screenshots/phone_en_06_home_dark.png) | ![Home Dark 2](docs/screenshots/phone_en_07_home_dark2.png) |

### Phone — Italian

| Home | Menu | Converter | Key Generator | Encrypter |
|------|------|-----------|---------------|-----------|
| ![Home](docs/screenshots/phone_it_01_home.png) | ![Menu](docs/screenshots/phone_it_02_menu.png) | ![Converter](docs/screenshots/phone_it_03_converter.png) | ![Key Generator](docs/screenshots/phone_it_04_key_generator.png) | ![Encrypter](docs/screenshots/phone_it_05_encrypter.png) |

| Home Dark | Home Dark 2 |
|-----------|-------------|
| ![Home Dark](docs/screenshots/phone_it_06_home_dark.png) | ![Home Dark 2](docs/screenshots/phone_it_07_home_dark2.png) |

### Tablet 7" — English

| Home | Menu | Converter | Key Generator | Encrypter |
|------|------|-----------|---------------|-----------|
| ![Home](docs/screenshots/tablet7_en_01_home.png) | ![Menu](docs/screenshots/tablet7_en_02_menu.png) | ![Converter](docs/screenshots/tablet7_en_03_converter.png) | ![Key Generator](docs/screenshots/tablet7_en_04_key_generator.png) | ![Encrypter](docs/screenshots/tablet7_en_05_encrypter.png) |

| Decrypter | Home Dark |
|-----------|-----------|
| ![Decrypter](docs/screenshots/tablet7_en_06_decrypter.png) | ![Home Dark](docs/screenshots/tablet7_en_07_home_dark.png) |

### Tablet 7" — Italian

| Home | Menu | Converter | Key Generator | Encrypter |
|------|------|-----------|---------------|-----------|
| ![Home](docs/screenshots/tablet7_it_01_home.png) | ![Menu](docs/screenshots/tablet7_it_02_menu.png) | ![Converter](docs/screenshots/tablet7_it_03_converter.png) | ![Key Generator](docs/screenshots/tablet7_it_04_key_generator.png) | ![Encrypter](docs/screenshots/tablet7_it_05_encrypter.png) |

| Decrypter | Home Dark |
|-----------|-----------|
| ![Decrypter](docs/screenshots/tablet7_it_06_decrypter.png) | ![Home Dark](docs/screenshots/tablet7_it_07_home_dark.png) |

### Tablet 10" — English

| Home | Menu | Converter | Key Generator | Encrypter |
|------|------|-----------|---------------|-----------|
| ![Home](docs/screenshots/tablet10_en_01_home.png) | ![Menu](docs/screenshots/tablet10_en_02_menu.png) | ![Converter](docs/screenshots/tablet10_en_03_converter.png) | ![Key Generator](docs/screenshots/tablet10_en_04_key_generator.png) | ![Encrypter](docs/screenshots/tablet10_en_05_encrypter.png) |

| Decrypter | Home Dark |
|-----------|-----------|
| ![Decrypter](docs/screenshots/tablet10_en_06_decrypter.png) | ![Home Dark](docs/screenshots/tablet10_en_07_home_dark.png) |

### Tablet 10" — Italian

| Home | Menu | Converter | Key Generator | Encrypter |
|------|------|-----------|---------------|-----------|
| ![Home](docs/screenshots/tablet10_it_01_home.png) | ![Menu](docs/screenshots/tablet10_it_02_menu.png) | ![Converter](docs/screenshots/tablet10_it_03_converter.png) | ![Key Generator](docs/screenshots/tablet10_it_04_key_generator.png) | ![Encrypter](docs/screenshots/tablet10_it_05_encrypter.png) |

| Decrypter | Home Dark |
|-----------|-----------|
| ![Decrypter](docs/screenshots/tablet10_it_06_decrypter.png) | ![Home Dark](docs/screenshots/tablet10_it_07_home_dark.png) |

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
