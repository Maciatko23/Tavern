# Monitor, na którym jest okno VS Code (zwyczaj gracza: gra na tym samym ekranie). Wypisuje JSON {x,y,w,h,src}.
# Bez okna Code - ekran główny. Używa tools/autopilot/ogladaj.js.
Add-Type -AssemblyName System.Windows.Forms
Add-Type @"
using System;
using System.Runtime.InteropServices;
public struct RECTX { public int Left; public int Top; public int Right; public int Bottom; }
public static class WinX { [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr h, out RECTX r); }
"@
$screens = [System.Windows.Forms.Screen]::AllScreens
$pick = [System.Windows.Forms.Screen]::PrimaryScreen
$src = "glowny"
$code = Get-Process -Name "Code" -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowHandle -ne [IntPtr]::Zero } | Select-Object -First 1
if ($code) {
    $r = New-Object RECTX
    if ([WinX]::GetWindowRect($code.MainWindowHandle, [ref]$r)) {
        $cx = [int](($r.Left + $r.Right) / 2); $cy = [int](($r.Top + $r.Bottom) / 2)
        foreach ($s in $screens) {
            $b = $s.Bounds
            if ($cx -ge $b.X -and $cx -lt ($b.X + $b.Width) -and $cy -ge $b.Y -and $cy -lt ($b.Y + $b.Height)) { $pick = $s; $src = "vscode" }
        }
    }
}
$b = $pick.Bounds
Write-Output ("{""x"":" + $b.X + ",""y"":" + $b.Y + ",""w"":" + $b.Width + ",""h"":" + $b.Height + ",""src"":""" + $src + """}")
