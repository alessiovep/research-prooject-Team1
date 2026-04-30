# Deelvraag 3 — GDPR & gegevensbeveiliging: testresultaten

**Onderzoeksvraag:** Welke beveiligingsmaatregelen zijn nodig om persoonsgegevens conform de GDPR-wetgeving te verwerken en op te slaan?

**Toegepaste technieken:**
1. AES-GCM 256-bit encryptie van lokaal opgeslagen scandata via de Web Crypto API.
2. Expliciete toestemmingsregistratie (consent flow) bij studentregistratie.

**Datum:** 2026-04-30
**Uitgevoerd door:** Alessio Veppi

## Implementatiekeuzes

### Encryptie van de lokale scan-queue

- **Algoritme:** AES-GCM 256-bit — geauthenticeerde encryptie, beschermt zowel vertrouwelijkheid als integriteit.
- **Key generatie:** `crypto.subtle.generateKey` met `extractable: false`. De sleutel kan nooit als bytes worden geëxporteerd vanuit de browser — bescherming tegen XSS-aanvallen die de key proberen te stelen.
- **Key opslag:** de `CryptoKey` wordt als object opgeslagen in een aparte IndexedDB (`handshake-keys`). Bij een volgende sessie wordt dezelfde sleutel hergebruikt.
- **IV:** per encryptie-operatie een willekeurige 12-byte IV via `crypto.getRandomValues`. Hergebruik van IV's is hierdoor structureel onmogelijk.
- **Transparantie:** `db.js` roept `encrypt()` aan bij `addScan` en `decrypt()` bij `getQueuedScans`. De rest van de applicatie werkt met plaintext objecten en hoeft niets te weten van encryptie.

### Consent flow

- Bij studentregistratie is een expliciete checkbox vereist: *"Ik ga akkoord met de verwerking van mijn persoonsgegevens voor dit event"*.
- De registratieknop blijft uitgeschakeld zolang de checkbox niet aangevinkt is (`v-model` + `:disabled="!consentGiven"`).
- De backend valideert het `ConsentGiven` veld en weigert de registratie als het `false` is (`400 Bad Request`).
- Bij succesvolle registratie wordt `ConsentGivenAt` als UTC-timestamp opgeslagen in de `Student` tabel — dit vormt het audit trail conform GDPR artikel 7 lid 1.

## Bewuste afwegingen

### Non-extractable key vs. passphrase-derived key

Een alternatief was een sleutel afleiden van een gebruikerswachtwoord (PBKDF2). Voordeel: de data is beschermd zelfs als iemand toegang krijgt tot de IndexedDB-bestanden op schijfniveau. Nadeel: vereist een login-systeem, wat buiten de scope van deze POC valt.

De non-extractable aanpak biedt bescherming op **browserniveau**: een XSS-aanval of kwaadaardige extensie kan de sleutel niet als bytes extraheren. Dit is een significante verbetering ten opzichte van plaintext opslag en volstaat als bewijs voor de POC.

### Dataminimalisatie

De scan-queue bevat enkel `companyId`, `token` en `scannedAt` — geen naam, e-mail of andere persoonsidentificerende velden. De koppeling tussen token en student bestaat alleen server-side. Dit beperkt de impact van een eventueel lek van de lokale queue.

### Consent op frontend én backend

De checkbox is frontend-validatie (UX), maar de backend valideert ook. Hierdoor kan een kwaadwillende die de API rechtstreeks aanspreekt geen student registreren zonder consent.

## Tests

### Test 1 — Non-extractable key

| # | Stap | Verwacht | Resultaat |
|---|---|---|---|
| 1.1 | Browser console: `const k = await getKey()` | CryptoKey object zichtbaar | ✅ |
| 1.2 | `await crypto.subtle.exportKey('raw', k)` | Exception: *"key is not extractable"* | ✅ |
| 1.3 | Page refresh → `getKey()` opnieuw | Dezelfde sleutel geladen uit `handshake-keys` IndexedDB | ✅ |

### Test 2 — Encryptie en decryptie

| # | Stap | Verwacht | Resultaat |
|---|---|---|---|
| 2.1 | `encrypt("hello world")` → `{ iv, ciphertext }` | Binaire output, niet leesbaar als tekst | ✅ |
| 2.2 | `decrypt({ iv, ciphertext })` | Originele string `"hello world"` terug | ✅ |

### Test 3 — IndexedDB toont versleutelde data

| # | Stap | Verwacht | Resultaat |
|---|---|---|---|
| 3.1 | DevTools Network → Offline | (geen netwerktraffic) | ✅ |
| 3.2 | Scan via `/scanner` | Geel vakje, queue-teller +1 | ✅ |
| 3.3 | DevTools → Application → IndexedDB → `handshake-poc` → `scan-queue` | Record bevat `iv` en `ciphertext`, **geen leesbare** `companyId`, `token` of `scannedAt` | ✅ |

### Test 4 — Consent flow frontend

| # | Stap | Verwacht | Resultaat |
|---|---|---|---|
| 4.1 | `/student` openen zonder checkbox aan te vinken | Knop "Registreer" is uitgeschakeld | ✅ |
| 4.2 | Checkbox aanvinken | Knop wordt actief | ✅ |
| 4.3 | Registreren met aangevinkte checkbox | Student aangemaakt, `consentGivenAt` in response | ✅ |

### Test 5 — Consent validatie op backend

| # | Stap | Verwacht | Resultaat |
|---|---|---|---|
| 5.1 | POST `/api/students` met `"consentGiven": false` | 400 Bad Request, `"Toestemming is vereist"` | ✅ |
| 5.2 | POST `/api/students` met `"consentGiven": true` | 201 Created, `consentGivenAt` aanwezig als UTC-timestamp | ✅ |

## Conclusie deelvraag 3

De twee toegepaste technieken adresseren elk een specifiek GDPR-risico:

1. **AES-GCM encryptie van de lokale queue** mitigeert het risico op datalekkage van persoonsgegevens die tijdelijk op het apparaat van het bedrijf staan. De non-extractable sleutel voorkomt dat een aanvaller via XSS of een kwaadaardige extensie de ruwe sleutelbytes kan exfiltreren.

2. **Consent flow met audit trail** implementeert de GDPR-vereiste voor aantoonbare toestemming (artikel 7 lid 1): de gebruiker geeft actief toestemming, de backend weigert verwerking zonder toestemming en de timestamp wordt bewaard als bewijs.

**Aansluiting bij de literatuur:**
- Web Crypto API met non-extractable keys (bron: *OWASP Mobile Top 10 — M9: Insecure Data Storage*) → lokale opslag zonder encryptie is een bekende OWASP-kwetsbaarheid; AES-GCM adresseert dit direct.
- Expliciete toestemming + audit trail (bron: *GDPR artikel 7*) → `ConsentGivenAt` timestamp vormt de wettelijk vereiste aantoningslast.

**Beperkingen om in productie te verhelpen:**
- Key is gebonden aan het apparaat en de browser: als de gebruiker een andere browser opent of de browserdata wist, gaat de sleutel verloren en zijn oude versleutelde queue-items niet meer te ontsleutelen.
- In productie: sleutel afleiden van een gebruikerswachtwoord (PBKDF2) of beheren via een KMS, zodat de sleutel overdraagbaar en herstelbaar is.
- Geen "recht op vergetelheid" geïmplementeerd (DELETE endpoint voor student + scans) — buiten scope POC.
