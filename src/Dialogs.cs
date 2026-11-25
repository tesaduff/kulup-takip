using System;
using System.Collections.Generic;
using System.Drawing;
using System.Linq;
using System.Windows.Forms;

namespace KulupTakip
{
    static class Ui
    {
        public static float Olcek = 1f;
        public static readonly Font Yazi = new Font("Segoe UI", 10f);
        public static readonly Font Kalin = new Font("Segoe UI", 10f, FontStyle.Bold);
        public static readonly Font Buyuk = new Font("Segoe UI", 13f, FontStyle.Bold);
        public static readonly Color Mavi = Color.FromArgb(31, 78, 121);
        public static readonly Color AcikMavi = Color.FromArgb(221, 235, 247);
        public static readonly Color Yesil = Color.FromArgb(198, 239, 206);
        public static readonly Color Kirmizi = Color.FromArgb(255, 199, 206);
        public static readonly Color Sari = Color.FromArgb(255, 235, 156);
        public static readonly Color Gri = Color.FromArgb(237, 237, 237);

        public static int S(int px) { return (int)Math.Round(px * Olcek); }

        public static Button Btn(string text, EventHandler click)
        {
            var b = new Button { Text = text, AutoSize = true, AutoSizeMode = AutoSizeMode.GrowAndShrink, Font = Yazi, Padding = new Padding(S(6), S(3), S(6), S(3)), Margin = new Padding(S(3)), UseVisualStyleBackColor = true };
            if (click != null) b.Click += click;
            return b;
        }

        public static Label Lbl(string text)
        {
            return new Label { Text = text, AutoSize = true, Font = Yazi, Margin = new Padding(S(3), S(9), S(3), S(3)) };
        }

        public static FlowLayoutPanel Bar()
        {
            return new FlowLayoutPanel { Dock = DockStyle.Top, AutoSize = true, AutoSizeMode = AutoSizeMode.GrowAndShrink, WrapContents = true, Padding = new Padding(S(4)) };
        }

        public static DataGridView Grid()
        {
            var g = new DataGridView
            {
                Dock = DockStyle.Fill, AllowUserToAddRows = false, AllowUserToDeleteRows = false, AllowUserToResizeRows = false,
                RowHeadersVisible = false, SelectionMode = DataGridViewSelectionMode.FullRowSelect, MultiSelect = true,
                AutoSizeColumnsMode = DataGridViewAutoSizeColumnsMode.Fill, BackgroundColor = Color.White, BorderStyle = BorderStyle.None,
                EnableHeadersVisualStyles = false, Font = Yazi, ColumnHeadersHeightSizeMode = DataGridViewColumnHeadersHeightSizeMode.AutoSize,
                EditMode = DataGridViewEditMode.EditOnKeystrokeOrF2
            };
            g.ColumnHeadersDefaultCellStyle.BackColor = Mavi;
            g.ColumnHeadersDefaultCellStyle.ForeColor = Color.White;
            g.ColumnHeadersDefaultCellStyle.Font = Kalin;
            g.ColumnHeadersDefaultCellStyle.Padding = new Padding(S(2), S(4), S(2), S(4));
            g.DefaultCellStyle.SelectionBackColor = Color.FromArgb(155, 194, 230);
            g.DefaultCellStyle.SelectionForeColor = Color.Black;
            g.RowTemplate.Height = S(28);
            g.AlternatingRowsDefaultCellStyle.BackColor = Color.FromArgb(248, 250, 252);
            return g;
        }

        public static DataGridViewTextBoxColumn Col(string name, string header, int weight, bool ro)
        {
            return new DataGridViewTextBoxColumn { Name = name, HeaderText = header, FillWeight = weight, ReadOnly = ro, SortMode = DataGridViewColumnSortMode.NotSortable };
        }

        public static void Hata(string msg) { MessageBox.Show(msg, "Kulüp Takip", MessageBoxButtons.OK, MessageBoxIcon.Warning); }
        public static void Bilgi(string msg) { MessageBox.Show(msg, "Kulüp Takip", MessageBoxButtons.OK, MessageBoxIcon.Information); }
        public static bool Sor(string msg) { return MessageBox.Show(msg, "Kulüp Takip", MessageBoxButtons.YesNo, MessageBoxIcon.Question) == DialogResult.Yes; }

