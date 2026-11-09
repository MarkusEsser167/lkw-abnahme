/*
 * Einstellungen der App – hier anpassen.
 */
window.APP_CONFIG = {
  firma: "WEGO Systembaustoffe GmbH",

  // Vordefinierte Empfänger (Buttons auf der Senden-Seite)
  presetEmails: [
    { label: "Logistik", email: "logistik@wego-vti.de" },
    { label: "Hendrik Nijland", email: "hendrik.nijland@wego-vti.de" },
  ],

  /*
   * Optional: Endpunkt für automatischen Mailversand (z. B. Power Automate
   * "Beim Empfang einer HTTP-Anforderung" → "E-Mail senden (V2)" mit Anhang).
   * Die App sendet per POST JSON:
   *   { to: ["a@b.de", ...], subject, body, filename, pdfBase64 }
   * Leer lassen = Versand über das Teilen-Menü / Mailprogramm des Geräts.
   */
  sendEndpoint: "",
};
