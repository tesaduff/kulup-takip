/* Veri dosyası (KulupVerileri.xlsx) okuma/yazma ve rapor Excel'e aktarma.
   Sürüm 1 (Windows) veri dosyasıyla uyumludur. */
'use strict';
const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');
const L = require('./renderer/logic');

function str(v) {
  if (v === null || v === undefined) return '';
  if (v instanceof Date) return L.gunKey(new Date(v.getUTCFullYear(), v.getUTCMonth(), v.getUTCDate()));
  if (typeof v === 'object') {
    if (v.richText) return v.richText.map(r => r.text).join('');
    if (v.text !== undefined) return String(v.text);
    if (v.result !== undefined) return str(v.result);
    if (v.error) return '';
  }
  return String(v).trim();
}
function num(v) { const n = L.parsePara(str(v)); return isNaN(n) ? 0 : n; }
function bool(v) { return ['evet', 'e', 'var', 'x', '1', 'true', 'dogru'].includes(L.norm(str(v))); }
function tarih(s) {
  s = str(s);
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const m = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/); if (m) return `${m[3]}-${L.pad(m[2])}-${L.pad(m[1])}`;
  if (/^\d{5}(\.\d+)?$/.test(s)) { const d = new Date(Date.UTC(1899, 11, 30) + parseFloat(s) * 86400000); return L.gunKey(new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())); }
  return s;
}
function ay(s) { s = tarih(s); return s.length >= 7 ? s.slice(0, 7) : s; }

function sheetRows(ws) {
  const rows = [];
  ws.eachRow({ includeEmpty: true }, (row, rn) => {
    const r = [];
    row.eachCell({ includeEmpty: true }, (cell, cn) => { r[cn - 1] = str(cell.value); });
    for (let i = 0; i < r.length; i++) if (r[i] === undefined) r[i] = '';
    rows[rn - 1] = r;
  });
  for (let i = 0; i < rows.length; i++) if (!rows[i]) rows[i] = [];
  return rows;
}
function tablo(ws) {
  const rows = sheetRows(ws);
  if (!rows.length) return [];
  const h = rows[0].map(x => x.trim());
  return rows.slice(1).filter(r => r.some(x => x)).map(r => { const o = {}; h.forEach((k, i) => { if (k) o[k] = r[i] || ''; }); return o; });
}

async function load(file) {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(file);
  const data = L.yeniVeri();
  const ayar = wb.getWorksheet('Ayarlar');
  if (!ayar) throw new Error('Bu dosya bir Kulüp Takip veri dosyası değil ("Ayarlar" sayfası yok).');
  const st = data.settings;
  for (const r of sheetRows(ayar).slice(1)) {
    const k = (r[0] || '').trim(), v = (r[1] || '').trim();
    switch (k) {
      case 'Okul': st.okul = v; break;
      case 'Sınıf': st.sinif = v; break;
      case 'Öğretmen': st.ogretmen = v; break;
      case 'Kulüp': st.kulup = v || 'Kulüp'; break;
      case 'Müdür': st.mudur = v; break;
      case 'Eğitim Yılı': { const y = parseInt(v, 10); if (y) st.yil = y; break; }
      case 'Aylık Ücret': st.ucret = num(v); break;
      case 'Kardeş İndirimi %': st.kardesIndirim = num(v); break;
      case 'Başlangıç Ayı': st.baslangicAy = ay(v); break;
      case 'Son Ödeme Günü': st.sonOdemeGunu = parseInt(v, 10) || 10; break;
    }
  }
  const og = wb.getWorksheet('Ogrenciler');
  if (og) for (const r of tablo(og)) {
    const id = parseInt(r.Id, 10); if (!id) continue;
    data.students.push({
      id, no: r.No || '', adSoyad: r.AdSoyad || '', veliAd: r.VeliAd || '', veliTel: r.VeliTel || '',
      kardes: bool(r.KardesVar), kardesAd: r.KardesAd || '', kardesSinif: r.KardesSinif || '', burslu: bool(r.Burslu),
      baslangicAy: ay(r.BaslangicAy || ''), bitisAy: ay(r.BitisAy || ''), not: r.Not || ''
    });
  }
  const od = wb.getWorksheet('Odemeler');
  if (od) for (const r of tablo(od)) {
    const id = parseInt(r.Id, 10), oid = parseInt(r.OgrenciId, 10); if (!id || !oid) continue;
    data.payments.push({ id, ogrenciId: oid, ay: ay(r.Ay), tutar: num(r.Tutar), tarih: tarih(r.Tarih), not: r.Not || '' });
  }
  const au = wb.getWorksheet('AylikUcret');
  if (au) for (const r of tablo(au)) { const a = ay(r.Ay); if (a) data.monthFees[a] = num(r.Ucret); }
  const yk = wb.getWorksheet('Yoklama');
  if (yk) for (const r of tablo(yk)) {
    const t = tarih(r.Tarih), oid = parseInt(r.OgrenciId, 10);
    if (t && oid && r.Durum) data.attendance[`${t}|${oid}`] = r.Durum;
  }
  const ku = wb.getWorksheet('Kullanici');
  if (ku) for (const r of tablo(ku)) if (r.KullaniciAdi) data.users.push({ ad: r.KullaniciAdi, salt: r.Salt, hash: r.Hash, kurtarmaSalt: r.KurtarmaSalt, kurtarmaHash: r.KurtarmaHash });
  return data;
}

