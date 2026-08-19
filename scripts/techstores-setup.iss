; Inno Setup script — IT-DIR Tech Stores 1.0.0.0
; Compile with: ISCC.exe scripts\techstores-setup.iss
; Or run: scripts\build-release.bat

#define MyAppName "IT-DIR Tech Stores"
#define MyAppVersion "1.0.0.0"
#define MyAppPublisher "IT Directorate — Zimbabwe National Army"
#define MyAppURL "http://127.0.0.1:8080/app/"
#define MyAppExeName "TECHSTORES.exe"
#define MyAppId "{{A7C3E91F-4B2D-4E8A-9F01-8C2D1E0F3A11}"

#ifndef SourceDir
  #define SourceDir "..\dist\TECHSTORES-Portable"
#endif
#ifndef OutputDir
  #define OutputDir "..\dist"
#endif

[Setup]
AppId={#MyAppId}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppVerName={#MyAppName} {#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
DefaultDirName={autopf}\TECHSTORES
DefaultGroupName={#MyAppName}
DisableProgramGroupPage=yes
OutputDir={#OutputDir}
OutputBaseFilename=TECHSTORES-Setup-1.0.0.0
SetupIconFile=..\assets\techstores.ico
UninstallDisplayIcon={app}\{#MyAppExeName}
Compression=lzma2/max
SolidCompression=yes
WizardStyle=modern
PrivilegesRequired=admin
ArchitecturesInstallIn64BitMode=x64compatible
VersionInfoVersion={#MyAppVersion}
VersionInfoCompany={#MyAppPublisher}
VersionInfoDescription={#MyAppName} Setup
VersionInfoProductName={#MyAppName}
VersionInfoProductVersion={#MyAppVersion}
CloseApplications=yes
RestartApplications=no

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked

[Files]
; Install runtime + app. Do not overwrite an existing techstores.db on upgrade.
Source: "{#SourceDir}\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs; Excludes: "techstores.db"

[Icons]
Name: "{group}\{#MyAppName}"; Filename: "{app}\START-SYSTEM.bat"; IconFilename: "{app}\{#MyAppExeName}"; WorkingDir: "{app}"
Name: "{group}\{#MyAppName} (console)"; Filename: "{app}\{#MyAppExeName}"; WorkingDir: "{app}"
Name: "{group}\{cm:UninstallProgram,{#MyAppName}}"; Filename: "{uninstallexe}"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\START-SYSTEM.bat"; IconFilename: "{app}\{#MyAppExeName}"; WorkingDir: "{app}"; Tasks: desktopicon

[Run]
Filename: "{app}\START-SYSTEM.bat"; Description: "Launch {#MyAppName}"; Flags: nowait postinstall skipifsilent shellexec
