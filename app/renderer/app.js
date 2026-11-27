/* Kulüp Takip - arayüz */
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const SMOKE = new URLSearchParams(location.search).has('smoke');
let D = null, INFO = null, USER = '', PAGE = 'panel', PARAMS = {}, UPD = { durum: '' };
const today = () => L.bugun();
const bugunKey = () => L.gunKey(today());

// ---------------- simgeler ----------------
const P = {
  home: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z',
  users: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
  check: 'M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11',
  wallet: 'M20 7H5a2 2 0 0 1 0-4h13v4M3 5v14a2 2 0 0 0 2 2h15V7M16 14h.01',
  file: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8',
  cog: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z',
  plus: 'M12 5v14M5 12h14', upload: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12',
  download: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3', printer: 'M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z',
  pdf: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M9 15h6', table: 'M3 3h18v18H3zM3 9h18M3 15h18M9 3v18',
  left: 'M15 18l-6-6 6-6', right: 'M9 18l6-6-6-6', cal: 'M3 6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM16 2v4M8 2v4M3 10h18',
  alert: 'M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01',
  bell: 'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0', out: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9',
  edit: 'M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z', trash: 'M3 6h18M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6M9 6V4h6v2',
  refresh: 'M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15', folder: 'M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z',
  lock: 'M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4', coin: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM15 9.5c-.5-1-1.6-1.5-3-1.5-1.7 0-3 .8-3 2s1.3 1.7 3 2 3 .8 3 2-1.3 2-3 2c-1.4 0-2.5-.5-3-1.5M12 6v2M12 16v2',
  clip: 'M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2M9 2h6v4H9zM9 12h6M9 16h6', star: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z',
  mail: 'M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM22 6l-10 7L2 6', receipt: 'M4 2v20l3-2 3 2 3-2 3 2 3-2 2 2V2l-2 2-3-2-3 2-3-2-3 2zM8 8h8M8 12h8M8 16h5',
  ok: 'M20 6 9 17l-5-5', x: 'M18 6 6 18M6 6l12 12', userx: 'M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M8.5 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM18 8l5 5M23 8l-5 5'
};
const ic = (n, cls) => `<svg class="${cls || ''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${P[n] || ''}"/></svg>`;
const RENK = { blue: ['#e7f0fc', '#3a7bd5'], green: ['#e3f5ea', '#2f9e5d'], orange: ['#fdebd6', '#e8862a'], purple: ['#f1e9fb', '#9b6bd6'], red: ['#fdeceb', '#e1544b'], teal: ['#dff4f4', '#1fa2a8'], gray: ['#eeece7', '#6f7889'] };
const icTile = (n, r) => `<span class="ic" style="--icb:${RENK[r][0]};--icc:${RENK[r][1]}">${ic(n)}</span>`;
const AV = ['#3a7bd5', '#2f9e5d', '#e8862a', '#9b6bd6', '#e1544b', '#1fa2a8', '#d4568c', '#6b7fd7'];
const avatar = s => { const p = s.adSoyad.split(' ').filter(Boolean); const h = [...s.adSoyad].reduce((a, c) => a + c.charCodeAt(0), 0); return `<span class="avatar" style="background:${AV[h % AV.length]}">${esc(((p[0] || '?')[0] + (p.length > 1 ? p[p.length - 1][0] : '')).toLocaleUpperCase('tr-TR'))}</span>`; };

// ---------------- yardımcılar ----------------
function toast(msg, cls, ms) { const t = document.createElement('div'); t.className = 'toast ' + (cls || ''); t.textContent = msg; $('#toasts').appendChild(t); setTimeout(() => t.remove(), ms || 4200); }
function modal(title, body, buttons, opts) {
  opts = opts || {};
  return new Promise(res => {
    const ov = document.createElement('div'); ov.className = 'ov';
    ov.innerHTML = `<div class="modal ${opts.wide ? 'wide' : ''}"><header>${esc(title)}</header><div class="mb">${body}</div><footer></footer></div>`;
    const ft = $('footer', ov);
    const kapat = v => { ov.remove(); res(v); };
    (buttons || [{ t: 'Tamam', cls: 'pri', v: true }]).forEach(b => {
      const el = document.createElement('button'); el.className = 'btn ' + (b.cls || ''); el.innerHTML = (b.ic ? ic(b.ic) : '') + esc(b.t);
      el.onclick = async () => { if (b.check) { const ok = await b.check(ov); if (!ok) return; } kapat(b.v === undefined ? ov : (typeof b.v === 'function' ? b.v(ov) : b.v)); };
      ft.appendChild(el);
    });
    ov.addEventListener('keydown', e => { if (e.key === 'Escape') kapat(null); });
    $('#modalRoot').appendChild(ov);
    if (opts.onOpen) opts.onOpen(ov);
    const f = $('input:not([type=checkbox]),select,textarea', ov); if (f) setTimeout(() => f.focus(), 30);
  });
}
const onayla = (msg, evet, cls) => modal('Emin misiniz?', `<p style="line-height:1.6">${msg}</p>`, [{ t: 'Vazgeç', v: false }, { t: evet || 'Evet', cls: cls || 'pri', v: true }]);
const bilgi = (title, msg) => modal(title, `<p style="line-height:1.6">${msg}</p>`);
const val = (ov, n) => { const e = $(`[name="${n}"]`, ov); return e ? (e.type === 'checkbox' ? e.checked : e.value.trim()) : ''; };
const ayOpts = (sec, aylar) => (aylar || L.yilAylari(D.settings.yil)).map(a => `<option value="${a}" ${a === sec ? 'selected' : ''}>${L.ayAd(a)}</option>`).join('');
const varsAy = () => { const a = L.yilAylari(D.settings.yil), b = L.ayKey(today()); return a.includes(b) ? b : (b < a[0] ? a[0] : a[11]); };
const durumPill = d => `<span class="pill ${({ odendi: 'ok', fazla: 'ok', kismi: 'warn', odenmedi: 'warn', gecikti: 'bad', burslu: 'purple', ucretsiz: 'muted', kayitdisi: 'muted' })[d.kod]}">${esc(d.text)}</span>`;
const turPill = s => s.burslu ? '<span class="pill purple">Burslu</span>' : s.kardes ? `<span class="pill blue">Kardeş %${D.settings.kardesIndirim}</span>` : '<span class="pill muted">Normal</span>';
const saat = () => new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

// ---------------- kayıt ----------------
let saveT = null, saving = false, dirty = false;
function setSave(cls, txt) { const e = $('#saveState'); if (e) { e.className = 'save ' + cls; e.textContent = txt; } }
function degisti() { dirty = true; setSave('busy', 'Kaydediliyor…'); clearTimeout(saveT); saveT = setTimeout(kaydet, 600); rozetler(); }
async function kaydet() {
  if (!dirty) return true;
  if (saving) { clearTimeout(saveT); saveT = setTimeout(kaydet, 400); return false; }
  saving = true; dirty = false;
  const r = await api.save(D);
  saving = false;
  if (r.ok) setSave('ok', '✓ Excel\'e kaydedildi ' + saat());
  else { dirty = true; setSave('err', '⚠ Kaydedilemedi'); toast(r.error, 'err', 7000); clearTimeout(saveT); saveT = setTimeout(kaydet, 5000); }
  return r.ok;
}
window.__kapanis = async () => {
  clearTimeout(saveT);
  if (dirty) { await kaydet(); if (dirty) return await onayla('Son değişiklikler kaydedilemedi (veri dosyası başka programda açık olabilir). Yine de kapatılsın mı?', 'Kaydetmeden Kapat', 'danger'); }
  return true;
};

// ---------------- şifre ----------------
const hex = b => Array.from(b, x => x.toString(16).padStart(2, '0')).join('');
const unhex = h => new Uint8Array((h.match(/../g) || []).map(x => parseInt(x, 16)));
const rastgele = n => hex(crypto.getRandomValues(new Uint8Array(n)));
async function ozet(sifre, salt) {
  const k = await crypto.subtle.importKey('raw', new TextEncoder().encode(sifre), 'PBKDF2', false, ['deriveBits']);
  return hex(new Uint8Array(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: unhex(salt), iterations: 150000 }, k, 256)));
}
const SORULAR = ['Annenizin kızlık soyadı nedir?', 'İlk okulunuzun adı nedir?', 'Doğduğunuz şehir neresidir?', 'İlk evcil hayvanınızın adı nedir?', 'En sevdiğiniz öğretmeninizin adı nedir?', 'Çocukluk lakabınız nedir?'];
const cevapNorm = s => L.norm(s).replace(/\s+/g, '');
async function kullaniciKur(ad, sifre, soru, cevap) {
  const salt = rastgele(16), cs = rastgele(16);
  D.users = [{ ad, salt, hash: await ozet(sifre, salt), soru, cevapSalt: cs, cevapHash: await ozet(cevapNorm(cevap), cs) }];
}
const sifreKontrol = (a, b) => a.length < 4 ? 'Şifre en az 4 karakter olmalı.' : a !== b ? 'Şifreler aynı değil.' : '';
// "Beni hatırla": bu bilgisayarda şifre sormadan aç (şifre değişince geçersiz olur)
const HATIRLA = 'kt_beni_hatirla';
const hatirlaIz = u => u.ad + '|' + u.hash.slice(0, 24);
function hatirlaYaz(acik) { try { if (acik) localStorage.setItem(HATIRLA, hatirlaIz(D.users[0])); else localStorage.removeItem(HATIRLA); } catch (e) { /* yoksay */ } }
function hatirlandi() { try { return !!D.users[0] && localStorage.getItem(HATIRLA) === hatirlaIz(D.users[0]); } catch (e) { return false; } }

