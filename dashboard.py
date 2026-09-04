import os
import sys
import subprocess
import sqlite3
import socket

# Configurar salida UTF-8 para consola de Windows
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

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

def get_network_info():
    hostname = socket.gethostname()
    try:
        ip = socket.gethostbyname(hostname)
    except Exception:
        ip = "172.18.136.195"
    return hostname, ip

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

def get_db_info():
    if not os.path.exists(DB_PATH):
        return {"exists": False}
    try:
        conn = sqlite3.connect(DB_PATH)
        cur = conn.cursor()
        cur.execute("SELECT COUNT(*) FROM tickets")
        total_tickets = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM users")
        total_users = cur.fetchone()[0]
        conn.close()

        total_uploads = 0
        if os.path.exists(UPLOADS_DIR):
            total_uploads = len([f for f in os.listdir(UPLOADS_DIR) if os.path.isfile(os.path.join(UPLOADS_DIR, f))])

        return {
            "exists": True,
            "total_tickets": total_tickets,
            "total_users": total_users,
            "total_uploads": total_uploads
        }
    except Exception:
        return {"exists": False}

def print_dashboard():
    os.system("")
    srv = get_server_status()
    hostname, ip = get_network_info()
    db = get_db_info()

    print(f"{CYAN}==============================================================================={RESET}")
    print(f"                {BOLD}AQUASHIELD · MESA DE AYUDA (AquaChile S.A.){RESET}")
    print(f"                     {GRAY}CENTRO DE CONTROL Y MONITOR EN VIVO{RESET}")
    print(f"{CYAN}==============================================================================={RESET}\n")

    # 1. SERVIDOR DESATENDIDO
    if srv["active"]:
        procs = srv.get("processes", [])
        has_silent = any(p.get("is_silent") for p in procs)
        pid_desc = ", ".join([f"{p['name']} (PID {p['pid']}, RAM: {p['memory']})" for p in procs])
        if has_silent:
            print(f"  {BOLD}● SERVIDOR DESATENDIDO (SEGUNDO PLANO):{RESET} {GREEN}[ ACTIVO 🟢 ]{RESET}")
            print(f"    {GRAY}└─ Proceso Silencioso: {pid_desc} | Puerto: 5050{RESET}")
        else:
            print(f"  {BOLD}● SERVIDOR EN MODO CONSOLA VISIBLE:{RESET}     {YELLOW}[ ACTIVO 🖥️ ]{RESET}")
            print(f"    {GRAY}└─ Proceso: {pid_desc} | Puerto: 5050{RESET}")
    else:
        print(f"  {BOLD}● SERVIDOR DESATENDIDO (SEGUNDO PLANO):{RESET} {RED}[ DETENIDO 🔴 ]{RESET}")
        print(f"    {GRAY}└─ No hay ningún servidor ejecutándose en el puerto 5050.{RESET}")

    print()

    # 2. RED LOCAL CORPORATIVA
    print(f"  {BOLD}● RED LOCAL CORPORATIVA ({hostname}):{RESET}   {GREEN}[ ACTIVO 🟢 ]{RESET}")
    print(f"    {GRAY}└─ Equipo: {hostname} | IP: {ip} | Red: olimpo.aquachile.com{RESET}")

    print()

    # 3. CANAL COLEGAS (OFICINA / VPN)
    print(f"  {BOLD}● CANAL PARA COLEGAS (OFICINA / VPN):{RESET}   {GREEN}[ ACTIVO 🟢 ]{RESET}")
    print(f"    {GRAY}└─ Portal Cloud: https://aquashield-team.github.io/Modulo-Mesa-Ayuda/{RESET}")

    print()

    # 4. BASE DE DATOS
    if db.get("exists"):
        print(f"  {BOLD}● BASE DE DATOS LOCAL (SQLITE):{RESET}         {GREEN}[ CONECTADA 💾 ]{RESET}")
        print(f"    {GRAY}└─ {db['total_tickets']} Tickets registrados | {db['total_users']} Usuarios | {db['total_uploads']} Archivos adjuntos{RESET}")
    else:
        print(f"  {BOLD}● BASE DE DATOS LOCAL (SQLITE):{RESET}         {YELLOW}[ NO INICIALIZADA ]{RESET}")

    print(f"\n{CYAN}==============================================================================={RESET}")
    print(f"                             {BOLD}ACCIONES DISPONIBLES{RESET}")
    print(f"{CYAN}==============================================================================={RESET}\n")

    if srv["active"]:
        # Si el servidor ya está activo, NO mostrar opción de iniciar
        print(f"  ¿Necesitas {BOLD}DETENER{RESET} el servidor en segundo plano?  -->  Presiona {RED}[2]{RESET}")
        print(f"  ¿Necesitas {BOLD}REINICIAR{RESET} el servidor (refrescar)?     -->  Presiona {YELLOW}[3]{RESET}")
        print(f"  ¿Necesitas {BOLD}ABRIR{RESET} tu Panel Admin en Chrome?        -->  Presiona {GREEN}[4]{RESET}")
    else:
        # Si el servidor está detenido, mostrar opción de iniciar y ocultar detener/reiniciar/admin
        print(f"  ¿Necesitas {BOLD}INICIAR{RESET} el servidor en segundo plano?  -->  Presiona {CYAN}[1]{RESET}")

    print(f"  ¿Necesitas {BOLD}ABRIR{RESET} el Portal Web de tus Colegas?    -->  Presiona {GREEN}[5]{RESET}")
    print(f"  ¿Necesitas {BOLD}REFRESCAR{RESET} este panel de estado?        -->  Presiona [R]")
    print(f"  ¿Deseas {BOLD}SALIR{RESET} del Centro de Control?              -->  Presiona [0]")
    print(f"\n{CYAN}==============================================================================={RESET}")

if __name__ == "__main__":
    print_dashboard()
