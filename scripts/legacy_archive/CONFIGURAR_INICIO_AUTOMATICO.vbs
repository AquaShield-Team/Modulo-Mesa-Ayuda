Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)

startupFolder = WshShell.SpecialFolders("Startup")
Set shortcut = WshShell.CreateShortcut(startupFolder & "\AquaShield_Mesa_Ayuda.lnk")
shortcut.TargetPath = "wscript.exe"
shortcut.Arguments = Chr(34) & scriptDir & "\INICIAR_SEGUNDO_PLANO.vbs" & Chr(34)
shortcut.WorkingDirectory = scriptDir
shortcut.IconLocation = scriptDir & "\static\favicon.ico,0"
shortcut.Save
