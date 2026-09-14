#ifndef AppVersion
    #error AppVersion is required
#endif
#ifndef SourceDir
    #error SourceDir is required
#endif
#ifndef OutputDir
    #error OutputDir is required
#endif
#ifndef OutputBaseFilename
    #error OutputBaseFilename is required
#endif
#ifndef IconFile
    #error IconFile is required
#endif
#ifndef Is64Bit
    #define Is64Bit 0
#endif

[Setup]
AppId={{B5967A3C-2787-4FF5-A612-E523F37A130C}
AppName=Scratch farsi
AppVersion={#AppVersion}
AppPublisher=Scratch Foundation and contributors
DefaultDirName={localappdata}\Programs\Scratch farsi
DefaultGroupName=Scratch farsi
DisableProgramGroupPage=yes
OutputDir={#OutputDir}
OutputBaseFilename={#OutputBaseFilename}
Compression=lzma2/fast
SolidCompression=yes
SetupIconFile={#IconFile}
PrivilegesRequired=lowest
PrivilegesRequiredOverridesAllowed=dialog
SetupLogging=yes
UninstallDisplayIcon={app}\ScratchFA.exe
VersionInfoVersion={#AppVersion}
WizardStyle=modern
#if Is64Bit
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
#endif

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Files]
Source: "{#SourceDir}\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{autoprograms}\Scratch farsi"; Filename: "{app}\ScratchFA.exe"
Name: "{autodesktop}\Scratch farsi"; Filename: "{app}\ScratchFA.exe"; Tasks: desktopicon

[Tasks]
Name: "desktopicon"; Description: "Create a desktop shortcut"; GroupDescription: "Additional shortcuts:"

[Run]
Filename: "{app}\ScratchFA.exe"; Description: "Launch Scratch farsi"; Flags: nowait postinstall skipifsilent