const HEAD = { font: { bold: true, color: { argb: 'FFFFFFFF' } }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4E79' } } };
function headRow(ws, cols) {
  ws.addRow(cols);
  const r = ws.getRow(1);
  r.eachCell(c => { c.font = HEAD.font; c.fill = HEAD.fill; });
  ws.views = [{ state: 'frozen', ySplit: 1 }];
}

async function save(file, data) {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Kulüp Takip';
  const st = data.settings;
  const a = wb.addWorksheet('Ayarlar');
  headRow(a, ['Anahtar', 'Değer']);
  [['Okul', st.okul], ['Sınıf', st.sinif], ['Öğretmen', st.ogretmen], ['Kulüp', st.kulup], ['Müdür', st.mudur],
   ['Eğitim Yılı', `${st.yil}-${st.yil + 1}`], ['Aylık Ücret', String(st.ucret)], ['Kardeş İndirimi %', String(st.kardesIndirim)],
   ['Başlangıç Ayı', st.baslangicAy || ''], ['Son Ödeme Günü', String(st.sonOdemeGunu || 10)]].forEach(r => a.addRow(r));
  a.addRow([]);
  a.addRow(['Bu dosya Kulüp Takip programı tarafından yönetilir. Program açıkken bu dosyayı Excel\'de düzenlemeyin.']);
  a.getColumn(1).width = 22; a.getColumn(2).width = 40;

  const o = wb.addWorksheet('Ogrenciler');
  headRow(o, ['Id', 'No', 'AdSoyad', 'VeliAd', 'VeliTel', 'KardesVar', 'KardesAd', 'KardesSinif', 'Burslu', 'BaslangicAy', 'BitisAy', 'Not']);
  for (const s of L.sirala(data.students))
    o.addRow([s.id, s.no || '', s.adSoyad, s.veliAd || '', s.veliTel || '', s.kardes ? 'Evet' : 'Hayır', s.kardesAd || '', s.kardesSinif || '', s.burslu ? 'Evet' : 'Hayır', s.baslangicAy || '', s.bitisAy || '', s.not || '']);
  [6, 8, 28, 22, 16, 10, 20, 12, 8, 12, 12, 24].forEach((w, i) => o.getColumn(i + 1).width = w);

  const ad = id => { const s = data.students.find(x => x.id === id); return s ? s.adSoyad : ''; };
  const p = wb.addWorksheet('Odemeler');
  headRow(p, ['Id', 'OgrenciId', 'Ogrenci', 'Ay', 'Tutar', 'Tarih', 'Not']);
  for (const x of data.payments.slice().sort((a, b) => a.id - b.id)) p.addRow([x.id, x.ogrenciId, ad(x.ogrenciId), x.ay, x.tutar, x.tarih, x.not || '']);
  p.getColumn(5).numFmt = '#,##0.00 "₺"';
  [6, 10, 28, 10, 14, 12, 24].forEach((w, i) => p.getColumn(i + 1).width = w);

  const u = wb.addWorksheet('AylikUcret');
  headRow(u, ['Ay', 'Ucret']);
  Object.keys(data.monthFees).sort().forEach(k => u.addRow([k, Number(data.monthFees[k])]));
  u.getColumn(2).numFmt = '#,##0.00 "₺"'; u.getColumn(2).width = 14;

  const y = wb.addWorksheet('Yoklama');
  headRow(y, ['Tarih', 'OgrenciId', 'Ogrenci', 'Durum']);
  Object.keys(data.attendance).sort().forEach(k => { const [t, id] = k.split('|'); y.addRow([t, +id, ad(+id), data.attendance[k]]); });
  [12, 10, 28, 12].forEach((w, i) => y.getColumn(i + 1).width = w);

  const k = wb.addWorksheet('Kullanici', { state: 'hidden' });
  headRow(k, ['KullaniciAdi', 'Salt', 'Hash', 'KurtarmaSalt', 'KurtarmaHash']);
  for (const x of data.users || []) k.addRow([x.ad, x.salt, x.hash, x.kurtarmaSalt || '', x.kurtarmaHash || '']);

  const tmp = file + '.tmp';
  await wb.xlsx.writeFile(tmp);
  try {
    if (fs.existsSync(file)) {
      const yd = path.join(path.dirname(file), 'Yedekler');
      fs.mkdirSync(yd, { recursive: true });
      const yedek = path.join(yd, `KulupVerileri_${L.gunKey(L.bugun())}.xlsx`);
      if (!fs.existsSync(yedek)) {
        fs.copyFileSync(file, yedek);
        const eski = fs.readdirSync(yd).filter(f => /^KulupVerileri_.*\.xlsx$/.test(f)).sort().reverse().slice(60);
        for (const f of eski) try { fs.unlinkSync(path.join(yd, f)); } catch (e) { /* yoksay */ }
      }
    }
    fs.copyFileSync(tmp, file);
  } finally {
    try { fs.unlinkSync(tmp); } catch (e) { /* yoksay */ }
  }
}

async function readFirstSheet(file) {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(file);
  const ws = wb.worksheets.find(w => w.rowCount > 0) || wb.worksheets[0];
  return ws ? sheetRows(ws) : [];
}

async function writeTemplate(file) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Öğrenciler');
  headRow(ws, ['Okul No', 'Adı Soyadı', 'Veli Adı', 'Veli Telefonu', 'Kardeş (Evet/Hayır)', 'Kardeşinin Adı', 'Kardeşinin Sınıfı', 'Burslu (Evet/Hayır)']);
  [10, 28, 22, 16, 14, 22, 14, 14].forEach((w, i) => ws.getColumn(i + 1).width = w);
  await wb.xlsx.writeFile(file);
}

