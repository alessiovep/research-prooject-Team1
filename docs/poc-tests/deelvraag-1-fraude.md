# Deelvraag 1 — Fraudebestendigheid: testresultaten

**Onderzoeksvraag:** Welke digitale technieken kunnen worden ingezet om fraude met QR-codes (zoals kopiëren en ongeautoriseerd delen) te voorkomen?

**Toegepaste techniek:** dynamische, eenmalig bruikbare tokens met expiry van 20 seconden, geïnspireerd op bron 2 (*Fraud mitigation in attendance monitoring systems using dynamic QR code, geofencing and IMEI technologies*).

**Datum:** 2026-04-28
**Uitgevoerd door:** Alessio Veppi

## Implementatiekeuzes

- **Token-formaat:** `student:{id}:{guid}` waarbij guid een willekeurige 128-bit string is.
- **Levensduur:** 20 seconden (conform bron 2).
- **Eenmalig gebruik:** zodra een token gescand is, wordt hij uit de server-state verwijderd.
- **Server-side state:** `ConcurrentDictionary<string, ActiveToken>` in geheugen.
- **Frontend refresh:** student-app vraagt elke 15 seconden een nieuwe token op (5s buffer onder de 20s expiry).

## Bewust niet geïmplementeerd

- **IMEI-controle (bron 2):** in een browseromgeving niet beschikbaar; iOS verbiedt het zelfs voor native apps. Buiten scope POC.
- **Geofencing (bron 2):** roept privacy-vragen op die de bron zelf erkent (regel 204 onderzoekspaper). Bewust niet geïmplementeerd om GDPR-conformiteit (deelvraag 3) niet te ondermijnen.
- **HMAC-getekende stateless tokens (JWT):** in productie wenselijk om server-state te vermijden; voor de POC bewijst de geheugen-aanpak het concept evengoed.

## Tests

### Test 1 — Geldige scan (happy path)

**Stappen:**
1. Student registreert via `/student` → krijgt verse token.
2. Bedrijf plakt token in `/scanner` binnen 20 seconden.

**Verwacht resultaat:** scan wordt geregistreerd, server geeft `201 Created`.

**Resultaat:** geslaagd — ScanEvent aangemaakt in database.

### Test 2 — Replay attack (zelfde token tweemaal)

**Stappen:**
1. Token T1 wordt succesvol gescand (zoals in Test 1).
2. Direct daarna wordt T1 een tweede keer ingediend bij `/api/scans`.

**Verwacht resultaat:** server weigert, `400 Bad Request` met error `"Token onbekend of al gebruikt"`.

**Resultaat:** geslaagd — token verwijderd uit server-state na eerste gebruik, tweede poging wordt geweigerd.

**Bewijs:** screenshot van de error in browser/Swagger.

### Test 3 — Verlopen token

**Stappen:**
1. Token T2 wordt opgehaald.
2. Er wordt 25 seconden gewacht (expiry van 20s overschreden).
3. T2 wordt ingediend bij `/api/scans`.

**Verwacht resultaat:** server weigert, `400 Bad Request` met error `"Token verlopen"`.

**Resultaat:** geslaagd.

**Bewijs:** screenshot van de error.

### Test 4 — Verzonnen token

**Stappen:**
1. Een willekeurige string `student:1:fake-guid-xyz` wordt rechtstreeks ingediend bij `/api/scans`.

**Verwacht resultaat:** server weigert, `400 Bad Request` met error `"Token onbekend of al gebruikt"`.

**Resultaat:** geslaagd — niet-uitgegeven tokens komen niet voor in server-state.

### Test 5 — Auto-refresh op de student-pagina

**Stappen:**
1. `/student` openen, student registreren.
2. DevTools → Network → filter op `qr-token`.
3. 60 seconden observeren.

**Verwacht resultaat:** elke 15 seconden een nieuwe `GET /api/students/{id}/qr-token` met telkens een andere GUID in de response.

**Resultaat:** geslaagd — 4 calls geobserveerd in 60 seconden, telkens nieuwe GUID, QR-image herrendert visueel.

## Conclusie deelvraag 1

De combinatie van **expiry + eenmalig gebruik + auto-refresh** beschermt tegen de twee belangrijkste aanvalsvectoren beschreven in bron 2:

1. **Kopiëren door screenshot/foto:** een gekopieerde QR is binnen 20 seconden waardeloos. In de praktijk vaak nog korter omdat de student de QR al heeft laten scannen door een echt bedrijf, waardoor de token meteen geconsumeerd is.
2. **Doorsturen / proxy attendance:** dezelfde QR kan niet door twee verschillende bedrijven na elkaar gescand worden. De eerste scan invalideert hem.

**Beperkingen die in productie verholpen moeten worden:**
- Server-state in geheugen overleeft geen herstart of multi-instance deployment → in productie: Redis of cryptografisch getekende JWT zodat geen state nodig is.
- 20-seconden expiry vraagt continue netwerk-verbinding voor de student → conflicteert deels met deelvraag 2 (offline-first). Resolutie volgt in fase 3.


*TODO - nog screenshots toevoegen
bv
![Test 2](screenshots/test-2-replay.png)