        public static List<string> SinifListesi()
        {
            var l = new List<string> { "Anasınıfı-A", "Anasınıfı-B", "Anasınıfı-C" };
            for (int s = 1; s <= 8; s++) foreach (char c in "ABCDEFGH") l.Add(s + "-" + c);
            return l;
        }
    }

    class Item
    {
        public string Key, Text;
        public Item(string k, string t) { Key = k; Text = t; }
        public override string ToString() { return Text; }
    }

    // Alan-etiket düzenli basit form tabanı
    class FormBase : Form
    {
        protected TableLayoutPanel T;
        protected Button Tamam, Iptal;

        public FormBase(string title)
        {
            Text = title;
            Font = Ui.Yazi;
            FormBorderStyle = FormBorderStyle.FixedDialog;
            MaximizeBox = false; MinimizeBox = false;
            StartPosition = FormStartPosition.CenterParent;
            AutoSize = true; AutoSizeMode = AutoSizeMode.GrowAndShrink;
            Padding = new Padding(Ui.S(12));
            T = new TableLayoutPanel { ColumnCount = 2, AutoSize = true, AutoSizeMode = AutoSizeMode.GrowAndShrink, Dock = DockStyle.Fill };
            T.ColumnStyles.Add(new ColumnStyle(SizeType.AutoSize));
            T.ColumnStyles.Add(new ColumnStyle(SizeType.Absolute, Ui.S(330)));
            Controls.Add(T);
            Tamam = Ui.Btn("Kaydet", null);
            Iptal = Ui.Btn("Vazgeç", null);
            Tamam.Click += (s, e) => { if (Dogrula()) { DialogResult = DialogResult.OK; Close(); } };
            Iptal.DialogResult = DialogResult.Cancel;
            AcceptButton = Tamam; CancelButton = Iptal;
        }

        protected virtual bool Dogrula() { return true; }

        protected T2 Alan<T2>(string etiket, T2 c) where T2 : Control
        {
            int r = T.RowCount++;
            T.RowStyles.Add(new RowStyle(SizeType.AutoSize));
            if (etiket != null) T.Controls.Add(new Label { Text = etiket, AutoSize = true, Anchor = AnchorStyles.Left, Margin = new Padding(Ui.S(3), Ui.S(8), Ui.S(10), Ui.S(3)) }, 0, r);
            c.Dock = DockStyle.Fill;
            c.Margin = new Padding(Ui.S(3), Ui.S(4), Ui.S(3), Ui.S(4));
            T.Controls.Add(c, 1, r);
            if (etiket == null) T.SetColumn(c, 1);
            return c;
        }

        protected void Satir(Control c)
        {
            int r = T.RowCount++;
            T.RowStyles.Add(new RowStyle(SizeType.AutoSize));
            T.Controls.Add(c, 0, r);
            T.SetColumnSpan(c, 2);
        }

        protected void Butonlar()
        {
            var p = new FlowLayoutPanel { FlowDirection = FlowDirection.RightToLeft, AutoSize = true, Dock = DockStyle.Fill, Margin = new Padding(0, Ui.S(10), 0, 0) };
            p.Controls.Add(Iptal); p.Controls.Add(Tamam);
            Satir(p);
        }

        protected static ComboBox Combo(bool editable)
        {
            return new ComboBox { DropDownStyle = editable ? ComboBoxStyle.DropDown : ComboBoxStyle.DropDownList, Font = Ui.Yazi };
        }

        protected static void AySec(ComboBox c, IEnumerable<string> aylar, string secili)
        {
            c.Items.Clear();
            foreach (var a in aylar) c.Items.Add(new Item(a, Ay.Ad(a)));
            for (int i = 0; i < c.Items.Count; i++) if (((Item)c.Items[i]).Key == secili) c.SelectedIndex = i;
            if (c.SelectedIndex < 0 && c.Items.Count > 0) c.SelectedIndex = 0;
        }