// ---------- Rapor modelini Excel'e aktar ----------
const FILL = { ok: 'FFC6EFCE', bad: 'FFFFC7CE', warn: 'FFFFEB9C', muted: 'FFEDEDED', head: 'FFD9E1F2', total: 'FFEDEDED', hl: 'FFC6EFCE' };
const BORDER = { top: { style: 'thin', color: { argb: 'FF999999' } }, left: { style: 'thin', color: { argb: 'FF999999' } }, bottom: { style: 'thin', color: { argb: 'FF999999' } }, right: { style: 'thin', color: { argb: 'FF999999' } } };
const MONEY = '#,##0.00 "₺"';

function cellVal(c) { return c && typeof c === 'object' && !(c instanceof Date) ? c : { v: c }; }

function sheetFrom(wb, model, settings, name) {
  const ws = wb.addWorksheet(name.slice(0, 31).replace(/[[\]:*?/\\]/g, ' '), {
    pageSetup: { paperSize: 9, orientation: model.landscape ? 'landscape' : 'portrait', fitToPage: true, fitToWidth: 1, fitToHeight: 0, margins: { left: 0.4, right: 0.4, top: 0.5, bottom: 0.5, header: 0.3, footer: 0.3 } }
  });
  const ncol = Math.max(2, ...model.blocks.filter(b => b.type === 'table').map(b => b.columns.length), 4);
  const title = (txt, size, bold, italic) => {
    const r = ws.addRow([txt]); ws.mergeCells(r.number, 1, r.number, ncol);
    r.getCell(1).font = { bold, italic, size }; r.getCell(1).alignment = { horizontal: italic ? 'left' : 'center' };
  };
  title(settings.okul.toLocaleUpperCase('tr-TR'), 14, true);
  title(`${settings.kulup} • ${settings.sinif} Sınıfı • ${settings.yil}-${settings.yil + 1} Eğitim-Öğretim Yılı`, 11, true);
  title(model.title, 12, true);
  if (model.subtitle) title(model.subtitle + `   •   Sınıf Öğretmeni: ${settings.ogretmen}`, 9, false, true);
  ws.addRow([]);
  const widths = new Array(ncol).fill(10);
  for (const b of model.blocks) {
    if (b.type === 'table') {
      if (b.title) { const r = ws.addRow([b.title]); r.getCell(1).font = { bold: true, size: 11 }; }
      const hr = ws.addRow(b.columns.map(c => c.label.replace(/\n/g, ' ')));
      hr.eachCell(c => { c.font = { bold: true }; c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: FILL.head } }; c.border = BORDER; c.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }; });
      b.columns.forEach((c, i) => { widths[i] = Math.max(widths[i], c.xw || Math.min(40, Math.max(6, c.label.length + 2))); });
      const put = (cells, isFoot) => {
        const r = ws.addRow(cells.map(x => { const c = cellVal(x); return c.v === '' || c.v === undefined ? null : c.v; }));
        cells.forEach((x, i) => {
          const c = cellVal(x), cell = r.getCell(i + 1), col = b.columns[i] || {};
          cell.border = BORDER;
          if (col.money && typeof c.v === 'number') cell.numFmt = MONEY;
          const cls = isFoot ? (c.cls === 'hl' ? 'hl' : 'total') : c.cls;
          if (cls && FILL[cls]) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: FILL[cls] } };
          if (isFoot || c.bold) cell.font = { bold: true };
          cell.alignment = { horizontal: col.align === 'right' ? 'right' : col.align === 'center' ? 'center' : 'left', vertical: 'middle' };
          if (!col.money && typeof c.v === 'string') widths[i] = Math.max(widths[i], Math.min(40, c.v.length + 2));
        });
        if (isFoot && b.footSpan) ws.mergeCells(r.number, 1, r.number, b.footSpan);
      };
      for (const row of b.rows) put(row.cells || row, false);
      for (const f of b.foot || []) put(f, true);
      ws.addRow([]);
    } else if (b.type === 'summary') {
      if (b.title) { const r = ws.addRow([b.title]); r.getCell(1).font = { bold: true, size: 11 }; }
      for (const it of b.items) {
        const r = ws.addRow([it[0], null, null, typeof it[1] === 'object' ? it[1].v : it[1]]);
        ws.mergeCells(r.number, 1, r.number, 3);
        r.getCell(1).font = { bold: true }; r.getCell(1).border = BORDER; r.getCell(4).border = BORDER;
        r.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: FILL.total } };
        if (it.money || (typeof it[1] === 'number' && it[2] !== 'count')) r.getCell(4).numFmt = MONEY;
        r.getCell(4).font = { bold: true, size: it[2] === 'hl' ? 12 : 11 };
        if (it[2] === 'hl') r.getCell(4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: FILL.hl } };
      }
      ws.addRow([]);
    } else if (b.type === 'note') {
      const r = ws.addRow([b.text]); ws.mergeCells(r.number, 1, r.number, ncol);
      r.getCell(1).font = { italic: true, size: 9, color: { argb: 'FF595959' } }; r.getCell(1).alignment = { wrapText: true };
    } else if (b.type === 'letter') {
      for (const line of b.lines) { const r = ws.addRow([line]); ws.mergeCells(r.number, 1, r.number, ncol); r.getCell(1).alignment = { wrapText: true }; }
      ws.addRow([]);
    }
  }
  if (model.signatures) {
    ws.addRow([]);
    const half = Math.max(1, Math.floor(ncol / 2));
    const sig = (l, rr) => { const r = ws.addRow([]); r.getCell(1).value = l; r.getCell(half + 1).value = rr; ws.mergeCells(r.number, 1, r.number, half); ws.mergeCells(r.number, half + 1, r.number, ncol); r.getCell(1).alignment = r.getCell(half + 1).alignment = { horizontal: 'center' }; return r; };
    const r1 = sig(model.signatures[0], model.signatures[1]); r1.font = { bold: true };
    sig(settings.ogretmen, settings.mudur || '');
    sig('Sınıf Öğretmeni', 'Okul Müdürü');
    ws.addRow([]);
    sig('İmza: ......................', 'İmza: ......................');
  }
  widths.forEach((w, i) => { ws.getColumn(i + 1).width = w; });
}

async function exportReport(file, models, settings) {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Kulüp Takip';
  const used = new Set();
  for (const m of models) {
    let n = (m.sheet || m.title).slice(0, 28), i = 2;
    while (used.has(n.toLowerCase())) n = (m.sheet || m.title).slice(0, 26) + ' ' + i++;
    used.add(n.toLowerCase());
    sheetFrom(wb, m, settings, n);
  }
  await wb.xlsx.writeFile(file);
}

module.exports = { load, save, readFirstSheet, writeTemplate, exportReport };
