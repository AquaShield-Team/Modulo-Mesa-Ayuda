import subprocess
import urllib.request
import json
import os
import sys
import socket

# Configurar UTF-8
try:
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
    if hasattr(sys.stderr, 'reconfigure'):
        sys.stderr.reconfigure(encoding='utf-8')
except Exception:
    pass

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
REPO = "AquaShield-Team/Modulo-Mesa-Ayuda"

# Colores ANSI para Windows CMD
GREEN = "\033[92m"
YELLOW = "\033[93m"
CYAN = "\033[96m"
RED = "\033[91m"
BOLD = "\033[1m"
RESET = "\033[0m"

print("=" * 79)
print(f"       {BOLD}AQUASHIELD · ESTADO INTEGRAL DE MESA DE AYUDA (AquaChile){RESET}")
print("=" * 79)

# ── 1. SERVIDOR LOCAL ────────────────────────────────────────────────────────
print(f"\n{BOLD}[🖥️  SERVIDOR LOCAL]{RESET}")
server_running = False
pid_str = "N/A"

try:
    net_res = subprocess.run(
        ["powershell", "-NoProfile", "-Command", "(Get-NetTCPConnection -LocalPort 5050 -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique)"],
        capture_output=True, text=True
    )
    pids = [p.strip() for p in net_res.stdout.split() if p.strip().isdigit()]
    if pids:
        server_running = True
        pid_str = ", ".join(pids)
except Exception:
    pass

if server_running:
    print(f"  ● Estado:         {GREEN}🟢 ACTIVO (En ejecución en segundo plano){RESET}")
    print(f"  ● PID:            {pid_str} | Puerto: 5050")
    
    try:
        req = urllib.request.Request("http://localhost:5050/api/stats", headers={"User-Agent": "AquaShieldCheck"})
        with urllib.request.urlopen(req, timeout=1.5) as r:
            st_data = json.loads(r.read().decode("utf-8"))
            tot = st_data.get("stats", {}).get("total", 0)
            abi = st_data.get("stats", {}).get("abierto", 0)
            pro = st_data.get("stats", {}).get("en_proceso", 0)
            res = st_data.get("stats", {}).get("resuelto", 0)
            print(f"  ● Base de Datos:  {tot} tickets ({abi} abiertos, {pro} en proceso, {res} resueltos)")
    except Exception:
        print(f"  ● Base de Datos:  helpdesk.db activa")
        
    fqdn = socket.getfqdn()
    local_ip = "127.0.0.1"
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(('8.8.8.8', 80))
        local_ip = s.getsockname()[0]
        s.close()
    except Exception:
        pass
        
    print(f"  ● Acceso Admin:   {CYAN}http://localhost:5050/admin{RESET}")
    print(f"  ● Red AquaChile:  {GREEN}http://{fqdn}:5050{RESET}  (IP: http://{local_ip}:5050)")
else:
    print(f"  ● Estado:         {RED}🔴 INACTIVO (Servidor detenido){RESET}")
    print(f"  ● Sugerencia:     Ejecuta {YELLOW}INICIAR_SILENCIOSO.bat{RESET} para levantarlo")

# ── 2. GITHUB & GITHUB PAGES ─────────────────────────────────────────────
print(f"\n{BOLD}[🐙 GITHUB & GITHUB PAGES]{RESET}")
print(f"  ● Repositorio:    {CYAN}https://github.com/{REPO}{RESET}")
print(f"  ● Portal Web:     {CYAN}https://aquashield-team.github.io/Modulo-Mesa-Ayuda/{RESET}")
print(f"  ● Panel Admin:    {CYAN}https://aquashield-team.github.io/Modulo-Mesa-Ayuda/admin.html{RESET}")

try:
    gh_run = subprocess.run(
        ["gh", "run", "list", "--repo", REPO, "--limit", "1", "--json", "status,conclusion,updatedAt"],
        capture_output=True, text=True
    )
    if gh_run.returncode == 0:
        runs = json.loads(gh_run.stdout or "[]")
        if runs:
            r0 = runs[0]
            concl = r0.get("conclusion") or r0.get("status")
            if concl == "success":
                date_str = r0.get('updatedAt', '')[:16].replace('T', ' ')
                print(f"  ● Estado Deploy:  {GREEN}🟢 PUBLICADO CON ÉXITO{RESET} ({date_str} UTC)")
            elif concl == "in_progress":
                print(f"  ● Estado Deploy:  {YELLOW}🟡 DESPLIEGUE EN CURSO (Compilando)...{RESET}")
            else:
                print(f"  ● Estado Deploy:  {YELLOW}Estado: {concl}{RESET}")
