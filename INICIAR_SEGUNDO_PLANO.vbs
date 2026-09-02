Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
WshShell.CurrentDirectory = scriptDir

' Detener instancia previa en puerto 5050 si existiera
WshShell.Run "cmd.exe /c for /f ""tokens=5"" %a in ('netstat -aon ^| find "":5050"" ^| find ""LISTENING""') do taskkill /f /pid %a", 0, True

' Iniciar app.py en segundo plano (0 = totalmente invisible, sin ventana CMD)
WshShell.Run "cmd.exe /c python app.py", 0, False

' Esperar 2 segundos y abrir el navegador local
WScript.Sleep 2000
WshShell.Run "http://localhost:5050", 1, False
