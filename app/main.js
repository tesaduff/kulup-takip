'use strict';
const { app, BrowserWindow, ipcMain, dialog, shell, Menu, net } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { spawn } = require('child_process');
const store = require('./store');

const REPO = 'tesaduff/kulup-takip';
const smokeArg = process.argv.find(a => a.startsWith('--smoke'));
const SMOKE = smokeArg ? (smokeArg.split('=')[1] || path.join(os.tmpdir(), 'kulup-smoke')) : null;

if (!SMOKE && !app.requestSingleInstanceLock()) { app.quit(); }

function klasor() {
  const d = SMOKE ? SMOKE : path.join(app.getPath('documents'), 'KulupTakip');
  fs.mkdirSync(d, { recursive: true });
  return d;
}
const veriYolu = () => path.join(klasor(), 'KulupVerileri.xlsx');
const raporKlasoru = () => { const d = path.join(klasor(), 'Raporlar'); fs.mkdirSync(d, { recursive: true }); return d; };
const guvenliAd = s => String(s).replace(/[<>:"/\\|?*\x00-\x1f]/g, '_').slice(0, 120);

let win;
function pencere() {
  win = new BrowserWindow({
    width: 1280, height: 820, minWidth: 980, minHeight: 640, show: !SMOKE,
    title: 'Kulüp Takip', backgroundColor: '#f4f6fb',
    icon: path.join(__dirname, 'icon.png'),
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: false }
  });
  Menu.setApplicationMenu(null);
  win.loadFile(path.join(__dirname, 'renderer', 'index.html'), { query: SMOKE ? { smoke: '1' } : {} });
  win.webContents.setWindowOpenHandler(({ url }) => { if (/^https:\/\//.test(url)) shell.openExternal(url); return { action: 'deny' }; });
  win.webContents.on('will-navigate', e => e.preventDefault());
  if (!SMOKE) win.once('ready-to-show', () => win.maximize());
  win.on('close', e => {
    if (win.__kapatIzin) return;
    e.preventDefault();
    win.webContents.send('app:closing');
    win.webContents.executeJavaScript('window.__kapanis ? window.__kapanis() : true').then(ok => { if (ok) { win.__kapatIzin = true; win.close(); } }).catch(() => { win.__kapatIzin = true; win.close(); });
  });
}

app.on('second-instance', () => { if (win) { if (win.isMinimized()) win.restore(); win.focus(); } });
app.whenReady().then(() => { pencere(); if (!SMOKE) setTimeout(() => guncellemeKontrol(false), 4000); });
app.on('window-all-closed', () => app.quit());

// ---------------- veri ----------------
ipcMain.handle('app:info', () => ({
  version: app.getVersion(), platform: process.platform, arch: process.arch, klasor: klasor(), veri: veriYolu(),
  paket: paketTuru(), smoke: !!SMOKE
}));
ipcMain.handle('data:load', async () => {
  const f = veriYolu();
  if (!fs.existsSync(f)) return { exists: false };
  try { return { exists: true, data: await store.load(f) }; }
  catch (e) { return { exists: true, error: e.message }; }
});
ipcMain.handle('data:save', async (_e, data) => {
  try { await store.save(veriYolu(), data); return { ok: true }; }
  catch (e) { return { ok: false, error: e.code === 'EBUSY' || e.code === 'EPERM' ? 'Veri dosyası başka bir programda (Excel) açık olabilir. Kapatın, program tekrar deneyecek.' : e.message }; }
});

ipcMain.handle('excel:import', async () => {
  const r = await dialog.showOpenDialog(win, { title: 'Öğrenci listesini seçin', filters: [{ name: 'Excel', extensions: ['xlsx'] }], properties: ['openFile'] });
  if (r.canceled || !r.filePaths[0]) return null;
  try { return { rows: await store.readFirstSheet(r.filePaths[0]) }; }
  catch (e) { return { error: 'Dosya okunamadı: ' + e.message + '\nDosyanın .xlsx biçiminde olduğundan emin olun (eski .xls dosyasını Excel/LibreOffice ile .xlsx olarak kaydedin).' }; }
});
ipcMain.handle('excel:template', async () => {
  const r = await dialog.showSaveDialog(win, { defaultPath: path.join(app.getPath('documents'), 'Ogrenci_Listesi_Sablonu.xlsx'), filters: [{ name: 'Excel', extensions: ['xlsx'] }] });
  if (r.canceled || !r.filePath) return null;
  await store.writeTemplate(r.filePath); shell.openPath(r.filePath); return r.filePath;
});

// ---------------- raporlar ----------------
ipcMain.handle('report:excel', async (_e, { models, settings, ad, sor }) => {
  let f = path.join(raporKlasoru(), guvenliAd(ad) + '.xlsx');
  if (sor) { const r = await dialog.showSaveDialog(win, { defaultPath: f, filters: [{ name: 'Excel', extensions: ['xlsx'] }] }); if (r.canceled) return null; f = r.filePath; }
  await store.exportReport(f, models, settings);
  if (!SMOKE) shell.openPath(f);
  return f;
});

async function gizliPencere(html) {
  const w = new BrowserWindow({ show: false, webPreferences: { sandbox: true, javascript: false } });
  const tmp = path.join(os.tmpdir(), `kulup-rapor-${process.pid}-${Date.now()}.html`);
  fs.writeFileSync(tmp, html, 'utf8');
  await w.loadFile(tmp);
  setTimeout(() => { try { fs.unlinkSync(tmp); } catch (e) { /* yoksay */ } }, 60000);
  return w;
}
ipcMain.handle('report:pdf', async (_e, { html, ad, sor }) => {
  let f = path.join(raporKlasoru(), guvenliAd(ad) + '.pdf');
  if (sor) { const r = await dialog.showSaveDialog(win, { defaultPath: f, filters: [{ name: 'PDF', extensions: ['pdf'] }] }); if (r.canceled) return null; f = r.filePath; }
  const w = await gizliPencere(html);
  try {
    const buf = await w.webContents.printToPDF({ printBackground: true, preferCSSPageSize: true, margins: { marginType: 'none' } });
    fs.writeFileSync(f, buf);
  } finally { w.destroy(); }
  if (!SMOKE) shell.openPath(f);
  return f;
});
ipcMain.handle('report:print', async (_e, { html }) => {
  const w = await gizliPencere(html);
  return new Promise(res => {
    w.webContents.print({ silent: false, printBackground: true, margins: { marginType: 'none' } }, (ok, err) => { w.destroy(); res({ ok, error: ok ? null : err }); });
  });
});

ipcMain.handle('shell:open', async (_e, which) => {
  const map = { veri: klasor(), rapor: raporKlasoru(), yedek: path.join(klasor(), 'Yedekler') };
  const p = map[which] || which;
  if (!p || (!map[which] && !String(p).startsWith(klasor()))) return false;
  fs.mkdirSync(map[which] ? p : path.dirname(p), { recursive: true });
  await shell.openPath(p); return true;
});

ipcMain.handle('backup:export', async (_e, data) => {
  const r = await dialog.showSaveDialog(win, { defaultPath: path.join(app.getPath('documents'), `KulupYedek_${new Date().toISOString().slice(0, 10)}.xlsx`), filters: [{ name: 'Excel', extensions: ['xlsx'] }] });
  if (r.canceled || !r.filePath) return null;
  const tmp = r.filePath + '.yeni';
  await store.save(tmp, data); fs.renameSync(tmp, r.filePath);
  return r.filePath;
});
ipcMain.handle('backup:import', async () => {
  const r = await dialog.showOpenDialog(win, { title: 'Yedek dosyasını seçin', filters: [{ name: 'Excel', extensions: ['xlsx'] }], properties: ['openFile'] });
  if (r.canceled || !r.filePaths[0]) return null;
  try {
    const data = await store.load(r.filePaths[0]);
    if (fs.existsSync(veriYolu())) {
      const yd = path.join(klasor(), 'Yedekler'); fs.mkdirSync(yd, { recursive: true });
      fs.copyFileSync(veriYolu(), path.join(yd, `GeriYuklemeOncesi_${Date.now()}.xlsx`));
    }
    return { data };
  } catch (e) { return { error: e.message }; }
});

// ---------------- smoke test ----------------
ipcMain.handle('smoke:shot', async (_e, name) => {
  const img = await win.webContents.capturePage();
  fs.writeFileSync(path.join(klasor(), name + '.png'), img.toPNG());
  return true;
});
ipcMain.handle('smoke:done', async (_e, { ok, log }) => {
  fs.writeFileSync(path.join(klasor(), 'smoke.log'), log || '');
  setTimeout(() => app.exit(ok ? 0 : 1), 300);
});
if (SMOKE) setTimeout(() => { fs.writeFileSync(path.join(klasor(), 'smoke.log'), 'ZAMAN AŞIMI'); app.exit(2); }, 180000);

// ---------------- güncelleme ----------------
function paketTuru() {
  if (process.platform === 'win32') return 'nsis';
  if (process.platform === 'linux') return process.env.APPIMAGE ? 'appimage' : 'deb';
  return 'diger';
}
const durumGonder = s => { if (win && !win.isDestroyed()) win.webContents.send('update:status', s); };
let updater = null;
function getUpdater() {
  if (updater) return updater;
  const { autoUpdater } = require('electron-updater');
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.on('download-progress', p => durumGonder({ durum: 'iniyor', yuzde: Math.round(p.percent) }));
  autoUpdater.on('update-downloaded', () => durumGonder({ durum: 'hazir' }));
  autoUpdater.on('error', e => durumGonder({ durum: 'hata', mesaj: String(e && e.message || e) }));
  updater = autoUpdater;
  return updater;
}
function surumKarsilastir(a, b) {
  const x = String(a).replace(/^v/, '').split('.').map(n => parseInt(n, 10) || 0), y = String(b).replace(/^v/, '').split('.').map(n => parseInt(n, 10) || 0);
  for (let i = 0; i < 3; i++) if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) - (y[i] || 0);
  return 0;
}
function getJson(url) {
  return new Promise((res, rej) => {
    const req = net.request({ url, headers: { 'User-Agent': 'kulup-takip', Accept: 'application/vnd.github+json' } });
    let body = '';
    req.on('response', r => { r.on('data', c => body += c); r.on('end', () => { if (r.statusCode !== 200) return rej(new Error('GitHub yanıtı: ' + r.statusCode)); try { res(JSON.parse(body)); } catch (e) { rej(e); } }); });
    req.on('error', rej); req.end();
  });
}
let debBilgi = null, debDosya = null;
async function guncellemeKontrol(elle) {
  try {
    if (!app.isPackaged) { if (elle) durumGonder({ durum: 'yok', mesaj: 'Geliştirme sürümünde güncelleme denetlenmez.' }); return; }
    durumGonder({ durum: 'denetleniyor' });
    if (paketTuru() === 'deb') {
      const rel = await getJson(`https://api.github.com/repos/${REPO}/releases/latest`);
      const asset = (rel.assets || []).find(a => /_amd64\.deb$/.test(a.name));
      if (asset && surumKarsilastir(rel.tag_name, app.getVersion()) > 0) {
        debBilgi = { url: asset.browser_download_url, ad: asset.name, surum: rel.tag_name.replace(/^v/, ''), notlar: rel.body || '' };
        durumGonder({ durum: 'var', surum: debBilgi.surum, notlar: debBilgi.notlar });
      } else durumGonder({ durum: 'yok' });
      return;
    }
    const r = await getUpdater().checkForUpdates();
    const v = r && r.updateInfo && r.updateInfo.version;
    if (v && surumKarsilastir(v, app.getVersion()) > 0) durumGonder({ durum: 'var', surum: v, notlar: typeof r.updateInfo.releaseNotes === 'string' ? r.updateInfo.releaseNotes : '' });
    else durumGonder({ durum: 'yok' });
  } catch (e) {
    durumGonder({ durum: elle ? 'hata' : 'sessiz', mesaj: 'Güncelleme denetlenemedi (internet bağlantısını kontrol edin): ' + e.message });
  }
}
ipcMain.handle('update:check', () => guncellemeKontrol(true));
ipcMain.handle('update:download', async () => {
  if (paketTuru() !== 'deb') { getUpdater().downloadUpdate().catch(e => durumGonder({ durum: 'hata', mesaj: e.message })); return; }
  if (!debBilgi) return;
  debDosya = path.join(os.tmpdir(), debBilgi.ad);
  const out = fs.createWriteStream(debDosya);
  const indir = (url) => {
    const req = net.request({ url, redirect: 'follow', headers: { 'User-Agent': 'kulup-takip' } });
    req.on('response', r => {
      if (r.statusCode !== 200) { durumGonder({ durum: 'hata', mesaj: 'İndirme başarısız: ' + r.statusCode }); return; }
      const top = parseInt(r.headers['content-length'], 10) || 0; let n = 0;
      r.on('data', c => { out.write(c); n += c.length; if (top) durumGonder({ durum: 'iniyor', yuzde: Math.round(100 * n / top) }); });
      r.on('end', () => out.end(() => durumGonder({ durum: 'hazir' })));
    });
    req.on('error', e => durumGonder({ durum: 'hata', mesaj: e.message }));
    req.end();
  };
  indir(debBilgi.url);
});
ipcMain.handle('update:install', async () => {
  if (paketTuru() !== 'deb') { setImmediate(() => getUpdater().quitAndInstall(false, true)); return; }
  if (!debDosya || !fs.existsSync(debDosya)) return;
  durumGonder({ durum: 'kuruluyor' });
  // Pardus/Debian: yönetici şifresi pencereyle sorulur (pkexec)
  const p = spawn('pkexec', ['apt-get', 'install', '-y', '--allow-downgrades', debDosya], { stdio: 'ignore' });
  p.on('error', () => durumGonder({ durum: 'hata', mesaj: 'pkexec bulunamadı. Paketi elle kurun: ' + debDosya }));
  p.on('exit', code => {
    if (code === 0) { durumGonder({ durum: 'kuruldu' }); setTimeout(() => { app.relaunch(); app.exit(0); }, 1500); }
    else durumGonder({ durum: 'hata', mesaj: code === 126 || code === 127 ? 'Kurulum iptal edildi (şifre girilmedi).' : 'Kurulum başarısız (kod ' + code + '). Paket: ' + debDosya });
  });
});
