using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Text;

namespace KulupTakip
{
    static class Reports
    {
        static int Baslik(XSheet sh, DataStore db, string baslik, string alt, int cols)
        {
            var st = db.Settings;
            sh.Set(0, 0, st.Okul.ToUpper(Ay.TR), St.Title); sh.Merge(0, 0, 0, cols - 1);
            sh.Set(1, 0, st.Kulup + "  •  " + st.Sinif + " Sınıfı  •  " + st.EgitimYili + " Eğitim-Öğretim Yılı", St.Subtitle); sh.Merge(1, 0, 1, cols - 1);
            sh.Set(2, 0, baslik, St.Subtitle); sh.Merge(2, 0, 2, cols - 1);
            sh.Set(3, 0, alt + "   •   Sınıf Öğretmeni: " + st.Ogretmen + "   •   Düzenlenme: " + DateTime.Now.ToString("dd.MM.yyyy HH:mm"), St.Note);
            sh.Merge(3, 0, 3, cols - 1);
            sh.Heights[0] = 22;
            return 5;
        }

        static void Imzalar(XSheet sh, DataStore db, int row, int cols, string sol, string sag)
        {
            int half = Math.Max(1, cols / 2);
            var st = db.Settings;
            sh.Set(row, 0, sol, St.BoldCenterPlain); sh.Merge(row, 0, row, half - 1);
            sh.Set(row, half, sag, St.BoldCenterPlain); sh.Merge(row, half, row, cols - 1);
            sh.Set(row + 1, 0, st.Ogretmen, St.CenterPlain); sh.Merge(row + 1, 0, row + 1, half - 1);
            sh.Set(row + 1, half, st.Mudur != "" ? st.Mudur : "", St.CenterPlain); sh.Merge(row + 1, half, row + 1, cols - 1);
            sh.Set(row + 2, 0, "Sınıf Öğretmeni", St.CenterPlain); sh.Merge(row + 2, 0, row + 2, half - 1);
            sh.Set(row + 2, half, "Okul Müdürü", St.CenterPlain); sh.Merge(row + 2, half, row + 2, cols - 1);
            sh.Set(row + 4, 0, "İmza: ......................", St.CenterPlain); sh.Merge(row + 4, 0, row + 4, half - 1);
            sh.Set(row + 4, half, "İmza: ......................", St.CenterPlain); sh.Merge(row + 4, half, row + 4, cols - 1);
        }

        static int DurumStil(string d)
        {
            if (d == Durumlar.Geldi) return St.Green;
            if (d == Durumlar.Gelmedi) return St.Red;
            if (d == Durumlar.Izinli || d == Durumlar.Raporlu) return St.Yellow;
            return St.Center;
        }

        static int OdemeStil(string durum)
        {
            if (durum.StartsWith("Ödendi")) return St.Green;
            if (durum == "Kısmi") return St.Yellow;
            if (durum == "Ödenmedi") return St.Red;
            return St.Gray;
        }

        static int ParaStil(string durum)
        {
            if (durum.StartsWith("Ödendi")) return St.MoneyGreen;
            if (durum == "Kısmi") return St.MoneyYellow;
            if (durum == "Ödenmedi") return St.MoneyRed;
            return St.MoneyGray;
        }

        // ------------------ GÜNLÜK ------------------
        public static XSheet GunlukYoklama(DataStore db, DateTime gun)
        {
            var sh = new XSheet("Günlük Yoklama");
            string ay = Ay.Of(gun);
            int cols = 5;
            int r = Baslik(sh, db, "GÜNLÜK YOKLAMA LİSTESİ", gun.ToString("dd MMMM yyyy dddd", Ay.TR), cols);
            string[] h = { "Sıra", "Okul No", "Adı Soyadı", "Durum", "Açıklama" };
            for (int i = 0; i < h.Length; i++) sh.Set(r, i, h[i], St.Header);
            r++;
            var cnt = new Dictionary<string, int>();
            int sira = 1;
            foreach (var s in db.AydaAktifler(ay))
            {
                string d = db.YoklamaAl(gun, s.Id);
                sh.Set(r, 0, sira++, St.Center); sh.Set(r, 1, s.No, St.Center); sh.Set(r, 2, s.AdSoyad, St.Text);
                sh.Set(r, 3, d == "" ? "İşlenmedi" : d, DurumStil(d)); sh.Set(r, 4, s.Burslu ? "Burslu" : "", St.Text);
                int c; cnt.TryGetValue(d, out c); cnt[d] = c + 1;
                r++;
            }
            r++;
            r = Ozet(sh, r, new[]
            {
                new object[] { "Toplam öğrenci", sira - 1 },
                new object[] { "Geldi", Say(cnt, Durumlar.Geldi) },
                new object[] { "Gelmedi", Say(cnt, Durumlar.Gelmedi) },
                new object[] { "İzinli", Say(cnt, Durumlar.Izinli) },
                new object[] { "Raporlu", Say(cnt, Durumlar.Raporlu) },
                new object[] { "Yoklaması işlenmemiş", Say(cnt, "") },
            }, false);
            Imzalar(sh, db, r + 1, cols, "Düzenleyen", "Onaylayan");
            sh.Width(0, 6); sh.Width(1, 9); sh.Width(2, 34); sh.Width(3, 14); sh.Width(4, 22);
            return sh;
        }

