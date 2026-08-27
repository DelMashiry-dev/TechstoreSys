# Create / refresh Tech Stores launcher shortcuts (online DB + offline shell)
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$desktop = [Environment]::GetFolderPath('Desktop')
$shell = New-Object -ComObject WScript.Shell

$launchers = @(
    @{
        Bat = Join-Path $root 'START-SYSTEM.bat'
        Ico = Join-Path $root 'assets\database.ico'
        LinkNames = @('START-SYSTEM.lnk', 'TechStoreSys Online.lnk')
        Description = 'IT-DIR Tech Stores — Online database mode (techstores.db on port 8080)'
    },
    @{
        Bat = Join-Path $root 'START-OFFLINE.bat'
        Ico = Join-Path $root 'assets\techstores.ico'
        LinkNames = @('START-OFFLINE.lnk', 'TechStoreSys Offline.lnk')
        Description = 'IT-DIR Tech Stores — Offline browser mode (IndexedDB)'
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
        throw "Missing icon for $($launcher.LinkNames[0]): $($launcher.Ico)"
    }

    foreach ($linkName in $launcher.LinkNames) {
        $paths = @(
            (Join-Path $root $linkName),
            (Join-Path $desktop $linkName)
        )
        foreach ($path in $paths) {
            Set-LauncherShortcut -Path $path -Bat $launcher.Bat -Ico $launcher.Ico -Description $launcher.Description
        }
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
