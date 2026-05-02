# Handshake App — PXL Research Project (2TIW)

POC voor een netwerkevent-app waarbij studenten zich met een **roterende QR-code** identificeren bij bedrijven. Het onderzoek beantwoordt drie deelvragen rond fraudepreventie, offline werking en GDPR-conformiteit.

## Deelvragen

1. **Fraude** — voorkomen dat tokens hergebruikt of vervalst worden via roterende, eenmalig consumeerbare tokens met korte TTL. Zie [`docs/poc-tests/deelvraag-1-fraude.md`](docs/poc-tests/deelvraag-1-fraude.md).
2. **Offline** — scans die offline gebeuren mogen niet verloren gaan; opslag in IndexedDB queue met automatische sync bij `online` event. Zie [`docs/poc-tests/deelvraag-2-offline.md`](docs/poc-tests/deelvraag-2-offline.md).
3. **GDPR** — expliciete consent flow plus AES-GCM encryptie van de lokale queue met een non-extractable sleutel. Zie [`docs/poc-tests/deelvraag-3-gdpr.md`](docs/poc-tests/deelvraag-3-gdpr.md).

## Tech stack

- **Backend:** ASP.NET Core 8 Web API + EF Core + SQLite
- **Frontend:** Vue 3 (Composition API, `<script setup>`) + Vite + vue-router
- **Crypto:** Web Crypto API (AES-GCM 256-bit, non-extractable key)
- **Storage offline:** IndexedDB

## Repository layout

```
backend/HandshakeApi/      ASP.NET Core 8 Web API (SQLite via EF Core)
frontend/handshake-app/    Vue 3 + Vite SPA
docs/poc-tests/            Testverslagen per deelvraag
template_researchpaper_*   Paper-template (niet bewerken)
```

## Vereisten

- .NET SDK **8.0** (zie `global.json`)
- Node.js `^20.19.0 || >=22.12.0`

## Lokaal draaien

Open twee terminals — backend en frontend draaien afzonderlijk zodat logs gescheiden blijven.

### Backend

```bash
cd backend/HandshakeApi
dotnet run
```

API luistert op `http://localhost:5142`, Swagger UI op `/swagger`. De SQLite-database `handshake.db` wordt automatisch aangemaakt.

### Frontend

```bash
cd frontend/handshake-app
npm install
npm run dev
```

SPA op `http://localhost:5173`.

**Eerste keer:** maak `frontend/handshake-app/.env.development` aan met:

```dotenv
VITE_API_URL=http://localhost:5142
```

Dit bestand staat in `.gitignore` en wordt dus niet mee-gekloond. Zonder deze variabele gaan API-calls naar de Vite dev server zelf en krijg je 404's. Herstart `npm run dev` na het aanmaken — Vite leest env vars alleen bij startup.

### Overige scripts (frontend)

- `npm run build` — productie-build
- `npm run lint` — oxlint + eslint
- `npm run format` — Prettier

## Architectuur in het kort

### Token lifecycle
1. Student vraagt QR-token op via `GET /api/students/{id}/qr-token` → `TokenService` levert `student:{id}:{guid}` met TTL van **20 seconden**.
2. Frontend ververst de QR elke **15 seconden** (kleiner dan TTL, met buffer).
3. Bedrijf scant en POST't naar `/api/scans`. `TokenService.TryConsumeAt` valideert de timestamp en verwijdert het token → eenmalig gebruik.
4. Tokens leven in een in-memory `ConcurrentDictionary` (singleton) — bewust gehouden voor de POC; voor productie te vervangen door Redis/DB.

### Offline queue
- Bij netwerkfout wordt de scan AES-GCM-versleuteld in IndexedDB gezet.
- `window.addEventListener('online')` triggert sync; oorspronkelijke `scannedAt` wordt meegestuurd zodat de server-side TTL-check correct is.
- Backend zet `IsOfflineSynced = true` voor offline-gesynchroniseerde scans.

### Encryptie & consent
- AES-GCM 256-bit sleutel via `crypto.subtle.generateKey(..., false, ...)` — non-extractable, opgeslagen als `CryptoKey`-object in IndexedDB.
- Verse 12-byte random IV per `encrypt()`-call.
- Consent: frontend checkbox + backend-validatie (`ConsentGiven == true`), met `ConsentGivenAt` als audit trail (GDPR art. 7 lid 1).

## Conventies

- Code is in het **Engels**, UI-strings en commentaar in het **Nederlands**.
- API routes: `/api/[controller]` (lowercase).
- Tijden: backend slaat UTC op, frontend stuurt ISO-strings.
- Errors van `api.js` beginnen met `API ` zodat de frontend netwerk-errors van server-errors kan onderscheiden.
