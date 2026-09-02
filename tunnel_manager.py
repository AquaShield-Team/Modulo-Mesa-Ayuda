import subprocess
import re
import time
import os
import sys

# Configurar encoding UTF-8 seguro para consolas Windows
try:
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
    if hasattr(sys.stderr, 'reconfigure'):
        sys.stderr.reconfigure(encoding='utf-8')
except Exception:
    pass

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
cf_exe = os.path.join(BASE_DIR, "bin", "cloudflared.exe")

if not os.path.exists(cf_exe):
    print("[ERROR] No se encontro cloudflared.exe en bin/.")
    input("Presiona Enter para salir...")
    sys.exit(1)

print("=" * 70)
print("       AQUASHIELD - GENERADOR DE ENLACE WEB SEGURO (HTTPS)")
print("       (Funciona con o sin VPN FortiClient - 0 Permisos de Admin)")
print("=" * 70)
print("\n[*] Estableciendo tunel seguro con Cloudflare...")

proc = subprocess.Popen(
    [cf_exe, "tunnel", "--url", "http://localhost:5050"],
    stdout=subprocess.PIPE,
    stderr=subprocess.STDOUT,
    text=True,
    encoding="utf-8",
    errors="replace",
    bufsize=1
)

tunnel_url = None
start_time = time.time()

while time.time() - start_time < 25:
    line = proc.stdout.readline()
    if line:
        match = re.search(r'https://[a-zA-Z0-9-]+\.trycloudflare\.com', line)
        if match:
            tunnel_url = match.group(0)
            break

if tunnel_url:
    # Guardar en archivo
    txt_path = os.path.join(BASE_DIR, "ENLACE_COMPARTIR.txt")
    with open(txt_path, "w", encoding="utf-8") as f:
        f.write(tunnel_url + "\n")

    # Intentar copiar al portapapeles
    try:
        subprocess.run(["powershell", "-NoProfile", "-Command", f"Set-Clipboard -Value '{tunnel_url}'"], check=False)
        copied = " (Copiado al portapapeles)"
    except Exception:
        copied = ""

    print("\n" + "=" * 70)
    print("  [OK] ENLACE WEB ACTIVO Y LISTO PARA COMPARTIR:")
    print(f"\n  --> {tunnel_url} {copied}")
    print("\n" + "=" * 70)
    print("  [*] CARACTERISTICAS:")
    print("      - Tus colegas pueden abrirlo desde VPN FortiClient, sin VPN o celular.")
    print("      - Cuenta con conexion cifrada segura SSL (HTTPS).")
    print("      - No requiere permisos de Administrador de TI.")
    print("=" * 70)
    print("\n[IMPORTANTE] Manten esta ventana abierta mientras tus colegas usen el enlace.")
    print("Para cerrar el enlace, presiona Ctrl + C o cierra esta ventana.")
    print("=" * 70 + "\n")

    try:
        proc.wait()
    except KeyboardInterrupt:
        print("\n[*] Cerrando tunel web...")
        proc.terminate()
else:
    print("[ERROR] No se pudo generar el tunel. Verifica tu conexion a internet.")
    proc.terminate()
    input("\nPresiona Enter para salir...")