        static int Say(Dictionary<string, int> d, string k) { int v; return d.TryGetValue(k, out v) ? v : 0; }

        static int Ozet(XSheet sh, int r, object[][] satirlar, bool para)
        {
            foreach (var s in satirlar)
            {
                sh.Set(r, 1, s[0], St.BoldText); sh.Merge(r, 1, r, 2);
                bool vurgu = s.Length > 2 && (bool)s[2];
                sh.Set(r, 3, s[1], vurgu ? St.MoneyHighlight : (s[1] is decimal ? St.MoneyTotal : St.BoldCenter));
                r++;
            }
            return r;
        }

        static XSheet Tahsilat(DataStore db, DateTime bas, DateTime bit, string baslik)
        {
            var sh = new XSheet("Tahsilat");
            int cols = 7;
            string aralik = bas == bit ? bas.ToString("dd.MM.yyyy") : bas.ToString("dd.MM.yyyy") + " - " + bit.ToString("dd.MM.yyyy");
            int r = Baslik(sh, db, baslik, aralik, cols);
            string[] h = { "Sıra", "Tarih", "Okul No", "Adı Soyadı", "Ait Olduğu Ay", "Tutar", "Not" };
            for (int i = 0; i < h.Length; i++) sh.Set(r, i, h[i], St.Header);
            r++;
            string b1 = Ay.Gun(bas), b2 = Ay.Gun(bit);
            var l = db.Payments.Where(p => string.CompareOrdinal(p.Tarih, b1) >= 0 && string.CompareOrdinal(p.Tarih, b2) <= 0)
                .OrderBy(p => p.Tarih).ThenBy(p => p.Id).ToList();
            decimal top = 0; int sira = 1;
            foreach (var p in l)
            {
                var s = db.Bul(p.OgrenciId);
                sh.Set(r, 0, sira++, St.Center); sh.Set(r, 1, Ay.GunTr(p.Tarih), St.Center);
                sh.Set(r, 2, s != null ? s.No : "", St.Center); sh.Set(r, 3, s != null ? s.AdSoyad : "(silinmiş öğrenci)", St.Text);
                sh.Set(r, 4, Ay.Ad(p.Ay), St.Center); sh.Set(r, 5, p.Tutar, p.Tutar < 0 ? St.MoneyRed : St.Money); sh.Set(r, 6, p.Not, St.Text);
                top += p.Tutar; r++;
            }
            if (l.Count == 0) { sh.Set(r, 0, "Bu tarih aralığında tahsilat yapılmamış.", St.Text); sh.Merge(r, 0, r, cols - 1); r++; }
            sh.Set(r, 0, "TOPLAM TAHSİL EDİLEN (İdareye teslim edilecek)", St.BoldText); sh.Merge(r, 0, r, 4);
            sh.Set(r, 5, top, St.MoneyHighlight); sh.Set(r, 6, "", St.BoldText);
            Imzalar(sh, db, r + 3, cols, "Teslim Eden", "Teslim Alan");
            sh.Width(0, 6); sh.Width(1, 12); sh.Width(2, 9); sh.Width(3, 30); sh.Width(4, 15); sh.Width(5, 14); sh.Width(6, 20);
            return sh;
        }

        public static List<XSheet> Gunluk(DataStore db, DateTime gun)
        {
            return new List<XSheet> { GunlukYoklama(db, gun), Tahsilat(db, gun, gun, "GÜNLÜK TAHSİLAT LİSTESİ") };
        }

