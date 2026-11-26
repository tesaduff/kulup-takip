'use strict';
const { contextBridge, ipcRenderer } = require('electron');

const inv = (ch) => (...a) => ipcRenderer.invoke(ch, ...a);

contextBridge.exposeInMainWorld('api', {
  info: inv('app:info'),
  load: inv('data:load'),
  save: inv('data:save'),
  importExcel: inv('excel:import'),
  template: inv('excel:template'),
  exportExcel: inv('report:excel'),
  pdf: inv('report:pdf'),
  print: inv('report:print'),
  openPath: inv('shell:open'),
  backupExport: inv('backup:export'),
  backupImport: inv('backup:import'),
  updateCheck: inv('update:check'),
  updateDownload: inv('update:download'),
  updateInstall: inv('update:install'),
  onUpdate: (fn) => ipcRenderer.on('update:status', (_e, s) => fn(s)),
  smokeShot: inv('smoke:shot'),
  smokeDone: inv('smoke:done')
});
