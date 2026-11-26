using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;

namespace KulupTakip
{
    // Geliştirici testi: KulupTakip.exe --selftest <klasör>
    static class SelfTest
    {
        static int hata;
        static void Esit(object a, object b, string ad)
        {
            if (!Equals(a, b)) { hata++; Console.WriteLine("HATA " + ad + ": beklenen=" + b + " gelen=" + a); }
            else Console.WriteLine("ok   " + ad);
        }

        // Ekran görüntüleri: KulupTakip.exe --shots <klasör>
        public static int Shots(string dir)
        {
            if (Run(dir) != 0) return 1;
            System.Windows.Forms.Application.EnableVisualStyles();
            var db = new DataStore(Path.Combine(dir, "test_veri.xlsx"));
            db.Load();
            Action<System.Windows.Forms.Form, string> shot = (f, ad) =>
            {
                f.StartPosition = System.Windows.Forms.FormStartPosition.Manual;
                f.Location = new System.Drawing.Point(-5000, -5000);
                f.ShowInTaskbar = false;
                f.Show();
                System.Windows.Forms.Application.DoEvents();
                using (var bmp = new System.Drawing.Bitmap(f.Width, f.Height))
                {
                    f.DrawToBitmap(bmp, new System.Drawing.Rectangle(0, 0, f.Width, f.Height));
                    bmp.Save(Path.Combine(dir, ad + ".png"), System.Drawing.Imaging.ImageFormat.Png);
                }
            };
            var m = new MainForm(db);
            var tabs = m.Controls.OfType<System.Windows.Forms.TabControl>().First();
            m.Show(); m.Location = new System.Drawing.Point(-5000, -5000);
            for (int i = 0; i < tabs.TabPages.Count; i++)
            {
                tabs.SelectedIndex = i;
                if (i == 1) tabs.TabPages[1].Controls.OfType<System.Windows.Forms.Panel>().First().Controls.OfType<System.Windows.Forms.FlowLayoutPanel>().First()
                    .Controls.OfType<System.Windows.Forms.DateTimePicker>().First().Value = new DateTime(2026, 11, 25);
                shot(m, "ekran_" + (i + 1));
            }
            db.Dirty = false;
            m.Close();
            shot(new SetupForm(new Settings(), true), "ekran_kurulum");
            shot(new StudentForm(db, db.Bul(2)), "ekran_ogrenci");
            shot(new PaymentForm("Zeynep Çelik", "2026-11", 200), "ekran_odeme");
            return 0;
        }