        // ------------------ HAFTALIK ------------------
        public static List<XSheet> Haftalik(DataStore db, DateTime tarih)
        {
            DateTime bas = Ay.HaftaBasi(tarih), bit = bas.AddDays(4);
            var gunler = new List<DateTime>();
            for (int i = 0; i < 7; i++)
            {
                var g = bas.AddDays(i);
                if (i < 5 || db.GunKayitliMi(g)) gunler.Add(g);
            }
            bit = gunler.Last();
            var sh = Cizelge(db, gunler, "HAFTALIK YOKLAMA ÇİZELGESİ", bas.ToString("dd.MM.yyyy") + " - " + bit.ToString("dd.MM.yyyy"), "Haftalık Yoklama");
            return new List<XSheet> { sh, Tahsilat(db, bas, bit, "HAFTALIK TAHSİLAT LİSTESİ") };
        }

        static XSheet Cizelge(DataStore db, List<DateTime> gunler, string baslik, string alt, string ad)
        {
            var sh = new XSheet(ad) { Landscape = true };
            int n = gunler.Count;
            int cols = 3 + n + 4;
            int r = Baslik(sh, db, baslik, alt, cols);
            sh.Set(r, 0, "Sıra", St.Header); sh.Set(r, 1, "No", St.Header); sh.Set(r, 2, "Adı Soyadı", St.Header);
            bool kisa = n > 7;
            for (int i = 0; i < n; i++)
                sh.Set(r, 3 + i, kisa ? gunler[i].Day + "\n" + gunler[i].ToString("ddd", Ay.TR) : gunler[i].ToString("dd.MM\ndddd", Ay.TR), St.Header);
            sh.Set(r, 3 + n, "Geldi", St.Header); sh.Set(r, 4 + n, "Gelmedi", St.Header); sh.Set(r, 5 + n, "İzinli/ Raporlu", St.Header); sh.Set(r, 6 + n, "Devam %", St.Header);
            sh.Heights[r] = 32;
            r++;
            int bas = r;
            var gunGeldi = new int[n];
            // dönem içindeki öğrenciler: herhangi bir günde aktif olan
            var ogr = db.Sirali(db.Students.Where(s => gunler.Any(g => s.AydaAktif(Ay.Of(g)))));
            int sira = 1;
            foreach (var s in ogr)
            {
                sh.Set(r, 0, sira++, St.Center); sh.Set(r, 1, s.No, St.Center); sh.Set(r, 2, s.AdSoyad, St.Text);
                int g = 0, y = 0, iz = 0;
                for (int i = 0; i < n; i++)
                {
                    string d = s.AydaAktif(Ay.Of(gunler[i])) ? db.YoklamaAl(gunler[i], s.Id) : "";
                    sh.Set(r, 3 + i, Durumlar.Kisa(d), DurumStil(d));
                    if (d == Durumlar.Geldi) { g++; gunGeldi[i]++; }
                    else if (d == Durumlar.Gelmedi) y++;
                    else if (d != "") iz++;
                }
                sh.Set(r, 3 + n, g, St.Center); sh.Set(r, 4 + n, y, St.Center); sh.Set(r, 5 + n, iz, St.Center);
                int top = g + y + iz;
                sh.Set(r, 6 + n, top == 0 ? "-" : "%" + Math.Round(100.0 * g / top).ToString(CultureInfo.InvariantCulture), St.Center);
                r++;
            }
            sh.Set(r, 0, "Gelen öğrenci sayısı", St.BoldText); sh.Merge(r, 0, r, 2);
            for (int i = 0; i < n; i++) sh.Set(r, 3 + i, gunGeldi[i], St.BoldCenter);
            for (int i = 0; i < 4; i++) sh.Set(r, 3 + n + i, "", St.BoldText);
            r += 2;
            sh.Set(r, 0, "G: Geldi   Y: Gelmedi (Yok)   İ: İzinli   R: Raporlu   Boş: yoklama işlenmemiş", St.Note); sh.Merge(r, 0, r, cols - 1);
            Imzalar(sh, db, r + 2, cols, "Düzenleyen", "Onaylayan");
            sh.Width(0, 5); sh.Width(1, 6); sh.Width(2, 28);
            for (int i = 0; i < n; i++) sh.Width(3 + i, kisa ? 4.2 : 11);
            sh.Width(3 + n, 7); sh.Width(4 + n, 8); sh.Width(5 + n, 8); sh.Width(6 + n, 8);
            sh.FreezeRows = bas;
            return sh;
        }

