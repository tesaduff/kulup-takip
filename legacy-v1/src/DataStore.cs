using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;

namespace KulupTakip
{
    class Settings
    {
        public string Okul = "", Sinif = "", Ogretmen = "", Kulup = "Kulüp", Mudur = "";
        public int YilBaslangic = Ay.VarsayilanYil();
        public decimal Ucret = 0m;
        public decimal KardesIndirim = 50m;
        public string BaslangicAy = "";

        public bool Tamam { get { return Okul.Trim() != "" && Sinif.Trim() != "" && Ogretmen.Trim() != ""; } }
        public string EgitimYili { get { return YilBaslangic + "-" + (YilBaslangic + 1); } }
    }

    class Student
    {
        public int Id;
        public string No = "", AdSoyad = "", VeliAd = "", VeliTel = "", KardesAd = "", KardesSinif = "", Not = "";
        public bool KardesVar, Burslu;
        public string BaslangicAy = "", BitisAy = "";

        public bool AydaAktif(string ay)
        {
            if (BaslangicAy != "" && string.CompareOrdinal(ay, BaslangicAy) < 0) return false;
            if (BitisAy != "" && string.CompareOrdinal(ay, BitisAy) > 0) return false;
            return true;
        }
        public bool Ayrildi { get { return BitisAy != ""; } }
    }

    class Payment
    {
        public int Id, OgrenciId;
        public string Ay = "", Tarih = "", Not = "";
        public decimal Tutar;
    }

    static class Durumlar
    {
        public const string Geldi = "Geldi", Gelmedi = "Gelmedi", Izinli = "İzinli", Raporlu = "Raporlu";
        public static readonly string[] Hepsi = { Geldi, Gelmedi, Izinli, Raporlu };
        public static string Kisa(string d)
        {
            if (d == Geldi) return "G";
            if (d == Gelmedi) return "Y";
            if (d == Izinli) return "İ";
            if (d == Raporlu) return "R";
            return "";
        }
    }

    static class Ay
    {
        public static readonly string[] Adlar = { "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık" };
        public static readonly CultureInfo TR = new CultureInfo("tr-TR");

        public static int VarsayilanYil() { var d = DateTime.Today; return d.Month >= 9 ? d.Year : d.Year - 1; }
        public static string Of(DateTime d) { return d.ToString("yyyy-MM", CultureInfo.InvariantCulture); }
        public static string Bugun { get { return Of(DateTime.Today); } }
        public static string Ad(string ay)
        {
            DateTime d;
            if (!TryParse(ay, out d)) return ay;
            return Adlar[d.Month - 1] + " " + d.Year;
        }
        public static bool TryParse(string ay, out DateTime d)
        {
            return DateTime.TryParseExact(ay + "-01", "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out d);
        }
        // Eylül -> Ağustos (12 ay)
        public static List<string> YilAylari(int yil)
        {
            var l = new List<string>();
            var d = new DateTime(yil, 9, 1);
            for (int i = 0; i < 12; i++) l.Add(Of(d.AddMonths(i)));
            return l;
        }
        public static string Gun(DateTime d) { return d.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture); }
        public static string GunTr(string g)
        {
            DateTime d;
            if (DateTime.TryParseExact(g, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out d))
                return d.ToString("dd.MM.yyyy", CultureInfo.InvariantCulture);
            return g;
        }
        public static DateTime HaftaBasi(DateTime d)
        {
            int diff = ((int)d.DayOfWeek + 6) % 7; // Pazartesi=0
            return d.Date.AddDays(-diff);
        }
    }

    static class Para
    {
        public static string F(decimal v) { return v.ToString("#,##0.00", Ay.TR) + " ₺"; }
        public static bool TryParse(string s, out decimal v)
        {
            v = 0;
            if (s == null) return false;
            s = s.Replace("₺", "").Replace("TL", "").Replace("tl", "").Replace(" ", "").Trim();
            if (s == "") { v = 0; return true; }
            if (s.Contains(",") && s.Contains(".")) s = s.Replace(".", "").Replace(",", ".");
            else if (s.Contains(",")) s = s.Replace(",", ".");
            return decimal.TryParse(s, NumberStyles.Number, CultureInfo.InvariantCulture, out v);
        }
    }

