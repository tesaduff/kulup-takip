# Kulüp Takip derleme betiği
# Ek kurulum gerekmez: Windows'ta hazır bulunan .NET Framework 4.x C# derleyicisini kullanır.
# Kullanım:  powershell -ExecutionPolicy Bypass -File build.ps1          (KulupTakip.exe üretir)
#            powershell -ExecutionPolicy Bypass -File build.ps1 -Test    (testleri de çalıştırır)
param([switch]$Test)
$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

$csc = Join-Path $env:WINDIR 'Microsoft.NET\Framework64\v4.0.30319\csc.exe'
if (-not (Test-Path $csc)) { $csc = Join-Path $env:WINDIR 'Microsoft.NET\Framework\v4.0.30319\csc.exe' }
if (-not (Test-Path $csc)) { throw '.NET Framework 4 C# derleyicisi (csc.exe) bulunamadı.' }

New-Item -ItemType Directory -Force dist | Out-Null
$src  = Get-ChildItem src\*.cs | ForEach-Object { $_.FullName }
$refs = '/r:System.dll','/r:System.Core.dll','/r:System.Drawing.dll','/r:System.Windows.Forms.dll',
        '/r:System.Xml.dll','/r:System.Xml.Linq.dll','/r:System.IO.Compression.dll','/r:System.IO.Compression.FileSystem.dll'
$common = @('/nologo','/codepage:65001','/optimize+','/platform:anycpu') + $refs
$icon = @(); if (Test-Path 'assets\app.ico') { $icon = @('/win32icon:assets\app.ico') }

& $csc @common @icon /target:winexe /out:dist\KulupTakip.exe @src
if ($LASTEXITCODE -ne 0) { throw 'Derleme başarısız.' }
Write-Host 'Derlendi: dist\KulupTakip.exe'

if ($Test) {
    & $csc @common /target:exe /out:dist\KulupTakip_test.exe @src
    if ($LASTEXITCODE -ne 0) { throw 'Test derlemesi başarısız.' }
    $out = Join-Path $env:TEMP 'KulupTakipTest'
    & dist\KulupTakip_test.exe --selftest $out
    $code = $LASTEXITCODE
    Remove-Item dist\KulupTakip_test.exe -ErrorAction SilentlyContinue
    if ($code -ne 0) { throw "Testler başarısız ($code)." }
    Write-Host "Test raporları: $out"
}