        // ------------------ AYLIK ------------------
        public static XSheet AylikYoklama(DataStore db, string ay)
        {
            DateTime ilk; Ay.TryParse(ay, out ilk);
            var gunler = new List<DateTime>();
            for (var d = ilk; d.Month == ilk.Month; d = d.AddDays(1))
                if ((d.DayOfWeek != DayOfWeek.Saturday && d.DayOfWeek != DayOfWeek.Sunday) || db.GunKayitliMi(d)) gunler.Add(d);
            return Cizelge(db, gunler, "AYLIK YOKLAMA ÇİZELGESİ", Ay.Ad(ay), "Aylık Yoklama");
        }

        public static XSheet AylikAidat(DataStore db, string ay)
        {
            var sh = new XSheet("Aylık Aidat") { Landscape = true };
            int cols = 10;
            int r = Baslik(sh, db, "AYLIK KULÜP ÜCRETİ TAHSİLAT VE İDAREYE TESLİM RAPORU", Ay.Ad(ay) + "  •  Aylık ücret: " + Para.F(db.AyinUcreti(ay)), cols);
            string[] h = { "Sıra", "Okul No", "Adı Soyadı", "Veli", "Ücret Türü", "Kardeşi / Sınıfı", "Ödenecek", "Ödenen", "Kalan", "Durum" };
            for (int i = 0; i < h.Length; i++) sh.Set(r, i, h[i], St.Header);
            sh.FreezeRows = r + 1;
            r++;
            decimal tBorc = 0, tOd = 0, tKalan = 0, tKardes = 0, tBurs = 0;
            int nNormal = 0, nKardes = 0, nBurs = 0, nOdedi = 0, nKismi = 0, nOdemedi = 0;
            int sira = 1;
            foreach (var s in db.AydaAktifler(ay))
            {
                decimal b = db.Borc(s, ay), o = db.Odenen(s.Id, ay), k = Math.Max(0, b - o);
                string du = db.OdemeDurumu(s, ay);
                sh.Set(r, 0, sira++, St.Center); sh.Set(r, 1, s.No, St.Center); sh.Set(r, 2, s.AdSoyad, St.Text);
                sh.Set(r, 3, s.VeliAd, St.Text); sh.Set(r, 4, db.Tur(s), s.Burslu ? St.Gray : St.Text);
                sh.Set(r, 5, s.KardesVar ? (s.KardesAd + (s.KardesSinif != "" ? " (" + s.KardesSinif + ")" : "")).Trim() : "", St.Text);
                sh.Set(r, 6, b, St.Money); sh.Set(r, 7, o, ParaStil(du)); sh.Set(r, 8, k, k > 0 ? St.MoneyRed : St.Money);
                sh.Set(r, 9, du, OdemeStil(du));
                tBorc += b; tOd += o; tKalan += k;
                if (s.Burslu) { nBurs++; tBurs += db.AyinUcreti(ay); }
                else if (s.KardesVar) { nKardes++; tKardes += db.Indirim(s, ay); }
                else nNormal++;
                if (du.StartsWith("Ödendi")) nOdedi++; else if (du == "Kısmi") nKismi++; else if (du == "Ödenmedi") nOdemedi++;
                r++;
            }
            sh.Set(r, 0, "TOPLAM", St.BoldText); sh.Merge(r, 0, r, 5);
            sh.Set(r, 6, tBorc, St.MoneyTotal); sh.Set(r, 7, tOd, St.MoneyTotal); sh.Set(r, 8, tKalan, St.MoneyTotal); sh.Set(r, 9, "", St.BoldText);
            r += 2;
            // bu ay içinde (tarihe göre) elden alınan toplam
            DateTime ilk; Ay.TryParse(ay, out ilk);
            string b1 = Ay.Gun(ilk), b2 = Ay.Gun(ilk.AddMonths(1).AddDays(-1));
            decimal elden = db.Payments.Where(p => string.CompareOrdinal(p.Tarih, b1) >= 0 && string.CompareOrdinal(p.Tarih, b2) <= 0).Sum(p => p.Tutar);

            sh.Set(r, 1, "ÖZET", St.Header); sh.Merge(r, 1, r, 3); r++;
            r = Ozet(sh, r, new[]
            {
                new object[] { "Kulübe kayıtlı öğrenci", sira - 1 },
                new object[] { "Tam ücretli öğrenci", nNormal },
                new object[] { "Kardeş indirimli öğrenci (%" + db.Settings.KardesIndirim.ToString("0.##", Ay.TR) + ")", nKardes },
                new object[] { "Burslu (ücretsiz) öğrenci", nBurs },
                new object[] { "Ödeyen / Kısmi / Ödemeyen", nOdedi + " / " + nKismi + " / " + nOdemedi },
                new object[] { "Aylık kişi başı ücret", db.AyinUcreti(ay) },
                new object[] { "Kardeş indirimi toplamı", tKardes },
                new object[] { "Burs muafiyeti toplamı", tBurs },
                new object[] { "Tahsil edilmesi gereken toplam", tBorc },
                new object[] { "İDAREYE TESLİM EDİLECEK TUTAR", tOd, true },
                new object[] { "Tahsil edilemeyen (kalan) tutar", tKalan },
                new object[] { "Ay içinde alınan (tüm aylar)*", elden },
            }, true);
            sh.Set(r, 1, "* Ödeme tarihine göre bu ay içinde elden alınan para; geçmiş veya ileri aylara ait ödemeler dahildir.", St.Note); sh.Merge(r, 1, r, cols - 1);
            Imzalar(sh, db, r + 2, cols, "Teslim Eden", "Teslim Alan");
            sh.Width(0, 5); sh.Width(1, 7); sh.Width(2, 30); sh.Width(3, 20); sh.Width(4, 18); sh.Width(5, 20);
            sh.Width(6, 13); sh.Width(7, 13); sh.Width(8, 13); sh.Width(9, 13);
            return sh;
        }

