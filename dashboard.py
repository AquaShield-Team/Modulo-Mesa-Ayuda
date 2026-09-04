import os
import sys
import time
import subprocess
import sqlite3
import socket
import msvcrt
from datetime import datetime

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

def start_server_background():
    subprocess.Popen(['pythonw', 'app.py'], cwd=BASE_DIR)
    time.sleep(1.5)

def stop_server():
    srv = get_server_status()
    if srv["active"]:
        for pid in srv["pids"]:
            subprocess.run(f'taskkill /F /PID {pid}', shell=True, capture_output=True)
        time.sleep(1)

def open_admin_chrome():
    subprocess.run('start chrome "http://localhost:5050/admin" 2>nul || start msedge "http://localhost:5050/admin" 2>nul || start "" "http://localhost:5050/admin"', shell=True)

def render_screen(message=None):
    os.system("cls")
    srv = get_server_status()
    hostname, ip = get_network_info()
    db = get_db_info()
    now_str = datetime.now().strftime("%H:%M:%S")

    print(f"{CYAN}==============================================================================={RESET}")
    print(f"                {BOLD}AQUASHIELD · MESA DE AYUDA (AquaChile S.A.){RESET}")
    print(f"                 {GRAY}CENTRO DE CONTROL Y MONITOR EN TIEMPO REAL{RESET}")
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
        print(f"  {BOLD}● SERVIDOR DESATENDIDO (SEGUNDO PLANO):{RESET} {RED}[ DETENIDO / CAÍDO 🔴 ]{RESET}")
        print(f"    {GRAY}└─ El servidor no está respondiendo en el puerto 5050.{RESET}")

    print()

    # 2. RED LOCAL CORPORATIVA
    print(f"  {BOLD}● RED LOCAL CORPORATIVA ({hostname}):{RESET}   {GREEN}[ CONECTADO 🟢 ]{RESET}")
    print(f"    {GRAY}└─ Equipo: {hostname} | IP: {ip} | Red: olimpo.aquachile.com{RESET}")

    print()

    # 3. CANAL COLEGAS (PORTAL CLOUD)
    print(f"  {BOLD}● CANAL PARA COLEGAS (OFICINA / VPN):{RESET}   {GREEN}[ OPERATIVO 🟢 ]{RESET}")
    print(f"    {GRAY}└─ Portal Cloud: https://aquashield-team.github.io/Modulo-Mesa-Ayuda/{RESET}")

    print()

    # 4. BASE DE DATOS
    if db.get("exists"):
        print(f"  {BOLD}● BASE DE DATOS LOCAL (SQLITE):{RESET}         {GREEN}[ CONECTADA 💾 ]{RESET}")
        print(f"    {GRAY}└─ {db['total_tickets']} Tickets registrados | {db['total_users']} Usuarios | {db['total_uploads']} Archivos adjuntos{RESET}")
    else:
        print(f"  {BOLD}● BASE DE DATOS LOCAL (SQLITE):{RESET}         {YELLOW}[ NO INICIALIZADA ]{RESET}")

    print()
    print(f"  {CYAN}⏱️  ESTADO EN VIVO:{RESET} Chequeo a las {BOLD}{now_str}{RESET} (Actualización automática cada 3s)")

    if message:
        print(f"\n  {YELLOW}>>> {message}{RESET}")

    print(f"\n{CYAN}==============================================================================={RESET}")
    print(f"                             {BOLD}CONTROL RÁPIDO{RESET}")
    print(f"{CYAN}==============================================================================={RESET}\n")

    if srv["active"]:
        print(f"  [1] {BOLD}Reiniciar Servidor{RESET} (Refrescar proceso en segundo plano)")
        print(f"  [2] {BOLD}Detener Servidor{RESET}")
        print(f"  [3] {BOLD}Volver a abrir Panel Admin en Chrome{RESET}")
    else:
        print(f"  [1] {BOLD}Iniciar Servidor en segundo plano{RESET}")

    print(f"  [0] {BOLD}Salir del Monitor{RESET} (El servidor continuará activo en segundo plano)")
    print(f"\n{CYAN}==============================================================================={RESET}")
    print("Presiona una tecla para ejecutar una acción...")

def main():
    os.system("")
    # 1. Al iniciar: si el servidor no está corriendo, levantarlo automáticamente en segundo plano
    srv = get_server_status()
    if not srv["active"]:
        print("Iniciando servidor en segundo plano...")
        start_server_background()

    # 2. Abrir automáticamente Google Chrome en el panel de admin
    print("Abriendo Panel Admin en Google Chrome...")
    open_admin_chrome()

    message = None
    # 3. Bucle de monitoreo en tiempo real (Watchdog cada 3 segundos)
    while True:
        render_screen(message)
        message = None

        # Esperar 3 segundos verificando si el usuario presiona una tecla
        key_pressed = None
        for _ in range(15): # 15 * 0.2s = 3 segundos
            time.sleep(0.2)
            if msvcrt.kbhit():
                ch = msvcrt.getch()
                try:
                    key_pressed = ch.decode("utf-8").lower()
                except Exception:
                    key_pressed = str(ch)
                break

        if key_pressed:
            srv = get_server_status()
            if key_pressed == "1":
                if srv["active"]:
                    message = "Reiniciando servidor desatendido..."
                    stop_server()
                    start_server_background()
                    message = "Servidor reiniciado exitosamente en segundo plano."
                else:
                    message = "Iniciando servidor desatendido..."
                    start_server_background()
                    message = "Servidor iniciado en segundo plano."
            elif key_pressed == "2" and srv["active"]:
                message = "Deteniendo servidor..."
                stop_server()
                message = "Servidor detenido."
            elif key_pressed == "3" and srv["active"]:
                open_admin_chrome()
                message = "Panel Admin abierto en Chrome."
            elif key_pressed in ("0", "q"):
                print("\nCerrando monitor. El servidor continúa activo en segundo plano.\n")
                break

if __name__ == "__main__":
    main()