        protected static string Secili(ComboBox c) { var i = c.SelectedItem as Item; return i != null ? i.Key : ""; }
    }

    // ---------------- AÇILIŞ / AYARLAR ----------------
    class SetupForm : FormBase
    {
        readonly Settings st;
        TextBox okul, ogretmen, kulup, mudur, ucret, indirim;
        ComboBox sinif, yil, basAy;

        public SetupForm(Settings s, bool ilk) : base(ilk ? "Kulüp Takip - İlk Kurulum" : "Okul ve Kulüp Bilgileri")
        {
            st = s;
            if (ilk)
            {
                var l = new Label { Text = "Hoş geldiniz! Başlamak için okul ve sınıf bilgilerinizi girin.\nBu bilgiler raporlarda ve idareye verilecek listelerde kullanılır.", AutoSize = true, Font = Ui.Kalin, ForeColor = Ui.Mavi, Margin = new Padding(Ui.S(3), Ui.S(3), Ui.S(3), Ui.S(12)) };
                Satir(l);
            }
            okul = Alan("Okulun Adı *", new TextBox { Text = s.Okul });
            sinif = Alan("Sınıfı / Şubesi *", Combo(true));
            foreach (var x in Ui.SinifListesi()) sinif.Items.Add(x);
            sinif.Text = s.Sinif;
            ogretmen = Alan("Sınıf Öğretmeni (Adı Soyadı) *", new TextBox { Text = s.Ogretmen });
            kulup = Alan("Kulübün Adı", new TextBox { Text = s.Kulup });
            mudur = Alan("Okul Müdürü (raporlarda imza için)", new TextBox { Text = s.Mudur });
            yil = Alan("Eğitim-Öğretim Yılı", Combo(false));
            int vy = Ay.VarsayilanYil();
            for (int y = vy - 3; y <= vy + 2; y++) yil.Items.Add(new Item(y.ToString(), y + "-" + (y + 1)));
            for (int i = 0; i < yil.Items.Count; i++) if (((Item)yil.Items[i]).Key == s.YilBaslangic.ToString()) yil.SelectedIndex = i;
            basAy = Alan("Kulübün başladığı ay", Combo(false));
            ucret = Alan("Aylık kulüp ücreti (₺)", new TextBox { Text = s.Ucret == 0 ? "" : s.Ucret.ToString("0.##", Ay.TR) });
            indirim = Alan("Kardeş indirimi (%)", new TextBox { Text = s.KardesIndirim.ToString("0.##", Ay.TR) });
            yil.SelectedIndexChanged += (a, b) => AyDoldur();
            AyDoldur();
            Satir(new Label { Text = "* zorunlu alanlar. Burslu öğrencilerden ücret alınmaz; kardeşi olan öğrenciye indirim uygulanır.", AutoSize = true, ForeColor = Color.DimGray, Margin = new Padding(Ui.S(3), Ui.S(8), Ui.S(3), 0) });
            Butonlar();
            if (ilk) Tamam.Text = "Başla";
        }

        void AyDoldur()
        {
            int y; int.TryParse(Secili(yil), out y);
            if (y == 0) y = Ay.VarsayilanYil();
            var aylar = Ay.YilAylari(y);
            string sec = st.BaslangicAy != "" && aylar.Contains(st.BaslangicAy) ? st.BaslangicAy : aylar[0];
            AySec(basAy, aylar, sec);
        }

        protected override bool Dogrula()
        {
            if (okul.Text.Trim() == "" || sinif.Text.Trim() == "" || ogretmen.Text.Trim() == "")
            { Ui.Hata("Okul adı, sınıf ve öğretmen adı soyadı zorunludur."); return false; }
            decimal u, ind;
            if (!Para.TryParse(ucret.Text, out u) || u < 0) { Ui.Hata("Aylık ücret geçerli bir sayı olmalı (örn. 750 veya 750,50)."); return false; }
            if (!Para.TryParse(indirim.Text, out ind) || ind < 0 || ind > 100) { Ui.Hata("Kardeş indirimi 0 ile 100 arasında olmalı."); return false; }
            st.Okul = okul.Text.Trim(); st.Sinif = sinif.Text.Trim(); st.Ogretmen = ogretmen.Text.Trim();
            st.Kulup = kulup.Text.Trim() == "" ? "Kulüp" : kulup.Text.Trim(); st.Mudur = mudur.Text.Trim();
            int y; if (int.TryParse(Secili(yil), out y)) st.YilBaslangic = y;
            st.BaslangicAy = Secili(basAy);
            st.Ucret = u; st.KardesIndirim = ind;
            return true;
        }
    }