        // ------------------ YILLIK TOPLU ------------------
        public static List<string> RaporAylari(DataStore db, string sonAy)
        {
            var l = Ay.YilAylari(db.Settings.YilBaslangic);
            var res = new List<string>();
            foreach (var a in l)
            {
                if (string.CompareOrdinal(a, sonAy) > 0) break;
                if (string.CompareOrdinal(a, db.IlkAy) < 0 && !db.Payments.Any(p => p.Ay == a)) continue;
                bool yaz = a.EndsWith("-07") || a.EndsWith("-08");
                if (yaz && !db.AyUcret.ContainsKey(a) && !db.Payments.Any(p => p.Ay == a)) continue;
                res.Add(a);
            }
            if (res.Count == 0) res.Add(sonAy);
            return res;
        }

        public static List<XSheet> Yillik(DataStore db, string sonAy)
        {
            var aylar = RaporAylari(db, sonAy);
            var sh = new XSheet("Toplu Aidat Listesi") { Landscape = true };
            int n = aylar.Count, cols = 4 + n + 3;
            int r = Baslik(sh, db, "TOPLU KULÜP ÜCRETİ LİSTESİ", Ay.Ad(aylar[0]) + " - " + Ay.Ad(aylar[n - 1]), cols);
            sh.Set(r, 0, "Sıra", St.Header); sh.Set(r, 1, "No", St.Header); sh.Set(r, 2, "Adı Soyadı", St.Header); sh.Set(r, 3, "Ücret Türü", St.Header);
            for (int i = 0; i < n; i++) sh.Set(r, 4 + i, Ay.Ad(aylar[i]).Replace(" ", "\n"), St.Header);
            sh.Set(r, 4 + n, "Toplam\nÖdenecek", St.Header); sh.Set(r, 5 + n, "Toplam\nÖdenen", St.Header); sh.Set(r, 6 + n, "Kalan\nBorç", St.Header);
            sh.Heights[r] = 32;
            sh.FreezeRows = r + 1;
            r++;
            var ayTop = new decimal[n];
            decimal gB = 0, gO = 0;
            var ogr = db.Sirali(db.Students.Where(s => aylar.Any(a => s.AydaAktif(a) || db.Odenen(s.Id, a) != 0)));
            int sira = 1;
            foreach (var s in ogr)
            {
                sh.Set(r, 0, sira++, St.Center); sh.Set(r, 1, s.No, St.Center); sh.Set(r, 2, s.AdSoyad, St.Text); sh.Set(r, 3, db.Tur(s), s.Burslu ? St.Gray : St.Text);
                decimal tb = 0, to = 0;
                for (int i = 0; i < n; i++)
                {
                    decimal o = db.Odenen(s.Id, aylar[i]);
                    string du = db.OdemeDurumu(s, aylar[i]);
                    if (du.StartsWith("Kayıt dışı") && o == 0) sh.Set(r, 4 + i, "-", St.Center);
                    else if (du == "Burslu") sh.Set(r, 4 + i, "Burslu", St.Gray);
                    else sh.Set(r, 4 + i, o, ParaStil(du));
                    ayTop[i] += o;
                    tb += db.Borc(s, aylar[i]); to += o;
                }
                sh.Set(r, 4 + n, tb, St.Money); sh.Set(r, 5 + n, to, St.Money); sh.Set(r, 6 + n, Math.Max(0, tb - to), tb - to > 0 ? St.MoneyRed : St.Money);
                gB += tb; gO += to;
                r++;
            }
            sh.Set(r, 0, "AYLIK TAHSİLAT TOPLAMI", St.BoldText); sh.Merge(r, 0, r, 3);
            for (int i = 0; i < n; i++) sh.Set(r, 4 + i, ayTop[i], St.MoneyTotal);
            sh.Set(r, 4 + n, gB, St.MoneyTotal); sh.Set(r, 5 + n, gO, St.MoneyHighlight); sh.Set(r, 6 + n, Math.Max(0, gB - gO), St.MoneyTotal);
            r += 2;
            sh.Set(r, 0, "Yeşil: ödendi   Sarı: kısmi ödeme   Kırmızı: ödenmedi   Gri: burslu/ücretsiz   -: o ay kulüpte değil", St.Note); sh.Merge(r, 0, r, cols - 1);
            Imzalar(sh, db, r + 2, cols, "Düzenleyen", "Onaylayan");
            sh.Width(0, 5); sh.Width(1, 6); sh.Width(2, 26); sh.Width(3, 18);
            for (int i = 0; i < n; i++) sh.Width(4 + i, 11);
            sh.Width(4 + n, 13); sh.Width(5 + n, 13); sh.Width(6 + n, 13);

            // Aylık özet sayfası
            var oz = new XSheet("Aylık Özet");
            int c2 = 9;
            int r2 = Baslik(oz, db, "AYLARA GÖRE TAHSİLAT ÖZETİ (İDAREYE TESLİM)", Ay.Ad(aylar[0]) + " - " + Ay.Ad(aylar[n - 1]), c2);
            string[] h = { "Ay", "Öğrenci", "Burslu", "Kardeş İnd.", "Aylık Ücret", "Ödenecek", "Tahsil Edilen\n(İdareye Teslim)", "Kalan", "Tahsil %" };
            for (int i = 0; i < h.Length; i++) oz.Set(r2, i, h[i], St.Header);
            oz.Heights[r2] = 32;
            r2++;
            decimal sB = 0, sO = 0;
            foreach (var a in aylar)
            {
                var akt = db.AydaAktifler(a);
                decimal b = akt.Sum(s => db.Borc(s, a));
                decimal o = db.Payments.Where(p => p.Ay == a).Sum(p => p.Tutar);
                oz.Set(r2, 0, Ay.Ad(a), St.Text); oz.Set(r2, 1, akt.Count, St.Center); oz.Set(r2, 2, akt.Count(s => s.Burslu), St.Center);
                oz.Set(r2, 3, akt.Count(s => s.KardesVar && !s.Burslu), St.Center); oz.Set(r2, 4, db.AyinUcreti(a), St.Money);
                oz.Set(r2, 5, b, St.Money); oz.Set(r2, 6, o, St.MoneyGreen); oz.Set(r2, 7, Math.Max(0, b - o), b - o > 0 ? St.MoneyRed : St.Money);
                oz.Set(r2, 8, b == 0 ? "-" : "%" + Math.Round(100m * o / b).ToString(CultureInfo.InvariantCulture), St.Center);
                sB += b; sO += o; r2++;
            }
            oz.Set(r2, 0, "GENEL TOPLAM", St.BoldText); oz.Merge(r2, 0, r2, 4);
            oz.Set(r2, 5, sB, St.MoneyTotal); oz.Set(r2, 6, sO, St.MoneyHighlight); oz.Set(r2, 7, Math.Max(0, sB - sO), St.MoneyTotal);
            oz.Set(r2, 8, sB == 0 ? "-" : "%" + Math.Round(100m * sO / sB).ToString(CultureInfo.InvariantCulture), St.BoldCenter);
            Imzalar(oz, db, r2 + 3, c2, "Teslim Eden", "Teslim Alan");
            oz.Width(0, 16); oz.Width(1, 9); oz.Width(2, 8); oz.Width(3, 10); oz.Width(4, 13); oz.Width(5, 14); oz.Width(6, 16); oz.Width(7, 13); oz.Width(8, 9);
            return new List<XSheet> { oz, sh };
        }

