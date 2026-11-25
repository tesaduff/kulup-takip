using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Linq;
using System.Windows.Forms;

namespace KulupTakip
{
    class MainForm : Form
    {
        readonly DataStore db;
        readonly Timer kayitTimer = new Timer { Interval = 1200 };
        Label baslik, durumLbl;
        TabControl tabs;

        // Öğrenciler
        DataGridView gOgr; TextBox ara; Label ogrOzet;
        // Yoklama
        DataGridView gYok; DateTimePicker yokTarih; Label yokOzet;
        // Aidat
        DataGridView gAid; ComboBox aidAy; TextBox aidUcret; Label aidOzet, aidBilgi; bool aidDolduruluyor;
        // Raporlar
        DateTimePicker rTarih; ComboBox rAy; TextBox rOzet;
        // Ayarlar
        Label ayarBilgi;

        public MainForm(DataStore db)
        {
            this.db = db;
            Font = Ui.Yazi;
            Text = "Kulüp Takip - Yoklama ve Aidat";
            StartPosition = FormStartPosition.CenterScreen;
            Size = new Size(Ui.S(1150), Ui.S(760));
            MinimumSize = new Size(Ui.S(820), Ui.S(560));
            try { Icon = Icon.ExtractAssociatedIcon(Application.ExecutablePath); } catch { }

            var ust = new Panel { Dock = DockStyle.Top, Height = Ui.S(58), BackColor = Ui.Mavi };
            baslik = new Label { Dock = DockStyle.Fill, ForeColor = Color.White, Font = Ui.Buyuk, TextAlign = ContentAlignment.MiddleLeft, Padding = new Padding(Ui.S(14), 0, 0, 0) };
            ust.Controls.Add(baslik);
            durumLbl = new Label { Dock = DockStyle.Bottom, Height = Ui.S(26), TextAlign = ContentAlignment.MiddleLeft, Padding = new Padding(Ui.S(8), 0, 0, 0), BackColor = Color.FromArgb(242, 242, 242), ForeColor = Color.DimGray };

            tabs = new TabControl { Dock = DockStyle.Fill, Font = Ui.Kalin, Padding = new Point(Ui.S(14), Ui.S(6)) };
            tabs.TabPages.Add(OgrenciSekmesi());
            tabs.TabPages.Add(YoklamaSekmesi());
            tabs.TabPages.Add(AidatSekmesi());
            tabs.TabPages.Add(RaporSekmesi());
            tabs.TabPages.Add(AyarSekmesi());
            tabs.SelectedIndexChanged += (s, e) => SekmeYenile();

            Controls.Add(tabs); Controls.Add(ust); Controls.Add(durumLbl);
            kayitTimer.Tick += (s, e) => { kayitTimer.Stop(); Kaydet(false); };
            FormClosing += Kapaniyor;
            BaslikYenile();
            OgrDoldur();
            Durum("Veriler: " + db.Path);
            if (db.Students.Count == 0) tabs.SelectedIndex = 0;
            else tabs.SelectedIndex = 1;
        }

        // ================= ORTAK =================
        void BaslikYenile()
        {
            var st = db.Settings;
            baslik.Text = st.Okul + "   •   " + st.Sinif + " Sınıfı   •   " + st.Ogretmen + "   •   " + st.Kulup + " (" + st.EgitimYili + ")";
            if (ayarBilgi != null)
                ayarBilgi.Text = "Okul: " + st.Okul + "\nSınıf: " + st.Sinif + "\nSınıf Öğretmeni: " + st.Ogretmen + "\nKulüp: " + st.Kulup +
                    "\nOkul Müdürü: " + (st.Mudur == "" ? "-" : st.Mudur) + "\nEğitim-Öğretim Yılı: " + st.EgitimYili +
                    "\nKulüp başlangıç ayı: " + Ay.Ad(db.IlkAy) + "\nVarsayılan aylık ücret: " + Para.F(st.Ucret) +
                    "\nKardeş indirimi: %" + st.KardesIndirim.ToString("0.##", Ay.TR) +
                    "\n\nVeri dosyası: " + db.Path;
        }

        void Durum(string s) { durumLbl.Text = s; }

        void Degisti()
        {
            db.Dirty = true;
            kayitTimer.Stop(); kayitTimer.Start();
            Durum("Kaydediliyor...");
        }

        bool Kaydet(bool sessizDegil)
        {
            if (!db.Dirty) return true;
            try
            {
                db.Save();
                Durum("✔ Kaydedildi " + DateTime.Now.ToString("HH:mm:ss") + "   •   " + db.Path);
                return true;
            }
            catch (Exception ex)
            {
                Durum("⚠ KAYDEDİLEMEDİ: " + ex.Message + "  (Veri dosyası Excel'de açıksa kapatın; program tekrar deneyecek.)");
                durumLbl.ForeColor = Color.Firebrick;
                kayitTimer.Interval = 5000; kayitTimer.Start();
                if (sessizDegil) Ui.Hata("Veriler kaydedilemedi:\n" + ex.Message + "\n\nKulupVerileri.xlsx dosyası Excel'de açıksa kapatıp tekrar deneyin.");
                return false;
            }
            finally
            {
                if (!db.Dirty) { durumLbl.ForeColor = Color.DimGray; kayitTimer.Interval = 1200; }
            }
        }

        void Kapaniyor(object sender, FormClosingEventArgs e)
        {
            if (gYok != null && gYok.IsCurrentCellInEditMode) gYok.EndEdit();
            if (gAid != null && gAid.IsCurrentCellInEditMode) gAid.EndEdit();
            while (db.Dirty)
            {
                if (Kaydet(false)) break;
                var r = MessageBox.Show("Veriler kaydedilemedi. KulupVerileri.xlsx Excel'de açık olabilir.\n\nDosyayı kapatıp \"Yeniden Dene\"ye basın.\n\"İptal\" programı açık tutar.",
                    "Kulüp Takip", MessageBoxButtons.RetryCancel, MessageBoxIcon.Warning);
                if (r == DialogResult.Cancel) { e.Cancel = true; return; }
            }
        }

        void SekmeYenile()
        {
            switch (tabs.SelectedIndex)
            {
                case 0: OgrDoldur(); break;
                case 1: YokDoldur(); break;
                case 2: AidDoldur(); break;
                case 3: OzetYenile(); break;
            }
        }