    // ---------------- ÖĞRENCİ ----------------
    class StudentForm : FormBase
    {
        readonly Student s;
        readonly DataStore db;
        TextBox no, ad, veli, tel, kAd, not;
        CheckBox kardes, burs, ayrildi;
        ComboBox kSinif, basAy, bitAy;
        Label ucretBilgi;

        public StudentForm(DataStore db, Student s) : base(s.Id == 0 ? "Yeni Öğrenci" : "Öğrenci Bilgileri")
        {
            this.db = db; this.s = s;
            no = Alan("Okul No", new TextBox { Text = s.No });
            ad = Alan("Adı Soyadı *", new TextBox { Text = s.AdSoyad });
            veli = Alan("Veli Adı Soyadı", new TextBox { Text = s.VeliAd });
            tel = Alan("Veli Telefonu", new TextBox { Text = s.VeliTel });
            burs = Alan(null, new CheckBox { Text = "Burslu öğrenci (kulüp ücreti alınmaz)", Checked = s.Burslu, AutoSize = true });
            kardes = Alan(null, new CheckBox { Text = "Okulda kardeşi var (%" + db.Settings.KardesIndirim.ToString("0.##", Ay.TR) + " indirim)", Checked = s.KardesVar, AutoSize = true });
            kAd = Alan("Kardeşinin Adı", new TextBox { Text = s.KardesAd });
            kSinif = Alan("Kardeşinin Sınıfı", Combo(true));
            foreach (var x in Ui.SinifListesi()) kSinif.Items.Add(x);
            kSinif.Text = s.KardesSinif;
            var aylar = Ay.YilAylari(db.Settings.YilBaslangic);
            if (s.BaslangicAy != "" && !aylar.Contains(s.BaslangicAy)) aylar.Insert(0, s.BaslangicAy);
            basAy = Alan("Kulübe başladığı ay", Combo(false));
            AySec(basAy, aylar, s.BaslangicAy != "" ? s.BaslangicAy : db.IlkAy);
            ayrildi = Alan(null, new CheckBox { Text = "Kulüpten ayrıldı", Checked = s.Ayrildi, AutoSize = true });
            bitAy = Alan("Son devam ettiği ay", Combo(false));
            var aylar2 = Ay.YilAylari(db.Settings.YilBaslangic);
            if (s.BitisAy != "" && !aylar2.Contains(s.BitisAy)) aylar2.Insert(0, s.BitisAy);
            AySec(bitAy, aylar2, s.BitisAy != "" ? s.BitisAy : Ay.Bugun);
            not = Alan("Not", new TextBox { Text = s.Not });
            ucretBilgi = new Label { AutoSize = true, Font = Ui.Kalin, ForeColor = Ui.Mavi, Margin = new Padding(Ui.S(3), Ui.S(8), Ui.S(3), 0) };
            Satir(ucretBilgi);
            Butonlar();
            EventHandler g = (a, b) => Guncelle();
            kardes.CheckedChanged += g; burs.CheckedChanged += g; ayrildi.CheckedChanged += g;
            Guncelle();
        }

        void Guncelle()
        {
            kAd.Enabled = kSinif.Enabled = kardes.Checked;
            bitAy.Enabled = ayrildi.Checked;
            decimal u = db.AyinUcreti(Ay.Bugun);
            decimal b = burs.Checked ? 0 : kardes.Checked ? Math.Round(u * (100 - db.Settings.KardesIndirim) / 100m, 2) : u;
            ucretBilgi.Text = "Aylık ödeyeceği ücret: " + Para.F(b) + (burs.Checked ? "  (burslu)" : kardes.Checked ? "  (kardeş indirimli)" : "");
        }