        // ------------------ ÖĞRENCİ LİSTESİ ------------------
        public static XSheet OgrenciListesi(DataStore db)
        {
            var sh = new XSheet("Öğrenci Listesi") { Landscape = true };
            int cols = 10;
            int r = Baslik(sh, db, "KULÜP ÖĞRENCİ LİSTESİ", db.Students.Count(s => !s.Ayrildi) + " öğrenci devam ediyor", cols);
            string[] h = { "Sıra", "Okul No", "Adı Soyadı", "Veli Adı", "Veli Telefonu", "Ücret Türü", "Kardeşi", "Kardeşinin Sınıfı", "Başlangıç", "Durum" };
            for (int i = 0; i < h.Length; i++) sh.Set(r, i, h[i], St.Header);
            sh.FreezeRows = r + 1;
            r++;
            int sira = 1;
            foreach (var s in db.Sirali(db.Students))
            {
                object[] v = { sira++, s.No, s.AdSoyad, s.VeliAd, s.VeliTel, db.Tur(s), s.KardesVar ? s.KardesAd : "", s.KardesVar ? s.KardesSinif : "",
                    s.BaslangicAy != "" ? Ay.Ad(s.BaslangicAy) : "", s.Ayrildi ? "Ayrıldı (" + Ay.Ad(s.BitisAy) + ")" : "Devam" };
                for (int i = 0; i < v.Length; i++) sh.Set(r, i, v[i], i == 0 || i == 1 ? St.Center : (s.Ayrildi ? St.Gray : St.Text));
                r++;
            }
            r++;
            r = Ozet(sh, r, new[]
            {
                new object[] { "Toplam (devam eden)", db.Students.Count(s => !s.Ayrildi) },
                new object[] { "Burslu", db.Students.Count(s => !s.Ayrildi && s.Burslu) },
                new object[] { "Kardeş indirimli", db.Students.Count(s => !s.Ayrildi && s.KardesVar && !s.Burslu) },
            }, false);
            Imzalar(sh, db, r + 1, cols, "Düzenleyen", "Onaylayan");
            sh.Width(0, 5); sh.Width(1, 8); sh.Width(2, 26); sh.Width(3, 20); sh.Width(4, 15); sh.Width(5, 18); sh.Width(6, 18); sh.Width(7, 12); sh.Width(8, 13); sh.Width(9, 18);
            return sh;
        }