    class DataStore
    {
        public readonly string Path;
        public Settings Settings = new Settings();
        public List<Student> Students = new List<Student>();
        public List<Payment> Payments = new List<Payment>();
        public Dictionary<string, decimal> AyUcret = new Dictionary<string, decimal>();
        // anahtar: yyyy-MM-dd|ogrenciId
        public Dictionary<string, string> Yoklama = new Dictionary<string, string>();
        public bool Dirty;

        public DataStore(string path) { Path = path; }

        public static string Klasor
        {
            get
            {
                string d = System.IO.Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments), "KulupTakip");
                Directory.CreateDirectory(d);
                return d;
            }
        }
        public static string RaporKlasoru { get { string d = System.IO.Path.Combine(Klasor, "Raporlar"); Directory.CreateDirectory(d); return d; } }
        public static string YedekKlasoru { get { string d = System.IO.Path.Combine(Klasor, "Yedekler"); Directory.CreateDirectory(d); return d; } }
        public static string VarsayilanYol() { return System.IO.Path.Combine(Klasor, "KulupVerileri.xlsx"); }

        // ---------- HESAPLAR ----------
        public decimal AyinUcreti(string ay)
        {
            decimal u;
            if (AyUcret.TryGetValue(ay, out u)) return u;
            return Settings.Ucret;
        }

        public decimal Borc(Student s, string ay)
        {
            if (!s.AydaAktif(ay)) return 0;
            if (s.Burslu) return 0;
            decimal u = AyinUcreti(ay);
            if (s.KardesVar) u = Math.Round(u * (100m - Settings.KardesIndirim) / 100m, 2);
            return u;
        }

        // öğrencinin ücret türüne göre aylık ücreti (kayıt tarihinden bağımsız)
        public decimal TurUcreti(Student s, string ay)
        {
            if (s.Burslu) return 0;
            decimal u = AyinUcreti(ay);
            return s.KardesVar ? Math.Round(u * (100m - Settings.KardesIndirim) / 100m, 2) : u;
        }

        public decimal Indirim(Student s, string ay)
        {
            if (!s.AydaAktif(ay)) return 0;
            decimal u = AyinUcreti(ay);
            return u - Borc(s, ay);
        }

        public string Tur(Student s)
        {
            if (s.Burslu) return "Burslu (ücretsiz)";
            if (s.KardesVar) return "Kardeş %" + Settings.KardesIndirim.ToString("0.##", Ay.TR);
            return "Normal";
        }

        public decimal Odenen(int id, string ay)
        {
            decimal t = 0;
            foreach (var p in Payments) if (p.OgrenciId == id && p.Ay == ay) t += p.Tutar;
            return t;
        }

        public string OdemeDurumu(Student s, string ay)
        {
            decimal b = Borc(s, ay), o = Odenen(s.Id, ay);
            if (!s.AydaAktif(ay)) return o > 0 ? "Kayıt dışı (ödeme var)" : "Kayıt dışı";
            if (b == 0) return s.Burslu ? "Burslu" : "Ücret yok";
            if (o >= b) return o > b ? "Ödendi (fazla)" : "Ödendi";
            if (o > 0) return "Kısmi";
            return "Ödenmedi";
        }

        public string SonOdemeTarihi(int id, string ay)
        {
            string t = "";
            foreach (var p in Payments)
                if (p.OgrenciId == id && p.Ay == ay && string.CompareOrdinal(p.Tarih, t) > 0) t = p.Tarih;
            return t;
        }

        public Payment OdemeEkle(int id, string ay, decimal tutar, DateTime tarih, string not)
        {
            int nid = Payments.Count == 0 ? 1 : Payments.Max(x => x.Id) + 1;
            var p = new Payment { Id = nid, OgrenciId = id, Ay = ay, Tutar = tutar, Tarih = Ay.Gun(tarih), Not = not ?? "" };
            Payments.Add(p);
            Dirty = true;
            return p;
        }

        public string YoklamaAl(DateTime gun, int id)
        {
            string d;
            return Yoklama.TryGetValue(Ay.Gun(gun) + "|" + id, out d) ? d : "";
        }

        public void YoklamaYaz(DateTime gun, int id, string durum)
        {
            string k = Ay.Gun(gun) + "|" + id;
            if (string.IsNullOrEmpty(durum)) Yoklama.Remove(k); else Yoklama[k] = durum;
            Dirty = true;
        }

        public bool GunKayitliMi(DateTime gun)
        {
            string p = Ay.Gun(gun) + "|";
            foreach (var k in Yoklama.Keys) if (k.StartsWith(p)) return true;
            return false;
        }

        public List<Student> Sirali(IEnumerable<Student> l)
        {
            return l.OrderBy(s => { int n; return int.TryParse(s.No, out n) ? n : int.MaxValue; })
                    .ThenBy(s => s.AdSoyad, StringComparer.Create(Ay.TR, true)).ToList();
        }

        public List<Student> AydaAktifler(string ay) { return Sirali(Students.Where(s => s.AydaAktif(ay))); }

        public Student Bul(int id) { return Students.FirstOrDefault(s => s.Id == id); }

        public int YeniId() { return Students.Count == 0 ? 1 : Students.Max(s => s.Id) + 1; }

        public string IlkAy { get { return Settings.BaslangicAy != "" ? Settings.BaslangicAy : Ay.YilAylari(Settings.YilBaslangic)[0]; } }

        // ---------- KAYIT / YÜKLEME ----------
        static string B(bool b) { return b ? "Evet" : "Hayır"; }
        static bool PB(string s)
        {
            s = (s ?? "").Trim().ToLower(Ay.TR);
            return s == "evet" || s == "e" || s == "var" || s == "x" || s == "1" || s == "true" || s == "doğru";
        }

        public void Load()
        {
            if (!File.Exists(Path)) return;
            var sheets = Xlsx.Read(Path);
            LoadFrom(sheets);
        }

        static Dictionary<string, int> Head(Xlsx.SheetData sd)
        {
            var h = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
            if (sd.Rows.Count == 0) return h;
            for (int i = 0; i < sd.Rows[0].Count; i++) if (!h.ContainsKey(sd.Rows[0][i].Trim())) h[sd.Rows[0][i].Trim()] = i;
            return h;
        }
        static string G(List<string> row, Dictionary<string, int> h, string col)
        {
            int i;
            if (!h.TryGetValue(col, out i) || i >= row.Count) return "";
            return (row[i] ?? "").Trim();
        }
        static decimal D(string s) { decimal v; return Para.TryParse(s, out v) ? v : 0; }
        static string Tarih(string s)
        {
            double oa;
            if (s.Length > 0 && !s.Contains("-") && !s.Contains(".") && double.TryParse(s, NumberStyles.Float, CultureInfo.InvariantCulture, out oa) && oa > 20000 && oa < 80000)
                return Ay.Gun(DateTime.FromOADate(oa));
            DateTime d;
            if (DateTime.TryParseExact(s, new[] { "yyyy-MM-dd", "dd.MM.yyyy", "d.M.yyyy" }, CultureInfo.InvariantCulture, DateTimeStyles.None, out d)) return Ay.Gun(d);
            return s;
        }
        static string AyNorm(string s)
        {
            double oa;
            if (s.Length > 0 && !s.Contains("-") && double.TryParse(s, NumberStyles.Float, CultureInfo.InvariantCulture, out oa) && oa > 20000 && oa < 80000)
                return Ay.Of(DateTime.FromOADate(oa));
            return s.Length >= 7 ? s.Substring(0, 7) : s;
        }

        public void LoadFrom(List<Xlsx.SheetData> sheets)
        {
            var st = new Settings();
            var students = new List<Student>();
            var pays = new List<Payment>();
            var ucret = new Dictionary<string, decimal>();
            var yok = new Dictionary<string, string>();
            bool bulundu = false;

            foreach (var sd in sheets)
            {
                var h = Head(sd);
                var rows = sd.Rows.Skip(1).Where(r => r.Any(x => !string.IsNullOrWhiteSpace(x))).ToList();
                switch (sd.Name)
                {
                    case "Ayarlar":
                        bulundu = true;
                        foreach (var r in rows)
                        {
                            string k = r.Count > 0 ? r[0].Trim() : "", v = r.Count > 1 ? (r[1] ?? "").Trim() : "";
                            if (k == "Okul") st.Okul = v;
                            else if (k == "Sınıf") st.Sinif = v;
                            else if (k == "Öğretmen") st.Ogretmen = v;
                            else if (k == "Kulüp") st.Kulup = v;
                            else if (k == "Müdür") st.Mudur = v;
                            else if (k == "Eğitim Yılı") { int y; if (int.TryParse(v.Split('-')[0], out y)) st.YilBaslangic = y; }
                            else if (k == "Aylık Ücret") st.Ucret = D(v);
                            else if (k == "Kardeş İndirimi %") st.KardesIndirim = D(v);
                            else if (k == "Başlangıç Ayı") st.BaslangicAy = AyNorm(v);
                        }
                        break;
                    case "Ogrenciler":
                        foreach (var r in rows)
                        {
                            int id;
                            if (!int.TryParse(G(r, h, "Id"), out id)) continue;
                            students.Add(new Student
                            {
                                Id = id, No = G(r, h, "No"), AdSoyad = G(r, h, "AdSoyad"), VeliAd = G(r, h, "VeliAd"),
                                VeliTel = G(r, h, "VeliTel"), KardesVar = PB(G(r, h, "KardesVar")), KardesAd = G(r, h, "KardesAd"),
                                KardesSinif = G(r, h, "KardesSinif"), Burslu = PB(G(r, h, "Burslu")),
                                BaslangicAy = AyNorm(G(r, h, "BaslangicAy")), BitisAy = AyNorm(G(r, h, "BitisAy")), Not = G(r, h, "Not")
                            });
                        }
                        break;
                    case "Odemeler":
                        foreach (var r in rows)
                        {
                            int id, oid;
                            if (!int.TryParse(G(r, h, "Id"), out id) || !int.TryParse(G(r, h, "OgrenciId"), out oid)) continue;
                            pays.Add(new Payment { Id = id, OgrenciId = oid, Ay = AyNorm(G(r, h, "Ay")), Tutar = D(G(r, h, "Tutar")), Tarih = Tarih(G(r, h, "Tarih")), Not = G(r, h, "Not") });
                        }
                        break;
                    case "AylikUcret":
                        foreach (var r in rows)
                        {
                            string a = AyNorm(G(r, h, "Ay"));
                            if (a != "") ucret[a] = D(G(r, h, "Ucret"));
                        }
                        break;
                    case "Yoklama":
                        foreach (var r in rows)
                        {
                            int oid;
                            string t = Tarih(G(r, h, "Tarih")), d = G(r, h, "Durum");
                            if (t == "" || d == "" || !int.TryParse(G(r, h, "OgrenciId"), out oid)) continue;
                            yok[t + "|" + oid] = d;
                        }
                        break;
                }
            }
            if (!bulundu) throw new InvalidDataException("Bu dosya bir Kulüp Takip veri dosyası değil (\"Ayarlar\" sayfası yok).");
            Settings = st; Students = students; Payments = pays; AyUcret = ucret; Yoklama = yok;
            Dirty = false;
        }

        public List<XSheet> ToSheets()
        {
            var list = new List<XSheet>();
            var a = new XSheet("Ayarlar");
            a.Set(0, 0, "Anahtar", St.Header); a.Set(0, 1, "Değer", St.Header);
            var kv = new List<string[]>
            {
                new[] { "Okul", Settings.Okul }, new[] { "Sınıf", Settings.Sinif }, new[] { "Öğretmen", Settings.Ogretmen },
                new[] { "Kulüp", Settings.Kulup }, new[] { "Müdür", Settings.Mudur }, new[] { "Eğitim Yılı", Settings.EgitimYili },
                new[] { "Aylık Ücret", Settings.Ucret.ToString(CultureInfo.InvariantCulture) },
                new[] { "Kardeş İndirimi %", Settings.KardesIndirim.ToString(CultureInfo.InvariantCulture) },
                new[] { "Başlangıç Ayı", Settings.BaslangicAy },
            };
            for (int i = 0; i < kv.Count; i++) { a.Set(i + 1, 0, kv[i][0], St.Text); a.Set(i + 1, 1, kv[i][1], St.Text); }
            a.Set(kv.Count + 2, 0, "Bu dosya Kulüp Takip programı tarafından yönetilir. Program açıkken bu dosyayı Excel'de düzenlemeyin.", St.Note);
            a.Width(0, 22); a.Width(1, 40);
            list.Add(a);

            var o = new XSheet("Ogrenciler");
            string[] oh = { "Id", "No", "AdSoyad", "VeliAd", "VeliTel", "KardesVar", "KardesAd", "KardesSinif", "Burslu", "BaslangicAy", "BitisAy", "Not" };
            for (int i = 0; i < oh.Length; i++) o.Set(0, i, oh[i], St.Header);
            int rr = 1;
            foreach (var s in Sirali(Students))
            {
                object[] v = { s.Id, s.No, s.AdSoyad, s.VeliAd, s.VeliTel, B(s.KardesVar), s.KardesAd, s.KardesSinif, B(s.Burslu), s.BaslangicAy, s.BitisAy, s.Not };
                for (int i = 0; i < v.Length; i++) o.Set(rr, i, v[i], St.Text);
                rr++;
            }
            o.Width(2, 28); o.Width(3, 22); o.Width(4, 16); o.Width(6, 20); o.Width(7, 12); o.FreezeRows = 1;
            list.Add(o);

            var p = new XSheet("Odemeler");
            string[] ph = { "Id", "OgrenciId", "Ogrenci", "Ay", "Tutar", "Tarih", "Not" };
            for (int i = 0; i < ph.Length; i++) p.Set(0, i, ph[i], St.Header);
            rr = 1;
            foreach (var x in Payments.OrderBy(x => x.Id))
            {
                var s = Bul(x.OgrenciId);
                object[] v = { x.Id, x.OgrenciId, s != null ? s.AdSoyad : "", x.Ay, x.Tutar, x.Tarih, x.Not };
                for (int i = 0; i < v.Length; i++) p.Set(rr, i, v[i], i == 4 ? St.Money : St.Text);
                rr++;
            }
            p.Width(2, 28); p.Width(4, 14); p.Width(5, 12); p.Width(6, 24); p.FreezeRows = 1;
            list.Add(p);

            var u = new XSheet("AylikUcret");
            u.Set(0, 0, "Ay", St.Header); u.Set(0, 1, "Ucret", St.Header);
            rr = 1;
            foreach (var x in AyUcret.OrderBy(x => x.Key)) { u.Set(rr, 0, x.Key, St.Text); u.Set(rr, 1, x.Value, St.Money); rr++; }
            u.Width(1, 14);
            list.Add(u);

            var y = new XSheet("Yoklama");
            y.Set(0, 0, "Tarih", St.Header); y.Set(0, 1, "OgrenciId", St.Header); y.Set(0, 2, "Ogrenci", St.Header); y.Set(0, 3, "Durum", St.Header);
            rr = 1;
            foreach (var x in Yoklama.OrderBy(x => x.Key, StringComparer.Ordinal))
            {
                var parts = x.Key.Split('|');
                int id; int.TryParse(parts[1], out id);
                var s = Bul(id);
                y.Set(rr, 0, parts[0], St.Text); y.Set(rr, 1, id, St.Text); y.Set(rr, 2, s != null ? s.AdSoyad : "", St.Text); y.Set(rr, 3, x.Value, St.Text);
                rr++;
            }
            y.Width(0, 12); y.Width(2, 28); y.Width(3, 12); y.FreezeRows = 1;
            list.Add(y);
            return list;
        }

        public void Save()
        {
            string tmp = Path + ".tmp";
            Xlsx.Write(tmp, ToSheets());
            try
            {
                if (File.Exists(Path))
                {
                    string yedek = System.IO.Path.Combine(YedekKlasoru, "KulupVerileri_" + DateTime.Today.ToString("yyyy-MM-dd") + ".xlsx");
                    if (!File.Exists(yedek)) { File.Copy(Path, yedek); EskiYedekleriSil(); }
                }
                File.Copy(tmp, Path, true);
            }
            finally
            {
                try { File.Delete(tmp); } catch { }
            }
            Dirty = false;
        }

        static void EskiYedekleriSil()
        {
            try
            {
                var f = new DirectoryInfo(YedekKlasoru).GetFiles("KulupVerileri_*.xlsx").OrderByDescending(x => x.Name).Skip(60);
                foreach (var x in f) x.Delete();
            }
            catch { }
        }
    }
}