        static void AyComboDoldur(ComboBox c, DataStore db, string secili)
        {
            c.Items.Clear();
            var aylar = Ay.YilAylari(db.Settings.YilBaslangic);
            foreach (var a in aylar) c.Items.Add(new Item(a, Ay.Ad(a)));
            int idx = aylar.IndexOf(secili);
            if (idx < 0) idx = string.CompareOrdinal(secili, aylar[0]) < 0 ? 0 : aylar.Count - 1;
            c.SelectedIndex = idx;
        }

        static string SeciliAy(ComboBox c) { var i = c.SelectedItem as Item; return i != null ? i.Key : Ay.Bugun; }

        static Panel Sayfa(Control icerik, params Control[] ustler)
        {
            var p = new Panel { Dock = DockStyle.Fill };
            p.Controls.Add(icerik);
            for (int i = ustler.Length - 1; i >= 0; i--) p.Controls.Add(ustler[i]);
            return p;
        }

        static Label AltBilgi()
        {
            return new Label { Dock = DockStyle.Bottom, AutoSize = false, Height = Ui.S(54), Font = Ui.Kalin, Padding = new Padding(Ui.S(8), Ui.S(4), Ui.S(8), Ui.S(4)), BackColor = Ui.AcikMavi, ForeColor = Color.FromArgb(31, 56, 100) };
        }

        // ================= ÖĞRENCİLER =================
        TabPage OgrenciSekmesi()
        {
            var tp = new TabPage("  Öğrenciler  ") { Font = Ui.Yazi };
            var bar = Ui.Bar();
            bar.Controls.Add(Ui.Btn("➕ Öğrenci Ekle", (s, e) => OgrEkle()));
            bar.Controls.Add(Ui.Btn("✎ Düzenle", (s, e) => OgrDuzenle()));
            bar.Controls.Add(Ui.Btn("✖ Sil", (s, e) => OgrSil()));
            bar.Controls.Add(Ui.Btn("Excel'den Yükle", (s, e) => ExcelYukle()));
            bar.Controls.Add(Ui.Btn("Toplu İsim Ekle", (s, e) => TopluEkle()));
            bar.Controls.Add(Ui.Btn("Boş Excel Şablonu", (s, e) => SablonVer()));
            bar.Controls.Add(Ui.Lbl("   Ara:"));
            ara = new TextBox { Width = Ui.S(170), Margin = new Padding(Ui.S(3), Ui.S(7), Ui.S(3), Ui.S(3)) };
            ara.TextChanged += (s, e) => OgrDoldur();
            bar.Controls.Add(ara);

            gOgr = Ui.Grid();
            gOgr.ReadOnly = true;
            gOgr.Columns.Add(Ui.Col("sira", "Sıra", 6, true));
            gOgr.Columns.Add(Ui.Col("no", "Okul No", 8, true));
            gOgr.Columns.Add(Ui.Col("ad", "Adı Soyadı", 26, true));
            gOgr.Columns.Add(Ui.Col("veli", "Veli", 18, true));
            gOgr.Columns.Add(Ui.Col("tel", "Telefon", 14, true));
            gOgr.Columns.Add(Ui.Col("tur", "Ücret Türü", 15, true));
            gOgr.Columns.Add(Ui.Col("kardes", "Kardeşi / Sınıfı", 18, true));
            gOgr.Columns.Add(Ui.Col("ucret", "Aylık Ücret", 12, true));
            gOgr.Columns.Add(Ui.Col("bas", "Başlangıç", 12, true));
            gOgr.Columns.Add(Ui.Col("durum", "Durum", 12, true));
            gOgr.Columns["ucret"].DefaultCellStyle.Alignment = DataGridViewContentAlignment.MiddleRight;
            gOgr.CellDoubleClick += (s, e) => { if (e.RowIndex >= 0) OgrDuzenle(); };
            gOgr.KeyDown += (s, e) => { if (e.KeyCode == Keys.Delete) OgrSil(); else if (e.KeyCode == Keys.Enter) { OgrDuzenle(); e.Handled = true; } };
            ogrOzet = AltBilgi();
            tp.Controls.Add(Sayfa(gOgr, bar));
            tp.Controls.Add(ogrOzet);
            return tp;
        }

        void OgrDoldur()
        {
            if (gOgr == null) return;
            string q = Importer.Norm(ara.Text);
            int secId = gOgr.SelectedRows.Count > 0 && gOgr.SelectedRows[0].Tag is int ? (int)gOgr.SelectedRows[0].Tag : -1;
            gOgr.Rows.Clear();
            int sira = 1;
            foreach (var s in db.Sirali(db.Students))
            {
                if (q != "" && !Importer.Norm(s.AdSoyad + " " + s.No + " " + s.VeliAd).Contains(q)) continue;
                int i = gOgr.Rows.Add(sira++, s.No, s.AdSoyad, s.VeliAd, s.VeliTel, db.Tur(s),
                    s.KardesVar ? (s.KardesAd + (s.KardesSinif != "" ? " (" + s.KardesSinif + ")" : "")).Trim() : "",
                    Para.F(db.TurUcreti(s, Ay.Bugun)),
                    s.BaslangicAy != "" ? Ay.Ad(s.BaslangicAy) : "", s.Ayrildi ? "Ayrıldı" : "Devam ediyor");
                var row = gOgr.Rows[i];
                row.Tag = s.Id;
                if (s.Ayrildi) row.DefaultCellStyle.ForeColor = Color.Gray;
                if (s.Burslu) row.Cells["tur"].Style.BackColor = Ui.Gri;
                else if (s.KardesVar) row.Cells["tur"].Style.BackColor = Ui.Sari;
                if (s.Id == secId) { gOgr.ClearSelection(); row.Selected = true; }
            }
            var akt = db.Students.Where(s => !s.Ayrildi).ToList();
            ogrOzet.Text = string.Format("Toplam {0} öğrenci (devam eden {1})   •   Burslu: {2}   •   Kardeş indirimli: {3}   •   Tam ücretli: {4}\nÇift tıklayarak düzenleyebilirsiniz. Aylık ücret: {5}",
                db.Students.Count, akt.Count, akt.Count(s => s.Burslu), akt.Count(s => s.KardesVar && !s.Burslu), akt.Count(s => !s.KardesVar && !s.Burslu), Para.F(db.Settings.Ucret));
        }

        Student SeciliOgr(DataGridView g)
        {
            if (g.SelectedRows.Count == 0 && g.CurrentRow == null) return null;
            var row = g.SelectedRows.Count > 0 ? g.SelectedRows[0] : g.CurrentRow;
            return row.Tag is int ? db.Bul((int)row.Tag) : null;
        }

