'use strict';
const path = require('path');
const fs = require('fs');
const os = require('os');
const L = require('../app/renderer/logic');
const R = require('../app/renderer/reports');
const store = require('../app/store');

let hata = 0;
function esit(a, b, ad) {
  const ok = JSON.stringify(a) === JSON.stringify(b);
  if (!ok) { hata++; console.log('HATA ' + ad + ': beklenen=' + JSON.stringify(b) + ' gelen=' + JSON.stringify(a)); } else console.log('ok   ' + ad);
}

(async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kulup-test-'));
  const D = L.yeniVeri();
  Object.assign(D.settings, { okul: 'Atatürk İlkokulu', sinif: '2-B', ogretmen: 'Ayşe Öğretmen', kulup: 'Satranç', mudur: 'Müdür Bey', yil: 2026, ucret: 800, kardesIndirim: 50, baslangicAy: '2026-09', sonOdemeGunu: 10 });
  D.students.push({ id: 1, no: '12', adSoyad: 'Ali Yılmaz', baslangicAy: '2026-09', bitisAy: '' });
  D.students.push({ id: 2, no: '5', adSoyad: 'Zeynep Çelik', kardes: true, kardesAd: 'Can', kardesSinif: '4-A', baslangicAy: '2026-09', bitisAy: '' });
  D.students.push({ id: 3, no: '7', adSoyad: 'Şule Güneş', burslu: true, baslangicAy: '2026-09', bitisAy: '' });
  D.students.push({ id: 4, no: '9', adSoyad: 'Ömer İnce', baslangicAy: '2026-11', bitisAy: '' });
  D.students.push({ id: 5, no: '3', adSoyad: 'Elif Ayrılan', baslangicAy: '2026-09', bitisAy: '' });
  D.monthFees['2026-12'] = 900;
  L.odemeEkle(D, 1, '2026-11', 800, '2026-11-05');
  L.odemeEkle(D, 2, '2026-11', 200, '2026-11-24');
  L.odemeEkle(D, 4, '2026-11', 800, '2026-11-25');
  L.odemeEkle(D, 5, '2026-09', 800, '2026-09-08');
  L.yoklamaYaz(D, '2026-11-25', 1, 'Geldi'); L.yoklamaYaz(D, '2026-11-25', 2, 'Gelmedi'); L.yoklamaYaz(D, '2026-11-25', 3, 'İzinli');
  L.yoklamaYaz(D, '2026-09-15', 5, 'Geldi'); L.yoklamaYaz(D, '2026-11-02', 5, 'Geldi');
  L.ayrildiIsaretle(D, D.students[4], '2026-10');
  const T = new Date(2026, 10, 26); // 26 Kasım 2026

  esit(L.borc(D, D.students[0], '2026-11'), 800, 'normal ücret');
  esit(L.borc(D, D.students[1], '2026-11'), 400, 'kardeş %50');
  esit(L.borc(D, D.students[2], '2026-11'), 0, 'burslu ücretsiz');
  esit(L.borc(D, D.students[3], '2026-10'), 0, 'kayıt öncesi ay borçsuz');
  esit(L.borc(D, D.students[1], '2026-12'), 450, 'aya özel ücret + kardeş');
  esit(L.durum(D, D.students[1], '2026-11', T).kod, 'gecikti', 'son ödeme geçince gecikti');
  esit(L.durum(D, D.students[1], '2026-11', new Date(2026, 10, 8)).kod, 'kismi', 'son ödeme öncesi kısmi');
  esit(L.durum(D, D.students[0], '2026-12', new Date(2026, 11, 3)).kod, 'odenmedi', 'süresi dolmamış ödenmedi');
  esit(L.trTarih(L.sonOdemeTarihi(D, '2026-11')), '10.11.2026', 'son ödeme tarihi');
  // ayrılan öğrenci
  esit(L.aktif(D.students[4], '2026-10'), true, 'ayrılan: ayrıldığı ay aktif');
  esit(L.aktif(D.students[4], '2026-11'), false, 'ayrılan: sonraki ay pasif');
  esit(L.yoklama(D, '2026-09-15', 5), 'Geldi', 'ayrılan: eski yoklama kalır');
  esit(L.yoklama(D, '2026-11-02', 5), '', 'ayrılan: sonraki yoklama silinir');
  esit(L.odenen(D, 5, '2026-09'), 800, 'ayrılan: eski ödeme kalır');
  esit(L.aktifler(D, '2026-11').map(s => s.id), [2, 3, 4, 1], 'kasım listesi (no sırası, ayrılan yok)');
  // gecikenler
  const g = L.gecikenler(D, T);
  esit(g.map(x => x.s.id), [1, 2, 5], 'gecikenler listesi (ayrılanın eski borcu dahil)');
  esit(g[0].toplam, 1600, 'Ali: eylül+ekim borcu');
  const o = L.ozetAy(D, '2026-11', T);
  esit([o.borc, o.tahsil, o.kalan, o.burslu, o.kardes], [2000, 1800, 200, 1, 1], 'kasım özeti');
  esit(L.yaklasanlar(D, new Date(2026, 11, 7), 5).liste.length, 3, 'yaklaşan son ödeme uyarısı');
  esit(L.parsePara('1.250,50 ₺'), 1250.5, 'para okuma');
  esit(L.para(1600), '1.600,00 ₺', 'para yazma');

  // içe aktarma
  const imp = L.satirlardanOgrenci([['Okul No', 'Adı Soyadı', 'Veli Adı', 'Veli Telefonu', 'Kardeş (Evet/Hayır)', 'Kardeşinin Adı', 'Kardeşinin Sınıfı', 'Burslu (Evet/Hayır)'], ['101', 'Deniz Kaya', '', '', 'Evet', '', '3-C', ''], ['102', 'Ece Aydın', '', '', '', '', '', 'Evet']]);
  esit(imp.ogrenciler.map(s => [s.no, s.adSoyad, s.kardes, s.kardesSinif, s.burslu]), [['101', 'Deniz Kaya', true, '3-C', false], ['102', 'Ece Aydın', false, '', true]], 'excel içe aktarma');
  esit(L.metindenOgrenci('125 Ali Veli\n126\tAyşe Demir\n\nMehmet Can').map(s => [s.no, s.adSoyad]), [['125', 'Ali Veli'], ['126', 'Ayşe Demir'], ['', 'Mehmet Can']], 'metinden ekleme');

  // raporlar
  for (const t of R.TURLER) {
    const models = R.olustur(t.id, D, { gun: '2026-11-25', ay: '2026-11', bas: '2026-11-01', bit: '2026-11-30', ogrenci: 2 }, T);
    const h = R.html(models, D.settings);
    if (!h.html.includes('</html>') || h.sayfa < 1) { hata++; console.log('HATA rapor ' + t.id); }
    else console.log(`ok   rapor ${t.id} (${h.sayfa} sayfa)`);
    await store.exportReport(path.join(dir, `r_${t.id}.xlsx`), models, D.settings);
    fs.writeFileSync(path.join(dir, `r_${t.id}.html`), h.html);
  }
  // uzun liste sayfalama
  const B = JSON.parse(JSON.stringify(D));
  for (let i = 0; i < 70; i++) B.students.push({ id: 100 + i, no: String(200 + i), adSoyad: 'Öğrenci ' + i, baslangicAy: '2026-09', bitisAy: '' });
  esit(R.html(R.olustur('liste', B, {}, T), B.settings).sayfa >= 3, true, 'uzun liste birden çok sayfa');

  // kaydet / oku
  D.users = [{ ad: 'ayse', salt: 'aa', hash: 'bb', kurtarmaSalt: 'cc', kurtarmaHash: 'dd' }];
  const f = path.join(dir, 'KulupVerileri.xlsx');
  await store.save(f, D);
  const D2 = await store.load(f);
  esit(D2.settings.okul, 'Atatürk İlkokulu', 'geri okuma: okul');
  esit(D2.settings.sonOdemeGunu, 10, 'geri okuma: son ödeme günü');
  esit(D2.students.length, 5, 'geri okuma: öğrenci');
  esit(D2.students.find(s => s.id === 2).kardesSinif, '4-A', 'geri okuma: kardeş sınıfı');
  esit(D2.students.find(s => s.id === 5).bitisAy, '2026-10', 'geri okuma: ayrılış');
  esit(D2.payments.length, 4, 'geri okuma: ödeme');
  esit(D2.monthFees['2026-12'], 900, 'geri okuma: aylık ücret');
  esit(D2.attendance['2026-11-25|2'], 'Gelmedi', 'geri okuma: yoklama');
  esit(D2.users[0].ad, 'ayse', 'geri okuma: kullanıcı');

  // sürüm 1 (Windows) veri dosyası
  const v1 = process.argv[2];
  if (v1 && fs.existsSync(v1)) {
    const D1 = await store.load(v1);
    esit(D1.students.length > 0 && D1.payments.length > 0, true, 'sürüm 1 dosyası okundu (' + D1.students.length + ' öğrenci)');
    esit(D1.students.find(s => s.adSoyad === 'Zeynep Çelik').kardes, true, 'sürüm 1: kardeş');
  }
  console.log('Çıktılar: ' + dir);
  console.log(hata ? hata + ' HATA' : 'TÜM TESTLER GEÇTİ');
  process.exit(hata ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