// ---------------- giriş / kurulum ----------------
function authEkran(html) {
  $('#app').hidden = true; const a = $('#auth'); a.hidden = false;
  a.innerHTML = `<div class="auth-art"><div class="logo">K</div><h2>Kulüp Takip</h2>
    <p>Sınıf öğretmenleri için kulüp yoklaması, aidat takibi ve idareye verilecek raporlar — hepsi tek yerde, internet gerekmeden.</p>
    <ul><li>Tek tıkla yoklama</li><li>Kardeş indirimi ve burslu öğrenci</li><li>Son ödeme tarihi ve gecikme uyarıları</li><li>Baskıya hazır raporlar, Excel ve PDF</li></ul></div>
    <div class="auth-box">${html}</div>`;
  const f = $('form', a); if (f) { const i = $('input', f); if (i) i.focus(); }
  return a;
}
function kurulum(adim, guncelleme) {
  const st = D.settings;
  if (adim === 1) {
    const y0 = L.varsayilanYil();
    const a = authEkran(`<form id="f"><div class="steps"><i class="on"></i><i></i></div>
      <h3>Hoş geldiniz! 👋</h3><div class="hint">Okul ve sınıf bilgilerinizi girin. Raporlarda bu bilgiler kullanılır.</div>
      <div class="form">
        <label class="f full">Okulun adı *<input class="inp" name="okul" value="${esc(st.okul)}" required></label>
        <label class="f">Sınıf / şube *<input class="inp" name="sinif" list="siniflar" value="${esc(st.sinif)}" placeholder="2-B" required></label>
        <label class="f">Eğitim-öğretim yılı<select class="inp" name="yil">${[y0 - 1, y0, y0 + 1].map(y => `<option value="${y}" ${y === st.yil ? 'selected' : ''}>${y}-${y + 1}</option>`).join('')}</select></label>
        <label class="f full">Sınıf öğretmeni (adı soyadı) *<input class="inp" name="ogretmen" value="${esc(st.ogretmen)}" required></label>
        <label class="f">Kulübün adı<input class="inp" name="kulup" value="${esc(st.kulup)}"></label>
        <label class="f">Okul müdürü<input class="inp" name="mudur" value="${esc(st.mudur)}"></label>
        <label class="f">Aylık kulüp ücreti (₺)<input class="inp" name="ucret" value="${st.ucret || ''}" placeholder="örn. 750"></label>
        <label class="f">Son ödeme günü (her ay)<input class="inp" name="son" type="number" min="1" max="28" value="${st.sonOdemeGunu || 10}"></label>
      </div><datalist id="siniflar">${L.sinifListesi().map(s => `<option value="${s}">`).join('')}</datalist>
      <div class="err-msg" id="err"></div><button class="btn pri" style="justify-content:center">Devam ${ic('right')}</button></form>`);
    $('#f', a).onsubmit = e => {
      e.preventDefault(); const f = e.target;
      const u = L.parsePara(f.ucret.value);
      if (isNaN(u) || u < 0) { $('#err').textContent = 'Aylık ücreti sayı olarak yazın (örn. 750).'; return; }
      Object.assign(st, { okul: f.okul.value.trim(), sinif: f.sinif.value.trim(), ogretmen: f.ogretmen.value.trim(), kulup: f.kulup.value.trim() || 'Kulüp', mudur: f.mudur.value.trim(), yil: +f.yil.value, ucret: u, sonOdemeGunu: Math.min(28, Math.max(1, +f.son.value || 10)) });
      if (!st.baslangicAy || !L.yilAylari(st.yil).includes(st.baslangicAy)) st.baslangicAy = `${st.yil}-09`;
      kurulum(2);
    };
  } else if (adim === 2) {
    const a = authEkran(`<form id="f"><div class="steps"><i class="on"></i><i class="on"></i></div>
      <h3>Kullanıcı oluşturun 🔒</h3><div class="hint">${guncelleme ? 'Programın yeni sürümünde verileriniz şifre ile korunuyor. Bilgileriniz aynen duruyor; sadece bir kullanıcı adı ve şifre belirleyin.' : 'Program açılışta bu kullanıcı adı ve şifreyi soracak.'}</div>
      <label class="f">Kullanıcı adı<input class="inp" name="ad" value="${esc((st.ogretmen.split(' ')[0] || '').toLocaleLowerCase('tr-TR'))}" required></label>
      <div class="form"><label class="f">Şifre<input class="inp" type="password" name="s1" required></label>
      <label class="f">Şifre (tekrar)<input class="inp" type="password" name="s2" required></label></div>
      <label class="f">Güvenlik sorusu <span class="hint" style="font-weight:500">(şifrenizi unutursanız sorulur)</span><select class="inp" name="soru">${SORULAR.map(s => `<option>${esc(s)}</option>`).join('')}</select></label>
      <label class="f">Cevabınız<input class="inp" name="cevap" required></label>
      <label class="chk"><input type="checkbox" name="hatirla" checked><span>Beni hatırla<small>Bu bilgisayarda açılışta şifre sorma.</small></span></label>
      <div class="err-msg" id="err"></div><button class="btn ok" style="justify-content:center">Programa Başla ${ic('right')}</button></form>`);
    $('#f', a).onsubmit = async e => {
      e.preventDefault(); const f = e.target;
      const h = sifreKontrol(f.s1.value, f.s2.value); if (h) { $('#err').textContent = h; return; }
      if (!f.ad.value.trim()) { $('#err').textContent = 'Kullanıcı adı yazın.'; return; }
      if (cevapNorm(f.cevap.value).length < 2) { $('#err').textContent = 'Güvenlik sorusunun cevabını yazın.'; return; }
      await kullaniciKur(f.ad.value.trim(), f.s1.value, f.soru.value, f.cevap.value);
      dirty = true; await kaydet();
      hatirlaYaz(f.hatirla.checked);
      USER = D.users[0].ad; uygulama();
    };
  }
}
function girisEkrani(mesaj) {
  const a = authEkran(`<form id="f"><h3>Tekrar hoş geldiniz</h3><div class="hint">${esc(D.settings.okul)} • ${esc(D.settings.sinif)} • ${esc(D.settings.ogretmen)}</div>
    <label class="f">Kullanıcı adı<input class="inp" name="ad" value="${esc(D.users[0].ad)}" required></label>
    <label class="f">Şifre<input class="inp" type="password" name="s" required autofocus></label>
    <label class="chk"><input type="checkbox" name="hatirla"><span>Beni hatırla<small>Bu bilgisayarda bir dahaki açılışta şifre sorma.</small></span></label>
    <div class="err-msg" id="err">${esc(mesaj || '')}</div><button class="btn pri" style="justify-content:center">Giriş Yap ${ic('right')}</button>
    <button type="button" class="link" id="unut">Şifremi unuttum</button></form>`);
  setTimeout(() => $('[name=s]', a).focus(), 50);
  $('#f', a).onsubmit = async e => {
    e.preventDefault(); const f = e.target, u = D.users[0];
    if (L.norm(f.ad.value) !== L.norm(u.ad) || await ozet(f.s.value, u.salt) !== u.hash) { $('#err').textContent = 'Kullanıcı adı veya şifre hatalı.'; f.s.value = ''; f.s.focus(); return; }
    hatirlaYaz(f.hatirla.checked);
    USER = u.ad; uygulama();
  };
  $('#unut', a).onclick = () => sifreYenile();
}
// Şifremi unuttum: güvenlik sorusu ile (eski kurulumlarda öğretmen adı ve sınıf ile) doğrula
function sifreYenile() {
  const u = D.users[0], soruVar = !!(u.soru && u.cevapHash);
  const b = authEkran(`<form id="f"><h3>Şifre yenileme</h3>
    ${soruVar ? `<div class="hint">Kurulumda belirlediğiniz güvenlik sorusunu cevaplayın.</div>
      <label class="f">${esc(u.soru)}<input class="inp" name="cevap" required></label>`
    : `<div class="hint">Programda kayıtlı öğretmen adı soyadını ve sınıfı yazın.</div>
      <label class="f">Sınıf öğretmeni (adı soyadı)<input class="inp" name="ogretmen" required></label>
      <label class="f">Sınıf / şube<input class="inp" name="sinif" placeholder="2-B" required></label>`}
    <div class="form"><label class="f">Yeni şifre<input class="inp" type="password" name="s1" required></label>
    <label class="f">Yeni şifre (tekrar)<input class="inp" type="password" name="s2" required></label></div>
    <div class="err-msg" id="err"></div><button class="btn pri" style="justify-content:center">Şifreyi Değiştir</button>
    <button type="button" class="link" id="geri">Girişe dön</button></form>`);
  $('#geri', b).onclick = () => girisEkrani();
  $('#f', b).onsubmit = async e => {
    e.preventDefault(); const f = e.target;
    const dogru = soruVar ? await ozet(cevapNorm(f.cevap.value), u.cevapSalt) === u.cevapHash
      : cevapNorm(f.ogretmen.value) === cevapNorm(D.settings.ogretmen) && cevapNorm(f.sinif.value) === cevapNorm(D.settings.sinif);
    if (!dogru) { $('#err').textContent = soruVar ? 'Cevap hatalı.' : 'Bilgiler programda kayıtlı olanlarla uyuşmuyor.'; return; }
    const h = sifreKontrol(f.s1.value, f.s2.value); if (h) { $('#err').textContent = h; return; }
    u.salt = rastgele(16); u.hash = await ozet(f.s1.value, u.salt); dirty = true; await kaydet();
    hatirlaYaz(false);
    girisEkrani('Şifre değiştirildi. Yeni şifrenizle giriş yapın.');
  };
}

// ---------------- uygulama kabuğu ----------------
const SAYFALAR = [
  { id: 'panel', ad: 'Ana Sayfa', ic: 'home', r: 'blue' },
  { id: 'ogrenciler', ad: 'Öğrenciler', ic: 'users', r: 'purple' },
  { id: 'yoklama', ad: 'Yoklama', ic: 'check', r: 'green' },
  { id: 'aidat', ad: 'Aidat / Ödemeler', ic: 'wallet', r: 'orange' },
  { id: 'raporlar', ad: 'Raporlar', ic: 'printer', r: 'teal' },
  { id: 'ayarlar', ad: 'Ayarlar', ic: 'cog', r: 'gray' }
];
function uygulama() {
  $('#auth').hidden = true; $('#app').hidden = false;
  $('#nav').innerHTML = SAYFALAR.map(p => `<a data-p="${p.id}" style="--icb:${RENK[p.r][0]};--icc:${RENK[p.r][1]}"><span class="ic">${ic(p.ic)}</span>${p.ad}<span class="badge" hidden></span></a>`).join('');
  $$('#nav a').forEach(a => a.onclick = () => git(a.dataset.p));
  $('#userBox').innerHTML = `<span>👤 ${esc(USER)}</span><button id="cikis">Çıkış</button>`;
  $('#cikis').onclick = async () => { await kaydet(); hatirlaYaz(false); girisEkrani(); };
  $('#brandSinif').textContent = `${D.settings.sinif} • ${D.settings.kulup}`;
  setSave('ok', '✓ Veriler Excel\'de');
  git('panel');
  const g = L.gecikenler(D, today());
  if (g.length && !SMOKE) setTimeout(() => toast(`⚠ ${g.length} öğrencinin son ödeme tarihi geçmiş borcu var (toplam ${L.para(g.reduce((t, x) => t + x.toplam, 0))}).`, 'err', 7000), 600);
}
function rozetler() {
  if (!$('#nav a')) return;
  const set = (p, v) => { const b = $(`#nav a[data-p="${p}"] .badge`); if (b) { b.hidden = !v; b.textContent = v || ''; } };
  set('aidat', L.gecikenler(D, today()).length || '');
  const g = today().getDay(), alinmadi = g !== 0 && g !== 6 && L.aktifler(D, L.ayKey(today())).length && !L.gunKayitli(D, bugunKey());
  set('yoklama', alinmadi ? '!' : '');
  set('ayarlar', UPD.durum === 'var' || UPD.durum === 'hazir' ? 'Yeni' : '');
}
function git(p, params) {
  PAGE = p; PARAMS = params || {};
  $$('#nav a').forEach(a => a.classList.toggle('on', a.dataset.p === p));
  const s = SAYFALAR.find(x => x.id === p);
  $('#pageTitle').textContent = s.ad; $('#pageSub').textContent = ''; $('#topRight').innerHTML = '';
  $('#page').scrollTop = 0;
  ({ panel, ogrenciler, yoklama, aidat, raporlar, ayarlar })[p]();
  rozetler();
}
const yenile = () => git(PAGE, PARAMS);