        void OgrEkle()
        {
            var s = new Student { BaslangicAy = db.IlkAy };
            using (var f = new StudentForm(db, s))
            {
                if (f.ShowDialog(this) != DialogResult.OK) return;
                s.Id = db.YeniId();
                db.Students.Add(s);
                Degisti(); OgrDoldur();
            }
        }

        void OgrDuzenle()
        {
            var s = SeciliOgr(gOgr);
            if (s == null) { Ui.Bilgi("Önce listeden bir öğrenci seçin."); return; }
            using (var f = new StudentForm(db, s))
                if (f.ShowDialog(this) == DialogResult.OK) { Degisti(); OgrDoldur(); }
        }

        void OgrSil()
        {
            var ids = gOgr.SelectedRows.Cast<DataGridViewRow>().Where(r => r.Tag is int).Select(r => (int)r.Tag).ToList();
            if (ids.Count == 0) { Ui.Bilgi("Silmek için öğrenci seçin."); return; }
            int odemeli = ids.Count(id => db.Payments.Any(p => p.OgrenciId == id));
            string msg = ids.Count == 1 ? "\"" + db.Bul(ids[0]).AdSoyad + "\" silinsin mi?" : ids.Count + " öğrenci silinsin mi?";
            msg += "\n\nÖğrencinin yoklama ve ödeme kayıtları da silinir.";
            if (odemeli > 0) msg += "\n\nDİKKAT: Ödeme kaydı olan öğrenci var. Kulüpten ayrılan öğrenciyi silmek yerine düzenleyip \"Kulüpten ayrıldı\" işaretlemeniz önerilir; böylece raporlarda geçmiş ödemeleri kalır.";
            if (!Ui.Sor(msg)) return;
            foreach (var id in ids)
            {
                db.Students.RemoveAll(s => s.Id == id);
                db.Payments.RemoveAll(p => p.OgrenciId == id);
                foreach (var k in db.Yoklama.Keys.Where(k => k.EndsWith("|" + id)).ToList()) db.Yoklama.Remove(k);
            }
            Degisti(); OgrDoldur();
        }

        void ExcelYukle()
        {
            using (var d = new OpenFileDialog { Filter = "Excel dosyası (*.xlsx)|*.xlsx|Tüm dosyalar|*.*", Title = "Öğrenci listesini seçin" })
            {
                if (d.ShowDialog(this) != DialogResult.OK) return;
                if (d.FileName.EndsWith(".xls", StringComparison.OrdinalIgnoreCase))
                {
                    Ui.Hata("Eski .xls biçimi okunamıyor.\nDosyayı Excel'de açıp \"Farklı Kaydet → Excel Çalışma Kitabı (*.xlsx)\" olarak kaydedin ve tekrar deneyin.");
                    return;
                }
                ImportResult res;
                try { res = Importer.Oku(d.FileName); }
                catch (Exception ex) { Ui.Hata("Dosya okunamadı:\n" + ex.Message + "\n\nDosya Excel'de açıksa kapatıp tekrar deneyin. Dosyanın .xlsx olduğundan emin olun."); return; }
                if (res.Ogrenciler.Count == 0) { Ui.Hata(res.Bilgi); return; }
                using (var p = new ImportPreview(res.Ogrenciler, res.Bilgi, ""))
                    if (p.ShowDialog(this) != DialogResult.OK) return;
                TopluKaydet(res.Ogrenciler);
            }
        }

        void TopluEkle()
        {
            using (var f = new BulkForm())
            {
                if (f.ShowDialog(this) != DialogResult.OK) return;
                TopluKaydet(Importer.Metinden(f.Metin));
            }
        }

        void TopluKaydet(List<Student> yeni)
        {
            int eklenen = 0, atlanan = 0;
            foreach (var s in yeni)
            {
                if (db.Students.Any(x => string.Equals(x.AdSoyad, s.AdSoyad, StringComparison.CurrentCultureIgnoreCase))) { atlanan++; continue; }
                s.Id = db.YeniId();
                if (s.BaslangicAy == "") s.BaslangicAy = db.IlkAy;
                db.Students.Add(s); eklenen++;
            }
            if (eklenen > 0) Degisti();
            OgrDoldur();
            Ui.Bilgi(eklenen + " öğrenci eklendi." + (atlanan > 0 ? "\n" + atlanan + " öğrenci zaten kayıtlı olduğu için atlandı." : "") +
                "\n\nKardeş indirimi ve burs durumlarını öğrenciye çift tıklayarak düzenleyebilirsiniz.");
        }

        void SablonVer()
        {
            using (var d = new SaveFileDialog { Filter = "Excel dosyası (*.xlsx)|*.xlsx", FileName = "Ogrenci_Listesi_Sablonu.xlsx" })
            {
                if (d.ShowDialog(this) != DialogResult.OK) return;
                try { Xlsx.Write(d.FileName, new List<XSheet> { Reports.Sablon() }); Ac(d.FileName); }
                catch (Exception ex) { Ui.Hata("Kaydedilemedi: " + ex.Message); }
            }
        }

