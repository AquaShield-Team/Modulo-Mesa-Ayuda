import os
import sys
import subprocess
from pyngrok import ngrok, conf

try:
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
    if hasattr(sys.stderr, 'reconfigure'):
        sys.stderr.reconfigure(encoding='utf-8')
except Exception:
    pass

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
config_path = os.path.join(BASE_DIR, "NGROK_CONFIG.txt")

token = ""
custom_domain = ""

if os.path.exists(config_path):
    with open(config_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line.startswith("AUTHTOKEN="):
                token = line.split("=", 1)[1].strip()
            elif line.startswith("DOMAIN="):
                custom_domain = line.split("=", 1)[1].strip()

print("=" * 70)
print("       AQUASHIELD - GESTOR DE TUNEL NGROK (OPCION 2)")
print("       (Soporta Dominio Fijo Permanente Gratuito)")
print("=" * 70)

if not token:
    print("\n[*] Para usar Ngrok con dominio fijo:")
    print("    1. Ingresa a https://dashboard.ngrok.com/get-started/your-authtoken")
    print("    2. Copia tu AuthToken gratuito.")
    token_input = input("\nIngresa tu AuthToken de Ngrok (o presiona Enter para cancelar): ").strip()
    if not token_input:
        sys.exit(0)
    token = token_input
    
    domain_input = input("Si tienes un dominio estatico gratis en ngrok, ingresalo (Ej: aquashield.ngrok-free.app) o Enter para dinamico: ").strip()
    if domain_input:
        custom_domain = domain_input
        
    with open(config_path, "w", encoding="utf-8") as f:
        f.write(f"AUTHTOKEN={token}\n")
        f.write(f"DOMAIN={custom_domain}\n")
    print("[OK] Configuracion guardada en NGROK_CONFIG.txt")

try:
    ngrok.set_auth_token(token)
    print("\n[*] Conectando tunel Ngrok al puerto 5050...")
    
    if custom_domain:
        tunnel = ngrok.connect(5050, "http", domain=custom_domain)
    else:
        tunnel = ngrok.connect(5050, "http")
        
    public_url = tunnel.public_url.replace("http://", "https://")
    
    # Copiar al portapapeles
    try:
        subprocess.run(["powershell", "-NoProfile", "-Command", f"Set-Clipboard -Value '{public_url}'"], check=False)
        copied = " (Copiado al portapapeles)"
    except Exception:
        copied = ""

    print("\n" + "=" * 70)
    print("  [OK] ENLACE NGROK ACTIVO Y LISTO PARA COMPARTIR:")
    print(f"\n  --> {public_url} {copied}")
    print("\n" + "=" * 70)
    print("  [*] CARACTERISTICAS DE NGROK:")
    print("      - Puede ser un dominio fijo permanente (ej: tunombre.ngrok-free.app).")
    print("      - Altisima estabilidad y velocidad.")
    print("      - Cero permisos de Administrador.")
    print("=" * 70)
    print("\n[IMPORTANTE] Manten esta ventana abierta mientras tus colegas usen el enlace.")
    print("Para cerrar el enlace, presiona Ctrl + C o cierra esta ventana.")
    print("=" * 70 + "\n")
    
    # Mantener el proceso vivo
    ngrok_process = ngrok.get_ngrok_process()
    ngrok_process.proc.wait()
except Exception as e:
    print(f"\n[ERROR] Error al iniciar Ngrok: {e}")
    input("\nPresiona Enter para salir...")
