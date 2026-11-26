using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace KulupTakip
{
    class ImportResult
    {
        public List<Student> Ogrenciler = new List<Student>();
        public string Bilgi = "";
    }

    static class Importer
    {
        public static string Norm(string s)
        {
            s = (s ?? "").Trim().ToLower(Ay.TR);
            var sb = new StringBuilder();
            foreach (char c in s)
            {
                switch (c)
                {
                    case 'ı': sb.Append('i'); break;
                    case 'ş': sb.Append('s'); break;
                    case 'ğ': sb.Append('g'); break;
                    case 'ü': sb.Append('u'); break;
                    case 'ö': sb.Append('o'); break;
                    case 'ç': sb.Append('c'); break;
                    case 'â': sb.Append('a'); break;
                    case 'î': sb.Append('i'); break;
                    default:
                        if (char.IsLetterOrDigit(c)) sb.Append(c); else sb.Append(' ');
                        break;
                }
            }
            return string.Join(" ", sb.ToString().Split(new[] { ' ' }, StringSplitOptions.RemoveEmptyEntries));
        }

        static bool Evet(string s)
        {
            s = Norm(s);
            return s == "evet" || s == "e" || s == "var" || s == "x" || s == "1" || s == "true" || s == "dogru" || s == "burslu";
        }
        static bool Hayir(string s)
        {
            s = Norm(s);
            return s == "" || s == "hayir" || s == "h" || s == "yok" || s == "0" || s == "false" || s == "-";
        }

        static string Cell(List<string> r, int i) { return i >= 0 && i < r.Count ? (r[i] ?? "").Trim() : ""; }

        public static ImportResult Oku(string path)
        {
            var sheets = Xlsx.Read(path);
            var res = new ImportResult();
            var sd = sheets.FirstOrDefault(s => s.Rows.Any(r => r.Any(c => !string.IsNullOrWhiteSpace(c))));
            if (sd == null) { res.Bilgi = "Dosyada veri bulunamadı."; return res; }

            int headerRow = -1;
            int cNo = -1, cAd = -1, cSoyad = -1, cAdSoyad = -1, cVeli = -1, cTel = -1, cKardes = -1, cKardesAd = -1, cKardesSinif = -1, cBurs = -1;
            for (int ri = 0; ri < Math.Min(20, sd.Rows.Count) && headerRow < 0; ri++)
            {
                var row = sd.Rows[ri];
                int tNo = -1, tAd = -1, tSoyad = -1, tAdSoyad = -1, tVeli = -1, tTel = -1, tKardes = -1, tKardesAd = -1, tKardesSinif = -1, tBurs = -1;
                for (int ci = 0; ci < row.Count; ci++)
                {
                    string h = Norm(row[ci]);
                    if (h == "") continue;
                    if (h.Contains("kardes"))
                    {
                        if (h.Contains("sinif")) tKardesSinif = ci;
                        else if (h.Contains("ad") || h.Contains("isim")) tKardesAd = ci;
                        else tKardes = ci;
                    }
                    else if (h.Contains("burs")) tBurs = ci;
                    else if (h.Contains("tel") || h.Contains("gsm") || h.Contains("cep")) tTel = ci;
                    else if (h.Contains("veli") || h.Contains("anne") || h.Contains("baba")) { if (tVeli < 0) tVeli = ci; }
                    else if (h.Contains("sira") || h == "s no" || h == "sn") { }
                    else if ((h.Contains("ad") && h.Contains("soyad")) || h.Contains("isim") || h == "ogrenci" || h.Contains("ogrencinin")) tAdSoyad = ci;
                    else if (h.Contains("soyad")) tSoyad = ci;
                    else if (h == "ad" || h == "adi" || h.EndsWith(" adi") || h == "isim") tAd = ci;
                    else if (h == "no" || h.Contains("numara") || h.EndsWith(" no") || h.StartsWith("no ") || h == "okul no") tNo = ci;
                }
                if (tAdSoyad >= 0 || tAd >= 0)
                {
                    headerRow = ri;
                    cNo = tNo; cAd = tAd; cSoyad = tSoyad; cAdSoyad = tAdSoyad; cVeli = tVeli; cTel = tTel;
                    cKardes = tKardes; cKardesAd = tKardesAd; cKardesSinif = tKardesSinif; cBurs = tBurs;
                }
            }

            int start;
            if (headerRow < 0)
            {
                // Başlık yok: 1. sütun sayı ise numara, sonraki ad soyad
                start = 0;
                var ilk = sd.Rows.FirstOrDefault(r => r.Any(c => !string.IsNullOrWhiteSpace(c)));
                int n;
                if (ilk != null && ilk.Count > 1 && int.TryParse(Cell(ilk, 0), out n)) { cNo = 0; cAdSoyad = 1; }
                else cAdSoyad = 0;
                res.Bilgi = "Başlık satırı bulunamadı; " + (cNo == 0 ? "A sütunu numara, B sütunu ad soyad" : "A sütunu ad soyad") + " kabul edildi.\n";
            }
            else start = headerRow + 1;

            for (int ri = start; ri < sd.Rows.Count; ri++)
            {
                var r = sd.Rows[ri];
                string ad;
                if (cAdSoyad >= 0) ad = Cell(r, cAdSoyad);
                else ad = (Cell(r, cAd) + " " + Cell(r, cSoyad)).Trim();
                if (cAdSoyad >= 0 && cSoyad >= 0 && cSoyad != cAdSoyad && Cell(r, cSoyad) != "") ad = (ad + " " + Cell(r, cSoyad)).Trim();
                ad = string.Join(" ", ad.Split(new[] { ' ' }, StringSplitOptions.RemoveEmptyEntries));
                if (ad == "") continue;
                string nad = Norm(ad);
                if (nad.Contains("toplam") || nad.Contains("adi soyadi")) continue;
                int dummy;
                if (int.TryParse(ad, out dummy)) continue;

                var s = new Student { AdSoyad = ad, No = Cell(r, cNo), VeliAd = Cell(r, cVeli), VeliTel = Cell(r, cTel) };
                if (s.No.EndsWith(".0")) s.No = s.No.Substring(0, s.No.Length - 2);
                string k = Cell(r, cKardes), kAd = Cell(r, cKardesAd), kSinif = Cell(r, cKardesSinif);
                if (cKardes >= 0 && !Hayir(k))
                {
                    s.KardesVar = true;
                    if (!Evet(k)) s.KardesAd = k;
                }
                if (kAd != "" && !Hayir(kAd)) { s.KardesVar = true; s.KardesAd = kAd; }
                if (kSinif != "" && !Hayir(kSinif)) { s.KardesVar = true; s.KardesSinif = kSinif; }
                s.Burslu = cBurs >= 0 && Evet(Cell(r, cBurs));
                res.Ogrenciler.Add(s);
            }
            if (res.Ogrenciler.Count == 0) res.Bilgi += "Öğrenci adı içeren satır bulunamadı.";
            return res;
        }

        public static List<Student> Metinden(string text)
        {
            var l = new List<Student>();
            foreach (var line0 in text.Split(new[] { '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries))
            {
                string line = line0.Trim();
                if (line == "") continue;
                string no = "";
                var parts = line.Split(new[] { '\t', ';' }, StringSplitOptions.RemoveEmptyEntries).Select(x => x.Trim()).Where(x => x != "").ToList();
                int n;
                if (parts.Count >= 2 && int.TryParse(parts[0], out n)) { no = parts[0]; line = parts[1]; }
                else
                {
                    var sp = line.Split(new[] { ' ' }, 2);
                    if (sp.Length == 2 && int.TryParse(sp[0].TrimEnd('.', '-', ')'), out n)) { no = sp[0].TrimEnd('.', '-', ')'); line = sp[1].Trim(); }
                }
                line = string.Join(" ", line.Split(new[] { ' ' }, StringSplitOptions.RemoveEmptyEntries));
                if (line != "") l.Add(new Student { No = no, AdSoyad = line });
            }
            return l;
        }
    }
}
