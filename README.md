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
- **Vollautomatisch (empfohlen):** Power-Automate-Flow mit Trigger *„Beim Empfang einer HTTP-Anforderung“* und Aktion *„E-Mail senden (V2)“* (Office 365 Outlook) anlegen. JSON-Schema:
  ```json
  { "type": "object", "properties": {
      "to": { "type": "array", "items": { "type": "string" } },
      "subject": { "type": "string" }, "body": { "type": "string" },
      "filename": { "type": "string" }, "pdfBase64": { "type": "string" } } }
  ```
  An: `join(triggerBody()?['to'], ';')`, Anhang-Inhalt: `base64ToBinary(triggerBody()?['pdfBase64'])`.
  Die Flow-URL dann in `config.js` bei `sendEndpoint` eintragen. (Der HTTP-Trigger ist ein Premium-Connector.)

## Hosting (GitHub Pages)
Repository → Settings → Pages → *Deploy from a branch* → `main` / `/ (root)`. Die App ist dann unter `https://<user>.github.io/<repo>/` erreichbar. Auf dem Handy öffnen → „Zum Home-Bildschirm hinzufügen“.

## Lokal testen
```bash
python -m http.server 8765
```