// ================= ANA SAYFA =================
function panel() {
  const t = today(), ay = L.ayKey(t), st = D.settings;
  const sa = t.getHours(), selam = sa < 12 ? 'Günaydın' : sa < 18 ? 'İyi günler' : 'İyi akşamlar';
  const dev = L.devamEdenler(D), akt = L.aktifler(D, ay), o = L.ozetAy(D, ay, t), gec = L.gecikenler(D, t), yak = L.yaklasanlar(D, t, 5);
  const c = L.yoklamaSay(D, bugunKey(), akt), alindi = L.gunKayitli(D, bugunKey());
  const son = L.sonOdemeTarihi(D, ay), kalanGun = L.gunFarki(t, son);
  const yuzde = o.ucretli ? Math.round(100 * o.odeyen / o.ucretli) : 0;
  const gecTop = gec.reduce((x, y) => x + y.toplam, 0);
  $('#pageSub').textContent = L.tarihUzun(t);
  const uyarilar = [];
  if (UPD.durum === 'var') uyarilar.push(['info', 'star', `Yeni sürüm (${UPD.surum}) hazır!`, 'Ayarlar sayfasından tek tıkla güncelleyebilirsiniz.', `<button class="btn sm x" data-go="ayarlar">Güncelle</button>`]);
  if (!st.ucret) uyarilar.push(['info', 'coin', 'Aylık kulüp ücreti girilmemiş', 'Ücreti Ayarlar sayfasından girin; hesaplamalar otomatik yapılır.', `<button class="btn sm x" data-go="ayarlar">Ayarlar</button>`]);
  if (!dev.length) uyarilar.push(['info', 'users', 'Henüz öğrenci eklenmemiş', 'Öğrencileri elle, Excel dosyasından veya listeden yapıştırarak ekleyebilirsiniz.', `<button class="btn sm x" data-go="ogrenciler">Öğrenci Ekle</button>`]);
  if (gec.length) uyarilar.push(['bad', 'alert', `${gec.length} öğrencinin gecikmiş ödemesi var — toplam ${L.para(gecTop)}`, gec.slice(0, 4).map(x => `${x.s.adSoyad} (${x.aylar.map(a => L.AYLAR[L.parseAy(a.ay).getMonth()]).join(', ')})`).join(' • ') + (gec.length > 4 ? ` ve ${gec.length - 4} öğrenci daha` : ''), `<button class="btn sm x" data-rep="mektup">Veli Yazısı</button>`]);
  if (yak.liste.length) uyarilar.push(['warn', 'bell', yak.kalanGun === 0 ? `Bugün ${L.ayAd(ay)} ödemesinin son günü!` : `${L.ayAd(ay)} ödemesinin son gününe ${yak.kalanGun} gün kaldı`, `${yak.liste.length} öğrenci henüz ödemedi: ${yak.liste.slice(0, 5).map(s => s.adSoyad).join(', ')}${yak.liste.length > 5 ? '…' : ''}`, `<button class="btn sm x" data-go="aidat">Ödeme Al</button>`]);
  const gun = t.getDay();
  if (akt.length && !alindi && gun !== 0 && gun !== 6) uyarilar.push(['info', 'check', 'Bugünün yoklaması henüz alınmadı', 'Yoklama sayfasında "Hepsi Geldi" deyip sadece gelmeyenleri işaretleyebilirsiniz.', `<button class="btn sm x" data-go="yoklama">Yoklama Al</button>`]);
  const devs = akt.filter(s => L.devamsizlik(D, s.id, ay) >= 3);
  if (devs.length) uyarilar.push(['warn', 'userx', `Bu ay 3 gün veya daha fazla gelmeyen ${devs.length} öğrenci var`, devs.map(s => `${s.adSoyad} (${L.devamsizlik(D, s.id, ay)} gün)`).join(', '), '']);
  if (!uyarilar.length) uyarilar.push(['ok', 'ok', 'Her şey yolunda! 🎉', 'Gecikmiş ödeme veya bekleyen bir işiniz yok.', '']);

  const sonrakiAy = L.addMonths(ay, 1), sonraki = L.sonOdemeTarihi(D, sonrakiAy);
  $('#page').innerHTML = `
    <div class="hello"><div><h2>${selam}, ${esc(st.ogretmen)} 👋</h2><p>${esc(st.okul)} • ${esc(st.sinif)} sınıfı • ${esc(st.kulup)}</p></div>
      <div class="acts"><button class="btn" data-go="yoklama">${ic('check')}Yoklama Al</button><button class="btn" data-go="aidat">${ic('coin')}Ödeme Al</button><button class="btn" data-go="raporlar">${ic('printer')}Rapor Hazırla</button></div></div>
    <div class="grid g4" style="margin-bottom:18px">
      <div class="card stat">${icTile('users', 'purple')}<div><div class="l">Öğrenci</div><div class="v">${dev.length}</div><div class="s">${dev.filter(s => s.burslu).length} burslu • ${dev.filter(s => s.kardes && !s.burslu).length} kardeş indirimli</div></div></div>
      <div class="card stat">${icTile('check', 'green')}<div><div class="l">Bugünkü yoklama</div><div class="v">${alindi ? `${c.Geldi} / ${akt.length}` : '—'}</div><div class="s">${alindi ? `${c.Gelmedi} gelmedi • ${c['İzinli'] + c.Raporlu} izinli/raporlu` : 'Henüz alınmadı'}</div></div></div>
      <div class="card stat">${icTile('wallet', 'orange')}<div><div class="l">${L.AYLAR[t.getMonth()]} tahsilatı</div><div class="v">${L.para(o.tahsil)}</div><div class="s">Ödenecek ${L.para(o.borc)} • kalan ${L.para(o.kalan)}</div></div></div>
      <div class="card stat">${icTile('alert', 'red')}<div><div class="l">Gecikmiş borç</div><div class="v" style="color:${gecTop ? 'var(--bad)' : 'var(--ok)'}">${L.para(gecTop)}</div><div class="s">${gec.length} öğrenci</div></div></div>
    </div>
    <div class="grid g2">
      <div class="card"><h3>${icTile('cal', 'red')}Son ödeme tarihi</h3>
        <div class="due"><div class="cal"><div class="m">${L.AYLAR[son.getMonth()].toLocaleUpperCase('tr-TR')}</div><div class="d">${son.getDate()}</div></div>
          <div style="flex:1"><div class="big">${kalanGun > 0 ? `${kalanGun} gün kaldı` : kalanGun === 0 ? 'Bugün son gün!' : `${-kalanGun} gün geçti`}</div>
          <div class="hint" style="margin:4px 0 10px">${L.ayAd(ay)} kulüp ücreti için son gün: ${L.tarihUzun(son)}</div>
          <div class="bar"><i style="width:${yuzde}%"></i></div><div class="hint" style="margin-top:6px">${o.odeyen} / ${o.ucretli} öğrenci ödedi (%${yuzde})</div></div></div>
        <div class="hint" style="margin-top:14px">Sonraki son ödeme: <b>${L.tarihUzun(sonraki)}</b> (${L.ayAd(sonrakiAy)}) • Her ayın ${st.sonOdemeGunu}. günü</div>
      </div>
      <div class="card"><h3>${icTile('bell', 'orange')}Uyarılar ve hatırlatmalar</h3>
        ${uyarilar.map(u => `<div class="alert ${u[0]}">${ic(u[1])}<div><b>${esc(u[2])}</b>${esc(u[3])}</div>${u[4]}</div>`).join('')}
      </div>
    </div>
    ${gec.length ? `<div class="card"><h3>${icTile('coin', 'red')}Gecikmiş ödemeler</h3>${gec.slice(0, 12).map(x => `<div class="list-row"><div class="who">${avatar(x.s)}<div><b>${esc(x.s.adSoyad)}</b><div class="hint">${x.aylar.map(a => `${L.ayAd(a.ay)}: ${L.para(a.kalan)}`).join(' • ')}${x.s.veliTel ? ' • ☎ ' + esc(x.s.veliTel) : ''}</div></div></div>
      <div style="display:flex;gap:8px;align-items:center"><span class="pill bad">${L.para(x.toplam)}</span><button class="btn sm ok" data-pay="${x.s.id}" data-ay="${x.aylar[0].ay}">Ödeme Al</button></div></div>`).join('')}</div>` : ''}`;
  $$('[data-go]').forEach(b => b.onclick = () => git(b.dataset.go));
  $$('[data-rep]').forEach(b => b.onclick = () => git('raporlar', { id: b.dataset.rep }));
  $$('[data-pay]').forEach(b => b.onclick = async () => { const s = D.students.find(x => x.id === +b.dataset.pay); if (await odemeAl(s, b.dataset.ay)) yenile(); });
}

// ================= ÖĞRENCİLER =================
let ogrFiltre = 'devam', ogrAra = '';
function ogrenciler() {
  $('#pageSub').textContent = 'Öğrenci ekleyin, düzenleyin; kardeş indirimi ve burs durumunu belirleyin';
  $('#topRight').innerHTML = `<button class="btn" id="tpl">${ic('download')}Boş Şablon</button><button class="btn" id="yap">${ic('clip')}Listeden Yapıştır</button><button class="btn" id="imp">${ic('upload')}Excel'den Yükle</button><button class="btn pri" id="yeni">${ic('plus')}Yeni Öğrenci</button>`;
  $('#yeni').onclick = () => ogrenciForm(null);
  $('#imp').onclick = excelYukle; $('#yap').onclick = yapistir;
  $('#tpl').onclick = async () => { const f = await api.template(); if (f) toast('Şablon kaydedildi: ' + f, 'ok'); };
  const ay = L.ayKey(today());
  const ciz = () => {
    const q = L.norm(ogrAra);
    let l = L.sirala(D.students).filter(s => ogrFiltre === 'tum' || (ogrFiltre === 'devam' ? !s.bitisAy : !!s.bitisAy));
    if (q) l = l.filter(s => L.norm(`${s.adSoyad} ${s.no} ${s.veliAd} ${s.veliTel}`).includes(q));
    const dev = D.students.filter(s => !s.bitisAy);
    $('#liste').innerHTML = !D.students.length ? `<div class="empty"><div class="big-ic">${ic('users')}</div><b>Henüz öğrenci yok</b>Sağ üstteki düğmelerle öğrenci ekleyin. e-Okul listesini kopyalayıp "Listeden Yapıştır" ile hızlıca ekleyebilirsiniz.</div>`
      : `<table class="tbl"><thead><tr><th>Öğrenci</th><th>Veli</th><th>Ücret türü</th><th>Kardeşi</th><th class="r">Aylık ücret</th><th>Bu ay</th><th class="r">İşlemler</th></tr></thead><tbody>
      ${l.map(s => `<tr class="${s.bitisAy ? 'left' : ''}"><td><div class="who">${avatar(s)}<div><div class="name">${esc(s.adSoyad)}</div><div class="sub">${s.no ? 'No ' + esc(s.no) + ' • ' : ''}${s.bitisAy ? 'Ayrıldı: ' + L.ayAd(s.bitisAy) : 'Başlangıç: ' + L.ayAd(s.baslangicAy)}</div></div></div></td>
        <td>${esc(s.veliAd)}<div class="sub">${esc(s.veliTel)}</div></td><td>${turPill(s)}</td>
        <td>${s.kardes ? `${esc(s.kardesAd)}<div class="sub">${esc(s.kardesSinif)}</div>` : '<span class="sub">—</span>'}</td>
        <td class="r"><b>${L.para(L.turUcreti(D, s, ay))}</b></td><td>${durumPill(L.durum(D, s, ay))}</td>
        <td class="r" style="white-space:nowrap"><button class="btn sm ghost" data-h="${s.id}" title="Hesap dökümü">${ic('receipt')}</button><button class="btn sm ghost" data-e="${s.id}" title="Düzenle">${ic('edit')}</button><button class="btn sm ghost" data-d="${s.id}" title="Sil / Ayrıldı">${ic('trash')}</button></td></tr>`).join('')}
      </tbody><tfoot><tr><td colspan="7">${dev.length} öğrenci devam ediyor • ${dev.filter(s => s.burslu).length} burslu • ${dev.filter(s => s.kardes && !s.burslu).length} kardeş indirimli • ${D.students.length - dev.length} ayrılan</td></tr></tfoot></table>`;
    $$('[data-e]').forEach(b => b.onclick = () => ogrenciForm(D.students.find(s => s.id === +b.dataset.e)));
    $$('[data-d]').forEach(b => b.onclick = () => ogrenciSil(D.students.find(s => s.id === +b.dataset.d)));
    $$('[data-h]').forEach(b => b.onclick = () => hesap(D.students.find(s => s.id === +b.dataset.h)));
  };
  $('#page').innerHTML = `<div class="toolbar"><input class="inp search" id="ara" placeholder="🔍  İsim, numara veya veli ara" value="${esc(ogrAra)}">
    <select class="inp" id="flt"><option value="devam">Devam edenler</option><option value="ayrilan">Ayrılanlar</option><option value="tum">Tümü</option></select></div><div class="tbl-wrap" id="liste"></div>`;
  $('#flt').value = ogrFiltre;
  $('#flt').onchange = e => { ogrFiltre = e.target.value; ciz(); };
  $('#ara').oninput = e => { ogrAra = e.target.value; ciz(); };
  ciz();
}