except Exception:
    pass

try:
    iss_res = subprocess.run(
        ["gh", "issue", "list", "--repo", REPO, "--label", "en-espera", "--state", "open", "--json", "number"],
        capture_output=True, text=True
    )
    if iss_res.returncode == 0:
        issues = json.loads(iss_res.stdout or "[]")
        if len(issues) == 0:
            print(f"  ● Bandeja Espera: {GREEN}🟢 0 requerimientos en cola (Al día){RESET}")
        else:
            print(f"  ● Bandeja Espera: {YELLOW}🟡 {len(issues)} REQUERIMIENTOS EN COLA PENDIENTES{RESET} (Usa 'Sincronizar Cola' en Admin)")
except Exception:
    pass

# ── 3. ESTADO DE VERSIÓN Y COMMITS ──────────────────────────────────────────
print(f"\n{BOLD}[📦 ESTADO DE VERSIÓN Y COMMITS]{RESET}")

try:
    git_log = subprocess.run(
        ["git", "log", "-1", "--format=%h|%s|%cd|%an", "--date=format:%Y-%m-%d %H:%M:%S"],
        capture_output=True, text=True
    )
    if git_log.returncode == 0 and git_log.stdout.strip():
        chash, cmsg, cdate, cauthor = git_log.stdout.strip().split("|", 3)
        print(f"  ● Último Push:    {CYAN}{chash}{RESET} - {cmsg}")
        print(f"  ● Fecha y Autor:  {cdate} | Autor: {cauthor}")
        
    st_res = subprocess.run(["git", "status", "-sb"], capture_output=True, text=True)
    st_line = st_res.stdout.splitlines()[0] if st_res.stdout else ""
    
    if "behind" in st_line:
        print(f"  ● Sincronización: {YELLOW}🟡 DESACTUALIZADO{RESET} (Hay commits nuevos en GitHub. Ejecuta 'git pull')")
    elif "ahead" in st_line:
        print(f"  ● Sincronización: {CYAN}🔵 CAMBIOS PENDIENTES{RESET} (Tienes commits locales listos para 'git push')")
    else:
        print(f"  ● Sincronización: {GREEN}🟢 ACTUALIZADO (Al día con origin/main de GitHub){RESET}")
except Exception as e:
    print(f"  ● Error Git:      {e}")

# ── 4. ENLACE WEB PÚBLICO ACTIVO ─────────────────────────────────────────────
print(f"\n{BOLD}[🌐 TÚNEL WEB PÚBLICO (Cloudflare HTTP/2)]{RESET}")
txt_file = os.path.join(BASE_DIR, "TUNNEL_URL.txt")
tunnel_url = ""
if os.path.exists(txt_file):
    with open(txt_file, "r", encoding="utf-8") as f:
        tunnel_url = f.read().strip().replace('\ufeff', '')

if tunnel_url and "trycloudflare.com" in tunnel_url:
    print(f"  ● URL Túnel:      {CYAN}{tunnel_url}{RESET}")
    try:
        t_req = urllib.request.Request(f"{tunnel_url}/api/stats", headers={"User-Agent": "AquaShieldCheck"})
        with urllib.request.urlopen(t_req, timeout=2.0) as tr:
            if tr.status == 200:
                print(f"  ● Conectividad:   {GREEN}🟢 RESPONDIENDO EN VIVO (HTTP 200 - Operativo){RESET}")
    except Exception:
        print(f"  ● Conectividad:   {YELLOW}🟡 INACTIVO / REPOSO (Inícialo con COMPARTIR_ENLACE_WEB.bat){RESET}")
else:
    print(f"  ● Estado:         No hay túnel activo configurado")
    print(f"  ● Para activarlo: Haz doble clic en {YELLOW}COMPARTIR_ENLACE_WEB.bat{RESET}")

print("\n" + "=" * 79)
