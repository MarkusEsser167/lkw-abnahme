/*
 * Prüfpunkte für die LKW-Abnahme.
 * Abgeleitet aus den Auftragsbestätigungen/Angeboten von Döhle, Wecon,
 * Kotschenreuther und Hesotec. Hier zentral pflegen.
 *
 * Aufbau:
 *   SECTIONS: Abschnitte. `for` = Kategorien, für die der Abschnitt gilt ("*" = alle).
 *   Jeder Punkt: { t: "Prüfpunkt", h: "Hinweis/Soll lt. AB", v: true (Messwert/Ist-Feld) }
 */
window.CATEGORIES = [
  { id: "kran", name: "Kran", icon: "🏗️" },
  { id: "stapler", name: "Mitnahmestapler", icon: "🚜" },
  { id: "lbw", name: "Ladebordwand", icon: "⬇️" },
  { id: "transporter", name: "Transporter", icon: "🚐" },
  { id: "sonstiges", name: "Sonstiges", icon: "🚛" },
];

const LKW = ["kran", "stapler", "lbw", "sonstiges"];

window.SECTIONS = [
  // ───────────────────────── Allgemein (alle) ─────────────────────────
  {
    id: "fahrgestell", title: "Fahrgestell", for: ["*"], items: [
      { t: "Fahrgestell Hersteller/Typ/Achsformel lt. AB", h: "z. B. Actros 2545 L 6x2 / MAN TGS 26.440 6x2-4 LL", v: true },
      { t: "FIN stimmt mit Papieren überein", v: true },
      { t: "Radstand / Fahrerhaus lt. AB", v: true },
      { t: "Bereifung lt. AB, Reifenzustand, Felgen", h: "z. B. 315/70 R22,5" },
      { t: "Kilometerstand bei Übergabe", v: true },
      { t: "Lack Fahrerhaus/Fahrgestell ohne Schäden (Rundgang)" },
      { t: "Kotflügel / Spritzschutz vollständig und fest" },
      { t: "Kraftstoff- und AdBlue-Tank: Position, Befestigung, dicht" },
      { t: "Seitliche Schutzeinrichtung (SSE) / Heckunterfahrschutz montiert" },
      { t: "Unterlegkeile mit Halterung", h: "lt. AB: links vor der HA" },
      { t: "Luftfederung / Niveauregulierung / Liftachse funktionsfähig" },
      { t: "Keine Undichtigkeiten (Öl, Diesel, Luft, Hydraulik)" },
    ],
  },
  {
    id: "anhaenger", title: "Anhängerbetrieb", for: LKW, items: [
      { t: "Anhängerkupplung Fabrikat/Typ lt. AB", h: "z. B. Ringfeder D50 / Rockinger 500", v: true },
      { t: "Kupplungstraverse / Kupplungsrücksprung lt. AB" },
      { t: "Luftanschlüsse: Duomatik-Schnellkupplung (rot/gelb entfallen)" },
      { t: "Anhängersteckdose 24 V 15-polig + ABS, Funktion" },
      { t: "Handhebel Anhängerkupplung unten" },
    ],
  },

  // ───────────────────────── Aufbau (LKW) ─────────────────────────
  {
    id: "aufbau", title: "Aufbau / Pritsche / Curtainsider", for: LKW, items: [
      { t: "Ladelänge (innen) gemessen", h: "lt. AB z. B. 6.300 / 6.500 / 7.500 mm", v: true },
      { t: "Ladebreite gemessen", h: "lt. AB ca. 2.480 mm", v: true },
      { t: "Innenhöhe / Durchladehöhe gemessen", h: "lt. AB z. B. 2.480 – 2.850 mm", v: true },
      { t: "Fahrzeuggesamthöhe ≤ 4,00 m", v: true },
      { t: "Unterbau/Hilfsrahmen: Schweißnähte, Befestigung am Fahrgestell" },
      { t: "Boden Siebdruck (27/30 mm) bündig, abgedichtet, unbeschädigt" },
      { t: "Außenrahmen gelocht / Langlöcher, Planeneinhakprofil" },
      { t: "Zurrschienen quer (BLS / Multi-X): Anzahl und Position", h: "lt. AB 6 Stk., 1. ca. 520 mm v. Stirnwand", v: true },
      { t: "Blechstreifen/Abdeckung unter den Zurrschienen" },
      { t: "Zurrringe / Zurrpunkte Anzahl lt. AB", v: true },
      { t: "Kombi-Ankerschienen Stirn- und Rückwand (Höhen lt. AB)" },
      { t: "Stirnwand / Rückwand: Ausführung, Siebdruck-/Anfahrschutz" },
      { t: "Schiebeplane seitlich: Lauf, Spannratschen, Gurtbandverschlüsse" },
      { t: "Mittelrunge(n) / Schieberunge: verschiebbar, Arretierung" },
      { t: "Einstecklatten Alu/Stahl (Anzahl Reihen lt. AB) + Lattendepot" },
      { t: "Ladebalken mit Sicherung" },
      { t: "Gurtliftsystem unter dem Dach (falls lt. AB)" },
      { t: "Planenfarbe und Planenzustand" },
      { t: "Prüfplakette / Zertifikat DIN EN 12642 Code XL" },
      { t: "Aufkleber Zugfestigkeit Zurrpunkte" },
      { t: "Staukästen / Werkzeugkästen: Anzahl, Position, gleichschließend", v: true },
      { t: "Lackierung Aufbau/Unterbau lt. Vorgabe (RAL), Hohlraumkonservierung" },
    ],
  },

  // ───────────────────────── Kategorie-spezifisch ─────────────────────────
  {
    id: "kran", title: "Ladekran", for: ["kran"], items: [
      { t: "Kran Fabrikat/Typ lt. AB", h: "z. B. Palfinger PK 30 TEC / Fassi F315RB", v: true },
      { t: "Kran-Seriennummer", v: true },
      { t: "Heckmontage, Verschraubung, Hilfsrahmen-Verstärkung lt. Herstellervorgabe" },
      { t: "Jib (PJ) montiert, Multikupplung" },
      { t: "Drehservo / Drehmotor, Schnellwechsel zur Wendegabel" },
      { t: "Hydraulik: Pumpe, Tank, Ölstand, Leitungen dicht und geschützt" },
      { t: "Nebenabtrieb + Getriebeschaltblockierung bei NA-Betrieb" },
      { t: "Funkfernbedienung inkl. Ladestation (fest angeschlossen)" },
      { t: "Halterung Funkfernbedienung im FHS mit Warnton", h: "Warnton bei NA eingelegt bzw. Lösen der Feststellbremse" },
      { t: "Abstützung: Funktion, Zusatzabstützung unter Fahrgestellrahmen" },
      { t: "Abstützungen: Reflexfolie rot/weiß, Blitz-/LED-Leuchten" },
      { t: "Halter Abstützplatten – Platten auch bei eingefahrener Stütze entnehmbar" },
      { t: "Funktionstest aller Kranbewegungen inkl. Not-Aus" },
      { t: "Lastmomentbegrenzung / Kraneinstellung durch Hersteller" },
      { t: "Motor Start/Stopp und Drehzahlverstellung am Kran" },
      { t: "Auftritte / Aufstieg zum Kran / Wartungstritt, Haltegriff" },
      { t: "Kranprüfbuch / Prüfung vor Inbetriebnahme vorhanden" },
    ],
  },
  {
    id: "wendegabel", title: "Wendegabel / Anbaugerät", for: ["kran"], items: [
      { t: "Wendegabel Fabrikat/Typ lt. AB", h: "z. B. Kinshofer 1.500 kg", v: true },
      { t: "Halterung/Parkposition am Heck, Sicherung (Federriegel)" },
      { t: "Schlauch-/Kolbenstangenschutz Hydraulikzylinder" },
      { t: "Beschriftung Kransäule / Wendegabel (WEGO)" },
      { t: "2. Rückfahrkamera an der Wendegabelhalterung (falls lt. AB)" },
    ],
  },
  {
    id: "dach", title: "Dach-/Seitenöffnung für Kranbeladung", for: ["kran"], items: [
      { t: "Ausführung lt. AB", h: "Schiebeverdeck / Klappdach / Wingliner Open-Top", v: true },
      { t: "Öffnen/Schließen Dach – Funktion, Leichtgängigkeit" },
      { t: "Bedienung per Funk / von unten ohne Betreten der Ladefläche" },
      { t: "Verriegelung im geschlossenen Zustand (Diebstahlschutz)" },
      { t: "Seitenwand-Sicherung beim Öffnen (z. B. Elektromagnet)" },
      { t: "Dichtungen / Wasserdichtheit Dach und Stirnwand" },
      { t: "RSAB-Schlauchsystem gegen Wasser-/Eisplatten (falls lt. AB)" },
    ],
  },
  {
    id: "stapler", title: "Mitnahmestapler", for: ["stapler"], items: [
      { t: "Stapler Fabrikat/Typ lt. AB", h: "z. B. Moffett E4 25.4 NX / FLS 25 P Electric", v: true },
      { t: "Stapler-Seriennummer", v: true },
      { t: "Aufnahmetaschen heckseitig im Bodenrahmen", h: "Zinkenrohrabstand > 600 mm (außen-außen)" },
      { t: "Halterung + Kettensicherung / Halteketten vorhanden" },
      { t: "Ausziehbare Auflage für den Stapler, Bedienhaken Ausziehstützen" },
      { t: "Elektrischer Anschluss 15-polig am Heck" },
      { t: "Ladesteckdose E-Stapler 7-polig ISO 25981 – Ladefunktion geprüft" },
      { t: "Rückleuchten auf Haltern unter dem Heckquerträger, mit Stapler sichtbar" },
      { t: "Kennzeichen/Beleuchtung mit aufgesetztem Stapler sichtbar" },
      { t: "Probe: Stapler auf-/absetzen, Fahrt mit Stapler" },
      { t: "Achslasten mit Stapler (Wägung / Lastverteilungsplan)", v: true },
      { t: "Stapler-Dokumente (Betriebsanleitung, Prüfbuch/UVV)" },
    ],
  },
  {
    id: "lbw", title: "Ladebordwand", for: ["lbw"], items: [
      { t: "Ladebordwand Fabrikat/Typ/Tragkraft lt. AB", v: true },
      { t: "LBW-Seriennummer", v: true },
      { t: "Plattformmaße / Material lt. AB", v: true },
      { t: "Hauptschalter im Fahrerhaus mit Kontrollleuchte" },
      { t: "Bedienelemente (Kabel-/Funk-/Fußschalter) funktionsfähig" },
      { t: "Funktionstest: Heben, Senken, Neigen, Schließen" },
      { t: "Neigungsautomatik / Bodenanpassung" },
      { t: "Warnleuchten / Warnflaggen an der Plattform" },
      { t: "Abrollsicherung / Rollstopper" },
      { t: "Hydraulik dicht, Ölstand, Zylinder ohne Beschädigung" },
      { t: "Unterfahrschutz an der LBW lt. Vorschrift" },
      { t: "Typenschild / Lastdiagramm-Aufkleber" },
      { t: "Prüfbuch Ladebordwand + CE-Konformitätserklärung" },
      { t: "Batteriekapazität / Ladeleitung ausreichend" },
    ],
  },
  {
    id: "transporter", title: "Transporter", for: ["transporter"], items: [
      { t: "Fahrzeugtyp / Ausstattungslinie lt. AB", v: true },
      { t: "Laderaumboden, Seitenverkleidung" },
      { t: "Trennwand Fahrer-/Laderaum" },
      { t: "Zurrösen / Zurrschienen im Laderaum" },
      { t: "Regal-/Fahrzeugeinrichtung fest montiert (falls lt. AB)" },
      { t: "Dachträger / Leiterhalterung (falls lt. AB)" },
      { t: "Anhängerkupplung + Steckdose (falls lt. AB)" },
      { t: "Rückfahrkamera / Einparkhilfe" },
      { t: "Schiebetür(en), Hecktüren: Funktion, Feststeller" },
      { t: "Warndreieck, Verbandkasten, Warnwesten" },
      { t: "Serviceheft / digitales Wartungsheft" },
    ],
  },

  // ───────────────────────── Allgemein (alle) ─────────────────────────
  {
    id: "licht", title: "Beleuchtung / Elektrik / Kamera", for: ["*"], items: [
      { t: "Hauptbeleuchtung, Blinker, Bremslicht, Rückleuchten" },
      { t: "Seitenmarkierungsleuchten / Umrissleuchten" },
      { t: "LED-Arbeitsscheinwerfer seitlich li/re – Schalter im FHS" },
      { t: "LED-Arbeitsscheinwerfer vorne rechts (Ausleuchtung Vorderrad)" },
      { t: "Innenbeleuchtung / LED-Lichtstreifen Laderaum" },
      { t: "LED-Rückfahrscheinwerfer über Rückwärtsgang" },
      { t: "Rundumleuchten über Schalter im FHS" },
      { t: "Spurhalte- / Positionsleuchten hinten" },
      { t: "Rückfahrkamera (AXION) – Bild im TomTom-Display" },
      { t: "Kamera-Vorrüstung Anhänger (Steckdose neben AHK)" },
      { t: "Schalter Fremdaufbauelektrik beschriftet" },
    ],
  },
  {
    id: "sicherheit", title: "Sicherheitsausstattung (WEGO-Vorgabe)", for: ["*"], items: [
      { t: "Feuerlöscher 6 kg mit Box/Haltekasten" },
      { t: "Layher-Anlegeleiter mit Halterung/Sicherung" },
      { t: "4 Verkehrsleitkegel inkl. Halterung" },
      { t: "Absperrbänder / Haltemagnete" },
      { t: "Baustellenschilder (falls lt. AB)" },
      { t: "Notfalleimer mit Saugtüchern, beschriftet mit Kennzeichen" },
      { t: "Konturmarkierung ECE R104 (seitlich weiß / hinten rot)" },
      { t: "ECE-70 Warntafeln / Heckmarkierung" },
      { t: "Edelstahl-Gitterschutz Rückleuchten (falls lt. AB)" },
    ],
  },
  {
    id: "beschriftung", title: "Beschriftung / Telematik", for: ["*"], items: [
      { t: "Beschriftung WEGO / VTI (Plane, Fahrerhaus, Türen) lt. Vorgabe" },
      { t: "Fahrerhausmarkierung / Werbetafel (falls lt. AB)" },
      { t: "Webfleet LINK 740 Ortungsmodul montiert und online" },
      { t: "Webfleet PRO 8475 Truck mit Basisplatte montiert, funktionsfähig" },
      { t: "Maut-OBU montiert" },
      { t: "Prüfplakettenträger angebracht" },
    ],
  },
  {
    id: "doku", title: "Dokumentation / Abnahmen / Übergabe", for: ["*"], items: [
      { t: "Abnahme § 13 EG-FGV (TÜV/DEKRA) / Gutachten für ZB II" },
      { t: "Wägung / Lastverteilungsplan mit Achslastberechnung" },
      { t: "Leergewicht lt. Wägung", v: true },
      { t: "Fahrtenschreiber-/Tachoabnahme § 57b StVZO (falls lt. AB)" },
      { t: "Bedienungsanleitungen (Fahrgestell, Aufbau, Anbaugeräte)" },
      { t: "Wartungsanleitung / Inventarliste" },
      { t: "Technische Zeichnung Fahrgestell und Aufbau" },
      { t: "Fotostrecke je Fahrzeug" },
      { t: "Einweisung des Bedienpersonals erfolgt" },
      { t: "Anzahl Fahrzeugschlüssel / Staukastenschlüssel", v: true },
    ],
  },
];