async function ogrenciForm(s) {
  const yeni = !s; s = s || { id: 0, no: '', adSoyad: '', veliAd: '', veliTel: '', kardes: false, kardesAd: '', kardesSinif: '', burslu: false, baslangicAy: L.ilkAy(D), bitisAy: '', not: '' };
  const aylar = L.yilAylari(D.settings.yil);
  const body = `<div class="form">
    <label class="f full">Adı soyadı *<input class="inp" name="adSoyad" value="${esc(s.adSoyad)}"></label>
    <label class="f">Okul no<input class="inp" name="no" value="${esc(s.no)}"></label>
    <label class="f">Kulübe başladığı ay<select class="inp" name="bas">${ayOpts(s.baslangicAy || L.ilkAy(D), aylar.includes(s.baslangicAy) || !s.baslangicAy ? aylar : [s.baslangicAy, ...aylar])}</select></label>
    <label class="f">Veli adı soyadı<input class="inp" name="veliAd" value="${esc(s.veliAd)}"></label>
    <label class="f">Veli telefonu<input class="inp" name="veliTel" value="${esc(s.veliTel)}"></label>
    <label class="chk full"><input type="checkbox" name="burslu" ${s.burslu ? 'checked' : ''}><span>🎓 Burslu öğrenci<small>Kulüp ücreti alınmaz.</small></span></label>
    <label class="chk full"><input type="checkbox" name="kardes" ${s.kardes ? 'checked' : ''}><span>👫 Okulda kardeşi var<small>Aylık ücrete %${D.settings.kardesIndirim} kardeş indirimi uygulanır.</small></span></label>
    <label class="f kd">Kardeşinin adı<input class="inp" name="kardesAd" value="${esc(s.kardesAd)}"></label>
    <label class="f kd">Kardeşinin sınıfı<input class="inp" name="kardesSinif" list="sl2" value="${esc(s.kardesSinif)}" placeholder="Seçin veya yazın"></label>
    <label class="chk full"><input type="checkbox" name="ayrildi" ${s.bitisAy ? 'checked' : ''}><span>🚪 Kulüpten ayrıldı<small>Sadece ayrıldığı aydan sonraki aylarda listelerden çıkar; önceki ödeme ve yoklama kayıtları saklanır.</small></span></label>
    <label class="f full ay">Son devam ettiği ay<select class="inp" name="bit">${ayOpts(s.bitisAy || L.ayKey(today()), aylar)}</select></label>
    <label class="f full">Not<input class="inp" name="not" value="${esc(s.not)}"></label>
    <div class="full alert info" id="ucr" style="margin:0"></div></div><datalist id="sl2">${L.sinifListesi().map(x => `<option value="${x}">`).join('')}</datalist>`;
  const sonuc = await modal(yeni ? 'Yeni öğrenci' : 'Öğrenciyi düzenle', body, [{ t: 'Vazgeç', v: null }, {
    t: 'Kaydet', cls: 'pri', ic: 'ok', check: async ov => {
      const ad = val(ov, 'adSoyad').split(/\s+/).filter(Boolean).join(' ');
      if (!ad) { toast('Adı soyadı boş olamaz.', 'err'); return false; }
      if (D.students.some(x => x.id !== s.id && L.norm(x.adSoyad) === L.norm(ad)) && !await onayla(`"${esc(ad)}" adında bir öğrenci zaten var. Yine de kaydedilsin mi?`)) return false;
      if (val(ov, 'ayrildi') && val(ov, 'bit') < val(ov, 'bas')) { toast('Ayrılış ayı başlangıç ayından önce olamaz.', 'err'); return false; }
      return true;
    }, v: ov => ov
  }], {
    onOpen: ov => {
      const g = () => {
        $$('.kd', ov).forEach(e => e.style.display = $('[name=kardes]', ov).checked ? '' : 'none');
        $('.ay', ov).style.display = $('[name=ayrildi]', ov).checked ? '' : 'none';
        const u = L.ayinUcreti(D, L.ayKey(today())), b = $('[name=burslu]', ov).checked, k = $('[name=kardes]', ov).checked;
        $('#ucr', ov).innerHTML = `${ic('coin')}<div><b>Aylık ödeyeceği ücret: ${L.para(b ? 0 : k ? u * (100 - D.settings.kardesIndirim) / 100 : u)}</b>${b ? 'Burslu olduğu için ücret alınmaz.' : k ? 'Kardeş indirimi uygulandı.' : 'Tam ücret.'}</div>`;
      };
      $$('input[type=checkbox]', ov).forEach(c => c.onchange = g); g();
    }
  });
  if (!sonuc) return;
  const ov = sonuc;
  const eskiBitis = s.bitisAy;
  Object.assign(s, {
    adSoyad: val(ov, 'adSoyad').split(/\s+/).filter(Boolean).join(' '), no: val(ov, 'no'), veliAd: val(ov, 'veliAd'), veliTel: val(ov, 'veliTel'),
    burslu: val(ov, 'burslu'), kardes: val(ov, 'kardes'), kardesAd: val(ov, 'kardes') ? val(ov, 'kardesAd') : '', kardesSinif: val(ov, 'kardes') ? val(ov, 'kardesSinif') : '',
    baslangicAy: val(ov, 'bas'), not: val(ov, 'not')
  });
  if (yeni) { s.id = L.yeniId(D.students); D.students.push(s); }
  if (val(ov, 'ayrildi')) { if (s.bitisAy !== val(ov, 'bit') || !eskiBitis) L.ayrildiIsaretle(D, s, val(ov, 'bit')); } else s.bitisAy = '';
  degisti(); toast(yeni ? 'Öğrenci eklendi.' : 'Kaydedildi.', 'ok'); yenile();
}

async function ogrenciSil(s) {
  const kayitVar = D.payments.some(p => p.ogrenciId === s.id) || Object.keys(D.attendance).some(k => k.endsWith('|' + s.id));
  if (!kayitVar) { if (await onayla(`<b>${esc(s.adSoyad)}</b> silinsin mi?`, 'Sil', 'danger')) { L.tamamenSil(D, s.id); degisti(); yenile(); } return; }
  const r = await modal('Öğrencinin kayıtları var', `<p style="line-height:1.6"><b>${esc(s.adSoyad)}</b> için ödeme veya yoklama kayıtları bulunuyor.</p>
    <div class="alert info">${ic('star')}<div><b>Önerilen: Kulüpten ayrıldı olarak işaretleyin</b>Öğrenci seçtiğiniz aydan sonraki listelerde görünmez; geçmiş ödeme ve yoklama kayıtları raporlarda kalır.</div></div>
    <label class="f">Son devam ettiği ay<select class="inp" name="bit">${ayOpts(s.bitisAy || L.ayKey(today()))}</select></label>`,
    [{ t: 'Vazgeç', v: null }, { t: 'Tamamen Sil', cls: 'danger', v: () => 'sil' }, { t: 'Ayrıldı Olarak İşaretle', cls: 'pri', v: ov => ({ bit: val(ov, 'bit') }) }]);
  if (!r) return;
  if (r === 'sil') { if (!await onayla(`<b>${esc(s.adSoyad)}</b> ve tüm ödeme/yoklama kayıtları kalıcı olarak silinecek. Raporlardan da çıkacak.`, 'Kalıcı Olarak Sil', 'danger')) return; L.tamamenSil(D, s.id); }
  else L.ayrildiIsaretle(D, s, r.bit);
  degisti(); yenile();
}

async function ekle(list) {
  let n = 0, atla = 0;
  for (const x of list) {
    if (D.students.some(s => L.norm(s.adSoyad) === L.norm(x.adSoyad))) { atla++; continue; }
    D.students.push(Object.assign({ not: '', bitisAy: '', baslangicAy: L.ilkAy(D) }, x, { id: L.yeniId(D.students) })); n++;
  }
  if (n) degisti();
  await bilgi('Öğrenciler eklendi', `<b>${n}</b> öğrenci eklendi.${atla ? ` ${atla} öğrenci zaten kayıtlı olduğu için atlandı.` : ''}<br><br>Kardeş indirimi ve burs durumunu öğrencinin yanındaki ✎ düğmesiyle düzenleyebilirsiniz.`);
  yenile();
}
async function excelYukle() {
  const r = await api.importExcel(); if (!r) return;
  if (r.error) return bilgi('Dosya okunamadı', esc(r.error));
  const res = L.satirlardanOgrenci(r.rows);
  if (!res.ogrenciler.length) return bilgi('Öğrenci bulunamadı', esc(res.bilgi));
  const ok = await modal(`Excel'den yüklenecek ${res.ogrenciler.length} öğrenci`, `${res.bilgi ? `<div class="alert info">${ic('alert')}<div>${esc(res.bilgi)}</div></div>` : ''}
    <div class="tbl-wrap" style="max-height:52vh;box-shadow:none;border:1px solid var(--line)"><table class="tbl"><thead><tr><th>No</th><th>Adı Soyadı</th><th>Veli</th><th>Telefon</th><th>Kardeş</th><th>Burslu</th></tr></thead><tbody>
    ${res.ogrenciler.map(s => `<tr><td>${esc(s.no)}</td><td class="name">${esc(s.adSoyad)}</td><td>${esc(s.veliAd)}</td><td>${esc(s.veliTel)}</td><td>${s.kardes ? 'Evet ' + esc(s.kardesSinif) : ''}</td><td>${s.burslu ? 'Evet' : ''}</td></tr>`).join('')}</tbody></table></div>
    <p class="hint">Aynı isimde zaten kayıtlı olan öğrenciler atlanır.</p>`, [{ t: 'Vazgeç', v: false }, { t: 'Hepsini Ekle', cls: 'pri', ic: 'plus', v: true }], { wide: true });
  if (ok) ekle(res.ogrenciler);
}
async function yapistir() {
  const ov = await modal('Listeden yapıştır', `<p class="hint">Her satıra bir öğrenci yazın veya e-Okul / Excel listesinden kopyalayıp yapıştırın. Satır başındaki numara okul no olarak alınır.<br>Örnek: <b>125 Ali Yılmaz</b></p>
    <textarea class="inp" name="t" rows="14" style="width:100%;resize:vertical"></textarea>`, [{ t: 'Vazgeç', v: null }, { t: 'Ekle', cls: 'pri', ic: 'plus', v: o => o }]);
  if (!ov) return;
  const l = L.metindenOgrenci(val(ov, 't'));
  if (l.length) ekle(l); else toast('Liste boş.', 'err');
}
async function hesap(s) {
  const t = today();
  const aylar = L.yilAylari(D.settings.yil).filter(a => a <= L.ayKey(t) && (L.aktif(s, a) || L.odenen(D, s.id, a)));
  let tb = 0, to = 0;
  const rows = aylar.map(a => { const b = L.borc(D, s, a), o = L.odenen(D, s.id, a); tb += b; to += o; return `<tr><td>${L.ayAd(a)}</td><td>${L.trTarih(L.sonOdemeTarihi(D, a))}</td><td class="r">${L.para(b)}</td><td class="r">${L.para(o)}</td><td class="r">${L.para(Math.max(0, b - o))}</td><td>${durumPill(L.durum(D, s, a, t))}</td></tr>`; }).join('');
  const r = await modal(`${s.adSoyad} — hesap durumu`, `<p class="hint">${turPill(s)} ${s.kardes ? 'Kardeşi: ' + esc(s.kardesAd) + ' ' + esc(s.kardesSinif) : ''} ${s.veliTel ? '• ☎ ' + esc(s.veliTel) : ''}</p>
    <div class="tbl-wrap" style="box-shadow:none;border:1px solid var(--line)"><table class="tbl"><thead><tr><th>Ay</th><th>Son ödeme</th><th class="r">Ödenecek</th><th class="r">Ödenen</th><th class="r">Kalan</th><th>Durum</th></tr></thead>
    <tbody>${rows || '<tr><td colspan="6" class="c">Kayıt yok</td></tr>'}</tbody><tfoot><tr><td colspan="2">Toplam</td><td class="r">${L.para(tb)}</td><td class="r">${L.para(to)}</td><td class="r">${L.para(Math.max(0, tb - to))}</td><td></td></tr></tfoot></table></div>`,
    [{ t: 'Kapat', v: null }, { t: 'Yazdır / PDF', cls: 'pri', ic: 'printer', v: 'yaz' }], { wide: true });
  if (r === 'yaz') git('raporlar', { id: 'ekstre', ogrenci: s.id });
}

