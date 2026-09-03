import os
import sys
import subprocess
import sqlite3

# Configurar salida UTF-8 para evitar errores de charmap en CMD de Windows
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

# Colores ANSI
CYAN = "\033[96m"
GREEN = "\033[92m"
YELLOW = "\033[93m"
RED = "\033[91m"
BOLD = "\033[1m"
RESET = "\033[0m"
GRAY = "\033[90m"

BASE_DIR = r"c:\dev\Modulo-Mesa-Ayuda"
DB_PATH = os.path.join(BASE_DIR, "data", "helpdesk.db")
UPLOADS_DIR = os.path.join(BASE_DIR, "uploads")
STARTUP_LINK = os.path.join(os.environ.get("APPDATA", ""), r"Microsoft\Windows\Start Menu\Programs\Startup\AquaShield_Mesa_Ayuda.lnk")

def get_server_status():
    try:
        res = subprocess.run('netstat -ano | findstr :5050 | findstr LISTENING', shell=True, capture_output=True, text=True)
        lines = res.stdout.strip().splitlines()
        pids = set()
        for line in lines:
            parts = line.split()
            if len(parts) >= 5 and parts[3] == "LISTENING":
                pids.add(parts[4])
        
        if not pids:
            return {"active": False, "pids": []}

        proc_info = []
        for pid in pids:
            try:
                task_res = subprocess.run(f'tasklist /fi "PID eq {pid}" /fo csv /nh', shell=True, capture_output=True, text=True)
                row = task_res.stdout.strip().replace('"', '').split(',')
                if len(row) >= 5:
                    pname = row[0]
                    mem = row[4]
                    is_silent = "pythonw" in pname.lower()
                    proc_info.append({
                        "pid": pid,
                        "name": pname,
                        "memory": mem,
                        "is_silent": is_silent
                    })
                else:
                    proc_info.append({"pid": pid, "name": "python.exe", "memory": "N/D", "is_silent": False})
            except Exception:
                proc_info.append({"pid": pid, "name": "python.exe", "memory": "N/D", "is_silent": False})

        return {"active": True, "pids": list(pids), "processes": proc_info}
    except Exception as e:
        return {"active": False, "error": str(e)}

def get_database_metrics():
    if not os.path.exists(DB_PATH):
        return {"exists": False}
    try:
        conn = sqlite3.connect(DB_PATH)
        cur = conn.cursor()
        cur.execute("SELECT COUNT(*) FROM tickets")
        total_tickets = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM tickets WHERE status = 'abierto'")
        open_tickets = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM users")
        total_users = cur.fetchone()[0]
        conn.close()

        total_uploads = 0
        total_size_mb = 0
        if os.path.exists(UPLOADS_DIR):
            for f in os.listdir(UPLOADS_DIR):
                fp = os.path.join(UPLOADS_DIR, f)
                if os.path.isfile(fp):
                    total_uploads += 1
                    total_size_mb += os.path.getsize(fp) / (1024 * 1024)

        return {
            "exists": True,
            "total_tickets": total_tickets,
            "open_tickets": open_tickets,
            "total_users": total_users,
            "total_uploads": total_uploads,
            "uploads_size_mb": round(total_size_mb, 2)
        }
    except Exception as e:
        return {"exists": False, "error": str(e)}

def check_autostart():
    return os.path.exists(STARTUP_LINK)

def print_dashboard():
    os.system("")

    srv = get_server_status()
    db = get_database_metrics()
    autostart = check_autostart()

    print(f"{CYAN}==============================================================================={RESET}")
    print(f"      {BOLD}AQUASHIELD · MESA DE AYUDA Y GESTIÓN DE REQUERIMIENTOS (AquaChile){RESET}")
    print(f"                       {GRAY}PANEL DE ESTADO Y PROCESOS EN VIVO{RESET}")
    print(f"{CYAN}==============================================================================={RESET}\n")

    if srv["active"]:
        print(f"  {BOLD}ESTADO SERVIDOR:{RESET}    {GREEN}[ACTIVO]{RESET} Escuchando en http://localhost:5050")
        procs = srv.get("processes", [])
        has_silent = any(p.get("is_silent") for p in procs)
        mode_text = f"{CYAN}[MODO SILENCIOSO / SEGUNDO PLANO]{RESET} (Sin ventana de consola)" if has_silent else f"{YELLOW}[MODO VISIBLE]{RESET} (Ejecutándose en consola)"
        print(f"  {BOLD}MODO DE EJECUCIÓN:{RESET}  {mode_text}")

        print(f"  {BOLD}PROCESOS EN VIVO:{RESET}")
        for p in procs:
            mode_tag = "(Segundo Plano)" if p.get("is_silent") else "(Consola Activa)"
            print(f"    ├─ PID {BOLD}{p['pid']}{RESET} : {p['name']} {mode_tag} | Memoria RAM: {p['memory']}")
    else:
        print(f"  {BOLD}ESTADO SERVIDOR:{RESET}    {RED}[DETENIDO / INACTIVO]{RESET}")
        print(f"  {BOLD}MODO DE EJECUCIÓN:{RESET}  {GRAY}Ningún proceso en ejecución{RESET}")

    print()

    if db.get("exists"):
        print(f"  {BOLD}BASE DE DATOS:{RESET}      {GREEN}[OK]{RESET} SQLite Activa | {BOLD}{db['total_tickets']}{RESET} Tickets ({BOLD}{db['open_tickets']}{RESET} Abiertos) | {BOLD}{db['total_users']}{RESET} Usuarios")
        print(f"  {BOLD}ARCHIVOS ADJUNTOS:{RESET}  {BOLD}{db['total_uploads']}{RESET} archivos subidos ({db['uploads_size_mb']} MB en disco)")
    else:
        print(f"  {BOLD}BASE DE DATOS:{RESET}      {YELLOW}Base de datos no inicializada{RESET}")

    if autostart:
        print(f"  {BOLD}AUTO-INICIO:{RESET}        {GREEN}[ACTIVADO]{RESET} Inicia en silencio al encender el computador")
    else:
        print(f"  {BOLD}AUTO-INICIO:{RESET}        {GRAY}[DESACTIVADO]{RESET} Requiere inicio manual")

    print()
    print(f"  {BOLD}ENLACES RÁPIDOS:{RESET}")
    print(f"    - Panel Admin Gestión:   {CYAN}http://localhost:5050/admin{RESET}")
    print(f"    - Portal Web Usuarios:   {CYAN}https://aquashield-team.github.io/Modulo-Mesa-Ayuda/{RESET}")
    print(f"{CYAN}==============================================================================={RESET}")

if __name__ == "__main__":
    print_dashboard()