        // ================= YOKLAMA =================
        TabPage YoklamaSekmesi()
        {
            var tp = new TabPage("  Günlük Yoklama  ") { Font = Ui.Yazi };
            var bar = Ui.Bar();
            bar.Controls.Add(Ui.Btn("◀", (s, e) => yokTarih.Value = yokTarih.Value.AddDays(-1)));
            yokTarih = new DateTimePicker { Format = DateTimePickerFormat.Custom, CustomFormat = "dd MMMM yyyy dddd", Width = Ui.S(230), Margin = new Padding(Ui.S(3), Ui.S(6), Ui.S(3), Ui.S(3)) };
            yokTarih.ValueChanged += (s, e) => YokDoldur();
            bar.Controls.Add(yokTarih);
            bar.Controls.Add(Ui.Btn("▶", (s, e) => yokTarih.Value = yokTarih.Value.AddDays(1)));
            bar.Controls.Add(Ui.Btn("Bugün", (s, e) => yokTarih.Value = DateTime.Today));
            bar.Controls.Add(Ui.Lbl("  "));
            bar.Controls.Add(Ui.Btn("✔ Hepsi Geldi", (s, e) => YokHepsi()));
            bar.Controls.Add(Ui.Btn("Seçili: Geldi", (s, e) => YokSecili(Durumlar.Geldi)));
            bar.Controls.Add(Ui.Btn("Seçili: Gelmedi", (s, e) => YokSecili(Durumlar.Gelmedi)));
            bar.Controls.Add(Ui.Btn("Seçili: İzinli", (s, e) => YokSecili(Durumlar.Izinli)));
            bar.Controls.Add(Ui.Btn("Seçili: Raporlu", (s, e) => YokSecili(Durumlar.Raporlu)));
            bar.Controls.Add(Ui.Btn("Günü Temizle", (s, e) => YokTemizle()));

            var ipucu = new Label { Dock = DockStyle.Top, AutoSize = true, ForeColor = Color.DimGray, Padding = new Padding(Ui.S(8), 0, 0, Ui.S(4)),
                Text = "Durum hücresine tıklayınca Geldi → Gelmedi → İzinli → Raporlu sırasıyla değişir. Klavye: 1=Geldi  2=Gelmedi  3=İzinli  4=Raporlu  Del=Sil. Değişiklikler otomatik kaydedilir." };

            gYok = Ui.Grid();
            gYok.ReadOnly = true;
            gYok.Columns.Add(Ui.Col("sira", "Sıra", 6, true));
            gYok.Columns.Add(Ui.Col("no", "Okul No", 9, true));
            gYok.Columns.Add(Ui.Col("ad", "Adı Soyadı", 36, true));
            gYok.Columns.Add(Ui.Col("durum", "Durum (tıkla)", 18, true));
            gYok.Columns.Add(Ui.Col("tur", "Ücret Türü", 15, true));
            gYok.Columns.Add(Ui.Col("devam", "Bu Ay Devamsızlık", 14, true));
            gYok.Columns["durum"].DefaultCellStyle.Font = Ui.Kalin;
            gYok.Columns["durum"].DefaultCellStyle.Alignment = DataGridViewContentAlignment.MiddleCenter;
            gYok.Columns["devam"].DefaultCellStyle.Alignment = DataGridViewContentAlignment.MiddleCenter;
            gYok.RowTemplate.Height = Ui.S(32);
            gYok.CellClick += (s, e) =>
            {
                if (e.RowIndex < 0 || e.ColumnIndex != gYok.Columns["durum"].Index) return;
                var row = gYok.Rows[e.RowIndex];
                string d = (string)row.Cells["durum"].Value ?? "";
                int i = Array.IndexOf(Durumlar.Hepsi, d);
                YokYaz(row, Durumlar.Hepsi[(i + 1) % Durumlar.Hepsi.Length]);
                YokOzetYenile();
            };
            gYok.KeyDown += (s, e) =>
            {
                string d = null;
                if (e.KeyCode == Keys.D1 || e.KeyCode == Keys.NumPad1 || e.KeyCode == Keys.G) d = Durumlar.Geldi;
                else if (e.KeyCode == Keys.D2 || e.KeyCode == Keys.NumPad2 || e.KeyCode == Keys.Y) d = Durumlar.Gelmedi;
                else if (e.KeyCode == Keys.D3 || e.KeyCode == Keys.NumPad3 || e.KeyCode == Keys.I) d = Durumlar.Izinli;
                else if (e.KeyCode == Keys.D4 || e.KeyCode == Keys.NumPad4 || e.KeyCode == Keys.R) d = Durumlar.Raporlu;
                else if (e.KeyCode == Keys.Delete || e.KeyCode == Keys.Back) d = "";
                if (d == null) return;
                e.Handled = true; e.SuppressKeyPress = true;
                foreach (DataGridViewRow r in gYok.SelectedRows) YokYaz(r, d);
                // tek satırda ise bir sonrakine geç
                if (gYok.SelectedRows.Count == 1 && gYok.CurrentRow != null && gYok.CurrentRow.Index < gYok.Rows.Count - 1)
                {
                    int n = gYok.CurrentRow.Index + 1;
                    gYok.CurrentCell = gYok.Rows[n].Cells["ad"];
                }
                YokOzetYenile();
            };
            yokOzet = AltBilgi();
            tp.Controls.Add(Sayfa(gYok, bar, ipucu));
            tp.Controls.Add(yokOzet);
            yokTarih.Value = DateTime.Today;
            return tp;
        }

        void YokDoldur()
        {
            if (gYok == null) return;
            var gun = yokTarih.Value.Date;
            string ay = Ay.Of(gun);
            gYok.Rows.Clear();
            int sira = 1;
            foreach (var s in db.AydaAktifler(ay))
            {
                int devamsiz = 0;
                string p = ay + "-";
                foreach (var kv in db.Yoklama)
                    if (kv.Value == Durumlar.Gelmedi && kv.Key.StartsWith(p) && kv.Key.EndsWith("|" + s.Id)) devamsiz++;
                int i = gYok.Rows.Add(sira++, s.No, s.AdSoyad, db.YoklamaAl(gun, s.Id), db.Tur(s), devamsiz == 0 ? "" : devamsiz + " gün");
                gYok.Rows[i].Tag = s.Id;
                Renk(gYok.Rows[i].Cells["durum"]);
            }
            YokOzetYenile();
        }

        static void Renk(DataGridViewCell c)
        {
            string d = (string)c.Value ?? "";
            c.Style.BackColor = d == Durumlar.Geldi ? Ui.Yesil : d == Durumlar.Gelmedi ? Ui.Kirmizi : d == "" ? Color.Empty : Ui.Sari;
            c.Style.SelectionBackColor = d == Durumlar.Geldi ? Color.FromArgb(120, 200, 140) : d == Durumlar.Gelmedi ? Color.FromArgb(240, 130, 140) : d == "" ? Color.Empty : Color.FromArgb(240, 210, 90);
        }

        void YokYaz(DataGridViewRow row, string d)
        {
            if (!(row.Tag is int)) return;
            db.YoklamaYaz(yokTarih.Value.Date, (int)row.Tag, d);
            row.Cells["durum"].Value = d;
            Renk(row.Cells["durum"]);
            Degisti();
        }

        void YokHepsi()
        {
            bool sadeceBos = false;
            if (gYok.Rows.Cast<DataGridViewRow>().Any(r => ((string)r.Cells["durum"].Value ?? "") != ""))
                sadeceBos = Ui.Sor("Bazı öğrencilerin yoklaması zaten işlenmiş.\n\n\"Evet\": sadece boş olanlar Geldi yapılsın\n\"Hayır\": hepsi Geldi yapılsın");
            foreach (DataGridViewRow r in gYok.Rows)
                if (!sadeceBos || ((string)r.Cells["durum"].Value ?? "") == "") YokYaz(r, Durumlar.Geldi);
            YokOzetYenile();
        }