// ================= YOKLAMA =================
let yokGun = null;
function yoklama() {
  yokGun = yokGun || bugunKey();
  const d = L.parseGun(yokGun), ay = yokGun.slice(0, 7), list = L.aktifler(D, ay);
  const hs = d.getDay() === 0 || d.getDay() === 6;
  $('#pageSub').textContent = 'Öğrenciye dokunarak durumu seçin; değişiklikler otomatik kaydedilir';
  $('#topRight').innerHTML = `<button class="btn" id="tem">${ic('x')}Günü Temizle</button><button class="btn ok" id="hep">${ic('ok')}Hepsi Geldi</button>`;
  const say = () => { const c = L.yoklamaSay(D, yokGun, list); $('#cnt').innerHTML = `<span class="pill ok">✓ Geldi: ${c.Geldi}</span><span class="pill bad">✗ Gelmedi: ${c.Gelmedi}</span><span class="pill warn">İzinli: ${c['İzinli']}</span><span class="pill warn">Raporlu: ${c.Raporlu}</span><span class="pill muted">İşlenmedi: ${c.bos}</span>`; };
  const KOD = { 'Geldi': 'g', 'Gelmedi': 'y', 'İzinli': 'i', 'Raporlu': 'r' };
  $('#page').innerHTML = `<div class="toolbar"><div class="datebar"><button class="btn" id="once">${ic('left')}</button><input type="date" class="inp" id="gun" value="${yokGun}"><button class="btn" id="sonra">${ic('right')}</button><button class="btn sm" id="bug">Bugün</button></div>
    <b style="font-size:17px;margin-left:6px">${L.tarihUzun(d)}</b>${hs ? '<span class="pill warn">Hafta sonu</span>' : ''}<span class="sp"></span><div class="counts" id="cnt"></div></div>
    ${list.length ? `<div class="att">${list.map(s => { const y = L.yoklama(D, yokGun, s.id), dv = L.devamsizlik(D, s.id, ay); return `<div class="att-card ${KOD[y] || ''}" data-id="${s.id}"><div class="top"><div class="who">${avatar(s)}<div><b>${esc(s.adSoyad)}</b><div class="hint">${s.no ? 'No ' + esc(s.no) : ''}${dv ? ` • bu ay ${dv} gün gelmedi` : ''}</div></div></div></div>
      <div class="seg">${L.DURUMLAR.map(x => `<button class="${KOD[x]} ${y === x ? 'on' : ''}" data-d="${x}">${x === 'Geldi' ? '✓ ' : x === 'Gelmedi' ? '✗ ' : ''}${x}</button>`).join('')}</div></div>`; }).join('')}</div>`
      : `<div class="card empty"><div class="big-ic">${ic('users')}</div><b>Bu tarihte kulüpte öğrenci yok</b>Önce Öğrenciler sayfasından öğrenci ekleyin.</div>`}`;
  const gitGun = g => { yokGun = g; yoklama(); };
  $('#gun').onchange = e => e.target.value && gitGun(e.target.value);
  $('#once').onclick = () => gitGun(L.gunKey(L.addDays(d, -1)));
  $('#sonra').onclick = () => gitGun(L.gunKey(L.addDays(d, 1)));
  $('#bug').onclick = () => gitGun(bugunKey());
  $$('.att-card').forEach(card => $$('button', card).forEach(b => b.onclick = () => {
    const id = +card.dataset.id, cur = L.yoklama(D, yokGun, id), yeni = cur === b.dataset.d ? '' : b.dataset.d;
    L.yoklamaYaz(D, yokGun, id, yeni);
    $$('button', card).forEach(x => x.classList.toggle('on', x.dataset.d === yeni));
    card.className = 'att-card ' + (KOD[yeni] || '');
    degisti(); say();
  }));
  $('#hep').onclick = async () => {
    const dolu = list.some(s => L.yoklama(D, yokGun, s.id));
    let sadeceBos = false;
    if (dolu) { const r = await modal('Hepsi geldi', 'Bazı öğrencilerin yoklaması zaten işlenmiş.', [{ t: 'Vazgeç', v: null }, { t: 'Hepsini Geldi Yap', v: 'hep' }, { t: 'Sadece Boşları', cls: 'pri', v: 'bos' }]); if (!r) return; sadeceBos = r === 'bos'; }
    list.forEach(s => { if (!sadeceBos || !L.yoklama(D, yokGun, s.id)) L.yoklamaYaz(D, yokGun, s.id, 'Geldi'); });
    degisti(); yoklama();
  };
  $('#tem').onclick = async () => { if (await onayla(`${L.trTarih(yokGun)} gününün tüm yoklama kayıtları silinsin mi?`, 'Temizle', 'danger')) { list.forEach(s => L.yoklamaYaz(D, yokGun, s.id, '')); degisti(); yoklama(); } };
  if (list.length) say();
}

