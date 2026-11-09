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
   * Automatischer Mailversand über Google Apps Script (wie in der Unfall-App).
   * Code + Anleitung: apps-script/Code.gs bzw. README.md.
   * Hier die Web-App-URL eintragen: "https://script.google.com/macros/s/…/exec"
   * Leer lassen = Versand über das Teilen-Menü / Mailprogramm des Geräts.
   */
  sendEndpoint: "",
};
