/* Kulüp Takip - rapor modelleri ve sayfalı HTML (baskı önizleme) */
(function (root, factory) {
  const R = factory(root.L || (typeof require === 'function' ? require('./logic') : null));
  if (typeof module === 'object' && module.exports) module.exports = R;
  else root.R = R;
})(typeof self !== 'undefined' ? self : this, function (L) {
  'use strict';
  const m = (v, cls, bold) => ({ v: L.r2(v), cls, bold, money: true });
  const t = (v, cls, bold) => ({ v, cls, bold });
  const durumCls = k => ({ odendi: 'ok', fazla: 'ok', kismi: 'warn', odenmedi: 'warn', gecikti: 'bad', burslu: 'muted', ucretsiz: 'muted', kayitdisi: 'muted' })[k] || '';
  const yCls = d => d === 'Geldi' ? 'ok' : d === 'Gelmedi' ? 'bad' : d ? 'warn' : '';
  // Türkçe ilgi eki: Ali Yılmaz'ın, Zeynep Çelik'in, Ece'nin
  function iyelik(ad) {
    const w = String(ad).trim(), low = w.toLocaleLowerCase('tr-TR');
    const sesli = [...low].filter(c => 'aeıioöuü'.includes(c)).pop() || 'e';
    const ek = { a: 'ın', 'ı': 'ın', e: 'in', i: 'in', o: 'un', u: 'un', 'ö': 'ün', 'ü': 'ün' }[sesli];
    return w + "'" + ('aeıioöuü'.includes(low.slice(-1)) ? 'n' : '') + ek;
  }
  const C = (label, w, align, extra) => Object.assign({ label, w, align: align || 'left' }, extra || {});
  const M = (label, w) => C(label, w, 'right', { money: true, xw: 14 });

  // ================== RAPOR TANIMLARI ==================
  const TURLER = [
    { id: 'gunluk', ad: 'Günlük Rapor', acik: 'Seçilen günün yoklama listesi ve o gün alınan ödemeler', grup: 'Yoklama', param: 'gun' },
    { id: 'haftalik', ad: 'Haftalık Rapor', acik: 'Haftanın yoklama çizelgesi ve haftalık tahsilat', grup: 'Yoklama', param: 'gun' },
    { id: 'aylikYoklama', ad: 'Aylık Yoklama Çizelgesi', acik: 'Ayın tüm iş günleri, devam yüzdeleri', grup: 'Yoklama', param: 'ay' },
    { id: 'aylikAidat', ad: 'Aylık Aidat / İdareye Teslim', acik: 'Kim ne ödedi, indirimler, idareye teslim edilecek tutar', grup: 'Aidat', param: 'ay' },
    { id: 'paket', ad: 'Ay Sonu İdare Paketi', acik: 'Aylık aidat raporu ve aylık yoklama çizelgesi birlikte', grup: 'Aidat', param: 'ay' },
    { id: 'toplu', ad: 'Toplu Aidat Listesi', acik: 'Yıl başından seçilen aya kadar ay ay ödemeler ve aylık özet', grup: 'Aidat', param: 'ay' },
    { id: 'borclular', ad: 'Gecikmiş Ödemeler Listesi', acik: 'Son ödeme tarihi geçmiş, borcu kalan öğrenciler', grup: 'Aidat', param: 'gun' },
    { id: 'mektup', ad: 'Veli Hatırlatma Mektupları', acik: 'Borcu olan her öğrencinin velisine hatırlatma yazısı (sayfada 2 adet)', grup: 'Aidat', param: 'gun' },
    { id: 'tahsilat', ad: 'Tahsilat Dökümü', acik: 'İki tarih arasında alınan tüm ödemeler', grup: 'Aidat', param: 'aralik' },
    { id: 'makbuz', ad: 'Ödeme Makbuzu', acik: 'Seçilen öğrenci ve ay için makbuz (veli ve öğretmen nüshası)', grup: 'Öğrenci', param: 'ogrenciAy' },
    { id: 'ekstre', ad: 'Öğrenci Hesap Dökümü', acik: 'Bir öğrencinin tüm aylardaki ödeme ve devam durumu', grup: 'Öğrenci', param: 'ogrenci' },
    { id: 'liste', ad: 'Öğrenci Listesi', acik: 'Veli, telefon, kardeş ve burs bilgileriyle liste', grup: 'Öğrenci', param: '' }
  ];

  function olustur(id, data, p, today) {
    today = today || L.bugun();
    switch (id) {
      case 'gunluk': return [gunlukYoklama(data, p.gun), tahsilat(data, p.gun, p.gun, 'GÜNLÜK TAHSİLAT LİSTESİ')];
      case 'haftalik': return haftalik(data, p.gun);
      case 'aylikYoklama': return [aylikYoklama(data, p.ay)];
      case 'aylikAidat': return [aylikAidat(data, p.ay, today)];
      case 'paket': return [aylikAidat(data, p.ay, today), aylikYoklama(data, p.ay)];
      case 'toplu': return toplu(data, p.ay, today);
      case 'borclular': return [borclular(data, L.parseGun(p.gun))];
      case 'mektup': return [mektuplar(data, L.parseGun(p.gun))];
      case 'tahsilat': return [tahsilat(data, p.bas, p.bit, 'TAHSİLAT DÖKÜMÜ')];
      case 'makbuz': return [makbuz(data, p.ogrenci, p.ay)];
      case 'ekstre': return [ekstre(data, p.ogrenci, today)];
      case 'liste': return [liste(data)];
    }
    throw new Error('Bilinmeyen rapor: ' + id);
  }

  // ---------- yoklama ----------
  function gunlukYoklama(data, gun) {
    const list = L.aktifler(data, gun.slice(0, 7));
    const c = L.yoklamaSay(data, gun, list);
    return {
      title: 'GÜNLÜK YOKLAMA LİSTESİ', sheet: 'Günlük Yoklama', subtitle: L.tarihUzun(gun), signatures: ['Düzenleyen', 'Onaylayan'],
      blocks: [
        { type: 'table', columns: [C('Sıra', 6, 'center'), C('No', 8, 'center'), C('Adı Soyadı', 40), C('Durum', 16, 'center'), C('Açıklama', 30)],
          rows: list.map((s, i) => { const d = L.yoklama(data, gun, s.id); return [i + 1, s.no, s.adSoyad, t(d || 'İşlenmedi', yCls(d)), s.burslu ? 'Burslu' : '']; }) },
        { type: 'summary', title: 'Özet', items: [['Toplam öğrenci', list.length, 'count'], ['Geldi', c.Geldi, 'count'], ['Gelmedi', c.Gelmedi, 'count'], ['İzinli', c['İzinli'], 'count'], ['Raporlu', c.Raporlu, 'count'], ['Yoklaması işlenmemiş', c.bos, 'count']] }
      ]
    };
  }

  function cizelge(data, gunler, title, subtitle, sheet) {
    const kisa = gunler.length > 7;
    const ogr = L.sirala(data.students.filter(s => gunler.some(g => L.aktif(s, g.slice(0, 7)))));
    const gunGeldi = gunler.map(() => 0);
    const rows = ogr.map((s, i) => {
      let g = 0, y = 0, iz = 0;
      const cells = gunler.map((gun, j) => {
        const d = L.aktif(s, gun.slice(0, 7)) ? L.yoklama(data, gun, s.id) : '';
        if (d === 'Geldi') { g++; gunGeldi[j]++; } else if (d === 'Gelmedi') y++; else if (d) iz++;
        return t(L.KISA[d] || '', yCls(d));
      });
      const top = g + y + iz;
      return [i + 1, s.no, s.adSoyad, ...cells, g, y, iz, top ? '%' + Math.round(100 * g / top) : '-'];
    });
    const n = gunler.length;
    const cols = [C('Sıra', 5, 'center'), C('No', 6, 'center'), C('Adı Soyadı', kisa ? 30 : 34),
      ...gunler.map(g => { const d = L.parseGun(g); return C(kisa ? `${d.getDate()}\n${L.GUNLER_KISA[d.getDay()]}` : `${L.pad(d.getDate())}.${L.pad(d.getMonth() + 1)}\n${L.GUNLER[d.getDay()]}`, kisa ? 3.4 : 11, 'center', { xw: kisa ? 4.5 : 11 }); }),
      C('Geldi', 6, 'center'), C('Gelm.', 6, 'center'), C('İz/Rap', 6, 'center'), C('Devam', 7, 'center')];
    return {
      title, subtitle, sheet, landscape: true, signatures: ['Düzenleyen', 'Onaylayan'],
      blocks: [
        { type: 'table', columns: cols, rows, foot: [[t('Gelen öğrenci sayısı', '', true), '', '', ...gunGeldi, '', '', '', '']], footSpan: 3 },
        { type: 'note', text: 'G: Geldi   Y: Gelmedi (yok)   İ: İzinli   R: Raporlu   Boş: yoklama işlenmemiş' }
      ]
    };
  }

  function haftalik(data, gun) {
    const bas = L.haftaBasi(L.parseGun(gun));
    const gunler = [];
    for (let i = 0; i < 7; i++) { const g = L.gunKey(L.addDays(bas, i)); if (i < 5 || L.gunKayitli(data, g)) gunler.push(g); }
    const b = gunler[0], s = gunler[gunler.length - 1];
    return [cizelge(data, gunler, 'HAFTALIK YOKLAMA ÇİZELGESİ', `${L.trTarih(b)} - ${L.trTarih(s)}`, 'Haftalık Yoklama'), tahsilat(data, b, s, 'HAFTALIK TAHSİLAT LİSTESİ')];
  }

  function aylikYoklama(data, ay) {
    const gunler = [];
    for (let d = L.parseAy(ay); L.ayKey(d) === ay; d = L.addDays(d, 1)) {
      const g = L.gunKey(d);
      if ((d.getDay() !== 0 && d.getDay() !== 6) || L.gunKayitli(data, g)) gunler.push(g);
    }
    return cizelge(data, gunler, 'AYLIK YOKLAMA ÇİZELGESİ', L.ayAd(ay), 'Aylık Yoklama');
  }

  // ---------- aidat ----------
  function tahsilat(data, bas, bit, title) {
    const l = data.payments.filter(p => p.tarih >= bas && p.tarih <= bit).sort((a, b) => (a.tarih + a.id).localeCompare(b.tarih + b.id, 'tr'));
    const ad = id => data.students.find(s => s.id === id) || { adSoyad: '(silinmiş öğrenci)', no: '' };
    const top = l.reduce((x, p) => x + Number(p.tutar), 0);
    return {
      title, sheet: 'Tahsilat', subtitle: bas === bit ? L.tarihUzun(bas) : `${L.trTarih(bas)} - ${L.trTarih(bit)}`, signatures: ['Teslim Eden', 'Teslim Alan'],
      blocks: [
        { type: 'table', columns: [C('Sıra', 5, 'center'), C('Tarih', 11, 'center'), C('No', 7, 'center'), C('Adı Soyadı', 32), C('Ait Olduğu Ay', 15, 'center'), M('Tutar', 13), C('Not', 17)],
          rows: l.length ? l.map((p, i) => [i + 1, L.trTarih(p.tarih), ad(p.ogrenciId).no, ad(p.ogrenciId).adSoyad, L.ayAd(p.ay), m(p.tutar, p.tutar < 0 ? 'bad' : ''), p.not || '']) : [[t('Bu tarih aralığında tahsilat yapılmamış.', 'muted'), '', '', '', '', '', '']],
          foot: [[t('TOPLAM TAHSİL EDİLEN (İdareye teslim edilecek)', '', true), '', '', '', '', m(top, 'hl', true), '']], footSpan: 5 }
      ]
    };
  }

  function aylikAidat(data, ay, today) {
    const o = L.ozetAy(data, ay, today);
    const list = L.aktifler(data, ay);
    const ilk = ay + '-01', son = L.gunKey(new Date(L.parseAy(ay).getFullYear(), L.parseAy(ay).getMonth() + 1, 0));
    const elden = data.payments.filter(p => p.tarih >= ilk && p.tarih <= son).reduce((x, p) => x + Number(p.tutar), 0);
    return {
      title: 'AYLIK KULÜP ÜCRETİ TAHSİLAT VE İDAREYE TESLİM RAPORU', sheet: 'Aylık Aidat', landscape: true,
      subtitle: `${L.ayAd(ay)}  •  Aylık ücret: ${L.para(o.ucret)}  •  Son ödeme tarihi: ${L.trTarih(L.sonOdemeTarihi(data, ay))}`,
      signatures: ['Teslim Eden', 'Teslim Alan'],
      blocks: [
        { type: 'table', columns: [C('Sıra', 4, 'center'), C('No', 5, 'center'), C('Adı Soyadı', 22), C('Veli', 16), C('Ücret Türü', 11), C('Kardeşi / Sınıfı', 15), M('Ödenecek', 10), M('Ödenen', 10), M('Kalan', 10), C('Durum', 17, 'center')],
          rows: list.map((s, i) => {
            const b = L.borc(data, s, ay), od = L.odenen(data, s.id, ay), d = L.durum(data, s, ay, today);
            return [i + 1, s.no, s.adSoyad, s.veliAd, t(L.tur(data, s), s.burslu ? 'muted' : ''), s.kardes ? `${s.kardesAd || ''}${s.kardesSinif ? ' (' + s.kardesSinif + ')' : ''}` : '',
              m(b), m(od, durumCls(d.kod)), m(Math.max(0, b - od), b - od > 0 ? 'bad' : ''), t(d.text, durumCls(d.kod))];
          }),
          foot: [[t('TOPLAM', '', true), '', '', '', '', '', m(o.borc), m(o.tahsil), m(o.kalan), '']], footSpan: 6 },
        { type: 'summary', title: 'Özet', items: [
          ['Kulübe kayıtlı öğrenci', o.ogrenci, 'count'], ['Tam ücretli öğrenci', o.normal, 'count'],
          [`Kardeş indirimli öğrenci (%${data.settings.kardesIndirim})`, o.kardes, 'count'], ['Burslu (ücretsiz) öğrenci', o.burslu, 'count'],
          ['Ödeyen / Kısmi / Ödemeyen', `${o.odeyen} / ${o.kismi} / ${o.odemeyen}`, 'count'], ['Kişi başı aylık ücret', o.ucret],
          ['Kardeş indirimi toplamı', o.kardesInd], ['Burs muafiyeti toplamı', o.bursMuaf], ['Tahsil edilmesi gereken toplam', o.borc],
          ['İDAREYE TESLİM EDİLECEK TUTAR', o.tahsil, 'hl'], ['Tahsil edilemeyen (kalan) tutar', o.kalan], ['Ay içinde alınan (tüm aylar)*', L.r2(elden)]] },
        { type: 'note', text: '* Ödeme tarihine göre bu ay içinde elden alınan para; geçmiş veya ileri aylara ait ödemeler dahildir.' }
      ]
    };
  }

  function toplu(data, sonAy, today) {
    const aylar = L.raporAylari(data, sonAy);
    const aralik = `${L.ayAd(aylar[0])} - ${L.ayAd(aylar[aylar.length - 1])}`;
    // aylara göre özet
    let sB = 0, sO = 0;
    const ozRows = aylar.map(a => {
      const o = L.ozetAy(data, a, today); sB += o.borc; sO += o.tahsil;
      return [L.ayAd(a), o.ogrenci, o.burslu, o.kardes, m(o.ucret), m(o.borc), m(o.tahsil, 'ok'), m(o.kalan, o.kalan > 0 ? 'bad' : ''), o.borc ? '%' + Math.round(100 * o.tahsil / o.borc) : '-'];
    });
    const ozet = {
      title: 'AYLARA GÖRE TAHSİLAT ÖZETİ (İDAREYE TESLİM)', sheet: 'Aylık Özet', subtitle: aralik, signatures: ['Teslim Eden', 'Teslim Alan'],
      blocks: [{ type: 'table', columns: [C('Ay', 14), C('Öğrenci', 8, 'center'), C('Burslu', 7, 'center'), C('Kardeş', 7, 'center'), M('Aylık Ücret', 11), M('Ödenecek', 12), M('Tahsil Edilen\n(İdareye Teslim)', 14), M('Kalan', 11), C('Tahsil %', 8, 'center')],
        rows: ozRows, foot: [[t('GENEL TOPLAM', '', true), '', '', '', '', m(sB), m(sO, 'hl'), m(Math.max(0, sB - sO)), sB ? '%' + Math.round(100 * sO / sB) : '-']], footSpan: 5 }]
    };
    const ogr = L.sirala(data.students.filter(s => aylar.some(a => L.aktif(s, a) || L.odenen(data, s.id, a) !== 0)));
    const ayTop = aylar.map(() => 0);
    let gB = 0, gO = 0;
    const rows = ogr.map((s, i) => {
      let tb = 0, to = 0;
      const cells = aylar.map((a, j) => {
        const o = L.odenen(data, s.id, a), d = L.durum(data, s, a, today);
        ayTop[j] += o; tb += L.borc(data, s, a); to += o;
        if (d.kod === 'kayitdisi' && !o) return t('-', '', false);
        if (d.kod === 'burslu') return t('Burslu', 'muted');
        return m(o, durumCls(d.kod));
      });
      gB += tb; gO += to;
      return [i + 1, s.no, s.adSoyad, t(L.tur(data, s), s.burslu ? 'muted' : ''), ...cells, m(tb), m(to), m(Math.max(0, tb - to), tb - to > 0 ? 'bad' : '')];
    });
    const liste = {
      title: 'TOPLU KULÜP ÜCRETİ LİSTESİ', sheet: 'Toplu Aidat Listesi', subtitle: aralik, landscape: true, signatures: ['Düzenleyen', 'Onaylayan'],
      blocks: [
        { type: 'table', columns: [C('Sıra', 4, 'center'), C('No', 5, 'center'), C('Adı Soyadı', 22), C('Ücret Türü', 11), ...aylar.map(a => M(L.ayAd(a).replace(' ', '\n'), 9)), M('Toplam\nÖdenecek', 10), M('Toplam\nÖdenen', 10), M('Kalan\nBorç', 10)],
          rows, foot: [[t('AYLIK TAHSİLAT TOPLAMI', '', true), '', '', '', ...ayTop.map(v => m(v)), m(gB), m(gO, 'hl'), m(Math.max(0, gB - gO))]], footSpan: 4 },
        { type: 'note', text: 'Yeşil: ödendi   Sarı: kısmi / süresi dolmamış   Kırmızı: gecikmiş   Gri: burslu   -: o ay kulüpte değil' }
      ]
    };
    return [ozet, liste];
  }

  function borclular(data, today) {
    const g = L.gecikenler(data, today);
    const top = g.reduce((x, y) => x + y.toplam, 0);
    return {
      title: 'GECİKMİŞ KULÜP ÖDEMELERİ LİSTESİ', sheet: 'Gecikmiş Ödemeler', subtitle: `${L.trTarih(today)} itibarıyla son ödeme tarihi geçmiş borçlar`, landscape: true, signatures: ['Düzenleyen', 'Onaylayan'],
      blocks: [
        { type: 'table', columns: [C('Sıra', 4, 'center'), C('No', 5, 'center'), C('Adı Soyadı', 20), C('Veli', 15), C('Telefon', 12), C('Geciken Aylar', 32), C('En Uzun\nGecikme', 8, 'center'), M('Toplam Borç', 11)],
          rows: g.length ? g.map((x, i) => [i + 1, x.s.no, x.s.adSoyad, x.s.veliAd, x.s.veliTel, x.aylar.map(a => `${L.ayAd(a.ay)} (${L.para(a.kalan)})`).join(', '), Math.max(...x.aylar.map(a => a.gecikme)) + ' gün', m(x.toplam, 'bad')])
            : [[t('Gecikmiş ödeme yok. Tebrikler!', 'ok'), '', '', '', '', '', '', '']],
          foot: [[t(`TOPLAM (${g.length} öğrenci)`, '', true), '', '', '', '', '', '', m(top, 'bad')]], footSpan: 7 }
      ]
    };
  }

  function mektuplar(data, today) {
    const st = data.settings;
    const g = L.gecikenler(data, today);
    const blocks = g.map(x => ({
      type: 'letter',
      lines: [
        `Sayın ${x.s.veliAd || 'Veli'},`,
        `${st.sinif} sınıfı öğrencimiz ${iyelik(x.s.adSoyad)} kulüp (${st.kulup}) ücretlerinden aşağıda belirtilen tutarlar son ödeme tarihi geçtiği hâlde henüz ödenmemiştir.`,
        ...x.aylar.map(a => `•  ${L.ayAd(a.ay)}: ${L.para(a.kalan)}  (son ödeme tarihi ${L.trTarih(L.sonOdemeTarihi(data, a.ay))})`),
        `Toplam ödenmesi gereken tutar: ${L.para(x.toplam)}`,
        'Ödemenin en kısa sürede sınıf öğretmenine yapılmasını rica ederim. Ödeme yaptıysanız bu yazıyı dikkate almayınız.',
        `${L.trTarih(today)}`,
        `${st.ogretmen} — ${st.sinif} Sınıf Öğretmeni`
      ]
    }));
    return {
      title: 'VELİ ÖDEME HATIRLATMA YAZILARI', sheet: 'Hatırlatma', subtitle: `${g.length} öğrenci • ${L.trTarih(today)}`, letters: true,
      blocks: blocks.length ? blocks : [{ type: 'note', text: 'Son ödeme tarihi geçmiş borcu olan öğrenci bulunmuyor.' }]
    };
  }

  function makbuz(data, id, ay) {
    const s = data.students.find(x => x.id === +id);
    if (!s) throw new Error('Öğrenci seçin.');
    const st = data.settings, od = L.odenen(data, s.id, ay), b = L.borc(data, s, ay), ps = L.odemeler(data, s.id, ay);
    const lines = nusha => [
      `KULÜP ÜCRETİ ÖDEME MAKBUZU — ${nusha}`,
      `Öğrenci: ${s.adSoyad}${s.no ? ' (No: ' + s.no + ')' : ''}   •   Sınıf: ${st.sinif}   •   Kulüp: ${st.kulup}`,
      `Ait olduğu ay: ${L.ayAd(ay)}   •   Ücret türü: ${L.tur(data, s)}`,
      `Ödenecek: ${L.para(b)}   •   Ödenen: ${L.para(od)}   •   Kalan: ${L.para(Math.max(0, b - od))}`,
      ps.length ? 'Ödemeler: ' + ps.map(p => `${L.trTarih(p.tarih)} ${L.para(p.tutar)}`).join(', ') : 'Bu ay için ödeme kaydı yok.',
      `Yalnız ${L.para(od)} tahsil edilmiştir.`,
      `Teslim alan: ${st.ogretmen} (Sınıf Öğretmeni)                                İmza: ......................`
    ];
    return { title: 'ÖDEME MAKBUZU', sheet: 'Makbuz', subtitle: `${s.adSoyad} • ${L.ayAd(ay)}`, letters: true, blocks: [{ type: 'letter', lines: lines('VELİ NÜSHASI') }, { type: 'letter', lines: lines('ÖĞRETMEN NÜSHASI') }] };
  }

  function ekstre(data, id, today) {
    const s = data.students.find(x => x.id === +id);
    if (!s) throw new Error('Öğrenci seçin.');
    const aylar = L.yilAylari(data.settings.yil).filter(a => a <= L.ayKey(today) && (L.aktif(s, a) || L.odenen(data, s.id, a)));
    let tb = 0, to = 0;
    const rows = aylar.map(a => {
      const b = L.borc(data, s, a), o = L.odenen(data, s.id, a), d = L.durum(data, s, a, today);
      tb += b; to += o;
      const gel = Object.keys(data.attendance).filter(k => k.startsWith(a) && k.endsWith('|' + s.id));
      const g = gel.filter(k => data.attendance[k] === 'Geldi').length, y = gel.filter(k => data.attendance[k] === 'Gelmedi').length;
      return [L.ayAd(a), L.trTarih(L.sonOdemeTarihi(data, a)), m(b), m(o, durumCls(d.kod)), m(Math.max(0, b - o), b - o > 0 ? 'bad' : ''), t(d.text, durumCls(d.kod)), `${g} / ${y}`];
    });
    const ps = L.odemeler(data, s.id).slice().sort((a, b) => a.tarih.localeCompare(b.tarih));
    return {
      title: 'ÖĞRENCİ HESAP DÖKÜMÜ', sheet: 'Hesap Dökümü', signatures: ['Düzenleyen', 'Onaylayan'],
      subtitle: `${s.adSoyad}${s.no ? ' • No ' + s.no : ''} • ${L.tur(data, s)}${s.kardes && s.kardesSinif ? ' • Kardeşi: ' + (s.kardesAd || '') + ' (' + s.kardesSinif + ')' : ''}${s.bitisAy ? ' • Ayrıldı: ' + L.ayAd(s.bitisAy) : ''}`,
      blocks: [
        { type: 'table', title: 'Aylık durum', columns: [C('Ay', 14), C('Son Ödeme', 11, 'center'), M('Ödenecek', 12), M('Ödenen', 12), M('Kalan', 12), C('Durum', 20, 'center'), C('Geldi / Gelmedi', 11, 'center')],
          rows: rows.length ? rows : [[t('Kayıt yok', 'muted'), '', '', '', '', '', '']], foot: [[t('TOPLAM', '', true), '', m(tb), m(to), m(Math.max(0, tb - to), tb - to > 0 ? 'bad' : ''), '', '']], footSpan: 2 },
        { type: 'table', title: 'Ödeme hareketleri', columns: [C('Tarih', 14, 'center'), C('Ait Olduğu Ay', 18), M('Tutar', 14), C('Not', 40)],
          rows: ps.length ? ps.map(p => [L.trTarih(p.tarih), L.ayAd(p.ay), m(p.tutar), p.not || '']) : [[t('Ödeme yok', 'muted'), '', '', '']] }
      ]
    };
  }

  function liste(data) {
    const all = L.sirala(data.students);
    const dev = all.filter(s => !s.bitisAy);
    return {
      title: 'KULÜP ÖĞRENCİ LİSTESİ', sheet: 'Öğrenci Listesi', subtitle: `${dev.length} öğrenci devam ediyor`, landscape: true, signatures: ['Düzenleyen', 'Onaylayan'],
      blocks: [
        { type: 'table', columns: [C('Sıra', 4, 'center'), C('No', 5, 'center'), C('Adı Soyadı', 20), C('Veli Adı', 16), C('Telefon', 12), C('Ücret Türü', 11), C('Kardeşi', 15), C('Kardeş Sınıfı', 9), C('Başlangıç', 11), C('Durum', 13)],
          rows: all.map((s, i) => [i + 1, s.no, s.adSoyad, s.veliAd, s.veliTel, t(L.tur(data, s), s.burslu ? 'muted' : ''), s.kardes ? s.kardesAd : '', s.kardes ? s.kardesSinif : '', L.ayAd(s.baslangicAy), t(s.bitisAy ? 'Ayrıldı (' + L.ayAd(s.bitisAy) + ')' : 'Devam', s.bitisAy ? 'muted' : '')]) },
        { type: 'summary', items: [['Devam eden', dev.length, 'count'], ['Burslu', dev.filter(s => s.burslu).length, 'count'], ['Kardeş indirimli', dev.filter(s => s.kardes && !s.burslu).length, 'count'], ['Ayrılan', all.length - dev.length, 'count']] }
      ]
    };
  }

  // ================== SAYFALI HTML ==================
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const cv = c => (c !== null && typeof c === 'object') ? c : { v: c };
  const show = (c, col) => { c = cv(c); if (c.v === '' || c.v === null || c.v === undefined) return ''; return (c.money || (col && col.money && typeof c.v === 'number')) ? L.para(c.v) : String(c.v); };

  const ROW = 6.3, HEAD1 = 6.8, HEAD2 = 10, TTL = 7, GAP = 4, SUM = 5.6, SIG = 27, FOOT = 7, BIGHDR = 27, SMALLHDR = 10;

  function sayfala(model) {
    const W = model.landscape ? 297 : 210, H = model.landscape ? 210 : 297;
    const usable = H - 20 - FOOT;
    const pages = [{ items: [], h: BIGHDR }];
    let cur = pages[0];
    const yeni = () => { cur = { items: [], h: SMALLHDR }; pages.push(cur); };
    const kalan = () => usable - cur.h;
    for (const b of model.blocks) {
      if (b.type === 'table') {
        const hh = b.columns.some(c => c.label.includes('\n')) ? HEAD2 : HEAD1;
        const all = b.rows.map(r => ({ cells: r.cells || r })).concat((b.foot || []).map(f => ({ cells: f, foot: true })));
        let i = 0, first = true;
        while (i < all.length || first) {
          const titleH = b.title ? TTL : 0;
          if (kalan() < titleH + hh + ROW) yeni();
          const fit = Math.max(1, Math.floor((kalan() - titleH - hh) / ROW));
          const chunk = all.slice(i, i + fit);
          cur.items.push({ type: 'table', b, rows: chunk, title: b.title ? b.title + (first ? '' : ' (devam)') : '', hh });
          cur.h += titleH + hh + chunk.length * ROW + GAP;
          i += chunk.length; first = false;
          if (i < all.length) yeni();
        }
      } else if (b.type === 'summary') {
        const h = (b.title ? TTL : 0) + b.items.length * SUM + GAP;
        if (kalan() < h) yeni();
        cur.items.push(b); cur.h += h;
      } else if (b.type === 'note') {
        const h = Math.ceil(b.text.length / (W / 1.7)) * 4.5 + GAP;
        if (kalan() < h) yeni();
        cur.items.push(b); cur.h += h;
      } else if (b.type === 'letter') {
        const h = (usable - BIGHDR + SMALLHDR) / 2 - 2;
        if (kalan() < h) yeni();
        cur.items.push(Object.assign({ h }, b)); cur.h += h;
      }
    }
    if (model.signatures) { if (kalan() < SIG) yeni(); cur.items.push({ type: 'sig' }); }
    return pages;
  }

  function tabloHtml(it) {
    const b = it.b, tw = b.columns.reduce((x, c) => x + c.w, 0);
    let h = it.title ? `<div class="btitle">${esc(it.title)}</div>` : '';
    h += `<table class="rt"><colgroup>${b.columns.map(c => `<col style="width:${(100 * c.w / tw).toFixed(2)}%">`).join('')}</colgroup>`;
    h += `<thead><tr style="height:${it.hh}mm">${b.columns.map(c => `<th>${esc(c.label).replace(/\n/g, '<br>')}</th>`).join('')}</tr></thead><tbody>`;
    for (const r of it.rows) {
      h += `<tr class="${r.foot ? 'foot' : ''}">`;
      const span = r.foot && b.footSpan ? b.footSpan : 1;
      r.cells.forEach((c, i) => {
        if (r.foot && i > 0 && i < span) return;
        const col = b.columns[i] || {}, x = cv(c);
        const cls = [x.cls || '', col.align || '', x.bold ? 'b' : ''].join(' ');
        h += `<td class="${cls}"${r.foot && i === 0 && span > 1 ? ` colspan="${span}"` : ''}>${esc(show(c, col))}</td>`;
      });
      h += '</tr>';
    }
    return h + '</tbody></table>';
  }

  function sayfaHtml(model, settings, page, no, toplam) {
    const st = settings;
    let h = `<section class="page${model.landscape ? ' land' : ''}"><div class="pin">`;
    if (no === 1) {
      h += `<header class="big"><div class="okul">${esc(st.okul.toLocaleUpperCase('tr-TR'))}</div>
        <div class="alt">${esc(st.kulup)} • ${esc(st.sinif)} Sınıfı • ${st.yil}-${st.yil + 1} Eğitim-Öğretim Yılı</div>
        <div class="baslik">${esc(model.title)}</div>
        <div class="bilgi">${esc(model.subtitle || '')}${model.subtitle ? '   •   ' : ''}Sınıf Öğretmeni: ${esc(st.ogretmen)}</div></header>`;
    } else h += `<header class="small">${esc(model.title)} <span>(devam)</span></header>`;
    for (const it of page.items) {
      if (it.type === 'table') h += tabloHtml(it);
      else if (it.type === 'summary') {
        h += `<div class="sum">${it.title ? `<div class="btitle">${esc(it.title)}</div>` : ''}<table>${it.items.map(x => {
          const v = typeof x[1] === 'number' && x[2] !== 'count' ? L.para(x[1]) : esc(x[1]);
          return `<tr class="${x[2] === 'hl' ? 'hl' : ''}"><th>${esc(x[0])}</th><td>${v}</td></tr>`;
        }).join('')}</table></div>`;
      } else if (it.type === 'note') h += `<div class="note">${esc(it.text)}</div>`;
      else if (it.type === 'letter') h += `<div class="letter" style="height:${it.h}mm">${it.lines.map((l, i) => `<p class="${i === 0 ? 'lt' : ''}">${esc(l)}</p>`).join('')}</div>`;
      else if (it.type === 'sig') {
        const s = model.signatures;
        h += `<div class="sig"><div><b>${esc(s[0])}</b><br>${esc(st.ogretmen)}<br>Sınıf Öğretmeni<br><br>İmza: ......................</div>
          <div><b>${esc(s[1])}</b><br>${st.mudur ? esc(st.mudur) : '&nbsp;'}<br>Okul Müdürü<br><br>İmza: ......................</div></div>`;
      }
    }
    h += `</div><footer><span>${esc(st.okul)} • ${esc(st.sinif)} • ${esc(st.kulup)}</span><span>Düzenlenme: ${L.trTarih(L.bugun())}</span><span>Sayfa ${no} / ${toplam}</span></footer></section>`;
    return h;
  }

  const CSS = `
  @page { size: A4 portrait; margin: 0 }
  @page land { size: A4 landscape; margin: 0 }
  * { box-sizing: border-box }
  html, body { margin: 0; padding: 0 }
  body { font-family: "Segoe UI", "Noto Sans", "DejaVu Sans", "Liberation Sans", Arial, sans-serif; color: #111; -webkit-print-color-adjust: exact; print-color-adjust: exact }
  .page { width: 210mm; height: 297mm; padding: 10mm 10mm 0; position: relative; overflow: hidden; background: #fff; break-after: page; page-break-after: always }
  .page.land { width: 297mm; height: 210mm; page: land }
  .page:last-child { break-after: auto; page-break-after: auto }
  .pin { height: calc(100% - 10mm - ${FOOT}mm); overflow: hidden }
  header.big { text-align: center; height: ${BIGHDR - 2}mm; margin-bottom: 2mm; border-bottom: 0.4mm solid #1f4e79 }
  header.big .okul { font-size: 14pt; font-weight: 700; letter-spacing: .3px }
  header.big .alt { font-size: 9.5pt; font-weight: 600; color: #333; margin-top: 1mm }
  header.big .baslik { font-size: 11.5pt; font-weight: 700; color: #1f4e79; margin-top: 1.5mm }
  header.big .bilgi { font-size: 8pt; color: #555; font-style: italic; margin-top: 1mm }
  header.small { height: ${SMALLHDR - 3}mm; margin-bottom: 3mm; font-size: 9pt; font-weight: 700; color: #1f4e79; border-bottom: .3mm solid #1f4e79; display: flex; align-items: flex-end; gap: 2mm }
  header.small span { color: #777; font-weight: 400 }
  .btitle { height: ${TTL}mm; line-height: ${TTL}mm; font-weight: 700; font-size: 10pt; color: #1f4e79 }
  table.rt { width: 100%; border-collapse: collapse; table-layout: fixed; margin-bottom: ${GAP}mm; font-size: 8.6pt }
  table.rt th { background: #d9e1f2; border: .25mm solid #8a8a8a; font-weight: 700; padding: 0 1mm; line-height: 1.15; text-align: center }
  table.rt td { height: ${ROW}mm; border: .25mm solid #8a8a8a; padding: 0 1.2mm; white-space: nowrap; overflow: hidden; text-overflow: ellipsis }
  table.rt tr.foot td { background: #ededed; font-weight: 700 }
  td.right { text-align: right } td.center { text-align: center } td.b { font-weight: 700 }
  td.ok { background: #c6efce } td.bad { background: #ffc7ce } td.warn { background: #ffeb9c } td.muted { background: #ededed; color: #555 } td.hl { background: #a9e3b5 !important; font-size: 9.5pt }
  .sum { width: 60%; margin-bottom: ${GAP}mm }
  .sum table { width: 100%; border-collapse: collapse; font-size: 8.8pt }
  .sum th { text-align: left; background: #ededed; border: .25mm solid #8a8a8a; padding: 0 1.5mm; height: ${SUM}mm }
  .sum td { text-align: right; border: .25mm solid #8a8a8a; padding: 0 1.5mm; font-weight: 700; width: 35% }
  .sum tr.hl th, .sum tr.hl td { background: #a9e3b5; font-size: 10pt }
  .note { font-size: 7.8pt; color: #555; font-style: italic; margin-bottom: ${GAP}mm }
  .letter { border: .3mm dashed #888; border-radius: 2mm; padding: 6mm 8mm; margin-bottom: 4mm; font-size: 10pt; line-height: 1.45; overflow: hidden }
  .letter p { margin: 0 0 2mm } .letter p.lt { font-weight: 700; color: #1f4e79 }
  .sig { display: flex; justify-content: space-around; text-align: center; font-size: 9.5pt; margin-top: 6mm; line-height: 1.5 }
  footer { position: absolute; left: 10mm; right: 10mm; bottom: 5mm; height: ${FOOT - 2}mm; border-top: .25mm solid #bbb; font-size: 7.5pt; color: #666; display: flex; justify-content: space-between; align-items: center }
  @media screen {
    body { background: #e6e9ef; padding: 6mm 0; zoom: var(--zoom, 1) }
    .page { margin: 0 auto 6mm; box-shadow: 0 2px 12px rgba(0,0,0,.18) }
  }`;

  function html(models, settings) {
    const all = [];
    for (const md of models) { const p = sayfala(md); p.forEach((pg, i) => all.push({ md, pg, i, n: p.length })); }
    const body = all.map(x => sayfaHtml(x.md, settings, x.pg, x.i + 1, x.n)).join('\n');
    return { html: `<!doctype html><html lang="tr"><head><meta charset="utf-8"><title>${esc(models[0].title)}</title><style>${CSS}</style></head><body>${body}</body></html>`, sayfa: all.length, landscape: !!models[0].landscape };
  }

  return { TURLER, olustur, html, sayfala };
});