// ================= AİDAT =================
let aidAy = null, aidFiltre = 'tum', aidAra = '';
async function odemeAl(s, ay, tutar) {
  const kalan = Math.max(0, L.borc(D, s, ay) - L.odenen(D, s.id, ay));
  const ov = await modal(`Ödeme al — ${s.adSoyad}`, `<div class="alert info">${ic('coin')}<div><b>${L.ayAd(ay)} • Kalan borç: ${L.para(kalan)}</b>Ödenecek ${L.para(L.borc(D, s, ay))} • Şu ana kadar ödenen ${L.para(L.odenen(D, s.id, ay))} • Son ödeme tarihi ${L.trTarih(L.sonOdemeTarihi(D, ay))}</div></div>
    <div class="form"><label class="f">Alınan tutar (₺)<input class="inp" name="tutar" value="${tutar != null ? tutar : (kalan || '')}"></label>
    <label class="f">Ödeme tarihi<input class="inp" type="date" name="tarih" value="${bugunKey()}"></label>
    <label class="f full">Ait olduğu ay<select class="inp" name="ay">${ayOpts(ay)}</select></label>
    <label class="f full">Not (isteğe bağlı)<input class="inp" name="not" placeholder="örn. elden alındı"></label></div>
    <p class="hint">Yanlış ödeme girdiyseniz eksi tutar (örn. -100) yazarak düzeltebilirsiniz.</p>`,
    [{ t: 'Vazgeç', v: null }, { t: 'Ödemeyi Kaydet', cls: 'ok', ic: 'ok', check: ov => { const v = L.parsePara(val(ov, 'tutar')); if (isNaN(v) || v === 0) { toast('Geçerli bir tutar yazın (örn. 750 veya 375,50).', 'err'); return false; } return true; }, v: o => o }]);
  if (!ov) return false;
  L.odemeEkle(D, s.id, val(ov, 'ay'), L.parsePara(val(ov, 'tutar')), val(ov, 'tarih') || bugunKey(), val(ov, 'not'));
  degisti(); toast(`${s.adSoyad}: ${L.para(L.parsePara(val(ov, 'tutar')))} ödeme kaydedildi.`, 'ok');
  return true;
}
function aidat() {
  aidAy = aidAy || varsAy();
  const ay = aidAy, t = today(), son = L.sonOdemeTarihi(D, ay), kg = L.gunFarki(t, son);
  const ozel = D.monthFees[ay] !== undefined;
  $('#pageSub').textContent = 'Ödenen tutarı yazın veya "Tam Ödendi" deyin; tüm hesaplar otomatik yapılır';
  $('#topRight').innerHTML = `<button class="btn" id="mak">${ic('receipt')}Makbuz</button><button class="btn pri" id="rap">${ic('printer')}İdare Raporu</button>`;
  $('#rap').onclick = () => git('raporlar', { id: 'aylikAidat', ay });
  $('#mak').onclick = () => git('raporlar', { id: 'makbuz', ay });
  $('#page').innerHTML = `<div class="toolbar"><select class="inp" id="ay" style="font-weight:800">${ayOpts(ay)}</select>
    <span class="pill ${kg < 0 ? 'bad' : kg <= 3 ? 'warn' : 'blue'}" style="font-size:13.5px;padding:7px 13px">📅 Son ödeme: ${L.trTarih(son)} • ${kg > 0 ? kg + ' gün kaldı' : kg === 0 ? 'bugün son gün' : -kg + ' gün geçti'}</span>
    <span class="sp"></span><label class="hint" style="font-weight:700">Bu ayın ücreti</label><input class="inp" id="ucret" style="width:100px;text-align:right;font-weight:800" value="${L.ayinUcreti(D, ay)}"><button class="btn sm" id="ucretKay">Uygula</button>
    <span class="hint">${ozel ? '(bu aya özel)' : '(varsayılan)'}</span></div>
    <div class="grid g4" id="oz" style="margin-bottom:16px"></div>
    <div class="toolbar"><input class="inp search" id="ara" placeholder="🔍  Öğrenci ara" value="${esc(aidAra)}">
    <select class="inp" id="flt"><option value="tum">Tüm öğrenciler</option><option value="odemeyen">Ödemesi eksik olanlar</option><option value="geciken">Gecikenler</option><option value="odeyen">Ödeyenler</option></select>
    <span class="sp"></span><button class="btn ok" id="topluOde">${ic('ok')}Seçilenler Tam Ödedi</button></div>
    <div class="tbl-wrap" id="tb"></div>`;
  $('#flt').value = aidFiltre;
  $('#ay').onchange = e => { aidAy = e.target.value; aidat(); };
  $('#ucretKay').onclick = async () => {
    const u = L.parsePara($('#ucret').value); if (isNaN(u) || u < 0) return toast('Geçerli bir ücret yazın.', 'err');
    if (u === Number(D.settings.ucret)) delete D.monthFees[ay];
    else {
      const r = await modal('Ücret değişikliği', `${L.para(u)} ücret nasıl uygulansın?`, [{ t: 'Vazgeç', v: null }, { t: `Sadece ${L.ayAd(ay)}`, v: 'ay' }, { t: 'Varsayılan ücret yap', cls: 'pri', v: 'hep' }]);
      if (!r) return; if (r === 'ay') D.monthFees[ay] = u; else { D.settings.ucret = u; delete D.monthFees[ay]; }
    }
    degisti(); aidat();
  };
  const ciz = () => {
    const o = L.ozetAy(D, ay, t);
    $('#oz').innerHTML = `<div class="card stat">${icTile('coin', 'blue')}<div><div class="l">Ödenecek toplam</div><div class="v">${L.para(o.borc)}</div><div class="s">${o.ucretli} ücretli öğrenci</div></div></div>
      <div class="card stat">${icTile('wallet', 'green')}<div><div class="l">Tahsil edilen • idareye teslim</div><div class="v" style="color:var(--ok)">${L.para(o.tahsil)}</div><div class="s">${o.odeyen} öğrenci tam ödedi</div></div></div>
      <div class="card stat">${icTile('alert', 'red')}<div><div class="l">Kalan</div><div class="v" style="color:${o.kalan ? 'var(--bad)' : 'var(--ok)'}">${L.para(o.kalan)}</div><div class="s">${o.odemeyen} ödemedi • ${o.kismi} eksik • ${o.geciken} gecikti</div></div></div>
      <div class="card stat">${icTile('star', 'purple')}<div><div class="l">İndirim / burs</div><div class="v">${L.para(o.kardesInd + o.bursMuaf)}</div><div class="s">${o.kardes} kardeş • ${o.burslu} burslu</div></div></div>`;
    const q = L.norm(aidAra);
    let list = L.sirala(D.students.filter(s => L.aktif(s, ay) || L.odenen(D, s.id, ay)));
    if (q) list = list.filter(s => L.norm(s.adSoyad + ' ' + s.no).includes(q));
    list = list.filter(s => { const k = L.durum(D, s, ay, t).kod; return aidFiltre === 'tum' || (aidFiltre === 'odeyen' ? L.odendiMi(k) : aidFiltre === 'geciken' ? k === 'gecikti' : ['odenmedi', 'kismi', 'gecikti'].includes(k)); });
    $('#tb').innerHTML = list.length ? `<table class="tbl"><thead><tr><th style="width:34px"><input type="checkbox" id="hepsi"></th><th>Öğrenci</th><th>Tür</th><th class="r">Ödenecek</th><th class="r">Ödenen ✎</th><th class="r">Kalan</th><th>Durum</th><th>Son ödeme</th><th class="r">İşlem</th></tr></thead><tbody>
      ${list.map(s => { const b = L.borc(D, s, ay), od = L.odenen(D, s.id, ay), d = L.durum(D, s, ay, t); return `<tr data-id="${s.id}"><td><input type="checkbox" class="sec" ${b > od ? '' : 'disabled'}></td>
        <td><div class="who">${avatar(s)}<div><div class="name">${esc(s.adSoyad)}</div><div class="sub">${s.no ? 'No ' + esc(s.no) : ''}${s.kardes && s.kardesSinif ? ' • kardeşi ' + esc(s.kardesSinif) : ''}</div></div></div></td>
        <td>${turPill(s)}</td><td class="r">${L.para(b)}</td><td class="r"><input class="inp money-in" value="${od ? String(od).replace('.', ',') : ''}" placeholder="0" ${b === 0 && !od ? 'disabled' : ''}></td>
        <td class="r" style="color:${b - od > 0 ? 'var(--bad)' : 'inherit'};font-weight:700">${L.para(Math.max(0, b - od))}</td><td>${durumPill(d)}</td><td class="sub">${L.trTarih(L.sonOdemeGunuTarihi(D, s.id, ay))}</td>
        <td class="r" style="white-space:nowrap">${b > od ? `<button class="btn sm ok" data-full>Tam Ödendi</button> ` : ''}<button class="btn sm ghost" data-pay title="Ödeme al">${ic('coin')}</button><button class="btn sm ghost" data-his title="Ödeme geçmişi">${ic('clip')}</button></td></tr>`; }).join('')}
      </tbody></table>` : `<div class="empty"><div class="big-ic">${ic('wallet')}</div><b>${D.students.length ? 'Bu filtrede öğrenci yok' : 'Henüz öğrenci yok'}</b></div>`;
    const sid = el => +el.closest('tr').dataset.id, ogr = el => D.students.find(x => x.id === sid(el));
    $$('#tb [data-full]').forEach(b => b.onclick = () => { const s = ogr(b); const k = L.borc(D, s, ay) - L.odenen(D, s.id, ay); if (k > 0) { L.odemeEkle(D, s.id, ay, k, bugunKey(), ''); degisti(); toast(`${s.adSoyad}: ${L.para(k)} alındı.`, 'ok'); ciz(); } });
    $$('#tb [data-pay]').forEach(b => b.onclick = async () => { if (await odemeAl(ogr(b), ay)) ciz(); });
    $$('#tb [data-his]').forEach(b => b.onclick = () => gecmis(ogr(b), ay).then(ciz));
    $$('#tb .money-in').forEach(inp => {
      const uygula = () => {
        const s = ogr(inp), yeni = L.parsePara(inp.value), eski = L.odenen(D, s.id, ay);
        if (isNaN(yeni) || yeni < 0) { toast('Geçerli bir tutar yazın (örn. 750 veya 375,50).', 'err'); inp.value = eski ? String(eski).replace('.', ',') : ''; return; }
        if (L.r2(yeni - eski) !== 0) { L.odemeEkle(D, s.id, ay, yeni - eski, bugunKey(), yeni < eski ? 'Düzeltme' : ''); degisti(); ciz(); }
      };
      inp.onchange = uygula; inp.onkeydown = e => { if (e.key === 'Enter') inp.blur(); };
    });
    const h = $('#hepsi'); if (h) h.onchange = () => $$('#tb .sec:not(:disabled)').forEach(c => c.checked = h.checked);
  };
  $('#flt').onchange = e => { aidFiltre = e.target.value; ciz(); };
  $('#ara').oninput = e => { aidAra = e.target.value; ciz(); };
  $('#topluOde').onclick = async () => {
    const ids = $$('#tb .sec:checked').map(c => +c.closest('tr').dataset.id);
    if (!ids.length) return toast('Önce soldaki kutulardan öğrenci seçin.', 'err');
    let top = 0;
    for (const id of ids) { const s = D.students.find(x => x.id === id), k = L.borc(D, s, ay) - L.odenen(D, s.id, ay); if (k > 0) { L.odemeEkle(D, id, ay, k, bugunKey(), ''); top += k; } }
    degisti(); toast(`${ids.length} öğrenciden toplam ${L.para(top)} alındı.`, 'ok'); ciz();
  };
  ciz();
}
async function gecmis(s, ay) {
  const ciz = () => { const l = L.odemeler(D, s.id, ay).sort((a, b) => a.tarih.localeCompare(b.tarih)); return l.length ? `<table class="tbl"><thead><tr><th>Tarih</th><th class="r">Tutar</th><th>Not</th><th></th></tr></thead><tbody>${l.map(p => `<tr><td>${L.trTarih(p.tarih)}</td><td class="r"><b>${L.para(p.tutar)}</b></td><td>${esc(p.not)}</td><td class="r"><button class="btn sm danger" data-sil="${p.id}">${ic('trash')}Sil</button></td></tr>`).join('')}</tbody></table>` : '<div class="empty">Bu ay için ödeme kaydı yok.</div>'; };
  await modal(`Ödeme geçmişi — ${s.adSoyad} • ${L.ayAd(ay)}`, `<div id="hl">${ciz()}</div>`, [{ t: 'Kapat', v: null }], {
    onOpen: ov => {
      const bagla = () => $$('[data-sil]', ov).forEach(b => b.onclick = async () => {
        const p = D.payments.find(x => x.id === +b.dataset.sil);
        if (await onayla(`${L.trTarih(p.tarih)} tarihli ${L.para(p.tutar)} ödeme silinsin mi?`, 'Sil', 'danger')) { D.payments = D.payments.filter(x => x !== p); degisti(); $('#hl', ov).innerHTML = ciz(); bagla(); }
      });
      bagla();
    }
  });
}

