# LKW-Abnahme (PWA)

Web-App für die Abnahme neuer LKW beim Lieferanten. Läuft auf Handy/Tablet im Browser, ist als App installierbar und funktioniert auch offline.

## Ablauf
1. **Fahrzeug** – Kategorie wählen (Kran, Mitnahmestapler, Ladebordwand, Transporter, Sonstiges) und Stammdaten erfassen.
2. **Prüfung** – je Prüfpunkt ✓ i.O. / ✗ Mangel / – n.v., Ist-Werte, Bemerkung und Fotos. Zusätzliche Punkte aus der AB lassen sich zeilenweise einfügen.
3. **Abschluss** – Ergebnis, Bemerkungen, Unterschriften Prüfer + Lieferant, Empfänger wählen, PDF senden.

Die Erfassung wird laufend auf dem Gerät gespeichert (IndexedDB) – nichts geht verloren, wenn der Browser geschlossen wird.

## Anpassen
| Datei | Inhalt |
|---|---|
| `checklist.js` | Kategorien und Prüfpunkte |
| `config.js` | Firmenname, vordefinierte Mail-Empfänger, optionaler Versand-Endpunkt |
| `sw.js` | Nach Änderungen `VERSION` hochzählen, damit installierte Apps aktualisieren |

## Mailversand
Ohne Server kann eine Web-App keine Mail mit Anhang selbst verschicken. Daher:

- **Standard (ohne Einrichtung):** Auf Handy/Tablet öffnet „PDF per Mail senden“ das Teilen-Menü mit dem PDF als Anhang (Outlook/Mail wählen). Die Empfänger werden vorher in die Zwischenablage kopiert und im Mailprogramm eingefügt. Am PC wird das PDF gespeichert und Outlook mit Empfängern/Betreff geöffnet.
- **Vollautomatisch über Google Apps Script (wie Unfall-App):**
  1. https://script.google.com → *Neues Projekt* → Inhalt von [`apps-script/Code.gs`](apps-script/Code.gs) einfügen → speichern.
  2. *Bereitstellen → Neue Bereitstellung → Web-App*, „Ausführen als: Ich“, „Zugriff: Jeder“ → Berechtigungen bestätigen.
  3. Die Web-App-URL (`https://script.google.com/macros/s/…/exec`) in `config.js` bei `sendEndpoint` eintragen und pushen.

  Die App schickt per POST (`Content-Type: text/plain`, damit kein CORS-Preflight nötig ist):
  `{ to: "a@x.de,b@y.de", subject, message, filename, pdf_base64 }` – dasselbe Format wie die Unfall-App.
  Das Script verschickt nur an die Domains in `ALLOWED_DOMAINS` (Standard: `wego-vti.de`), weil die URL im öffentlichen Repo steht. Für Lieferanten-Adressen die Domain dort ergänzen. Absender ist das Google-Konto, unter dem das Script läuft (Limit: 100 Mails/Tag bei Gmail, 1.500 bei Workspace).

## Hosting (GitHub Pages)
Repository → Settings → Pages → *Deploy from a branch* → `main` / `/ (root)`. Die App ist dann unter `https://<user>.github.io/<repo>/` erreichbar. Auf dem Handy öffnen → „Zum Home-Bildschirm hinzufügen“.

## Lokal testen
```bash
python -m http.server 8765
```
