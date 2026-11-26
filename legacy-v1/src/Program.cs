using System;
using System.Drawing;
using System.IO;
using System.Reflection;
using System.Runtime.InteropServices;
using System.Threading;
using System.Windows.Forms;

[assembly: AssemblyTitle("Kulüp Takip")]
[assembly: AssemblyProduct("Kulüp Takip - Yoklama ve Aidat")]
[assembly: AssemblyDescription("İlkokul sınıf öğretmenleri için kulüp yoklama ve aidat takip programı")]
[assembly: AssemblyVersion("1.0.0.0")]
[assembly: AssemblyFileVersion("1.0.0.0")]

namespace KulupTakip
{
    static class Program
    {
        [DllImport("user32.dll")] static extern bool SetProcessDPIAware();

        [STAThread]
        static void Main(string[] args)
        {
            if (args.Length == 2 && args[0] == "--selftest") { Environment.Exit(SelfTest.Run(args[1])); return; }

            try { if (Environment.OSVersion.Version.Major >= 6) SetProcessDPIAware(); } catch { }
            if (args.Length == 2 && args[0] == "--shots")
            {
                using (var g0 = Graphics.FromHwnd(IntPtr.Zero)) Ui.Olcek = g0.DpiX / 96f;
                Environment.Exit(SelfTest.Shots(args[1])); return;
            }
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            Application.ThreadException += (s, e) => Ui.Hata("Beklenmeyen bir hata oluştu:\n" + e.Exception.Message);
            using (var g = Graphics.FromHwnd(IntPtr.Zero)) Ui.Olcek = g.DpiX / 96f;

            bool yeni;
            using (var mtx = new Mutex(true, "KulupTakip_TekKopya", out yeni))
            {
                if (!yeni) { Ui.Bilgi("Kulüp Takip programı zaten açık."); return; }

                DataStore db;
                try
                {
                    db = new DataStore(DataStore.VarsayilanYol());
                    db.Load();
                }
                catch (Exception ex)
                {
                    Ui.Hata("Veri dosyası okunamadı:\n" + DataStore.VarsayilanYol() + "\n\n" + ex.Message +
                        "\n\nDosya Excel'de açıksa kapatıp programı tekrar açın.\nDosya bozulduysa Belgeler\\KulupTakip\\Yedekler klasöründeki son yedeği KulupVerileri.xlsx adıyla kopyalayabilirsiniz.");
                    return;
                }

                if (!db.Settings.Tamam)
                {
                    using (var f = new SetupForm(db.Settings, true))
                        if (f.ShowDialog() != DialogResult.OK) return;
                    try { db.Dirty = true; db.Save(); }
                    catch (Exception ex) { Ui.Hata("Ayarlar kaydedilemedi: " + ex.Message); }
                }
                Application.Run(new MainForm(db));
                GC.KeepAlive(mtx);
            }
        }
    }
}
