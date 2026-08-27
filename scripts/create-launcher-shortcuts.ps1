# Create / refresh Tech Stores launcher shortcuts (online DB + offline shell)
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$desktop = [Environment]::GetFolderPath('Desktop')
$shell = New-Object -ComObject WScript.Shell

$launchers = @(
    @{
        Bat = Join-Path $root 'START-SYSTEM.bat'
        Ico = Join-Path $root 'assets\database.ico'
        LinkName = 'START-SYSTEM.lnk'
        Description = 'Start Tech Stores database server (techstores.db)'
    },
    @{
        Bat = Join-Path $root 'START-OFFLINE.bat'
        Ico = Join-Path $root 'assets\techstores.ico'
        LinkName = 'START-OFFLINE.lnk'
        Description = 'Start Tech Stores offline shell (browser IndexedDB)'
    }
)

function Set-LauncherShortcut {
    param(
        [string]$Path,
        [string]$Bat,
        [string]$Ico,
        [string]$Description
    )
    $s = $shell.CreateShortcut($Path)
    $s.TargetPath = $Bat
    $s.WorkingDirectory = $root
    $s.IconLocation = "$Ico,0"
    $s.Description = $Description
    $s.WindowStyle = 1
    $s.Save()
    Write-Host "Shortcut: $Path"
}

foreach ($launcher in $launchers) {
    if (-not (Test-Path $launcher.Bat)) {
        Write-Warning "Skipping missing batch file: $($launcher.Bat)"
        continue
    }
    if (-not (Test-Path $launcher.Ico)) {
        throw "Missing icon for $($launcher.LinkName): $($launcher.Ico)"
    }

    $paths = @(
        (Join-Path $root $launcher.LinkName),
        (Join-Path $desktop $launcher.LinkName)
    )
    foreach ($path in $paths) {
        Set-LauncherShortcut -Path $path -Bat $launcher.Bat -Ico $launcher.Ico -Description $launcher.Description
    }

    $batFull = [IO.Path]::GetFullPath($launcher.Bat)
    Get-ChildItem -Path $desktop -Filter '*.lnk' -ErrorAction SilentlyContinue | ForEach-Object {
        try {
            $sc = $shell.CreateShortcut($_.FullName)
            $target = [IO.Path]::GetFullPath($sc.TargetPath)
            if ($target -ieq $batFull) {
                $sc.IconLocation = "$($launcher.Ico),0"
                $sc.Save()
                Write-Host "Updated icon: $($_.Name)"
            }
        } catch {}
    }
}