        void YokSecili(string d)
        {
            if (gYok.SelectedRows.Count == 0) { Ui.Bilgi("Önce öğrenci(leri) seçin. Ctrl veya Shift ile birden fazla seçebilirsiniz."); return; }
            foreach (DataGridViewRow r in gYok.SelectedRows) YokYaz(r, d);
            YokOzetYenile();
        }

        void YokTemizle()
        {
            if (!Ui.Sor(yokTarih.Value.ToString("dd.MM.yyyy") + " gününün tüm yoklama kayıtları silinsin mi?")) return;
            foreach (DataGridViewRow r in gYok.Rows) YokYaz(r, "");
            YokOzetYenile();
        }

        void YokOzetYenile()
        {
            int g = 0, y = 0, iz = 0, bos = 0;
            foreach (DataGridViewRow r in gYok.Rows)
            {
                string d = (string)r.Cells["durum"].Value ?? "";
                if (d == Durumlar.Geldi) g++; else if (d == Durumlar.Gelmedi) y++; else if (d == "") bos++; else iz++;
            }
            var gun = yokTarih.Value.Date;
            string hafta = (gun.DayOfWeek == DayOfWeek.Saturday || gun.DayOfWeek == DayOfWeek.Sunday) ? "   (hafta sonu)" : "";
            yokOzet.Text = string.Format("{0}{1}\nÖğrenci: {2}    Geldi: {3}    Gelmedi: {4}    İzinli/Raporlu: {5}    İşlenmemiş: {6}",
                gun.ToString("dd MMMM yyyy dddd", Ay.TR), hafta, gYok.Rows.Count, g, y, iz, bos);
        }

        // ================= AİDAT =================
        TabPage AidatSekmesi()
        {
            var tp = new TabPage("  Aylık Aidat  ") { Font = Ui.Yazi };
            var bar = Ui.Bar();
            bar.Controls.Add(Ui.Lbl("Ay:"));
            aidAy = new ComboBox { DropDownStyle = ComboBoxStyle.DropDownList, Width = Ui.S(150), Margin = new Padding(Ui.S(3), Ui.S(6), Ui.S(3), Ui.S(3)) };
            aidAy.SelectedIndexChanged += (s, e) => AidDoldur();
            bar.Controls.Add(aidAy);
            bar.Controls.Add(Ui.Lbl("   Bu ayın ücreti (₺):"));
            aidUcret = new TextBox { Width = Ui.S(90), Margin = new Padding(Ui.S(3), Ui.S(6), Ui.S(3), Ui.S(3)) };
            bar.Controls.Add(aidUcret);
            bar.Controls.Add(Ui.Btn("Ücreti Uygula", (s, e) => UcretUygula()));
            aidBilgi = Ui.Lbl("");
            aidBilgi.ForeColor = Color.DimGray;
            bar.Controls.Add(aidBilgi);

            var bar2 = Ui.Bar();
            bar2.Controls.Add(Ui.Btn("✔ Seçilileri Tam Ödendi Yap", (s, e) => TamOdendi()));
            bar2.Controls.Add(Ui.Btn("₺ Ödeme Al (tutar gir)", (s, e) => OdemeAl()));
            bar2.Controls.Add(Ui.Btn("Ödeme Geçmişi / Sil", (s, e) => Gecmis()));
            bar2.Controls.Add(Ui.Lbl("  \"Ödenen\" hücresine çift tıklayıp tutarı doğrudan da yazabilirsiniz."));

            gAid = Ui.Grid();
            gAid.Columns.Add(Ui.Col("sira", "Sıra", 5, true));
            gAid.Columns.Add(Ui.Col("no", "No", 7, true));
            gAid.Columns.Add(Ui.Col("ad", "Adı Soyadı", 25, true));
            gAid.Columns.Add(Ui.Col("tur", "Ücret Türü", 15, true));
            gAid.Columns.Add(Ui.Col("borc", "Ödenecek", 12, true));
            gAid.Columns.Add(Ui.Col("odenen", "Ödenen ✎", 12, false));
            gAid.Columns.Add(Ui.Col("kalan", "Kalan", 12, true));
            gAid.Columns.Add(Ui.Col("tarih", "Son Ödeme", 11, true));
            gAid.Columns.Add(Ui.Col("durum", "Durum", 12, true));
            foreach (var c in new[] { "borc", "odenen", "kalan" }) gAid.Columns[c].DefaultCellStyle.Alignment = DataGridViewContentAlignment.MiddleRight;
            gAid.Columns["durum"].DefaultCellStyle.Alignment = DataGridViewContentAlignment.MiddleCenter;
            gAid.Columns["odenen"].DefaultCellStyle.Font = Ui.Kalin;
            gAid.CellBeginEdit += (s, e) =>
            {
                var st = db.Bul((int)gAid.Rows[e.RowIndex].Tag);
                if (st == null) { e.Cancel = true; return; }
                gAid.Rows[e.RowIndex].Cells["odenen"].Value = db.Odenen(st.Id, SeciliAy(aidAy)).ToString("0.##", Ay.TR);
            };
            gAid.CellEndEdit += (s, e) => OdenenDuzenlendi(e.RowIndex);
            gAid.CellDoubleClick += (s, e) =>
            {
                if (e.RowIndex >= 0 && e.ColumnIndex != gAid.Columns["odenen"].Index) OdemeAl();
            };
            aidOzet = AltBilgi();
            aidOzet.Height = Ui.S(62);
            tp.Controls.Add(Sayfa(gAid, bar, bar2));
            tp.Controls.Add(aidOzet);
            AyComboDoldur(aidAy, db, Ay.Bugun);
            return tp;
        }

        void AidDoldur()
        {
            if (gAid == null || aidAy.SelectedItem == null) return;
            aidDolduruluyor = true;
            string ay = SeciliAy(aidAy);
            aidUcret.Text = db.AyinUcreti(ay).ToString("0.##", Ay.TR);
            aidBilgi.Text = db.AyUcret.ContainsKey(ay) ? "  (bu aya özel ücret)" : "  (varsayılan ücret)";
            aidBilgi.Text += "   Kardeş indirimi: %" + db.Settings.KardesIndirim.ToString("0.##", Ay.TR);
            var secili = new HashSet<int>(gAid.SelectedRows.Cast<DataGridViewRow>().Where(r => r.Tag is int).Select(r => (int)r.Tag));
            int ilk = gAid.FirstDisplayedScrollingRowIndex;
            gAid.Rows.Clear();
            int sira = 1;
            var liste = db.Sirali(db.Students.Where(s => s.AydaAktif(ay) || db.Odenen(s.Id, ay) != 0));
            foreach (var s in liste)
            {
                int i = gAid.Rows.Add();
                gAid.Rows[i].Tag = s.Id;
                AidSatir(gAid.Rows[i], s, ay, sira++);
                if (secili.Contains(s.Id)) gAid.Rows[i].Selected = true;
            }
            if (secili.Count == 0) gAid.ClearSelection();
            if (ilk >= 0 && ilk < gAid.Rows.Count) gAid.FirstDisplayedScrollingRowIndex = ilk;
            aidDolduruluyor = false;
            AidOzet();
        }

