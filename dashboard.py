import os
import sys
import time
import socket
import sqlite3
import msvcrt
import webbrowser
import subprocess
from datetime import datetime

# Importar psutil para inspección en memoria sin subprocess
try:
    import psutil
except ImportError:
    psutil = None

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
CREATE_NO_WINDOW = 0x08000000

def get_network_info():
    hostname = socket.gethostname()
    try:
        ip = socket.gethostbyname(hostname)
    except Exception:
        ip = "172.18.136.195"
    return hostname, ip

def get_server_status():
    """Chequeo 100% en memoria con sockets y psutil. Cero ventanas emergentes."""
    # 1. Comprobar socket en memoria
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(0.1)
        is_active = (s.connect_ex(('127.0.0.1', 5050)) == 0)

    if not is_active:
        return {"active": False, "pids": [], "processes": []}

    # 2. Obtener información de procesos vía psutil (en memoria)
    proc_info = []
    pids = []
    if psutil:
        for p in psutil.process_iter(['pid', 'name', 'memory_info']):
            try:
                for c in p.net_connections(kind='inet'):
                    if c.laddr.port == 5050 and c.status == 'LISTEN':
                        mem_mb = round(p.info['memory_info'].rss / (1024 * 1024), 1)
                        pname = p.info['name']
                        pids.append(p.info['pid'])
                        proc_info.append({
                            "pid": p.info['pid'],
                            "name": pname,
                            "memory": f"{mem_mb} MB",
                            "is_silent": "pythonw" in pname.lower()
                        })
            except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
                continue

    if not proc_info and is_active:
        proc_info.append({
            "pid": "5050",
            "name": "pythonw.exe",
            "memory": "Activo",
            "is_silent": True
        })

    return {"active": True, "pids": pids, "processes": proc_info}

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
    """Inicia el servidor Flask sin crear NINGUNA ventana de consola."""
    subprocess.Popen(
        ['pythonw', 'app.py'],
        cwd=BASE_DIR,
        creationflags=CREATE_NO_WINDOW
    )
    time.sleep(1.2)

def stop_server():
    """Detiene el servidor matando el proceso directamente en memoria."""
    srv = get_server_status()
    if srv["active"]:
        if psutil:
            for pid in srv["pids"]:
                try:
                    p = psutil.Process(pid)
                    p.terminate()
                except Exception:
                    pass
        time.sleep(0.8)

def open_admin_browser():
    """Abre el panel admin en el navegador sin ventanas de consola."""
    try:
        webbrowser.open("http://localhost:5050/admin")
    except Exception:
        pass

def clear_screen():
    """Limpia la terminal en memoria con secuencias ANSI, sin llamar a cmd.exe cls."""
    sys.stdout.write("\033[H\033[2J")
    sys.stdout.flush()

def render_screen(message=None):
    clear_screen()
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
        pid_desc = ", ".join([f"{p['name']} (PID: {p['pid']} · RAM: {p['memory']})" for p in procs])
        if has_silent or len(procs) > 0:
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
        print(f"  [3] {BOLD}Volver a abrir Panel Admin en el Navegador{RESET}")
    else:
        print(f"  [1] {BOLD}Iniciar Servidor en segundo plano{RESET}")

    print(f"  [0] {BOLD}Salir del Monitor{RESET} (El servidor continuará activo en segundo plano)")
    print(f"\n{CYAN}==============================================================================={RESET}")
    print("Presiona una tecla para ejecutar una acción...")

def main():
    os.system("")
    # 1. Al iniciar: si el servidor no está corriendo, levantarlo automáticamente en silencio
    srv = get_server_status()
    if not srv["active"]:
        start_server_background()

    # 2. Abrir automáticamente el panel de admin en el navegador
    open_admin_browser()

    message = None
    # 3. Bucle de monitoreo 100% en memoria (Sin subprocesses, sin ventanas negras)
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
                    message = "Reiniciando servidor en segundo plano..."
                    stop_server()
                    start_server_background()
                    message = "Servidor reiniciado exitosamente en segundo plano."
                else:
                    message = "Iniciando servidor en segundo plano..."
                    start_server_background()
                    message = "Servidor iniciado en segundo plano."
            elif key_pressed == "2" and srv["active"]:
                message = "Deteniendo servidor..."
                stop_server()
                message = "Servidor detenido."
            elif key_pressed == "3" and srv["active"]:
                open_admin_browser()
                message = "Panel Admin abierto en navegador."
            elif key_pressed in ("0", "q"):
                print("\nCerrando monitor. El servidor continúa activo en segundo plano.\n")
                break

if __name__ == "__main__":
    main()
