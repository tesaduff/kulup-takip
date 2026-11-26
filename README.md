# Kulüp Takip — Yoklama ve Aidat Programı

İlkokul sınıf öğretmenleri için kulüp yoklaması, aidat (kulüp ücreti) takibi ve idareye verilecek raporlar. **Pardus** ve **Windows** üzerinde çalışır, internet gerektirmez; tüm bilgiler bilgisayarda bir **Excel** dosyasında saklanır.

## İndirme ve kurulum

[**Releases**](https://github.com/tesaduff/kulup-takip/releases/latest) sayfasından bilgisayarınıza uygun dosyayı indirin:

| Sistem | Dosya | Kurulum |
|---|---|---|
| **Pardus** (ve Debian/Ubuntu) | `kulup-takip_X.Y.Z_amd64.deb` | Dosyaya çift tıklayın, **Yükle** deyin. Program menüde **Eğitim → Kulüp Takip** olarak görünür. |
| **Windows 10 / 11** | `KulupTakip-Kurulum-X.Y.Z.exe` | Çift tıklayın, kurulumu tamamlayın. Masaüstüne kısayol eklenir. |
| Linux (kurulumsuz) | `KulupTakip-X.Y.Z.AppImage` | Sağ tık → Özellikler → "Çalıştırılabilir" işaretleyin, çift tıklayın. |

> Windows "Bilgisayarınız korundu" uyarısı verirse **Ek bilgi → Yine de çalıştır** deyin (program imzasız olduğu için normaldir).

### Güncelleme
Program açılışta yeni sürümü kendisi denetler. **Ayarlar → Güncelleme → İndir ve Kur** düğmesine basmanız yeterlidir. Pardus'ta kurulum sırasında bilgisayar şifreniz sorulur.

## Özellikler

- **Kullanıcı girişi:** İlk açılışta okul, sınıf, öğretmen bilgileri ile kullanıcı adı ve şifre oluşturulur. Şifre unutulursa kurtarma kodu ile yenilenir.
- **Sol menü:** Ana Sayfa, Öğrenciler, Yoklama, Aidat / Ödemeler, Raporlar, Ayarlar.
- **Ana sayfa:** Bugünkü yoklama, bu ayın tahsilatı, gecikmiş borçlar, **son ödeme tarihi sayacı** ve uyarılar (gecikenler, son günü yaklaşanlar, yoklaması alınmamış gün, çok devamsızlık yapanlar).
- **Öğrenciler:** Elle, **Excel'den** (.xlsx) veya listeden yapıştırarak ekleme.
  - **Kardeşi varsa %50 indirim**; kardeşin adı ve sınıfı seçilebilir.
  - **Burslu öğrenciden ücret alınmaz.**
  - **Kulüpten ayrılan öğrenci** sadece ayrıldığı aydan sonraki listelerden çıkar; eski ödeme ve yoklama kayıtları saklanır.
- **Yoklama:** Her öğrenci için büyük Geldi / Gelmedi / İzinli / Raporlu düğmeleri ve "Hepsi Geldi".
- **Aidat:** Ödenen tutarı yazın ya da "Tam Ödendi" deyin; ödenecek, kalan, indirim ve toplamlar **otomatik hesaplanır**. Kısmi ödeme, ödeme geçmişi ve aya özel ücret desteklenir. Her ayın **son ödeme günü** (varsayılan 10) geçince ödemeyenler "gecikti" olarak uyarılır.
- **Raporlar (baskı önizlemeli):** Günlük, haftalık, aylık yoklama; aylık aidat / **idareye teslim**; ay sonu paketi; toplu aidat listesi; gecikmiş ödemeler; **veli hatırlatma yazıları**; tahsilat dökümü; **ödeme makbuzu**; öğrenci hesap dökümü; öğrenci listesi. Her rapor program içinde sayfa sayfa önizlenir; **Yazdır**, **PDF** veya **Excel** olarak kaydedilir.
- **Veriler Excel'de:** `Belgeler/KulupTakip/KulupVerileri.xlsx`. Her gün otomatik yedek alınır; yedek USB ile başka bilgisayara taşınabilir. Sürüm 1'in veri dosyası aynen okunur.

## Geliştiriciler için

```bash
npm install
npm test          # hesaplama, rapor ve Excel testleri
npm start         # programı çalıştır
```

GitHub'a `v2.0.1` gibi bir etiket gönderildiğinde Actions; testleri çalıştırır, `.deb`, AppImage ve Windows kurulumunu derler, **.deb paketini gerçekten kurup programı açarak** dener ve Release'e ekler. Programın içindeki güncelleme bu Release'i kullanır.

`legacy-v1/` klasöründe ilk (yalnızca Windows) sürümün kaynak kodu durur.

## Lisans

MIT. Okullarda serbestçe kullanılabilir ve dağıtılabilir.