        void AidSatir(DataGridViewRow row, Student s, string ay, int sira)
        {
            decimal b = db.Borc(s, ay), o = db.Odenen(s.Id, ay);
            string du = db.OdemeDurumu(s, ay);
            row.Cells["sira"].Value = sira; row.Cells["no"].Value = s.No; row.Cells["ad"].Value = s.AdSoyad;
            row.Cells["tur"].Value = db.Tur(s); row.Cells["borc"].Value = Para.F(b); row.Cells["odenen"].Value = Para.F(o);
            row.Cells["kalan"].Value = Para.F(Math.Max(0, b - o));
            row.Cells["tarih"].Value = Ay.GunTr(db.SonOdemeTarihi(s.Id, ay));
            row.Cells["durum"].Value = du;
            Color c = du.StartsWith("Ödendi") ? Ui.Yesil : du == "Kısmi" ? Ui.Sari : du == "Ödenmedi" ? Ui.Kirmizi : Ui.Gri;
            row.Cells["durum"].Style.BackColor = c;
            row.Cells["odenen"].Style.BackColor = c;
        }

        void AidOzet()
        {
            string ay = SeciliAy(aidAy);
            var akt = db.AydaAktifler(ay);
            decimal b = akt.Sum(s => db.Borc(s, ay));
            decimal o = db.Payments.Where(p => p.Ay == ay).Sum(p => p.Tutar);
            int odedi = akt.Count(s => db.OdemeDurumu(s, ay).StartsWith("Ödendi"));
            int ucretli = akt.Count(s => db.Borc(s, ay) > 0);
            aidOzet.Text = string.Format("{0}:  Ödenecek toplam {1}   •   TAHSİL EDİLEN (idareye teslim) {2}   •   Kalan {3}\nÖdeyen {4}/{5} öğrenci   •   Burslu {6} (muaf {7})   •   Kardeş indirimli {8} (indirim {9})",
                Ay.Ad(ay), Para.F(b), Para.F(o), Para.F(Math.Max(0, b - o)), odedi, ucretli,
                akt.Count(s => s.Burslu), Para.F(akt.Where(s => s.Burslu).Sum(s => db.AyinUcreti(ay))),
                akt.Count(s => s.KardesVar && !s.Burslu), Para.F(akt.Where(s => s.KardesVar && !s.Burslu).Sum(s => db.Indirim(s, ay))));
        }

        void OdenenDuzenlendi(int ri)
        {
            if (aidDolduruluyor || ri < 0) return;
            var row = gAid.Rows[ri];
            var s = db.Bul((int)row.Tag);
            string ay = SeciliAy(aidAy);
            decimal yeni;
            string txt = Convert.ToString(row.Cells["odenen"].Value);
            if (!Para.TryParse(txt, out yeni) || yeni < 0)
            {
                Ui.Hata("Geçerli bir tutar yazın. Örnek: 750 veya 750,50");
                AidSatir(row, s, ay, (int)row.Cells["sira"].Value);
                return;
            }
            decimal fark = yeni - db.Odenen(s.Id, ay);
            if (fark != 0)
            {
                db.OdemeEkle(s.Id, ay, fark, DateTime.Today, fark < 0 ? "Düzeltme" : "");
                Degisti();
            }
            BeginInvoke((Action)(() => { AidSatir(row, s, ay, (int)row.Cells["sira"].Value); AidOzet(); }));
        }

        void UcretUygula()
        {
            decimal u;
            if (!Para.TryParse(aidUcret.Text, out u) || u < 0) { Ui.Hata("Geçerli bir ücret girin."); return; }
            string ay = SeciliAy(aidAy);
            if (u == db.Settings.Ucret) db.AyUcret.Remove(ay); else db.AyUcret[ay] = u;
            if (u != db.Settings.Ucret && Ui.Sor("Bu ücret varsayılan aylık ücret olsun mu?\n(Evet: özel ücret verilmemiş tüm aylar " + Para.F(u) + " olur.\nHayır: sadece " + Ay.Ad(ay) + " için geçerli olur.)"))
            {
                db.Settings.Ucret = u; db.AyUcret.Remove(ay); BaslikYenile();
            }
            Degisti(); AidDoldur();
        }

        List<Student> SeciliOgrenciler(DataGridView g)
        {
            var l = g.SelectedRows.Cast<DataGridViewRow>().Where(r => r.Tag is int).OrderBy(r => r.Index).Select(r => db.Bul((int)r.Tag)).Where(s => s != null).ToList();
            if (l.Count == 0 && g.CurrentRow != null && g.CurrentRow.Tag is int) l.Add(db.Bul((int)g.CurrentRow.Tag));
            return l;
        }

        void TamOdendi()
        {
            var l = SeciliOgrenciler(gAid);
            if (l.Count == 0) { Ui.Bilgi("Önce öğrenci(leri) seçin. Ctrl veya Shift ile birden fazla seçebilirsiniz."); return; }
            string ay = SeciliAy(aidAy);
            int n = 0; decimal t = 0;
            foreach (var s in l)
            {
                decimal k = db.Borc(s, ay) - db.Odenen(s.Id, ay);
                if (k > 0) { db.OdemeEkle(s.Id, ay, k, DateTime.Today, ""); n++; t += k; }
            }
            if (n > 0) { Degisti(); Durum(n + " öğrencinin " + Ay.Ad(ay) + " ödemesi alındı: " + Para.F(t)); }
            else Ui.Bilgi("Seçili öğrencilerin bu ay ödenecek borcu yok (ödenmiş, burslu veya ücretsiz).");
            AidDoldur();
        }

