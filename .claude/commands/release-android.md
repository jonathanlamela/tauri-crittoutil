Esegui il processo completo di release Android per CrittoUtil. Segui questi passi nell'ordine indicato:

## 1. Bump versione

Leggi la versione corrente da `package.json` (campo `version`).
Incrementa la patch version (es. `2.0.3` → `2.0.4`).
Aggiorna il campo `version` in tutti e tre questi file mantenendo il formato esatto:
- `package.json`
- `src-tauri/tauri.conf.json`
- `src-tauri/Cargo.toml`

## 2. Genera gli screenshot

Il dev server deve essere avviato prima di procedere. Esegui:
```
NVM_DIR="$HOME/.nvm" && . "$NVM_DIR/nvm.sh" && nvm use 22 && npm run dev &
```
Attendi che il server sia raggiungibile su http://localhost:5173 (fai polling con curl ogni 2s, max 30s).
Poi esegui:
```
NVM_DIR="$HOME/.nvm" && . "$NVM_DIR/nvm.sh" && nvm use 22 && npm run screenshots
```
Infine termina il dev server.

## 3. Build Android

Esegui la build Android in modalità release:
```
NVM_DIR="$HOME/.nvm" && . "$NVM_DIR/nvm.sh" && nvm use 22 && npx tauri android build
```
Se la build fallisce, riporta l'errore e fermati.

## 4. Genera changelog

Recupera i commit git dall'ultimo tag (o dagli ultimi 20 commit se non ci sono tag) con:
```
git log $(git describe --tags --abbrev=0 2>/dev/null || git rev-list --max-parents=0 HEAD)..HEAD --oneline
```

Sulla base di quei commit genera due testi di changelog pronti per il Google Play Store:

**Formato richiesto per entrambe le lingue:**
- Massimo 500 caratteri
- Tono professionale e user-facing (non tecnico)
- Bullet list con `•`
- Prima riga: `Versione X.Y.Z`

Scrivi entrambi i changelog in `CHANGELOG.md` nella root del progetto, in questo formato:

```markdown
## vX.Y.Z

### Google Play — English
...testo...

### Google Play — Italiano
...testo...
```

## 5. Commit finale

Esegui un commit con tutti i file modificati (versioni, screenshot, CHANGELOG.md):
```
git add package.json src-tauri/tauri.conf.json src-tauri/Cargo.toml docs/screenshots CHANGELOG.md
git commit -m "chore: release vX.Y.Z"
```

## 6. Report finale

Al termine mostra un riepilogo con:
- Versione rilasciata
- Percorso dell'APK/AAB generato
- Testo del changelog (entrambe le lingue)
