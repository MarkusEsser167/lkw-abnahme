/* LKW-Abnahme – App-Logik */
(() => {
  "use strict";
  const CFG = window.APP_CONFIG;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  // ───────────── Speicher (IndexedDB, Fallback localStorage) ─────────────
  const KEY = "abnahme-current";
  const db = {
    _db: null,
    async open() {
      if (this._db) return this._db;
      return (this._db = await new Promise((res, rej) => {
        const r = indexedDB.open("lkw-abnahme", 1);
        r.onupgradeneeded = () => r.result.createObjectStore("kv");
        r.onsuccess = () => res(r.result);
        r.onerror = () => rej(r.error);
      }));
    },
    async get(k) {
      try {
        const d = await this.open();
        return await new Promise((res, rej) => {
          const q = d.transaction("kv").objectStore("kv").get(k);
          q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error);
        });
      } catch { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } }
    },
    async set(k, v) {
      try {
        const d = await this.open();
        await new Promise((res, rej) => {
          const t = d.transaction("kv", "readwrite"); t.objectStore("kv").put(v, k);
          t.oncomplete = res; t.onerror = () => rej(t.error);
        });
      } catch { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }
    },
  };

  const today = () => new Date().toISOString().slice(0, 10);
  const fresh = () => ({
    meta: { datum: today(), kategorie: "" },
    items: {}, custom: [], result: "", sig: {}, emails: [],
  });
  let S = fresh();
  let saveTimer;
  const save = () => { clearTimeout(saveTimer); saveTimer = setTimeout(() => db.set(KEY, S), 250); };

  // ───────────── Toast ─────────────
  let toastTimer;
  function toast(msg, ms = 2600) {
    const t = $("#toast"); t.textContent = msg; t.classList.add("show");
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove("show"), ms);
  }

  // ───────────── Navigation ─────────────
  function goto(n) {
    $$(".step").forEach((s) => s.classList.toggle("active", s.id === "step" + n));
    $$("#steps button").forEach((b) => b.classList.toggle("active", b.dataset.step == n));
    if (n == 2) renderChecklist();
    if (n == 3) { renderSummary(); requestAnimationFrame(initSigs); }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  document.addEventListener("click", (e) => {
    const g = e.target.closest("[data-goto]"); if (g) goto(g.dataset.goto);
    const st = e.target.closest("#steps button"); if (st) goto(st.dataset.step);
  });

  // ───────────── Schritt 1: Kategorie + Meta ─────────────
  function renderCats() {
    $("#cats").innerHTML = CATEGORIES.map((c) =>
      `<button data-cat="${c.id}" class="${S.meta.kategorie === c.id ? "active" : ""}"><span>${c.icon}</span>${esc(c.name)}</button>`).join("");
  }
  $("#cats").addEventListener("click", (e) => {
    const b = e.target.closest("[data-cat]"); if (!b) return;
    S.meta.kategorie = b.dataset.cat; renderCats(); updateBadge(); save();
  });
  function bindMeta() {
    $$("[data-meta]").forEach((el) => {
      el.value = S.meta[el.dataset.meta] ?? "";
      el.oninput = () => { S.meta[el.dataset.meta] = el.value; save(); };
    });
  }

  // ───────────── Schritt 2: Checkliste ─────────────
  const sectionsFor = (cat) => SECTIONS.filter((s) => s.for.includes("*") || s.for.includes(cat));
  const itemKey = (secId, i) => `${secId}:${i}`;
  const getItem = (k) => (S.items[k] ||= { s: "", note: "", val: "", photos: [] });

  function allItems() {
    const out = [];
    for (const sec of sectionsFor(S.meta.kategorie)) {
      sec.items.forEach((it, i) => out.push({ sec, def: it, key: itemKey(sec.id, i), st: S.items[itemKey(sec.id, i)] || {} }));
    }
    S.custom.forEach((c, i) => out.push({ sec: { id: "custom", title: "Zusätzliche Prüfpunkte (AB)" }, def: { t: c.t, v: true }, key: "custom:" + i, st: c }));
    return out;
  }

  function itemHtml(key, def, st, custom) {
    const sv = st.s || "";
    return `<div class="item st-${sv}" data-key="${key}">
      <div class="itemrow">
        <div class="itemtext">${esc(def.t)}${def.h ? `<div class="hint">${esc(def.h)}</div>` : ""}</div>
        <div class="tri">
          <button data-s="ok" class="${sv === "ok" ? "on" : ""}" title="in Ordnung">✓</button>
          <button data-s="nok" class="${sv === "nok" ? "on" : ""}" title="Mangel">✗</button>
          <button data-s="na" class="${sv === "na" ? "on" : ""}" title="nicht vorhanden / nicht zutreffend">–</button>
        </div>
      </div>
      <div class="itemextra">
        ${def.v ? `<input type="text" data-f="val" placeholder="Ist-Wert / Angabe" value="${esc(st.val)}">` : ""}
        <input type="text" data-f="note" placeholder="${sv === "nok" ? "Mangel beschreiben …" : "Bemerkung"}" value="${esc(st.note)}">
        <label class="photobtn">📷 Foto<input type="file" accept="image/*" capture="environment" multiple data-f="photo"></label>
        ${custom ? `<button class="ghost small delcustom" data-del="${key}">entfernen</button>` : ""}
      </div>
      <div class="thumbs">${(st.photos || []).map((p, i) => `<div class="th"><img src="${p}" alt=""><button data-delphoto="${i}" title="Foto löschen">×</button></div>`).join("")}</div>
    </div>`;
  }

  function secProgress(keys) {
    const sts = keys.map((k) => stateOf(k).s);
    const done = sts.filter(Boolean).length, nok = sts.filter((s) => s === "nok").length;
    return { done, total: keys.length, nok };
  }
  const stateOf = (key) => key.startsWith("custom:") ? S.custom[+key.split(":")[1]] : getItem(key);

  function progText(p) { return `${p.done}/${p.total}${p.nok ? ` · ${p.nok} Mangel` : ""}`; }
  function progClass(p) { return p.nok ? "bad" : p.done === p.total ? "done" : ""; }

  function renderChecklist() {
    const cat = CATEGORIES.find((c) => c.id === S.meta.kategorie);
    $("#catLabel").textContent = cat ? `${cat.icon} ${cat.name}` : "⚠️ Bitte zuerst Kategorie wählen";
    const openIds = new Set($$("details.sec[open]").map((d) => d.dataset.sec));
    const first = !$("#sections").children.length;
    let html = "";
    const secs = sectionsFor(S.meta.kategorie);
    secs.forEach((sec, si) => {
      const keys = sec.items.map((_, i) => itemKey(sec.id, i));
      const p = secProgress(keys);
      const isOpen = openIds.has(sec.id) || (first && si === 0);
      html += `<details class="sec" data-sec="${sec.id}" ${isOpen ? "open" : ""}>
        <summary>${esc(sec.title)}<span class="secprog ${progClass(p)}">${progText(p)}</span></summary>
        <div class="secbar"><button class="ghost small" data-allok="${sec.id}">Rest alle i.O.</button></div>
        ${sec.items.map((it, i) => itemHtml(itemKey(sec.id, i), it, S.items[itemKey(sec.id, i)] || {}, false)).join("")}
      </details>`;
    });
    if (S.custom.length) {
      const keys = S.custom.map((_, i) => "custom:" + i);
      const p = secProgress(keys);
      html += `<details class="sec" data-sec="custom" open>
        <summary>Zusätzliche Prüfpunkte (AB)<span class="secprog ${progClass(p)}">${progText(p)}</span></summary>
        ${S.custom.map((c, i) => itemHtml("custom:" + i, { t: c.t, v: true }, c, true)).join("")}
      </details>`;
    }
    $("#sections").innerHTML = html;
    updateBadge();
  }

  function refreshItem(itemEl) {
    const key = itemEl.dataset.key, st = stateOf(key);
    const custom = key.startsWith("custom:");
    let def;
    if (custom) def = { t: st.t, v: true };
    else { const [sid, i] = key.split(":"); def = SECTIONS.find((s) => s.id === sid).items[+i]; }
    const tmp = document.createElement("div");
    tmp.innerHTML = itemHtml(key, def, st, custom);
    itemEl.replaceWith(tmp.firstElementChild);
    // Abschnittsfortschritt aktualisieren
    const det = $(`details.sec[data-sec="${custom ? "custom" : key.split(":")[0]}"]`);
    const keys = $$(".item", det).map((x) => x.dataset.key);
    const p = secProgress(keys), sp = $(".secprog", det);
    sp.textContent = progText(p); sp.className = "secprog " + progClass(p);
    updateBadge();
  }

  function updateBadge() {
    if (!S.meta.kategorie) { $("#progressBadge").textContent = ""; return; }
    const all = allItems();
    $("#progressBadge").textContent = `${all.filter((x) => x.st.s).length}/${all.length}`;
  }

  $("#sections").addEventListener("click", (e) => {
    const sb = e.target.closest(".tri button");
    if (sb) {
      const itemEl = sb.closest(".item"), st = stateOf(itemEl.dataset.key);
      st.s = st.s === sb.dataset.s ? "" : sb.dataset.s;
      save(); refreshItem(itemEl);
      if (st.s === "nok") setTimeout(() => $(`.item[data-key="${itemEl.dataset.key}"] [data-f="note"]`)?.focus(), 50);
      return;
    }
    const all = e.target.closest("[data-allok]");
    if (all) {
      const sec = SECTIONS.find((s) => s.id === all.dataset.allok);
      sec.items.forEach((_, i) => { const st = getItem(itemKey(sec.id, i)); if (!st.s) st.s = "ok"; });
      save(); renderChecklist(); return;
    }
    const dp = e.target.closest("[data-delphoto]");
    if (dp) {
      const itemEl = dp.closest(".item"), st = stateOf(itemEl.dataset.key);
      st.photos.splice(+dp.dataset.delphoto, 1); save(); refreshItem(itemEl); return;
    }
    const dc = e.target.closest("[data-del]");
    if (dc && confirm("Prüfpunkt entfernen?")) {
      S.custom.splice(+dc.dataset.del.split(":")[1], 1); save(); renderChecklist();
    }
  });
  $("#sections").addEventListener("input", (e) => {
    const f = e.target.dataset.f; if (f !== "val" && f !== "note") return;
    stateOf(e.target.closest(".item").dataset.key)[f] = e.target.value; save();
  });
  $("#sections").addEventListener("change", async (e) => {
    if (e.target.dataset.f !== "photo") return;
    const itemEl = e.target.closest(".item"), st = stateOf(itemEl.dataset.key);
    st.photos ||= [];
    for (const f of e.target.files) {
      try { st.photos.push(await shrink(f, 1280, 0.72)); } catch { toast("Foto konnte nicht gelesen werden"); }
    }
    save(); refreshItem(itemEl);
  });

  $("#btnAddCustom").onclick = () => {
    const lines = $("#customInput").value.split(/\r?\n/).map((l) => l.replace(/^[\s\-•*·]+/, "").trim()).filter(Boolean);
    if (!lines.length) return;
    lines.forEach((t) => S.custom.push({ t, s: "", note: "", val: "", photos: [] }));
    $("#customInput").value = ""; save(); renderChecklist();
    toast(`${lines.length} Prüfpunkt(e) hinzugefügt`);
  };

  function shrink(file, max, q) {
    return new Promise((res, rej) => {
      const url = URL.createObjectURL(file), img = new Image();
      img.onload = () => {
        const sc = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement("canvas");
        c.width = Math.round(img.width * sc); c.height = Math.round(img.height * sc);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url); res(c.toDataURL("image/jpeg", q));
      };
      img.onerror = () => { URL.revokeObjectURL(url); rej(); };
      img.src = url;
    });
  }

  // ───────────── Schritt 3: Zusammenfassung, Ergebnis, Unterschrift ─────────────
  function counts() {
    const all = allItems();
    return {
      all,
      ok: all.filter((x) => x.st.s === "ok").length,
      nok: all.filter((x) => x.st.s === "nok"),
      na: all.filter((x) => x.st.s === "na").length,
      open: all.filter((x) => !x.st.s).length,
    };
  }
  function renderSummary() {
    const c = counts();
    $("#summary").innerHTML = `<div class="ok"><b>${c.ok}</b>i.O.</div><div class="nok"><b>${c.nok.length}</b>Mängel</div><div class="na"><b>${c.na}</b>n.v.</div><div class="open"><b>${c.open}</b>offen</div>`;
    let h = "";
    if (c.nok.length) h += `<ul>${c.nok.map((x) => `<li><b>${esc(x.def.t)}</b>${x.st.note ? ": " + esc(x.st.note) : ""}</li>`).join("")}</ul>`;
    if (c.open) h += `<div class="warn">${c.open} Prüfpunkt(e) noch nicht bewertet – sie erscheinen im Protokoll als „offen“.</div>`;
    $("#defects").innerHTML = h;
    renderResult(); renderMail();
  }
  function renderResult() { $$("#result button").forEach((b) => b.classList.toggle("active", b.dataset.result === S.result)); }
  $("#result").addEventListener("click", (e) => {
    const b = e.target.closest("[data-result]"); if (!b) return;
    S.result = b.dataset.result; renderResult(); save();
  });

  const sigPads = {};
  function initSigs() {
    $$("canvas[data-sig]").forEach((cv) => {
      const name = cv.dataset.sig;
      const r = cv.getBoundingClientRect(); if (!r.width) return;
      const dpr = window.devicePixelRatio || 1;
      if (cv.width !== Math.round(r.width * dpr)) { cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr); }
      const ctx = cv.getContext("2d");
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, r.width, r.height);
      ctx.lineWidth = 2.2; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.strokeStyle = "#0b2545";
      if (S.sig[name]) { const im = new Image(); im.onload = () => ctx.drawImage(im, 0, 0, r.width, r.height); im.src = S.sig[name]; }
      if (sigPads[name]) return;
      sigPads[name] = true;
      let drawing = false, last;
      const pos = (e) => { const b = cv.getBoundingClientRect(); return [e.clientX - b.left, e.clientY - b.top]; };
      cv.addEventListener("pointerdown", (e) => { drawing = true; last = pos(e); cv.setPointerCapture(e.pointerId); });
      cv.addEventListener("pointermove", (e) => {
        if (!drawing) return; const p = pos(e), c2 = cv.getContext("2d");
        c2.beginPath(); c2.moveTo(...last); c2.lineTo(...p); c2.stroke(); last = p;
      });
      const end = () => { if (!drawing) return; drawing = false; S.sig[name] = cv.toDataURL("image/png"); save(); };
      cv.addEventListener("pointerup", end); cv.addEventListener("pointercancel", end);
    });
  }
  $$("[data-clear]").forEach((b) => b.onclick = () => { delete S.sig[b.dataset.clear]; save(); initSigs(); });
  window.addEventListener("resize", () => { if ($("#step3").classList.contains("active")) initSigs(); });

  // ───────────── E-Mail-Empfänger ─────────────
  const isMail = (m) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(m);
  function renderMail() {
    const has = (m) => S.emails.some((x) => x.toLowerCase() === m.toLowerCase());
    $("#presets").innerHTML = CFG.presetEmails.map((p) =>
      `<button data-preset="${esc(p.email)}" class="${has(p.email) ? "added" : ""}" title="${esc(p.email)}">${has(p.email) ? "✓" : "+"} ${esc(p.label)}</button>`).join("");
    $("#chips").innerHTML = S.emails.map((m, i) => `<span class="chip">${esc(m)}<button data-rm="${i}" title="entfernen">×</button></span>`).join("");
    const mode = CFG.sendEndpoint ? "Das Protokoll wird direkt an die Empfänger versendet."
      : navigator.canShare ? "Öffnet das Teilen-Menü (z. B. Outlook/Mail) mit dem PDF als Anhang. Die Empfänger werden vorher in die Zwischenablage kopiert."
      : "Das PDF wird heruntergeladen und das Mailprogramm mit den Empfängern geöffnet – bitte PDF anhängen.";
    $("#sendHint").textContent = mode;
  }
  function addMail(m) {
    m = m.trim().replace(/[;,]$/, "");
    if (!m) return;
    if (!isMail(m)) { toast("Ungültige E-Mail-Adresse"); return false; }
    if (!S.emails.some((x) => x.toLowerCase() === m.toLowerCase())) S.emails.push(m);
    save(); renderMail(); return true;
  }
  $("#presets").addEventListener("click", (e) => {
    const b = e.target.closest("[data-preset]"); if (!b) return;
    const m = b.dataset.preset, i = S.emails.findIndex((x) => x.toLowerCase() === m.toLowerCase());
    if (i >= 0) S.emails.splice(i, 1); else S.emails.push(m);
    save(); renderMail();
  });
  $("#chips").addEventListener("click", (e) => {
    const b = e.target.closest("[data-rm]"); if (!b) return;
    S.emails.splice(+b.dataset.rm, 1); save(); renderMail();
  });
  const commitInput = () => {
    const parts = $("#mailInput").value.split(/[\s,;]+/).filter(Boolean);
    if (parts.every((p) => addMail(p) !== false)) $("#mailInput").value = "";
  };
  $("#mailInput").addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === "," || e.key === ";") { e.preventDefault(); commitInput(); } });
  $("#mailInput").addEventListener("blur", () => { if ($("#mailInput").value.trim()) commitInput(); });
  $("#btnAddMail").onclick = commitInput;

  // ───────────── PDF ─────────────
  const pdfText = (s) => String(s ?? "")
    .replace(/≤/g, "<=").replace(/≥/g, ">=").replace(/[→⇒]/g, "->").replace(/[✓✔]/g, "i.O.").replace(/[✗✘]/g, "X")
    .replace(/[^\x00-\xFF€–—„“”‚‘’•…]/g, "");
  const RESULT_TXT = { ok: "ABGENOMMEN – ohne Mängel", nacharbeit: "ABGENOMMEN – mit Nacharbeit", abgelehnt: "NICHT ABGENOMMEN", "": "– kein Ergebnis gewählt –" };
  const STATUS_TXT = { ok: "i.O.", nok: "MANGEL", na: "n.v.", "": "offen" };
  const fmtDate = (d) => d ? d.split("-").reverse().join(".") : "";

  function fileName() {
    const m = S.meta;
    const id = (m.kennzeichen || m.fin || m.fzNr || "Fahrzeug").replace(/[^\w\-äöüÄÖÜß]+/g, "_");
    return `Abnahmeprotokoll_${id}_${m.datum || today()}.pdf`;
  }

  function validate() {
    const m = S.meta, miss = [];
    if (!m.kategorie) miss.push("Kategorie");
    if (!m.lieferant) miss.push("Lieferant");
    if (!m.fin && !m.kennzeichen) miss.push("FIN oder Kennzeichen");
    if (!m.pruefer) miss.push("Prüfer");
    if (miss.length) { toast("Bitte ausfüllen: " + miss.join(", "), 4000); goto(1); return false; }
    return true;
  }

  function buildPdf() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const W = 210, M = 14;
    const m = S.meta, c = counts();
    const cat = CATEGORIES.find((x) => x.id === m.kategorie);
    const BRAND = [11, 61, 110];

    // Kopf
    doc.setFillColor(...BRAND); doc.rect(0, 0, W, 22, "F");
    doc.setTextColor(255); doc.setFont("helvetica", "bold"); doc.setFontSize(15);
    doc.text("Abnahmeprotokoll Neufahrzeug", M, 10);
    doc.setFont("helvetica", "normal"); doc.setFontSize(9.5);
    doc.text(pdfText(`${CFG.firma} · Kategorie: ${cat ? cat.name : "-"}`), M, 16.5);
    doc.text(pdfText(fmtDate(m.datum)), W - M, 10, { align: "right" });
    doc.setTextColor(0);

    // Stammdaten
    const meta = [
      ["Lieferant", m.lieferant, "AB-/Angebots-Nr.", m.abNr],
      ["Fahrgestell", m.fahrgestell, "Aufbau/Anbaugerät", m.aufbau],
      ["FIN", m.fin, "Kennzeichen", m.kennzeichen],
      ["Interne Fzg.-Nr.", m.fzNr, "Ort", m.ort],
      ["Prüfer (WEGO)", m.pruefer, "Vertreter Lieferant", m.vertreter],
    ].map((r) => r.map(pdfText));
    doc.autoTable({
      startY: 27, body: meta, theme: "grid", margin: { left: M, right: M },
      styles: { fontSize: 9, cellPadding: 1.8 },
      columnStyles: { 0: { fontStyle: "bold", fillColor: [238, 242, 247], cellWidth: 32 }, 2: { fontStyle: "bold", fillColor: [238, 242, 247], cellWidth: 34 } },
    });

    // Ergebnis-Box
    let y = doc.lastAutoTable.finalY + 5;
    const rc = { ok: [30, 142, 62], nacharbeit: [214, 137, 0], abgelehnt: [198, 40, 40], "": [120, 120, 120] }[S.result || ""];
    doc.setDrawColor(...rc); doc.setLineWidth(0.8); doc.roundedRect(M, y, W - 2 * M, 14, 2, 2);
    doc.setFont("helvetica", "bold"); doc.setFontSize(12); doc.setTextColor(...rc);
    doc.text(pdfText("Ergebnis: " + RESULT_TXT[S.result || ""]), M + 4, y + 6);
    doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(60);
    doc.text(`Prüfpunkte: ${c.all.length}  ·  i.O.: ${c.ok}  ·  Mängel: ${c.nok.length}  ·  n.v.: ${c.na}  ·  offen: ${c.open}`, M + 4, y + 11);
    doc.setTextColor(0); doc.setLineWidth(0.2);
    y += 19;

    // Mängelliste
    if (c.nok.length) {
      doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.setTextColor(198, 40, 40);
      doc.text(pdfText(`Mängelliste (${c.nok.length})`), M, y); doc.setTextColor(0);
      doc.autoTable({
        startY: y + 2, margin: { left: M, right: M }, theme: "grid",
        head: [["#", "Bereich", "Prüfpunkt", "Mangel / Bemerkung"]],
        body: c.nok.map((x, i) => [i + 1, x.sec.title, x.def.t, [x.st.val, x.st.note].filter(Boolean).join(" – ")].map(pdfText)),
        headStyles: { fillColor: [198, 40, 40] }, styles: { fontSize: 8.5, cellPadding: 1.6 },
        columnStyles: { 0: { cellWidth: 8 }, 1: { cellWidth: 34 }, 2: { cellWidth: 62 } },
      });
      y = doc.lastAutoTable.finalY + 6;
    }
    if (m.bemerkung) {
      doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.text("Bemerkungen / Vereinbarungen", M, y);
      doc.setFont("helvetica", "normal"); doc.setFontSize(9);
      const lines = doc.splitTextToSize(pdfText(m.bemerkung), W - 2 * M);
      doc.text(lines, M, y + 5); y += 7 + lines.length * 4;
    }

    // Checkliste je Abschnitt
    const groups = [];
    c.all.forEach((x) => {
      let g = groups.find((g) => g.id === x.sec.id);
      if (!g) groups.push((g = { id: x.sec.id, title: x.sec.title, rows: [] }));
      g.rows.push(x);
    });
    const statusColor = { ok: [30, 142, 62], nok: [198, 40, 40], na: [110, 120, 130], "": [214, 137, 0] };
    doc.setFont("helvetica", "bold"); doc.setFontSize(11);
    if (y > 260) { doc.addPage(); y = 18; }
    doc.text(pdfText("Prüfpunkte im Detail"), M, y); y += 2;
    groups.forEach((g) => {
      doc.autoTable({
        startY: y, margin: { left: M, right: M, top: 14 }, theme: "grid",
        head: [[{ content: pdfText(g.title), colSpan: 4 }], ["#", "Prüfpunkt", "Ist / Bemerkung", "Status"]],
        body: g.rows.map((x, i) => [
          i + 1,
          pdfText(x.def.t) + (x.def.h ? `\n${pdfText(x.def.h)}` : ""),
          pdfText([x.st.val, x.st.note].filter(Boolean).join(" – ")) + ((x.st.photos || []).length ? `  [${x.st.photos.length} Foto]` : ""),
          STATUS_TXT[x.st.s || ""],
        ]),
        headStyles: { fillColor: BRAND, fontSize: 9 },
        styles: { fontSize: 8.3, cellPadding: 1.5, valign: "middle" },
        columnStyles: { 0: { cellWidth: 8 }, 1: { cellWidth: 82 }, 3: { cellWidth: 18, halign: "center", fontStyle: "bold" } },
        didParseCell: (d) => {
          if (d.section === "body" && d.column.index === 3) d.cell.styles.textColor = statusColor[g.rows[d.row.index].st.s || ""];
          if (d.section === "head" && d.row.index === 1) { d.cell.styles.fillColor = [238, 242, 247]; d.cell.styles.textColor = 40; }
        },
      });
      y = doc.lastAutoTable.finalY + 4;
    });

    // Fotos
    const photos = c.all.flatMap((x) => (x.st.photos || []).map((p) => ({ p, cap: `${STATUS_TXT[x.st.s || ""]} · ${x.def.t}${x.st.note ? " – " + x.st.note : ""}` })));
    if (photos.length) {
      doc.addPage(); y = 18;
      doc.setFont("helvetica", "bold"); doc.setFontSize(12); doc.text("Fotodokumentation", M, y); y += 5;
      const cw = (W - 2 * M - 6) / 2, ch = 62;
      photos.forEach((ph, i) => {
        const col = i % 2;
        if (col === 0 && i > 0) y += ch + 14;
        if (y + ch + 12 > 285) { doc.addPage(); y = 18; }
        const x = M + col * (cw + 6);
        try {
          const prop = doc.getImageProperties(ph.p);
          const r = Math.min(cw / prop.width, ch / prop.height);
          const w = prop.width * r, h = prop.height * r;
          doc.addImage(ph.p, "JPEG", x + (cw - w) / 2, y, w, h);
        } catch {}
        doc.setFont("helvetica", "normal"); doc.setFontSize(7.5);
        doc.text(doc.splitTextToSize(pdfText(`Foto ${i + 1}: ${ph.cap}`), cw).slice(0, 3), x, y + ch + 4);
      });
      y += ch + 18;
    }

    // Unterschriften
    if (y > 245) { doc.addPage(); y = 20; }
    doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.text("Unterschriften", M, y); y += 4;
    const sw = (W - 2 * M - 10) / 2;
    [["pruefer", "Prüfer (WEGO)", m.pruefer], ["lieferant", "Lieferant", m.vertreter]].forEach(([k, lbl, name], i) => {
      const x = M + i * (sw + 10);
      if (S.sig[k]) try {
        const pr = doc.getImageProperties(S.sig[k]);
        const r = Math.min(sw / pr.width, 28 / pr.height);
        doc.addImage(S.sig[k], "PNG", x, y + 28 - pr.height * r, pr.width * r, pr.height * r, undefined, "FAST");
      } catch {}
      doc.setDrawColor(120); doc.line(x, y + 30, x + sw, y + 30);
      doc.setFont("helvetica", "normal"); doc.setFontSize(8.5);
      doc.text(pdfText(`${lbl}${name ? ": " + name : ""} · ${fmtDate(m.datum)}${m.ort ? ", " + m.ort : ""}`), x, y + 34);
    });

    // Fußzeile
    const n = doc.getNumberOfPages();
    for (let i = 1; i <= n; i++) {
      doc.setPage(i); doc.setFontSize(7.5); doc.setTextColor(130);
      doc.text(pdfText(`Abnahmeprotokoll ${m.kennzeichen || m.fin || ""} · ${m.lieferant || ""}`), M, 291);
      doc.text(`Seite ${i} / ${n}`, W - M, 291, { align: "right" });
    }
    doc.setTextColor(0);
    return doc;
  }

  $("#btnPdf").onclick = () => {
    if (!validate()) return;
    const blob = buildPdf().output("blob");
    const url = URL.createObjectURL(blob);
    const w = window.open(url, "_blank");
    if (!w) { const a = document.createElement("a"); a.href = url; a.download = fileName(); a.click(); }
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  };

  function mailTexts() {
    const m = S.meta, cat = CATEGORIES.find((x) => x.id === m.kategorie);
    const subject = `Abnahmeprotokoll ${m.kennzeichen || m.fin || ""} – ${m.lieferant || ""} (${fmtDate(m.datum)})`.replace(/\s+/g, " ");
    const nok = counts().nok;
    const body = [
      "Hallo,", "",
      `anbei das Abnahmeprotokoll für ${cat ? cat.name + "-" : ""}Fahrzeug ${m.kennzeichen || ""} ${m.fin ? "(FIN " + m.fin + ")" : ""}.`.replace(/\s+/g, " "),
      `Lieferant: ${m.lieferant || "-"}${m.abNr ? ", AB " + m.abNr : ""}`,
      `Ergebnis: ${RESULT_TXT[S.result || ""]}`,
      nok.length ? `\nMängel (${nok.length}):\n` + nok.map((x) => `- ${x.def.t}${x.st.note ? ": " + x.st.note : ""}`).join("\n") : "",
      "", `Prüfer: ${m.pruefer || ""}`,
    ].join("\n");
    return { subject, body };
  }

  $("#btnSend").onclick = async () => {
    if ($("#mailInput").value.trim()) commitInput();
    if (!validate()) return;
    if (!S.emails.length) { toast("Bitte mindestens einen Empfänger hinzufügen"); $("#mailInput").focus(); return; }
    if (!S.result && !confirm("Es wurde noch kein Ergebnis gewählt. Trotzdem senden?")) return;
    const doc = buildPdf();
    const blob = doc.output("blob"), name = fileName();
    const { subject, body } = mailTexts();
    const btn = $("#btnSend");

    if (CFG.sendEndpoint) {
      btn.disabled = true; btn.textContent = "Sende …";
      try {
        const pdfBase64 = doc.output("datauristring").split(",")[1];
        const r = await fetch(CFG.sendEndpoint, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ to: S.emails, subject, body, filename: name, pdfBase64 }),
        });
        if (!r.ok) throw new Error(r.status);
        toast("✓ Protokoll versendet an " + S.emails.length + " Empfänger", 4000);
      } catch (err) {
        toast("Versand fehlgeschlagen (" + err.message + ") – bitte über Mailprogramm senden", 5000);
        fallbackMail(blob, name, subject, body);
      } finally { btn.disabled = false; btn.textContent = "PDF per Mail senden"; }
      return;
    }

    const file = new File([blob], name, { type: "application/pdf" });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try { await navigator.clipboard.writeText(S.emails.join("; ")); toast("Empfänger in Zwischenablage kopiert – im Mailprogramm einfügen", 4000); } catch {}
      try {
        await navigator.share({ files: [file], title: subject, text: body });
        return;
      } catch (err) { if (err.name === "AbortError") return; }
    }
    fallbackMail(blob, name, subject, body);
  };

  function fallbackMail(blob, name, subject, body) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
    const mailto = `mailto:${S.emails.map(encodeURIComponent).join(",")}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body + "\n\n(PDF bitte anhängen: " + name + ")")}`;
    setTimeout(() => { location.href = mailto; }, 400);
    toast("PDF gespeichert – bitte im Mailprogramm anhängen", 5000);
  }

  // ───────────── Neu ─────────────
  $("#btnNew").onclick = async () => {
    if (!confirm("Neue Abnahme beginnen? Die aktuelle Erfassung wird verworfen.")) return;
    const keepPruefer = S.meta.pruefer;
    S = fresh(); S.meta.pruefer = keepPruefer;
    await db.set(KEY, S);
    $("#sections").innerHTML = "";
    bindMeta(); renderCats(); updateBadge(); goto(1);
  };

  // ───────────── Start ─────────────
  (async () => {
    const saved = await db.get(KEY);
    if (saved && saved.meta) S = Object.assign(fresh(), saved);
    bindMeta(); renderCats(); updateBadge();
  })();

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
  }
})();