        void OdemeAl()
        {
            var l = SeciliOgrenciler(gAid);
            if (l.Count == 0) { Ui.Bilgi("Önce bir öğrenci seçin."); return; }
            var s = l[0];
            string ay = SeciliAy(aidAy);
            using (var f = new PaymentForm(s.AdSoyad, ay, Math.Max(0, db.Borc(s, ay) - db.Odenen(s.Id, ay))))
            {
                if (f.ShowDialog(this) != DialogResult.OK) return;
                db.OdemeEkle(s.Id, ay, f.Tutar, f.Tarih, f.Not);
                Degisti(); AidDoldur();
            }
        }

        void Gecmis()
        {
            var l = SeciliOgrenciler(gAid);
            if (l.Count == 0) { Ui.Bilgi("Önce bir öğrenci seçin."); return; }
            using (var f = new HistoryForm(db, l[0], SeciliAy(aidAy))) f.ShowDialog(this);
            if (db.Dirty) Degisti();
            AidDoldur();
        }

        // ================= RAPORLAR =================
        TabPage RaporSekmesi()
        {
            var tp = new TabPage("  Raporlar (İdare)  ") { Font = Ui.Yazi };
            var sol = new FlowLayoutPanel { Dock = DockStyle.Left, Width = Ui.S(380), FlowDirection = FlowDirection.TopDown, WrapContents = false, AutoScroll = true, Padding = new Padding(Ui.S(8)) };
            sol.Controls.Add(new Label { Text = "Gün / Hafta seçimi:", AutoSize = true, Font = Ui.Kalin, Margin = new Padding(Ui.S(3), Ui.S(6), Ui.S(3), 0) });
            rTarih = new DateTimePicker { Format = DateTimePickerFormat.Custom, CustomFormat = "dd MMMM yyyy dddd", Width = Ui.S(340), Value = DateTime.Today };
            rTarih.ValueChanged += (s, e) => OzetYenile();
            sol.Controls.Add(rTarih);
            sol.Controls.Add(new Label { Text = "Ay seçimi:", AutoSize = true, Font = Ui.Kalin, Margin = new Padding(Ui.S(3), Ui.S(10), Ui.S(3), 0) });
            rAy = new ComboBox { DropDownStyle = ComboBoxStyle.DropDownList, Width = Ui.S(340) };
            AyComboDoldur(rAy, db, Ay.Bugun);
            rAy.SelectedIndexChanged += (s, e) => OzetYenile();
            sol.Controls.Add(rAy);
            sol.Controls.Add(new Label { Text = "Excel raporu oluştur ve aç:", AutoSize = true, Font = Ui.Kalin, Margin = new Padding(Ui.S(3), Ui.S(16), Ui.S(3), Ui.S(4)) });

            Action<string, string, Func<string>> rb = (text, ipucu, f) =>
            {
                var b = Ui.Btn(text, (s, e) =>
                {
                    if (!Kaydet(true)) return;
                    try { string p = f(); Ac(p); Durum("Rapor oluşturuldu: " + p); }
                    catch (Exception ex) { Ui.Hata("Rapor oluşturulamadı:\n" + ex.Message); }
                });
                b.AutoSize = false; b.Width = Ui.S(340); b.Height = Ui.S(36); b.TextAlign = ContentAlignment.MiddleLeft;
                new ToolTip().SetToolTip(b, ipucu);
                sol.Controls.Add(b);
            };
            string sinif = db.Settings.Sinif;
            rb("Günlük Rapor (yoklama + tahsilat)", "Seçili günün yoklama listesi ve o gün alınan ödemeler.",
                () => Reports.Kaydet(Reports.Gunluk(db, rTarih.Value.Date), "Gunluk_" + db.Settings.Sinif + "_" + rTarih.Value.ToString("yyyy-MM-dd")));
            rb("Haftalık Rapor (yoklama + tahsilat)", "Seçili günün haftası (Pzt-Cuma) yoklama çizelgesi ve haftalık tahsilat.",
                () => Reports.Kaydet(Reports.Haftalik(db, rTarih.Value.Date), "Haftalik_" + db.Settings.Sinif + "_" + Ay.HaftaBasi(rTarih.Value).ToString("yyyy-MM-dd")));
            rb("Aylık Yoklama Çizelgesi", "Seçili ayın tüm günleri için yoklama çizelgesi.",
                () => Reports.Kaydet(new List<XSheet> { Reports.AylikYoklama(db, SeciliAy(rAy)) }, "AylikYoklama_" + db.Settings.Sinif + "_" + SeciliAy(rAy)));
            rb("Aylık Aidat / İdareye Teslim Raporu", "Seçili ayın ücret listesi: kim ne ödedi, burslu, kardeş indirimi, idareye teslim edilecek toplam.",
                () => Reports.Kaydet(new List<XSheet> { Reports.AylikAidat(db, SeciliAy(rAy)) }, "AylikAidat_" + db.Settings.Sinif + "_" + SeciliAy(rAy)));
            rb("Ay Sonu İdare Paketi (aidat + yoklama)", "Aylık aidat raporu ve aylık yoklama çizelgesi tek dosyada.",
                () => Reports.Kaydet(new List<XSheet> { Reports.AylikAidat(db, SeciliAy(rAy)), Reports.AylikYoklama(db, SeciliAy(rAy)) }, "AySonuPaketi_" + db.Settings.Sinif + "_" + SeciliAy(rAy)));
            rb("Toplu Aidat Listesi (yıl başından seçili aya)", "Tüm öğrencilerin ay ay ödemeleri, toplam ödenecek/ödenen/kalan ve aylara göre idareye teslim özeti.",
                () => Reports.Kaydet(Reports.Yillik(db, SeciliAy(rAy)), "TopluAidat_" + db.Settings.Sinif + "_" + db.Settings.EgitimYili));
            rb("Öğrenci Listesi", "Veli, telefon, kardeş ve burs bilgileriyle kulüp öğrenci listesi.",
                () => Reports.Kaydet(new List<XSheet> { Reports.OgrenciListesi(db) }, "OgrenciListesi_" + db.Settings.Sinif));
            var klasor = Ui.Btn("Raporlar klasörünü aç", (s, e) => Ac(DataStore.RaporKlasoru));
            klasor.Margin = new Padding(Ui.S(3), Ui.S(16), Ui.S(3), Ui.S(3));
            sol.Controls.Add(klasor);

            rOzet = new TextBox { Dock = DockStyle.Fill, Multiline = true, ReadOnly = true, ScrollBars = ScrollBars.Vertical, Font = new Font("Consolas", 10.5f), BackColor = Color.White, WordWrap = true };
            var sag = new Panel { Dock = DockStyle.Fill, Padding = new Padding(Ui.S(8)) };
            sag.Controls.Add(rOzet);
            sag.Controls.Add(new Label { Dock = DockStyle.Top, Text = "Ekran özeti (seçili gün, hafta ve ay)", Font = Ui.Kalin, Height = Ui.S(26) });
            tp.Controls.Add(sag);
            tp.Controls.Add(sol);
            return tp;
        }