// ================= RAPORLAR =================
const REP_IC = { gunluk: ['cal', 'green'], haftalik: ['cal', 'teal'], aylikYoklama: ['check', 'green'], aylikAidat: ['wallet', 'orange'], paket: ['file', 'blue'], toplu: ['table', 'purple'], borclular: ['alert', 'red'], mektup: ['mail', 'red'], tahsilat: ['coin', 'orange'], makbuz: ['receipt', 'teal'], ekstre: ['users', 'purple'], liste: ['users', 'blue'] };
let RP = null, ZOOM = 'fit';
function raporlar() {
  const t = today();
  RP = Object.assign({ id: 'aylikAidat', gun: bugunKey(), ay: varsAy(), bas: L.ayKey(t) + '-01', bit: bugunKey(), ogrenci: (L.sirala(D.students)[0] || {}).id || '' }, RP || {}, PARAMS);
  $('#pageSub').textContent = 'Raporu seçin, önizlemede kontrol edin; yazdırın, PDF veya Excel olarak kaydedin';
  $('#topRight').innerHTML = `<button class="btn" id="kl">${ic('folder')}Raporlar Klasörü</button>`;
  $('#kl').onclick = () => api.openPath('rapor');
  const gruplar = [...new Set(R.TURLER.map(x => x.grup))];
  $('#page').innerHTML = `<div class="rep"><div class="card rep-list">${gruplar.map(g => `<div class="grp">${g}</div>${R.TURLER.filter(x => x.grup === g).map(x => `<div class="rep-item" data-id="${x.id}">${icTile(...REP_IC[x.id])}<div><b>${x.ad}</b><small>${x.acik}</small></div></div>`).join('')}`).join('')}</div>
    <div class="card rep-main"><div class="rep-bar" id="rbar"></div><iframe class="rep-frame" id="rf" sandbox="allow-same-origin"></iframe></div></div>`;
  $$('.rep-item').forEach(e => e.onclick = () => { RP.id = e.dataset.id; raporCiz(); });
  raporCiz();
}
let SON_HTML = null, SON_MODELS = null, RAPOR_IS = {};
function raporCiz() {
  const tur = R.TURLER.find(x => x.id === RP.id);
  $$('.rep-item').forEach(e => e.classList.toggle('on', e.dataset.id === RP.id));
  const ogrOpts = () => L.sirala(D.students).map(s => `<option value="${s.id}" ${+RP.ogrenci === s.id ? 'selected' : ''}>${esc(s.adSoyad)}${s.bitisAy ? ' (ayrıldı)' : ''}</option>`).join('');
  let p = '';
  if (tur.param === 'gun') p = `<label class="hint" style="font-weight:800">Tarih</label><input type="date" class="inp" data-k="gun" value="${RP.gun}">`;
  if (tur.param === 'ay') p = `<label class="hint" style="font-weight:800">Ay</label><select class="inp" data-k="ay">${ayOpts(RP.ay)}</select>`;
  if (tur.param === 'aralik') p = `<input type="date" class="inp" data-k="bas" value="${RP.bas}"><span>—</span><input type="date" class="inp" data-k="bit" value="${RP.bit}">`;
  if (tur.param === 'ogrenci' || tur.param === 'ogrenciAy') p = `<select class="inp" data-k="ogrenci" style="max-width:230px">${ogrOpts()}</select>`;
  if (tur.param === 'ogrenciAy') p += `<select class="inp" data-k="ay">${ayOpts(RP.ay)}</select>`;
  $('#rbar').innerHTML = `${p}<span class="sp" style="flex:1"></span><span class="hint" id="sayfa"></span>
    <select class="inp" id="zoom" title="Yakınlaştırma"><option value="fit" ${ZOOM === 'fit' ? 'selected' : ''}>Sayfaya sığdır</option>${[0.6, 0.75, 1, 1.25].map(z => `<option value="${z}" ${z === ZOOM ? 'selected' : ''}>%${Math.round(z * 100)}</option>`).join('')}</select>
    <button class="btn" id="xls">${ic('table')}Excel</button><button class="btn" id="pdf">${ic('pdf')}PDF</button><button class="btn" id="yaz">${ic('printer')}Yazdır</button><button class="btn pri" id="onz">${ic('file')}Baskı Önizleme</button>`;
  $$('#rbar [data-k]').forEach(e => e.onchange = () => { RP[e.dataset.k] = e.value; raporCiz(); });
  $('#zoom').onchange = e => { ZOOM = e.target.value === 'fit' ? 'fit' : +e.target.value; zoomUygula(); };
  const ad = () => `${tur.ad.replace(/[^\p{L}\p{N} ]/gu, '').replace(/\s+/g, '_')}_${D.settings.sinif}_${tur.param === 'ay' || tur.param === 'ogrenciAy' ? RP.ay : tur.param === 'gun' ? RP.gun : tur.param === 'aralik' ? RP.bas + '_' + RP.bit : L.gunKey(today())}`;
  try {
    if ((tur.param === 'ogrenci' || tur.param === 'ogrenciAy') && !RP.ogrenci) throw new Error('Önce öğrenci ekleyin.');
    SON_MODELS = R.olustur(RP.id, D, RP, today());
    const h = R.html(SON_MODELS, D.settings);
    SON_HTML = h.html;
    $('#sayfa').textContent = `${h.sayfa} sayfa`;
    const f = $('#rf'); f.srcdoc = h.html; f.onload = zoomUygula;
  } catch (e) { SON_HTML = null; $('#rf').srcdoc = `<div style="font-family:sans-serif;padding:40px;color:#c33">${esc(e.message)}</div>`; }
  const is = async (fn, msg) => { if (!SON_HTML) return; try { const r = await fn(); if (r) toast(msg + (typeof r === 'string' ? ': ' + r : ''), 'ok', 6000); } catch (e) { toast('İşlem başarısız: ' + e.message, 'err'); } };
  RAPOR_IS = {
    yaz: () => is(() => api.print({ html: SON_HTML }).then(r => r.ok ? 'Yazıcıya gönderildi' : (r.error && !/cancel/i.test(r.error) ? Promise.reject(new Error(r.error)) : null)), ''),
    pdf: () => is(() => api.pdf({ html: SON_HTML, ad: ad(), sor: true }), 'PDF kaydedildi'),
    xls: () => is(() => api.exportExcel({ models: SON_MODELS, settings: D.settings, ad: ad(), sor: true }), 'Excel dosyası kaydedildi'),
    ad: tur.ad
  };
  $('#onz').onclick = baskiOnizleme;
  $('#yaz').onclick = () => is(() => api.print({ html: SON_HTML }).then(r => r.ok ? 'Yazıcıya gönderildi' : (r.error && r.error !== 'cancelled' && r.error !== 'Print job canceled' ? Promise.reject(new Error(r.error)) : null)), '');
  $('#pdf').onclick = () => is(() => api.pdf({ html: SON_HTML, ad: ad(), sor: true }), 'PDF kaydedildi');
  $('#xls').onclick = () => is(() => api.exportExcel({ models: SON_MODELS, settings: D.settings, ad: ad(), sor: true }), 'Excel dosyası kaydedildi');
}
// Tam ekran baskı önizleme: sayfaları büyük gösterir, oradan yazıcıya gönderilir
function baskiOnizleme() {
  if (!SON_HTML) return toast('Önce bir rapor seçin.', 'err');
  const ov = document.createElement('div'); ov.className = 'pv';
  ov.innerHTML = `<div class="pv-bar"><div class="pv-t"><b>${ic('printer')} Baskı Önizleme</b><span>${esc(RAPOR_IS.ad || '')} • ${esc($('#sayfa').textContent)} • A4</span></div><span class="sp"></span>
    <select class="inp" id="pvz"><option value="fit">Sayfaya sığdır</option><option value="0.5">%50</option><option value="0.75">%75</option><option value="1">%100</option><option value="1.25">%125</option></select>
    <button class="btn" id="pvx">${ic('table')}Excel</button><button class="btn" id="pvp">${ic('pdf')}PDF</button>
    <button class="btn ok" id="pvy">${ic('printer')}Yazdır</button><button class="btn" id="pvk">${ic('x')}Kapat</button></div>
    <iframe class="pv-frame" sandbox="allow-same-origin"></iframe>`;
  document.body.appendChild(ov);
  const fr = $('iframe', ov); let z = 'fit';
  const uygula = () => {
    try {
      const b = fr.contentDocument.body; let zz = z;
      if (zz === 'fit') { b.style.setProperty('--zoom', 1); const p = b.querySelector('.page'); zz = p ? Math.max(0.3, Math.min(1.5, (fr.clientWidth - 60) / p.offsetWidth)) : 1; }
      b.style.setProperty('--zoom', zz);
    } catch (e) { /* yoksay */ }
  };
  fr.onload = uygula; fr.srcdoc = SON_HTML;
  const kapat = () => { ov.remove(); document.removeEventListener('keydown', tus); window.removeEventListener('resize', uygula); };
  const tus = e => { if (e.key === 'Escape') kapat(); if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') { e.preventDefault(); RAPOR_IS.yaz(); } };
  document.addEventListener('keydown', tus); window.addEventListener('resize', uygula);
  $('#pvz', ov).onchange = e => { z = e.target.value === 'fit' ? 'fit' : +e.target.value; uygula(); };
  $('#pvy', ov).onclick = () => RAPOR_IS.yaz();
  $('#pvp', ov).onclick = () => RAPOR_IS.pdf();
  $('#pvx', ov).onclick = () => RAPOR_IS.xls();
  $('#pvk', ov).onclick = kapat;
  return ov;
}
function zoomUygula() {
  try {
    const f = $('#rf'), b = f.contentDocument.body;
    let z = ZOOM;
    if (z === 'fit') { b.style.setProperty('--zoom', 1); const p = b.querySelector('.page'); z = p ? Math.max(0.3, Math.min(1.3, (f.clientWidth - 40) / p.offsetWidth)) : 1; }
    b.style.setProperty('--zoom', z);
  } catch (e) { /* yoksay */ }
}
window.addEventListener('resize', () => { if (PAGE === 'raporlar' && ZOOM === 'fit') zoomUygula(); });

// ================= AYARLAR =================
function ayarlar() {
  const st = D.settings, y0 = L.varsayilanYil();
  $('#pageSub').textContent = 'Okul bilgileri, ücretler, kullanıcı, yedekleme ve güncelleme';
  $('#page').innerHTML = `<div class="grid g2">
    <div class="card"><h3>${icTile('home', 'blue')}Okul ve kulüp bilgileri</h3><div class="form" id="okulF">
      <label class="f full">Okulun adı<input class="inp" name="okul" value="${esc(st.okul)}"></label>
      <label class="f">Sınıf / şube<input class="inp" name="sinif" list="sl3" value="${esc(st.sinif)}"></label>
      <label class="f">Eğitim-öğretim yılı<select class="inp" name="yil">${[y0 - 2, y0 - 1, y0, y0 + 1].map(y => `<option value="${y}" ${y === st.yil ? 'selected' : ''}>${y}-${y + 1}</option>`).join('')}</select></label>
      <label class="f full">Sınıf öğretmeni<input class="inp" name="ogretmen" value="${esc(st.ogretmen)}"></label>
      <label class="f">Kulübün adı<input class="inp" name="kulup" value="${esc(st.kulup)}"></label>
      <label class="f">Okul müdürü<input class="inp" name="mudur" value="${esc(st.mudur)}"></label>
      </div><datalist id="sl3">${L.sinifListesi().map(x => `<option value="${x}">`).join('')}</datalist></div>
    <div class="card"><h3>${icTile('coin', 'orange')}Ücret ve ödeme ayarları</h3><div class="form" id="ucretF">
      <label class="f">Aylık kulüp ücreti (₺)<input class="inp" name="ucret" value="${st.ucret}"></label>
      <label class="f">Kardeş indirimi (%)<input class="inp" name="kardesIndirim" value="${st.kardesIndirim}"></label>
      <label class="f">Son ödeme günü (her ayın)<input class="inp" type="number" min="1" max="28" name="sonOdemeGunu" value="${st.sonOdemeGunu}"></label>
      <label class="f">Kulübün başladığı ay<select class="inp" name="baslangicAy">${ayOpts(L.ilkAy(D))}</select></label>
      <div class="full hint">Son ödeme günü geçtiği hâlde ödemeyen öğrenciler ana sayfada ve Aidat sayfasında <b>gecikti</b> olarak uyarılır. Bir aya özel ücreti Aidat sayfasından değiştirebilirsiniz.</div></div></div>
  </div>
  <div style="margin:-4px 0 18px"><button class="btn pri" id="kayit">${ic('ok')}Bilgileri Kaydet</button></div>
  <div class="grid g3">
    <div class="card"><h3>${icTile('star', 'purple')}Güncelleme</h3><div id="upd"></div></div>
    <div class="card"><h3>${icTile('download', 'green')}Yedekleme</h3><p class="hint">Program her gün ilk kayıtta otomatik yedek alır. Başka bilgisayara taşımak için yedeği USB belleğe kaydedin.</p>
      <div style="display:flex;flex-direction:column;gap:8px"><button class="btn" id="yv">${ic('download')}Yedeği Dışa Aktar</button><button class="btn" id="yy">${ic('upload')}Yedekten Geri Yükle</button><button class="btn" id="vk">${ic('folder')}Veri Klasörünü Aç</button></div></div>
    <div class="card"><h3>${icTile('lock', 'red')}Kullanıcı ve şifre</h3><p class="hint">Kullanıcı: <b>${esc(USER)}</b></p>
      <div style="display:flex;flex-direction:column;gap:8px"><button class="btn" id="sd">${ic('lock')}Şifreyi Değiştir</button><button class="btn" id="kk">${ic('refresh')}Güvenlik Sorusunu Değiştir</button></div></div>
  </div>
  <div class="card hint">Veri dosyası: <b>${esc(INFO.veri)}</b><br>Kulüp Takip sürüm ${INFO.version} • ${INFO.platform === 'linux' ? 'Pardus / Linux' : 'Windows'} • Tüm veriler yalnızca bu bilgisayarda, Excel dosyasında saklanır.</div>`;
  $('#kayit').onclick = () => {
    const g = n => $(`[name=${n}]`, $('#page')).value.trim();
    const u = L.parsePara(g('ucret')), k = L.parsePara(g('kardesIndirim')), so = parseInt(g('sonOdemeGunu'), 10);
    if (!g('okul') || !g('sinif') || !g('ogretmen')) return toast('Okul, sınıf ve öğretmen adı boş olamaz.', 'err');
    if (isNaN(u) || u < 0) return toast('Aylık ücret geçerli bir sayı olmalı.', 'err');
    if (isNaN(k) || k < 0 || k > 100) return toast('Kardeş indirimi 0-100 arasında olmalı.', 'err');
    if (!(so >= 1 && so <= 28)) return toast('Son ödeme günü 1-28 arasında olmalı.', 'err');
    Object.assign(st, { okul: g('okul'), sinif: g('sinif'), ogretmen: g('ogretmen'), kulup: g('kulup') || 'Kulüp', mudur: g('mudur'), yil: +g('yil'), ucret: u, kardesIndirim: k, sonOdemeGunu: so, baslangicAy: g('baslangicAy') });
    if (!L.yilAylari(st.yil).includes(st.baslangicAy)) st.baslangicAy = `${st.yil}-09`;
    $('#brandSinif').textContent = `${st.sinif} • ${st.kulup}`;
    aidAy = null; RP = null; degisti(); toast('Bilgiler kaydedildi.', 'ok'); ayarlar();
  };
  $('#yv').onclick = async () => { await kaydet(); const f = await api.backupExport(D); if (f) toast('Yedek kaydedildi: ' + f, 'ok', 6000); };
  $('#yy').onclick = async () => {
    const r = await api.backupImport(); if (!r) return; if (r.error) return bilgi('Yedek yüklenemedi', esc(r.error));
    const x = r.data;
    if (!await onayla(`Yedekteki bilgiler: <b>${esc(x.settings.okul)} • ${esc(x.settings.sinif)} • ${esc(x.settings.ogretmen)}</b><br>${x.students.length} öğrenci, ${x.payments.length} ödeme kaydı.<br><br>Şu anki tüm veriler bu yedekle <b>değiştirilecek</b> (eski hâli Yedekler klasöründe saklanır).`, 'Geri Yükle', 'danger')) return;
    const users = D.users; D = x; if (!D.users.length) D.users = users;
    degisti(); await kaydet(); toast('Yedek yüklendi.', 'ok'); USER = D.users[0].ad; uygulama();
  };
  $('#vk').onclick = () => api.openPath('veri');
  $('#sd').onclick = async () => {
    const ov = await modal('Şifreyi değiştir', `<div class="form"><label class="f full">Mevcut şifre<input class="inp" type="password" name="e"></label><label class="f">Yeni şifre<input class="inp" type="password" name="s1"></label><label class="f">Yeni şifre (tekrar)<input class="inp" type="password" name="s2"></label></div>`,
      [{ t: 'Vazgeç', v: null }, { t: 'Değiştir', cls: 'pri', check: async ov => { const u = D.users[0]; if (await ozet(val(ov, 'e'), u.salt) !== u.hash) { toast('Mevcut şifre hatalı.', 'err'); return false; } const h = sifreKontrol($('[name=s1]', ov).value, $('[name=s2]', ov).value); if (h) { toast(h, 'err'); return false; } return true; }, v: o => o }]);
    if (!ov) return; const u = D.users[0], hat = hatirlandi(); u.salt = rastgele(16); u.hash = await ozet($('[name=s1]', ov).value, u.salt); hatirlaYaz(hat); degisti(); toast('Şifre değiştirildi.', 'ok');
  };
  $('#kk').onclick = async () => {
    const u = D.users[0];
    const ov = await modal('Güvenlik sorusu', `<p class="hint">Şifrenizi unutursanız bu soru sorulur.${u.soru ? '' : ' Henüz güvenlik sorusu belirlenmemiş; şu an öğretmen adı ve sınıf ile şifre yenilenebiliyor.'}</p>
      <div class="form"><label class="f full">Mevcut şifre<input class="inp" type="password" name="e"></label>
      <label class="f full">Soru<select class="inp" name="soru">${SORULAR.map(s => `<option ${s === u.soru ? 'selected' : ''}>${esc(s)}</option>`).join('')}</select></label>
      <label class="f full">Cevap<input class="inp" name="cevap"></label></div>`,
      [{ t: 'Vazgeç', v: null }, { t: 'Kaydet', cls: 'pri', check: async ov => { if (await ozet(val(ov, 'e'), u.salt) !== u.hash) { toast('Mevcut şifre hatalı.', 'err'); return false; } if (cevapNorm(val(ov, 'cevap')).length < 2) { toast('Cevabı yazın.', 'err'); return false; } return true; }, v: o => o }]);
    if (!ov) return;
    u.soru = val(ov, 'soru'); u.cevapSalt = rastgele(16); u.cevapHash = await ozet(cevapNorm(val(ov, 'cevap')), u.cevapSalt);
    degisti(); toast('Güvenlik sorusu kaydedildi.', 'ok');
  };
  updCiz();
}
function updCiz() {
  const e = $('#upd'); if (!e) return;
  const u = UPD;
  let h = `<p class="hint">Yüklü sürüm: <b>${INFO.version}</b></p>`;
  if (u.durum === 'denetleniyor') h += '<div class="alert info">Yeni sürüm denetleniyor…</div>';
  else if (u.durum === 'yok') h += `<div class="alert ok">${ic('ok')}<div><b>Program güncel.</b>${esc(u.mesaj || '')}</div></div>`;
  else if (u.durum === 'var') h += `<div class="alert info">${ic('star')}<div><b>Yeni sürüm: ${esc(u.surum)}</b>İndirip kurmak için düğmeye basın.</div></div><button class="btn ok" id="indir">${ic('download')}İndir ve Kur</button>`;
  else if (u.durum === 'iniyor') h += `<div class="hint">İndiriliyor… %${u.yuzde || 0}</div><div class="bar"><i style="width:${u.yuzde || 0}%"></i></div>`;
  else if (u.durum === 'hazir') h += `<div class="alert ok">${ic('ok')}<div><b>Güncelleme indirildi.</b>${INFO.paket === 'deb' ? 'Kurulum sırasında bilgisayar şifreniz sorulacak.' : 'Program kapanıp yeni sürümle açılacak.'}</div></div><button class="btn ok" id="kur">${ic('refresh')}Şimdi Kur ve Yeniden Başlat</button>`;
  else if (u.durum === 'kuruluyor') h += '<div class="alert info">Kuruluyor… Şifre penceresi açıldıysa bilgisayar şifrenizi girin.</div>';
  else if (u.durum === 'kuruldu') h += '<div class="alert ok">Kuruldu, program yeniden başlatılıyor…</div>';
  else if (u.durum === 'hata') h += `<div class="alert bad">${ic('alert')}<div><b>Güncelleme yapılamadı</b>${esc(u.mesaj || '')}</div></div>`;
  if (!['iniyor', 'hazir', 'kuruluyor', 'kuruldu', 'var'].includes(u.durum)) h += `<button class="btn" id="den">${ic('refresh')}Güncellemeleri Denetle</button>`;
  e.innerHTML = h;
  const b = (id, fn) => { const x = $('#' + id); if (x) x.onclick = fn; };
  b('den', () => { UPD = { durum: 'denetleniyor' }; updCiz(); api.updateCheck(); });
  b('indir', () => { UPD = { durum: 'iniyor', yuzde: 0, surum: u.surum }; updCiz(); api.updateDownload(); });
  b('kur', async () => { await kaydet(); api.updateInstall(); });
}
api.onUpdate(s => {
  if (s.durum === 'sessiz') return;
  const onceki = UPD.durum; UPD = Object.assign({}, UPD, s);
  if (s.durum === 'var' && onceki !== 'var' && !$('#upd')) toast(`Yeni sürüm (${s.surum}) var. Ayarlar → Güncelleme bölümünden kurabilirsiniz.`, '', 8000);
  updCiz(); rozetler();
});

// ================= BAŞLAT =================
async function basla() {
  INFO = await api.info();
  const r = await api.load();
  if (r.error) {
    authEkran(`<form><h3>Veri dosyası okunamadı</h3><div class="alert bad">${ic('alert')}<div>${esc(r.error)}</div></div><p class="hint">Dosya başka bir programda (Excel/LibreOffice) açıksa kapatın ve tekrar deneyin. Dosya bozulduysa Yedekler klasöründeki son yedeği kullanabilirsiniz.</p>
      <button type="button" class="btn pri" id="tekrar">Tekrar Dene</button><button type="button" class="btn" id="kl">Veri Klasörünü Aç</button></form>`);
    $('#tekrar').onclick = basla; $('#kl').onclick = () => api.openPath('veri');
    return;
  }
  D = r.exists ? r.data : L.yeniVeri();
  if (SMOKE) return smoke();
  const st = D.settings;
  if (!st.okul || !st.sinif || !st.ogretmen) return kurulum(1);
  if (!D.users.length) return kurulum(2, true);
  if (hatirlandi()) { USER = D.users[0].ad; return uygulama(); }
  girisEkrani();
}

// ---------- otomatik test (CI) ----------
async function smoke() {
  const log = [], bekle = ms => new Promise(r => setTimeout(r, ms));
  const shot = async n => { await bekle(450); await api.smokeShot(n); log.push('ekran: ' + n); };
  try {
    kurulum(1); await shot('01_kurulum');
    const t = today(), y = L.varsayilanYil(t);
    Object.assign(D.settings, { okul: 'Atatürk İlkokulu', sinif: '2-B', ogretmen: 'Ayşe Yılmaz', kulup: 'Satranç Kulübü', mudur: 'Mehmet Demir', yil: y, ucret: 800, kardesIndirim: 50, sonOdemeGunu: 10, baslangicAy: `${y}-09` });
    await kullaniciKur('ayse', '1234', SORULAR[1], 'Atatürk');
    const adlar = ['Ali Kaya', 'Zeynep Çelik', 'Şule Güneş', 'Ömer İnce', 'Elif Şahin', 'Mehmet Öztürk', 'Ayşe Doğan', 'Can Arslan', 'Defne Koç', 'Yusuf Aydın', 'Ece Kılıç', 'Emir Yıldız'];
    adlar.forEach((a, i) => D.students.push({ id: i + 1, no: String(100 + i), adSoyad: a, veliAd: 'Veli ' + a.split(' ')[1], veliTel: '0532 000 00 ' + L.pad(i), kardes: i === 1 || i === 6, kardesAd: i === 1 ? 'Can Çelik' : i === 6 ? 'Ali Doğan' : '', kardesSinif: i === 1 ? '4-A' : i === 6 ? '1-C' : '', burslu: i === 2, baslangicAy: i === 11 ? L.ayKey(t) : `${y}-09`, bitisAy: '', not: '' }));
    const aylar = L.yilAylari(y).filter(a => a <= L.ayKey(t));
    for (const a of aylar) for (const s of D.students) { if (s.id % 4 === 0 && a === L.ayKey(t)) continue; if (s.id === 5 && a !== aylar[0]) continue; const b = L.borc(D, s, a); if (b) L.odemeEkle(D, s.id, a, s.id === 8 ? b / 2 : b, a + '-05', ''); }
    for (let i = 0; i < 10; i++) { const d = L.addDays(t, -i); if (d.getDay() === 0 || d.getDay() === 6) continue; D.students.forEach(s => L.yoklamaYaz(D, L.gunKey(d), s.id, s.id % 5 === 0 ? 'Gelmedi' : s.id === 7 && i === 1 ? 'İzinli' : 'Geldi')); }
    L.ayrildiIsaretle(D, D.students[9], aylar[Math.max(0, aylar.length - 2)]);
    dirty = true; if (!await kaydet()) throw new Error('kaydetme başarısız');
    girisEkrani(); await shot('02_giris');
    sifreYenile(); await shot('02b_sifre_yenile');
    USER = 'ayse'; uygulama(); await shot('03_panel');
    for (const p of ['ogrenciler', 'yoklama', 'aidat', 'ayarlar']) { git(p); await shot('04_' + p); }
    git('raporlar');
    for (const tr of R.TURLER) {
      RP.id = tr.id; RP.ogrenci = 2; raporCiz();
      if (!SON_HTML) throw new Error('rapor oluşmadı: ' + tr.id);
      log.push(`rapor ${tr.id}: ${$('#sayfa').textContent}`);
      if (['aylikAidat', 'toplu', 'mektup', 'haftalik'].includes(tr.id)) { await bekle(900); log.push('  zoom=' + ($('#rf').contentDocument.body.style.getPropertyValue('--zoom')) + ' sayfa=' + $('#rf').contentDocument.querySelectorAll('.page').length); await shot('05_rapor_' + tr.id); }
      await api.exportExcel({ models: SON_MODELS, settings: D.settings, ad: 'test_' + tr.id, sor: false });
      if (['aylikAidat', 'aylikYoklama', 'toplu', 'mektup'].includes(tr.id)) await api.pdf({ html: SON_HTML, ad: 'test_' + tr.id, sor: false });
    }
    RP.id = 'aylikAidat'; raporCiz(); await bekle(700);
    const pv = baskiOnizleme(); await bekle(1200); await shot('06_baski_onizleme'); pv.remove();
    log.push('baski onizleme: OK');
    const r = await api.load();
    if (!r.data || r.data.students.length !== 12 || r.data.payments.length !== D.payments.length || !r.data.users.length) throw new Error('geri okuma uyuşmuyor');
    log.push('kaydet/oku: OK ' + r.data.students.length + ' öğrenci, ' + r.data.payments.length + ' ödeme');
    log.push('TAMAM');
    await api.smokeDone({ ok: true, log: log.join('\n') });
  } catch (e) {
    log.push('HATA: ' + (e && e.stack || e));
    await api.smokeDone({ ok: false, log: log.join('\n') });
  }
}
window.addEventListener('error', e => { if (SMOKE) api.smokeDone({ ok: false, log: 'window error: ' + e.message }); });
basla();
