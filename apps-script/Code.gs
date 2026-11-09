/**
 * LKW-Abnahme – Mailversand über Google Apps Script
 *
 * Einrichtung:
 *  1. https://script.google.com → Neues Projekt → diesen Code einfügen → speichern
 *  2. Bereitstellen → Neue Bereitstellung → Typ "Web-App"
 *       Ausführen als: Ich      Zugriff: Jeder
 *  3. Berechtigungen bestätigen, Web-App-URL (…/exec) kopieren
 *  4. URL in config.js bei sendEndpoint eintragen, committen/pushen
 *
 * Nach Code-Änderungen: Bereitstellungen verwalten → Bearbeiten → Version "Neu".
 */

// Nur an diese Domains wird verschickt (Schutz vor Missbrauch der öffentlichen URL).
// Weitere Domains ergänzen, z. B. für Lieferanten: ['wego-vti.de', 'wecon.de']
const ALLOWED_DOMAINS = ['wego-vti.de'];

// Optional: Kopie jedes Protokolls an diese Adresse ('' = keine)
const BCC = '';

const MAX_RECIPIENTS = 10;

function doPost(e) {
  try {
    const d = JSON.parse(e.postData.contents);
    const to = String(d.to || '')
      .split(/[,;\s]+/)
      .map(function (s) { return s.trim().toLowerCase(); })
      .filter(Boolean);

    if (!to.length) return json({ status: 'error', message: 'Keine Empfänger' });
    if (to.length > MAX_RECIPIENTS) return json({ status: 'error', message: 'Zu viele Empfänger' });
    const bad = to.filter(function (m) {
      const dom = m.split('@')[1] || '';
      return !ALLOWED_DOMAINS.some(function (a) { return dom === a || dom.endsWith('.' + a); });
    });
    if (bad.length) return json({ status: 'error', message: 'Nicht erlaubte Empfänger: ' + bad.join(', ') });
    if (!d.pdf_base64) return json({ status: 'error', message: 'PDF fehlt' });

    const pdf = Utilities.newBlob(
      Utilities.base64Decode(d.pdf_base64),
      'application/pdf',
      String(d.filename || 'Abnahmeprotokoll.pdf')
    );

    const opts = { attachments: [pdf], name: 'LKW-Abnahme' };
    if (BCC) opts.bcc = BCC;

    MailApp.sendEmail(
      to.join(','),
      String(d.subject || 'Abnahmeprotokoll').slice(0, 250),
      String(d.message || ''),
      opts
    );
    return json({ status: 'ok', sent: to.length });
  } catch (err) {
    return json({ status: 'error', message: String(err) });
  }
}

// Aufruf der URL im Browser zeigt, ob das Script läuft
function doGet() {
  return json({ status: 'ok', app: 'lkw-abnahme', quotaRemaining: MailApp.getRemainingDailyQuota() });
}

function json(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
