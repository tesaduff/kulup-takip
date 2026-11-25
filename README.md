# Kulüp Takip — Yoklama ve Aidat Programı

İlkokul sınıf öğretmenlerinin kulüp yoklamasını ve öğrenci kulüp ücretlerini (aidatlarını) takip etmesi, idareye günlük, haftalık ve aylık rapor vermesi için hazırlanmış ücretsiz bir Windows programı.

- **Kurulum gerekmez.** Tek bir `KulupTakip.exe` dosyasıdır, internet gerektirmez.
- **Veriler Excel'de saklanır.** Tüm bilgiler bilgisayarda `Belgeler\KulupTakip\KulupVerileri.xlsx` dosyasına kaydedilir.
- Windows 10 ve Windows 11'de çalışır (Windows'ta hazır bulunan .NET Framework 4.x yeterlidir).

## İndirme

1. Bu sayfanın sağ tarafındaki **Releases** bölümüne girin.
2. En son sürümdeki **`KulupTakip.exe`** dosyasını indirin.
3. Dosyayı masaüstüne veya istediğiniz bir klasöre koyup çift tıklayın.

> Windows "Bilgisayarınız korundu" (SmartScreen) uyarısı verirse **Ek bilgi → Yine de çalıştır** seçeneğine tıklayın. Program imzasız olduğu için bu uyarı normaldir.

## Özellikler

### İlk açılış
Program ilk açıldığında şunları sorar: **okulun adı, sınıf/şube, sınıf öğretmeninin adı soyadı**, kulübün adı, okul müdürü (raporlardaki imza alanı için), eğitim-öğretim yılı, kulübün başladığı ay, aylık ücret ve kardeş indirimi oranı (varsayılan %50).

### Öğrenciler
- Elle tek tek ekleme
- **Excel'den yükleme** (.xlsx): başlık satırını kendisi tanır (Okul No, Adı Soyadı, Veli, Telefon, Kardeş, Kardeşinin Sınıfı, Burslu). İsterseniz program içinden **boş Excel şablonu** alabilirsiniz.
- **Toplu isim ekleme:** e-Okul'dan veya bir listeden kopyalayıp yapıştırın. Satır başındaki numara okul no olarak alınır.
- **Kardeşi var:** işaretlenirse aylık ücrete kardeş indirimi uygulanır (%50). Kardeşin adı ve **sınıfı** seçilebilir.
- **Burslu:** işaretlenen öğrenciden ücret alınmaz.
- Kulübe başladığı ay ve ayrıldığı ay tutulur. Ayrılan öğrencinin eski kayıtları raporlarda kalır.

### Günlük yoklama
- Tarih seçilir, öğrencinin durum hücresine tıklandıkça **Geldi → Gelmedi → İzinli → Raporlu** sırasıyla değişir.
- "Hepsi Geldi" düğmesiyle tek tıkla yoklama alınır, sonra sadece gelmeyenler değiştirilir.
- Klavye kısayolları: `1` Geldi, `2` Gelmedi, `3` İzinli, `4` Raporlu, `Del` temizle.
- Öğrencinin o ayki devamsızlık sayısı listede görünür.

### Aylık aidat
- Ay seçilir. Her öğrenci için **ödenecek, ödenen, kalan, son ödeme tarihi ve durum** (Ödendi / Kısmi / Ödenmedi / Burslu) görünür.
- "Seçilileri Tam Ödendi Yap", "Ödeme Al" (kısmi ödeme ve tarih girilebilir) ya da "Ödenen" hücresine doğrudan tutar yazma.
- Ödeme geçmişi tutulur, yanlış girilen ödeme silinebilir.
- Her ay için farklı ücret belirlenebilir (örneğin tatil ayında 0 ₺).
- Alt bölümde ayın toplamları görünür: ödenecek toplam, **tahsil edilen (idareye teslim)**, kalan, burslu ve kardeş indirimi toplamları.

### Raporlar (idareye vermek için, Excel)
| Rapor | İçerik |
|---|---|
| Günlük Rapor | O günün yoklama listesi ve o gün alınan ödemeler |
| Haftalık Rapor | Pazartesi-Cuma yoklama çizelgesi ve haftalık tahsilat listesi |
| Aylık Yoklama Çizelgesi | Ayın tüm iş günleri, öğrenci başına geldi/gelmedi sayıları, devam yüzdesi |
| Aylık Aidat / İdareye Teslim | Kim ne ödedi, burslu, kardeş indirimi, **idareye teslim edilecek tutar**, teslim eden ve teslim alan imza alanları |
| Ay Sonu İdare Paketi | Aylık aidat raporu ve aylık yoklama çizelgesi tek dosyada |
| Toplu Aidat Listesi | Tüm öğrencilerin ay ay ödemeleri (renkli), toplam ödenecek/ödenen/kalan ve aylara göre idareye teslim özeti |
| Öğrenci Listesi | Veli, telefon, kardeş ve burs bilgileriyle kulüp listesi |

Raporlar `Belgeler\KulupTakip\Raporlar` klasörüne kaydedilir ve otomatik açılır; Excel'den doğrudan yazdırılabilir (A4, sayfaya sığdırılmış).
Raporlar sekmesinde seçilen gün, hafta ve ayın **ekran özeti** de görünür (gelmeyenler, ödemesi eksik olanlar vb.).

### Yedekleme
- Program her gün ilk kayıtta otomatik yedek alır (`Belgeler\KulupTakip\Yedekler`, son 60 gün).
- **Yedeği Dışa Aktar / Yedekten Geri Yükle** ile veriler USB bellekle başka bilgisayara taşınabilir.

## Sık sorulan sorular

**e-Okul listem .xls uzantılı, yüklenmiyor.**
Dosyayı Excel'de açın, *Farklı Kaydet → Excel Çalışma Kitabı (.xlsx)* seçip kaydedin, sonra yükleyin. Ya da isimleri kopyalayıp **Toplu İsim Ekle** penceresine yapıştırın.

**"Kaydedilemedi" uyarısı alıyorum.**
`KulupVerileri.xlsx` dosyası Excel'de açıksa kapatın. Program birkaç saniye içinde tekrar kaydetmeyi dener.

**İki kardeş de aynı sınıftaysa?**
İndirimi hangi öğrenciye uygulayacaksanız sadece onda "Kardeşi var" kutusunu işaretleyin.

**Ödeme yanlış girildi.**
Aylık Aidat sekmesinde öğrenciyi seçip **Ödeme Geçmişi / Sil** ile silin ya da "Ödenen" hücresine doğru tutarı yazın.

## Geliştiriciler için

Ek bir şey kurmanız gerekmez. Windows'taki hazır C# derleyicisi kullanılır:

```powershell
powershell -ExecutionPolicy Bypass -File build.ps1 -Test
```

Çıktı: `dist\KulupTakip.exe`. Kaynak kodu `src\` klasöründedir (C# 5, WinForms, .NET Framework 4.x, harici kütüphane yok; .xlsx okuma/yazma kendi içinde yapılır).

GitHub'da `v1.0.0` gibi bir etiket (tag) gönderildiğinde **Actions** otomatik olarak EXE'yi derler, testleri çalıştırır ve **Release** sayfasına ekler.

## Lisans

MIT. Okullarda serbestçe kullanılabilir, çoğaltılabilir ve dağıtılabilir.