        protected override bool Dogrula()
        {
            string a = string.Join(" ", ad.Text.Split(new[] { ' ' }, StringSplitOptions.RemoveEmptyEntries));
            if (a == "") { Ui.Hata("Öğrencinin adı soyadı boş olamaz."); return false; }
            var ayni = db.Students.FirstOrDefault(x => x.Id != s.Id && string.Equals(x.AdSoyad, a, StringComparison.CurrentCultureIgnoreCase));
            if (ayni != null && !Ui.Sor("\"" + a + "\" adında bir öğrenci zaten var. Yine de kaydedilsin mi?")) return false;
            if (ayrildi.Checked && string.CompareOrdinal(Secili(bitAy), Secili(basAy)) < 0) { Ui.Hata("Ayrılış ayı, başlangıç ayından önce olamaz."); return false; }
            s.No = no.Text.Trim(); s.AdSoyad = a; s.VeliAd = veli.Text.Trim(); s.VeliTel = tel.Text.Trim();
            s.Burslu = burs.Checked; s.KardesVar = kardes.Checked;
            s.KardesAd = kardes.Checked ? kAd.Text.Trim() : ""; s.KardesSinif = kardes.Checked ? kSinif.Text.Trim() : "";
            s.BaslangicAy = Secili(basAy); s.BitisAy = ayrildi.Checked ? Secili(bitAy) : "";
            s.Not = not.Text.Trim();
            return true;
        }
    }

    // ---------------- ÖDEME ----------------
    class PaymentForm : FormBase
    {
        public decimal Tutar;
        public DateTime Tarih;
        public string Not;
        TextBox tutar, notTb;
        DateTimePicker tarih;

        public PaymentForm(string ogrenci, string ay, decimal kalan) : base("Ödeme Al")
        {
            Satir(new Label { Text = ogrenci + "  •  " + Ay.Ad(ay) + "\nKalan borç: " + Para.F(kalan), AutoSize = true, Font = Ui.Kalin, ForeColor = Ui.Mavi, Margin = new Padding(Ui.S(3), Ui.S(3), Ui.S(3), Ui.S(10)) });
            tutar = Alan("Alınan tutar (₺)", new TextBox { Text = kalan > 0 ? kalan.ToString("0.##", Ay.TR) : "" });
            tarih = Alan("Ödeme tarihi", new DateTimePicker { Format = DateTimePickerFormat.Long, Value = DateTime.Today });
            notTb = Alan("Not (isteğe bağlı)", new TextBox());
            Butonlar();
            Tamam.Text = "Ödemeyi Kaydet";
        }

        protected override bool Dogrula()
        {
            decimal v;
            if (!Para.TryParse(tutar.Text, out v) || v == 0) { Ui.Hata("Geçerli bir tutar girin. (Düzeltme için eksi tutar girebilirsiniz.)"); return false; }
            Tutar = v; Tarih = tarih.Value.Date; Not = notTb.Text.Trim();
            return true;
        }
    }

