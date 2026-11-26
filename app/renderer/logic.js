/* Kulüp Takip - hesaplama çekirdeği (tarayıcı ve Node ortak) */
(function (root, factory) {
  const L = factory();
  if (typeof module === 'object' && module.exports) module.exports = L;
  else root.L = L;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const AYLAR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
  const GUNLER = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
  const GUNLER_KISA = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
  const DURUMLAR = ['Geldi', 'Gelmedi', 'İzinli', 'Raporlu'];
  const KISA = { 'Geldi': 'G', 'Gelmedi': 'Y', 'İzinli': 'İ', 'Raporlu': 'R' };

  const pad = n => String(n).padStart(2, '0');
  const gunKey = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const ayKey = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
  function parseGun(s) { const [y, m, d] = String(s).split('-').map(Number); return new Date(y, (m || 1) - 1, d || 1); }
  function parseAy(s) { const [y, m] = String(s).split('-').map(Number); return new Date(y, (m || 1) - 1, 1); }
  function bugun() { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
  function ayAd(ay) { if (!ay) return ''; const d = parseAy(ay); return isNaN(d) ? ay : `${AYLAR[d.getMonth()]} ${d.getFullYear()}`; }
  function addMonths(ay, n) { const d = parseAy(ay); d.setMonth(d.getMonth() + n); return ayKey(d); }
  function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
  function ayGunSayisi(ay) { const d = parseAy(ay); return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate(); }
  function yilAylari(y) { const l = []; for (let i = 0; i < 12; i++) l.push(addMonths(`${y}-09`, i)); return l; }
  function varsayilanYil(t) { t = t || bugun(); return t.getMonth() >= 8 ? t.getFullYear() : t.getFullYear() - 1; }
  function trTarih(g) { if (!g) return ''; const d = typeof g === 'string' ? parseGun(g) : g; return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`; }
  function tarihUzun(d) { d = typeof d === 'string' ? parseGun(d) : d; return `${d.getDate()} ${AYLAR[d.getMonth()]} ${d.getFullYear()} ${GUNLER[d.getDay()]}`; }
  function haftaBasi(d) { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); const diff = (x.getDay() + 6) % 7; return addDays(x, -diff); }
  function gunFarki(a, b) { return Math.round((b - a) / 86400000); }
  const r2 = v => Math.round((Number(v) || 0) * 100) / 100;
  const fmt = new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const para = v => fmt.format(r2(v)) + ' ₺';
  function parsePara(s) {
    if (typeof s === 'number') return isFinite(s) ? s : NaN;
    s = String(s == null ? '' : s).replace(/₺|TL|tl|\s/g, '').trim();
    if (s === '') return 0;
    if (s.includes(',') && s.includes('.')) s = s.replace(/\./g, '').replace(',', '.');
    else if (s.includes(',')) s = s.replace(',', '.');
    if (!/^-?\d+(\.\d+)?$/.test(s)) return NaN;
    return parseFloat(s);
  }
  function norm(s) {
    s = String(s == null ? '' : s).trim().toLocaleLowerCase('tr-TR');
    const map = { 'ı': 'i', 'ş': 's', 'ğ': 'g', 'ü': 'u', 'ö': 'o', 'ç': 'c', 'â': 'a', 'î': 'i', 'û': 'u', 'i̇': 'i' };
    let o = '';
    for (const ch of s) o += map[ch] !== undefined ? map[ch] : (/[\p{L}\p{N}]/u.test(ch) ? ch : ' ');
    return o.replace(/̇/g, '').split(' ').filter(Boolean).join(' ');
  }
  const trCmp = new Intl.Collator('tr-TR', { sensitivity: 'base' }).compare;

  function yeniVeri() {
    return {
      settings: {
        okul: '', sinif: '', ogretmen: '', kulup: 'Kulüp', mudur: '', yil: varsayilanYil(),
        ucret: 0, kardesIndirim: 50, baslangicAy: '', sonOdemeGunu: 10
      },
      users: [], students: [], payments: [], monthFees: {}, attendance: {}
    };
  }

  // ---------- öğrenci / ücret ----------
  function ilkAy(data) { return data.settings.baslangicAy || `${data.settings.yil}-09`; }
  function aktif(s, ay) {
    if (s.baslangicAy && ay < s.baslangicAy) return false;
    if (s.bitisAy && ay > s.bitisAy) return false;
    return true;
  }
  function ayinUcreti(data, ay) {
    const u = data.monthFees[ay];
    return u !== undefined && u !== null && u !== '' ? Number(u) : Number(data.settings.ucret) || 0;
  }
  function turUcreti(data, s, ay) {
    if (s.burslu) return 0;
    const u = ayinUcreti(data, ay);
    return s.kardes ? r2(u * (100 - (Number(data.settings.kardesIndirim) || 0)) / 100) : u;
  }
  function borc(data, s, ay) { return aktif(s, ay) ? turUcreti(data, s, ay) : 0; }
  function indirim(data, s, ay) { return aktif(s, ay) ? r2(ayinUcreti(data, ay) - turUcreti(data, s, ay)) : 0; }
  function tur(data, s) {
    if (s.burslu) return 'Burslu';
    if (s.kardes) return `Kardeş %${Number(data.settings.kardesIndirim) || 0}`;
    return 'Normal';
  }
  function odemeler(data, id, ay) { return data.payments.filter(p => p.ogrenciId === id && (ay === undefined || p.ay === ay)); }
  function odenen(data, id, ay) { let t = 0; for (const p of data.payments) if (p.ogrenciId === id && p.ay === ay) t += Number(p.tutar) || 0; return r2(t); }
  function sonOdemeGunuTarihi(data, id, ay) { let t = ''; for (const p of data.payments) if (p.ogrenciId === id && p.ay === ay && p.tarih > t) t = p.tarih; return t; }
  function sonOdemeTarihi(data, ay) {
    const g = Math.min(Math.max(1, Number(data.settings.sonOdemeGunu) || 10), ayGunSayisi(ay));
    const d = parseAy(ay); d.setDate(g); return d;
  }

  // Ödeme durumu: kod = odendi | fazla | kismi | odenmedi | gecikti | burslu | ucretsiz | kayitdisi
  function durum(data, s, ay, today) {
    today = today || bugun();
    const b = borc(data, s, ay), o = odenen(data, s.id, ay);
    if (!aktif(s, ay)) return { kod: 'kayitdisi', text: o ? 'Kayıt dışı (ödeme var)' : 'Kulüpte değil', kalan: 0 };
    if (b === 0) return s.burslu ? { kod: 'burslu', text: 'Burslu', kalan: 0 } : { kod: 'ucretsiz', text: 'Ücret yok', kalan: 0 };
    const kalan = r2(Math.max(0, b - o));
    if (o >= b) return o > b ? { kod: 'fazla', text: 'Ödendi (+' + para(o - b) + ')', kalan: 0 } : { kod: 'odendi', text: 'Ödendi', kalan: 0 };
    const son = sonOdemeTarihi(data, ay);
    const gec = gunFarki(son, today);
    if (gec > 0) return { kod: 'gecikti', text: (o > 0 ? 'Eksik' : 'Ödenmedi') + ` • ${gec} gün gecikti`, kalan, gecikme: gec, kismi: o > 0 };
    if (o > 0) return { kod: 'kismi', text: 'Kısmi ödeme', kalan };
    return { kod: 'odenmedi', text: 'Ödenmedi', kalan, kalanGun: -gec };
  }
  const odendiMi = k => k === 'odendi' || k === 'fazla';

  function sirala(list) {
    return list.slice().sort((a, b) => {
      const na = parseInt(a.no, 10), nb = parseInt(b.no, 10);
      const va = isNaN(na) ? 1e9 : na, vb = isNaN(nb) ? 1e9 : nb;
      return va !== vb ? va - vb : trCmp(a.adSoyad, b.adSoyad);
    });
  }
  function aktifler(data, ay) { return sirala(data.students.filter(s => aktif(s, ay))); }
  function devamEdenler(data) { return sirala(data.students.filter(s => !s.bitisAy)); }

  function ozetAy(data, ay, today) {
    const akt = aktifler(data, ay);
    const o = { ay, ogrenci: akt.length, normal: 0, kardes: 0, burslu: 0, borc: 0, tahsil: 0, kalan: 0, kardesInd: 0, bursMuaf: 0, odeyen: 0, kismi: 0, odemeyen: 0, geciken: 0, ucretli: 0, ucret: ayinUcreti(data, ay) };
    for (const s of akt) {
      const b = borc(data, s, ay), od = odenen(data, s.id, ay), d = durum(data, s, ay, today);
      o.borc += b; o.kalan += Math.max(0, b - od);
      if (s.burslu) { o.burslu++; o.bursMuaf += ayinUcreti(data, ay); } else if (s.kardes) { o.kardes++; o.kardesInd += indirim(data, s, ay); } else o.normal++;
      if (b > 0) o.ucretli++;
      if (odendiMi(d.kod)) o.odeyen++;
      else if (d.kod === 'kismi' || (d.kod === 'gecikti' && d.kismi)) o.kismi++;
      else if (d.kod === 'odenmedi' || d.kod === 'gecikti') o.odemeyen++;
      if (d.kod === 'gecikti') o.geciken++;
    }
    for (const p of data.payments) if (p.ay === ay) o.tahsil += Number(p.tutar) || 0;
    ['borc', 'tahsil', 'kalan', 'kardesInd', 'bursMuaf'].forEach(k => o[k] = r2(o[k]));
    return o;
  }

  // Yıl başından bugüne kadar son ödeme tarihi geçmiş ve borcu kalan öğrenciler
  function gecikenler(data, today) {
    today = today || bugun();
    const res = [];
    const aylar = yilAylari(data.settings.yil).filter(a => a >= ilkAy(data) && a <= ayKey(today));
    for (const s of sirala(data.students)) {
      const l = [];
      for (const a of aylar) {
        const d = durum(data, s, a, today);
        if (d.kod === 'gecikti') l.push({ ay: a, kalan: d.kalan, gecikme: d.gecikme });
      }
      if (l.length) res.push({ s, aylar: l, toplam: r2(l.reduce((t, x) => t + x.kalan, 0)) });
    }
    return res.sort((a, b) => b.toplam - a.toplam);
  }
  // Son ödeme tarihine `gun` gün veya daha az kalan, henüz ödemeyenler
  function yaklasanlar(data, today, gun) {
    today = today || bugun(); gun = gun == null ? 5 : gun;
    const ay = ayKey(today), son = sonOdemeTarihi(data, ay), kalanGun = gunFarki(today, son);
    if (kalanGun < 0 || kalanGun > gun) return { ay, son, kalanGun, liste: [] };
    const liste = aktifler(data, ay).filter(s => { const d = durum(data, s, ay, today); return d.kod === 'odenmedi' || d.kod === 'kismi'; });
    return { ay, son, kalanGun, liste };
  }

  // ---------- yoklama ----------
  const yoklama = (data, gun, id) => data.attendance[`${gun}|${id}`] || '';
  function yoklamaYaz(data, gun, id, d) { const k = `${gun}|${id}`; if (d) data.attendance[k] = d; else delete data.attendance[k]; }
  function gunKayitli(data, gun) { const p = gun + '|'; return Object.keys(data.attendance).some(k => k.startsWith(p)); }
  function devamsizlik(data, id, ay) {
    let n = 0; const p = ay + '-', e = '|' + id;
    for (const k in data.attendance) if (data.attendance[k] === 'Gelmedi' && k.startsWith(p) && k.endsWith(e)) n++;
    return n;
  }
  function yoklamaSay(data, gun, list) {
    const c = { Geldi: 0, Gelmedi: 0, 'İzinli': 0, Raporlu: 0, bos: 0 };
    for (const s of list) { const d = yoklama(data, gun, s.id); if (d) c[d]++; else c.bos++; }
    return c;
  }

  function raporAylari(data, sonAy) {
    const res = [];
    for (const a of yilAylari(data.settings.yil)) {
      if (a > sonAy) break;
      const odemeVar = data.payments.some(p => p.ay === a);
      if (a < ilkAy(data) && !odemeVar) continue;
      if ((a.endsWith('-07') || a.endsWith('-08')) && data.monthFees[a] === undefined && !odemeVar) continue;
      res.push(a);
    }
    return res.length ? res : [sonAy];
  }

  function yeniId(list) { return list.reduce((m, x) => Math.max(m, x.id || 0), 0) + 1; }
  function odemeEkle(data, ogrenciId, ay, tutar, tarih, not) {
    const p = { id: yeniId(data.payments), ogrenciId, ay, tutar: r2(tutar), tarih: tarih || gunKey(bugun()), not: not || '' };
    data.payments.push(p); return p;
  }
  // Ayrılan öğrenci: ayrılış ayından sonraki yoklama/ödeme kayıtları temizlenir, öncekiler kalır
  function ayrildiIsaretle(data, s, sonAy) {
    s.bitisAy = sonAy;
    for (const k of Object.keys(data.attendance)) { const [g, id] = k.split('|'); if (+id === s.id && g.slice(0, 7) > sonAy) delete data.attendance[k]; }
  }
  function tamamenSil(data, id) {
    data.students = data.students.filter(s => s.id !== id);
    data.payments = data.payments.filter(p => p.ogrenciId !== id);
    for (const k of Object.keys(data.attendance)) if (k.endsWith('|' + id)) delete data.attendance[k];
  }

  // ---------- içe aktarma ----------
  const evet = s => ['evet', 'e', 'var', 'x', '1', 'true', 'dogru', 'burslu'].includes(norm(s));
  const hayir = s => ['', 'hayir', 'h', 'yok', '0', 'false', '-'].includes(norm(s));
  const temiz = s => String(s == null ? '' : s).split(/\s+/).filter(Boolean).join(' ');

  function satirlardanOgrenci(rows) {
    const res = { ogrenciler: [], bilgi: '' };
    rows = rows.map(r => (r || []).map(c => c == null ? '' : String(c).trim()));
    let hr = -1, c = {};
    for (let ri = 0; ri < Math.min(20, rows.length) && hr < 0; ri++) {
      const t = { no: -1, ad: -1, soyad: -1, adSoyad: -1, veli: -1, tel: -1, kardes: -1, kardesAd: -1, kardesSinif: -1, burs: -1 };
      rows[ri].forEach((cell, ci) => {
        const h = norm(cell); if (!h) return;
        if (h.includes('kardes')) { if (h.includes('sinif')) t.kardesSinif = ci; else if (h.includes('ad') || h.includes('isim')) t.kardesAd = ci; else t.kardes = ci; }
        else if (h.includes('burs')) t.burs = ci;
        else if (h.includes('tel') || h.includes('gsm') || h.includes('cep')) t.tel = ci;
        else if (h.includes('veli') || h.includes('anne') || h.includes('baba')) { if (t.veli < 0) t.veli = ci; }
        else if (h.includes('sira') || h === 's no' || h === 'sn') { /* sıra no atla */ }
        else if ((h.includes('ad') && h.includes('soyad')) || h.includes('isim') || h === 'ogrenci' || h.includes('ogrencinin')) t.adSoyad = ci;
        else if (h.includes('soyad')) t.soyad = ci;
        else if (h === 'ad' || h === 'adi' || h.endsWith(' adi')) t.ad = ci;
        else if (h === 'no' || h.includes('numara') || h.endsWith(' no') || h.startsWith('no ')) t.no = ci;
      });
      if (t.adSoyad >= 0 || t.ad >= 0) { hr = ri; c = t; }
    }
    let start = 0;
    if (hr < 0) {
      const ilk = rows.find(r => r.some(x => x));
      c = { no: -1, adSoyad: 0, soyad: -1, ad: -1, veli: -1, tel: -1, kardes: -1, kardesAd: -1, kardesSinif: -1, burs: -1 };
      if (ilk && ilk.length > 1 && /^\d+$/.test(ilk[0])) { c.no = 0; c.adSoyad = 1; }
      res.bilgi = 'Başlık satırı bulunamadı; ' + (c.no === 0 ? 'A sütunu numara, B sütunu ad soyad' : 'A sütunu ad soyad') + ' kabul edildi. ';
    } else start = hr + 1;
    const g = (r, i) => (i >= 0 && i < r.length ? r[i] : '');
    for (let ri = start; ri < rows.length; ri++) {
      const r = rows[ri];
      let ad = c.adSoyad >= 0 ? g(r, c.adSoyad) : `${g(r, c.ad)} ${g(r, c.soyad)}`;
      if (c.adSoyad >= 0 && c.soyad >= 0 && c.soyad !== c.adSoyad && g(r, c.soyad)) ad += ' ' + g(r, c.soyad);
      ad = temiz(ad);
      if (!ad || /^\d+$/.test(ad)) continue;
      const na = norm(ad); if (na.includes('toplam') || na.includes('adi soyadi')) continue;
      const s = { adSoyad: ad, no: g(r, c.no).replace(/\.0$/, ''), veliAd: g(r, c.veli), veliTel: g(r, c.tel), kardes: false, kardesAd: '', kardesSinif: '', burslu: false };
      const k = g(r, c.kardes), kAd = g(r, c.kardesAd), kS = g(r, c.kardesSinif);
      if (c.kardes >= 0 && !hayir(k)) { s.kardes = true; if (!evet(k)) s.kardesAd = k; }
      if (kAd && !hayir(kAd)) { s.kardes = true; s.kardesAd = kAd; }
      if (kS && !hayir(kS)) { s.kardes = true; s.kardesSinif = kS; }
      s.burslu = c.burs >= 0 && evet(g(r, c.burs));
      res.ogrenciler.push(s);
    }
    if (!res.ogrenciler.length) res.bilgi += 'Öğrenci adı içeren satır bulunamadı.';
    return res;
  }

  function metindenOgrenci(text) {
    const l = [];
    for (let line of String(text).split(/\r?\n/)) {
      line = line.trim(); if (!line) continue;
      let no = '';
      const parts = line.split(/[\t;]/).map(x => x.trim()).filter(Boolean);
      if (parts.length >= 2 && /^\d+$/.test(parts[0])) { no = parts[0]; line = parts[1]; }
      else { const m = line.match(/^(\d+)[.\-)]?\s+(.+)$/); if (m) { no = m[1]; line = m[2]; } }
      line = temiz(line);
      if (line) l.push({ no, adSoyad: line, veliAd: '', veliTel: '', kardes: false, kardesAd: '', kardesSinif: '', burslu: false });
    }
    return l;
  }

  function sinifListesi() {
    const l = ['Anasınıfı-A', 'Anasınıfı-B', 'Anasınıfı-C'];
    for (let s = 1; s <= 8; s++) for (const c of 'ABCDEFGH') l.push(`${s}-${c}`);
    return l;
  }

  return {
    AYLAR, GUNLER, GUNLER_KISA, DURUMLAR, KISA, pad, gunKey, ayKey, parseGun, parseAy, bugun, ayAd, addMonths, addDays, ayGunSayisi,
    yilAylari, varsayilanYil, trTarih, tarihUzun, haftaBasi, gunFarki, r2, para, parsePara, norm, trCmp, yeniVeri,
    ilkAy, aktif, ayinUcreti, turUcreti, borc, indirim, tur, odemeler, odenen, sonOdemeGunuTarihi, sonOdemeTarihi, durum, odendiMi,
    sirala, aktifler, devamEdenler, ozetAy, gecikenler, yaklasanlar, yoklama, yoklamaYaz, gunKayitli, devamsizlik, yoklamaSay,
    raporAylari, yeniId, odemeEkle, ayrildiIsaretle, tamamenSil, satirlardanOgrenci, metindenOgrenci, sinifListesi
  };
});