        void OzetYenile()
        {
            if (rOzet == null || rAy.SelectedItem == null) return;
            try { rOzet.Text = Reports.EkranOzeti(db, rTarih.Value.Date, SeciliAy(rAy)).Replace("\n", "\r\n").Replace("\r\r\n", "\r\n"); }
            catch (Exception ex) { rOzet.Text = "Özet hazırlanamadı: " + ex.Message; }
        }

        static void Ac(string path)
        {
            try { Process.Start(new ProcessStartInfo(path) { UseShellExecute = true }); }
            catch (Exception ex) { Ui.Bilgi("Dosya oluşturuldu ancak açılamadı:\n" + path + "\n\n" + ex.Message); }
        }

        // ================= AYARLAR =================
        TabPage AyarSekmesi()
        {
            var tp = new TabPage("  Ayarlar / Yedek  ") { Font = Ui.Yazi, Padding = new Padding(Ui.S(12)) };
            var f = new FlowLayoutPanel { Dock = DockStyle.Fill, FlowDirection = FlowDirection.TopDown, WrapContents = false, AutoScroll = true };
            ayarBilgi = new Label { AutoSize = true, Font = Ui.Yazi, Margin = new Padding(Ui.S(3), Ui.S(3), Ui.S(3), Ui.S(12)) };
            f.Controls.Add(new Label { Text = "Okul ve Kulüp Bilgileri", AutoSize = true, Font = Ui.Buyuk, ForeColor = Ui.Mavi });
            f.Controls.Add(ayarBilgi);
            f.Controls.Add(Ui.Btn("✎ Bilgileri Düzenle (okul, sınıf, öğretmen, ücret, indirim)", (s, e) =>
            {
                using (var d = new SetupForm(db.Settings, false))
                    if (d.ShowDialog(this) == DialogResult.OK)
                    {
                        Degisti(); BaslikYenile();
                        string sa = SeciliAy(aidAy), ra = SeciliAy(rAy);
                        AyComboDoldur(aidAy, db, sa); AyComboDoldur(rAy, db, ra);
                    }
            }));
            f.Controls.Add(new Label { Text = "Yedekleme", AutoSize = true, Font = Ui.Buyuk, ForeColor = Ui.Mavi, Margin = new Padding(Ui.S(3), Ui.S(20), Ui.S(3), Ui.S(3)) });
            f.Controls.Add(new Label { AutoSize = true, Text = "Program her gün ilk kayıtta otomatik yedek alır (Belgeler\\KulupTakip\\Yedekler).\nBaşka bilgisayara taşımak için \"Yedeği Dışa Aktar\" ile dosyayı USB belleğe kaydedip diğer bilgisayarda \"Yedekten Geri Yükle\" kullanın." });
            var b = Ui.Bar(); b.Dock = DockStyle.None;
            b.Controls.Add(Ui.Btn("Yedeği Dışa Aktar", (s, e) => YedekVer()));
            b.Controls.Add(Ui.Btn("Yedekten Geri Yükle", (s, e) => YedekYukle()));
            b.Controls.Add(Ui.Btn("Veri klasörünü aç", (s, e) => Ac(DataStore.Klasor)));
            b.Controls.Add(Ui.Btn("Veri dosyasını Excel'de aç (sadece görüntüleme)", (s, e) => { if (Kaydet(true)) Ac(db.Path); }));
            f.Controls.Add(b);
            f.Controls.Add(new Label { AutoSize = true, ForeColor = Color.DimGray, Margin = new Padding(Ui.S(3), Ui.S(20), Ui.S(3), Ui.S(3)),
                Text = "Kulüp Takip v1.0 • Tüm veriler yalnızca bu bilgisayarda, Excel (.xlsx) dosyasında saklanır. İnternet gerekmez." });
            tp.Controls.Add(f);
            BaslikYenile();
            return tp;
        }

        void YedekVer()
        {
            if (!Kaydet(true)) return;
            using (var d = new SaveFileDialog { Filter = "Excel dosyası (*.xlsx)|*.xlsx", FileName = "KulupYedek_" + db.Settings.Sinif + "_" + DateTime.Today.ToString("yyyy-MM-dd") + ".xlsx" })
            {
                if (d.ShowDialog(this) != DialogResult.OK) return;
                try { File.Copy(db.Path, d.FileName, true); Ui.Bilgi("Yedek kaydedildi:\n" + d.FileName); }
                catch (Exception ex) { Ui.Hata("Yedek alınamadı: " + ex.Message); }
            }
        }

        void YedekYukle()
        {
            using (var d = new OpenFileDialog { Filter = "Excel dosyası (*.xlsx)|*.xlsx", Title = "Yedek dosyasını seçin" })
            {
                if (d.ShowDialog(this) != DialogResult.OK) return;
                var tmp = new DataStore(d.FileName);
                try { tmp.Load(); }
                catch (Exception ex) { Ui.Hata("Bu dosya yüklenemedi:\n" + ex.Message); return; }
                if (!Ui.Sor("Yedekteki bilgiler:\n" + tmp.Settings.Okul + " - " + tmp.Settings.Sinif + " - " + tmp.Settings.Ogretmen + "\n" + tmp.Students.Count + " öğrenci, " + tmp.Payments.Count + " ödeme kaydı\n\nŞu anki tüm veriler bu yedekle DEĞİŞTİRİLECEK (eski hali Yedekler klasöründe kalır). Devam edilsin mi?")) return;
                try
                {
                    if (File.Exists(db.Path)) File.Copy(db.Path, Path.Combine(DataStore.YedekKlasoru, "GeriYuklemeOncesi_" + DateTime.Now.ToString("yyyy-MM-dd_HHmmss") + ".xlsx"), true);
                }
                catch { }
                db.Settings = tmp.Settings; db.Students = tmp.Students; db.Payments = tmp.Payments; db.AyUcret = tmp.AyUcret; db.Yoklama = tmp.Yoklama;
                db.Dirty = true;
                Kaydet(true);
                BaslikYenile();
                AyComboDoldur(aidAy, db, Ay.Bugun); AyComboDoldur(rAy, db, Ay.Bugun);
                OgrDoldur();
                Ui.Bilgi("Yedek yüklendi.");
            }
        }
    }
}