        public static XSheet Sablon()
        {
            var sh = new XSheet("Öğrenciler");
            string[] h = { "Okul No", "Adı Soyadı", "Veli Adı", "Veli Telefonu", "Kardeş (Evet/Hayır)", "Kardeşinin Adı", "Kardeşinin Sınıfı", "Burslu (Evet/Hayır)" };
            for (int i = 0; i < h.Length; i++) sh.Set(0, i, h[i], St.Header);
            for (int r = 1; r <= 40; r++) for (int i = 0; i < h.Length; i++) sh.Set(r, i, null, St.Text);
            sh.Width(0, 9); sh.Width(1, 28); sh.Width(2, 22); sh.Width(3, 16); sh.Width(4, 12); sh.Width(5, 22); sh.Width(6, 12); sh.Width(7, 12);
            sh.FreezeRows = 1;
            return sh;
        }

        // ------------------ KAYDET / AÇ ------------------
        public static string Kaydet(List<XSheet> sheets, string dosyaAdi)
        {
            foreach (char ch in Path.GetInvalidFileNameChars()) dosyaAdi = dosyaAdi.Replace(ch, '_');
            string path = Path.Combine(DataStore.RaporKlasoru, dosyaAdi + ".xlsx");
            int i = 2;
            while (true)
            {
                try { Xlsx.Write(path, sheets); break; }
                catch (IOException)
                {
                    if (i > 20) throw;
                    path = Path.Combine(DataStore.RaporKlasoru, dosyaAdi + " (" + i++ + ").xlsx");
                }
            }
            return path;
        }