        public static int Run(string dir)
        {
            try
            {
                Directory.CreateDirectory(dir);
                string path = Path.Combine(dir, "test_veri.xlsx");
                var db = new DataStore(path);
                db.Settings.Okul = "Atatürk İlkokulu"; db.Settings.Sinif = "2-B"; db.Settings.Ogretmen = "Ayşe Öğretmen";
                db.Settings.Kulup = "Satranç Kulübü"; db.Settings.Mudur = "Mehmet Müdür"; db.Settings.YilBaslangic = 2026;
                db.Settings.Ucret = 800; db.Settings.KardesIndirim = 50; db.Settings.BaslangicAy = "2026-09";
                db.Students.Add(new Student { Id = 1, No = "12", AdSoyad = "Ali Yılmaz", BaslangicAy = "2026-09" });
                db.Students.Add(new Student { Id = 2, No = "5", AdSoyad = "Zeynep Çelik", KardesVar = true, KardesAd = "Can Çelik", KardesSinif = "4-A", BaslangicAy = "2026-09" });
                db.Students.Add(new Student { Id = 3, No = "7", AdSoyad = "Şule Ğüneş", Burslu = true, BaslangicAy = "2026-09" });
                db.Students.Add(new Student { Id = 4, No = "9", AdSoyad = "Ömer İnce", BaslangicAy = "2026-11" });
                db.AyUcret["2026-12"] = 900;
                db.OdemeEkle(1, "2026-11", 800, new DateTime(2026, 11, 25), "");
                db.OdemeEkle(2, "2026-11", 200, new DateTime(2026, 11, 24), "taksit");
                db.OdemeEkle(4, "2026-11", 800, new DateTime(2026, 11, 25), "");
                db.YoklamaYaz(new DateTime(2026, 11, 25), 1, Durumlar.Geldi);
                db.YoklamaYaz(new DateTime(2026, 11, 25), 2, Durumlar.Gelmedi);
                db.YoklamaYaz(new DateTime(2026, 11, 25), 3, Durumlar.Izinli);

                Esit(db.Borc(db.Bul(1), "2026-11"), 800m, "normal ücret");
                Esit(db.Borc(db.Bul(2), "2026-11"), 400m, "kardeş %50");
                Esit(db.Borc(db.Bul(3), "2026-11"), 0m, "burslu 0");
                Esit(db.Borc(db.Bul(4), "2026-10"), 0m, "kayıt öncesi 0");
                Esit(db.Borc(db.Bul(2), "2026-12"), 450m, "aya özel ücret");
                Esit(db.OdemeDurumu(db.Bul(2), "2026-11"), "Kısmi", "kısmi durum");

                db.Save();
                var db2 = new DataStore(path);
                db2.Load();
                Esit(db2.Settings.Okul, "Atatürk İlkokulu", "ayar okul");
                Esit(db2.Settings.Ucret, 800m, "ayar ücret");
                Esit(db2.Students.Count, 4, "öğrenci sayısı");
                Esit(db2.Bul(3).AdSoyad, "Şule Ğüneş", "türkçe karakter");
                Esit(db2.Bul(2).KardesSinif, "4-A", "kardeş sınıfı");
                Esit(db2.Bul(3).Burslu, true, "burslu");
                Esit(db2.Payments.Count, 3, "ödeme sayısı");
                Esit(db2.Odenen(2, "2026-11"), 200m, "ödenen");
                Esit(db2.AyinUcreti("2026-12"), 900m, "aylık ücret");
                Esit(db2.YoklamaAl(new DateTime(2026, 11, 25), 2), Durumlar.Gelmedi, "yoklama");

                Xlsx.Write(Path.Combine(dir, "r_gunluk.xlsx"), Reports.Gunluk(db2, new DateTime(2026, 11, 25)));
                Xlsx.Write(Path.Combine(dir, "r_haftalik.xlsx"), Reports.Haftalik(db2, new DateTime(2026, 11, 25)));
                Xlsx.Write(Path.Combine(dir, "r_aylik_yoklama.xlsx"), new List<XSheet> { Reports.AylikYoklama(db2, "2026-11") });
                Xlsx.Write(Path.Combine(dir, "r_aylik_aidat.xlsx"), new List<XSheet> { Reports.AylikAidat(db2, "2026-11") });
                Xlsx.Write(Path.Combine(dir, "r_yillik.xlsx"), Reports.Yillik(db2, "2026-11"));
                Xlsx.Write(Path.Combine(dir, "r_liste.xlsx"), new List<XSheet> { Reports.OgrenciListesi(db2) });
                Console.WriteLine(Reports.EkranOzeti(db2, new DateTime(2026, 11, 25), "2026-11"));

                // şablon + içe aktarma
                var sab = Reports.Sablon();
                sab.Set(1, 0, "101", St.Text); sab.Set(1, 1, "Deniz Kaya", St.Text); sab.Set(1, 4, "Evet", St.Text); sab.Set(1, 6, "3-C", St.Text);
                sab.Set(2, 0, 102, St.Text); sab.Set(2, 1, "Ece Aydın", St.Text); sab.Set(2, 7, "Evet", St.Text);
                string sp = Path.Combine(dir, "sablon_dolu.xlsx");
                Xlsx.Write(sp, new List<XSheet> { sab });
                var imp = Importer.Oku(sp);
                Esit(imp.Ogrenciler.Count, 2, "içe aktarma sayısı");
                Esit(imp.Ogrenciler[0].KardesVar, true, "içe aktarma kardeş");
                Esit(imp.Ogrenciler[0].KardesSinif, "3-C", "içe aktarma kardeş sınıfı");
                Esit(imp.Ogrenciler[1].Burslu, true, "içe aktarma burslu");
                Esit(imp.Ogrenciler[1].No, "102", "içe aktarma no");

                var m = Importer.Metinden("125 Ali Veli\r\n126\tAyşe Demir\r\n\r\nMehmet Can");
                Esit(m.Count, 3, "metinden sayı");
                Esit(m[0].No, "125", "metinden no");
                Esit(m[1].AdSoyad, "Ayşe Demir", "metinden ad");

                Console.WriteLine(hata == 0 ? "TÜM TESTLER GEÇTİ" : hata + " HATA");
                return hata == 0 ? 0 : 1;
            }
            catch (Exception ex)
            {
                Console.WriteLine("İSTİSNA: " + ex);
                return 2;
            }
        }
    }
}