    class HistoryForm : Form
    {
        public HistoryForm(DataStore db, Student s, string ay)
        {
            Text = "Ödeme Geçmişi - " + s.AdSoyad + " - " + Ay.Ad(ay);
            Font = Ui.Yazi; StartPosition = FormStartPosition.CenterParent;
            Size = new Size(Ui.S(620), Ui.S(380)); MinimizeBox = false;
            var g = Ui.Grid();
            g.Columns.Add(Ui.Col("tarih", "Tarih", 30, true));
            g.Columns.Add(Ui.Col("tutar", "Tutar", 30, true));
            g.Columns.Add(Ui.Col("not", "Not", 50, true));
            g.Columns["tutar"].DefaultCellStyle.Alignment = DataGridViewContentAlignment.MiddleRight;
            Action doldur = () =>
            {
                g.Rows.Clear();
                foreach (var p in db.Payments.Where(p => p.OgrenciId == s.Id && p.Ay == ay).OrderBy(p => p.Tarih))
                {
                    int i = g.Rows.Add(Ay.GunTr(p.Tarih), Para.F(p.Tutar), p.Not);
                    g.Rows[i].Tag = p;
                }
            };
            doldur();
            var bar = Ui.Bar();
            bar.Dock = DockStyle.Bottom;
            bar.Controls.Add(Ui.Btn("Seçili ödemeyi sil", (a, b) =>
            {
                if (g.SelectedRows.Count == 0) return;
                var p = g.SelectedRows[0].Tag as Payment;
                if (p == null || !Ui.Sor(Ay.GunTr(p.Tarih) + " tarihli " + Para.F(p.Tutar) + " tutarındaki ödeme silinsin mi?")) return;
                db.Payments.Remove(p); db.Dirty = true; doldur();
            }));
            bar.Controls.Add(Ui.Btn("Kapat", (a, b) => Close()));
            Controls.Add(g); Controls.Add(bar);
        }
    }

    class BulkForm : FormBase
    {
        public string Metin;
        TextBox tb;
        public BulkForm() : base("Toplu Öğrenci Ekle")
        {
            Satir(new Label { Text = "Her satıra bir öğrenci yazın veya e-Okul / Excel listesinden kopyalayıp yapıştırın.\nSatır başında numara varsa okul no olarak alınır. Örnek:\n   125 Ali Yılmaz\n   126 Ayşe Demir", AutoSize = true, Margin = new Padding(Ui.S(3), Ui.S(3), Ui.S(3), Ui.S(8)) });
            tb = new TextBox { Multiline = true, ScrollBars = ScrollBars.Vertical, AcceptsReturn = true, Height = Ui.S(300), Font = Ui.Yazi };
            Satir(tb);
            tb.Dock = DockStyle.Fill;
            Butonlar();
            Tamam.Text = "Ekle";
            AcceptButton = null;
        }
        protected override bool Dogrula()
        {
            Metin = tb.Text;
            if (Metin.Trim() == "") { Ui.Hata("Liste boş."); return false; }
            return true;
        }
    }

    class ImportPreview : Form
    {
        public ImportPreview(List<Student> l, string bilgi, string kardesNot)
        {
            Text = "Excel'den Yüklenecek Öğrenciler (" + l.Count + ")";
            Font = Ui.Yazi; StartPosition = FormStartPosition.CenterParent; Size = new Size(Ui.S(760), Ui.S(520));
            var g = Ui.Grid();
            g.Columns.Add(Ui.Col("no", "No", 12, true)); g.Columns.Add(Ui.Col("ad", "Adı Soyadı", 40, true));
            g.Columns.Add(Ui.Col("veli", "Veli", 25, true)); g.Columns.Add(Ui.Col("tel", "Telefon", 20, true));
            g.Columns.Add(Ui.Col("k", "Kardeş", 20, true)); g.Columns.Add(Ui.Col("b", "Burslu", 12, true));
            foreach (var s in l) g.Rows.Add(s.No, s.AdSoyad, s.VeliAd, s.VeliTel, s.KardesVar ? ("Evet " + s.KardesSinif).Trim() : "", s.Burslu ? "Evet" : "");
            var top = new Label { Dock = DockStyle.Top, AutoSize = true, Padding = new Padding(Ui.S(6)), Text = (bilgi + kardesNot + "\nListe doğru görünüyorsa \"Ekle\" deyin. Aynı isimde zaten kayıtlı olan öğrenciler atlanır.").Trim() };
            var bar = Ui.Bar(); bar.Dock = DockStyle.Bottom; bar.FlowDirection = FlowDirection.RightToLeft;
            var v = Ui.Btn("Vazgeç", null); v.DialogResult = DialogResult.Cancel;
            var e2 = Ui.Btn("Ekle", null); e2.DialogResult = DialogResult.OK;
            bar.Controls.Add(v); bar.Controls.Add(e2);
            Controls.Add(g); Controls.Add(top); Controls.Add(bar);
            AcceptButton = e2; CancelButton = v;
        }
    }
}