        // ------------------ EKRAN ÖZETİ ------------------
        public static string EkranOzeti(DataStore db, DateTime gun, string ay)
        {
            var sb = new StringBuilder();
            var akt = db.AydaAktifler(Ay.Of(gun));
            int g = 0, y = 0, iz = 0, bos = 0;
            foreach (var s in akt)
            {
                string d = db.YoklamaAl(gun, s.Id);
                if (d == Durumlar.Geldi) g++; else if (d == Durumlar.Gelmedi) y++; else if (d == "") bos++; else iz++;
            }
            sb.AppendLine("■ GÜNLÜK — " + gun.ToString("dd MMMM yyyy dddd", Ay.TR));
            sb.AppendLine(string.Format("   Öğrenci: {0}   Geldi: {1}   Gelmedi: {2}   İzinli/Raporlu: {3}   İşlenmemiş: {4}", akt.Count, g, y, iz, bos));
            string gs = Ay.Gun(gun);
            sb.AppendLine("   Bugün tahsil edilen: " + Para.F(db.Payments.Where(p => p.Tarih == gs).Sum(p => p.Tutar)));
            if (y > 0)
                sb.AppendLine("   Gelmeyenler: " + string.Join(", ", akt.Where(s => db.YoklamaAl(gun, s.Id) == Durumlar.Gelmedi).Select(s => s.AdSoyad)));
            sb.AppendLine();

            DateTime hb = Ay.HaftaBasi(gun), hs = hb.AddDays(6);
            string h1 = Ay.Gun(hb), h2 = Ay.Gun(hs);
            int hg = 0, hy = 0;
            foreach (var kv in db.Yoklama)
            {
                string t = kv.Key.Substring(0, 10);
                if (string.CompareOrdinal(t, h1) >= 0 && string.CompareOrdinal(t, h2) <= 0)
                { if (kv.Value == Durumlar.Geldi) hg++; else if (kv.Value == Durumlar.Gelmedi) hy++; }
            }
            sb.AppendLine("■ HAFTALIK — " + hb.ToString("dd.MM.yyyy") + " - " + hb.AddDays(4).ToString("dd.MM.yyyy"));
            sb.AppendLine(string.Format("   Toplam katılım: {0}   Devamsızlık: {1}   Tahsilat: {2}", hg, hy,
                Para.F(db.Payments.Where(p => string.CompareOrdinal(p.Tarih, h1) >= 0 && string.CompareOrdinal(p.Tarih, h2) <= 0).Sum(p => p.Tutar))));
            sb.AppendLine();

            var aakt = db.AydaAktifler(ay);
            decimal b = aakt.Sum(s => db.Borc(s, ay)), o = db.Payments.Where(p => p.Ay == ay).Sum(p => p.Tutar);
            sb.AppendLine("■ AYLIK — " + Ay.Ad(ay) + "  (aylık ücret " + Para.F(db.AyinUcreti(ay)) + ")");
            sb.AppendLine(string.Format("   Öğrenci: {0}   Burslu: {1}   Kardeş indirimli: {2}", aakt.Count, aakt.Count(s => s.Burslu), aakt.Count(s => s.KardesVar && !s.Burslu)));
            sb.AppendLine("   Ödenecek toplam      : " + Para.F(b));
            sb.AppendLine("   Tahsil edilen        : " + Para.F(o) + "   ← İDAREYE TESLİM");
            sb.AppendLine("   Kalan                : " + Para.F(Math.Max(0, b - o)));
            var odemeyen = aakt.Where(s => { var d = db.OdemeDurumu(s, ay); return d == "Ödenmedi" || d == "Kısmi"; }).ToList();
            if (odemeyen.Count > 0)
            {
                sb.AppendLine("   Ödemesi eksik olanlar (" + odemeyen.Count + "):");
                foreach (var s in odemeyen)
                    sb.AppendLine("     - " + s.AdSoyad + "  → kalan " + Para.F(db.Borc(s, ay) - db.Odenen(s.Id, ay)));
            }
            sb.AppendLine();

            var aylar = RaporAylari(db, ay);
            decimal yb = 0, yo = 0;
            foreach (var a in aylar) { yb += db.AydaAktifler(a).Sum(s => db.Borc(s, a)); yo += db.Payments.Where(p => p.Ay == a).Sum(p => p.Tutar); }
            sb.AppendLine("■ YIL GENELİ — " + Ay.Ad(aylar[0]) + " - " + Ay.Ad(aylar[aylar.Count - 1]));
            sb.AppendLine("   Ödenecek: " + Para.F(yb) + "   Tahsil edilen: " + Para.F(yo) + "   Kalan: " + Para.F(Math.Max(0, yb - yo)));
            return sb.ToString();
        }
    }
}
