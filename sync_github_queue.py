import subprocess
import json
import re
import sys
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BASE_DIR)

import database

REPO = "AquaShield-Team/Modulo-Mesa-Ayuda"

def fetch_pending_github_issues():
    try:
        cmd = ["gh", "issue", "list", "--repo", REPO, "--label", "en-espera", "--state", "open", "--json", "number,title,body,createdAt,author"]
        res = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8")
        if res.returncode != 0:
            print(f"[ERROR] No se pudieron obtener issues de GitHub: {res.stderr}")
            return []
        return json.loads(res.stdout or "[]")
    except Exception as e:
        print(f"[ERROR] Excepcion al consultar issues: {e}")
        return []

def parse_ticket_from_issue_body(body):
    # Buscar bloque json embebido en ```json ... ```
    json_match = re.search(r'```json\s*(\{.*?\})\s*```', body, re.DOTALL)
    if json_match:
        try:
            return json.loads(json_match.group(1))
        except Exception:
            pass
            
    # Parsear formato Markdown alternativo
    data = {}
    m_name = re.search(r'\*\*Solicitante:\*\*\s*(.+?)\s*\((.+?)\)', body)
    if m_name:
        data["requester_name"] = m_name.group(1).strip()
        data["requester_email"] = m_name.group(2).strip()
    m_mod = re.search(r'\*\*Módulo:\*\*\s*(.+)', body)
    if m_mod:
        data["module_name"] = m_mod.group(1).strip()
    m_tipo = re.search(r'\*\*Tipo:\*\*\s*(.+?)\s*\|', body)
    if m_tipo:
        data["type"] = m_tipo.group(1).strip().lower()
    m_prio = re.search(r'\*\*Prioridad:\*\*\s*(.+)', body)
    if m_prio:
        data["priority"] = m_prio.group(1).strip().lower()
    m_desc = re.search(r'\*\*Descripción:\*\*\s*(.+)', body, re.DOTALL)
    if m_desc:
        data["description"] = m_desc.group(1).split("```")[0].strip()
        
    return data

def sync_github_queue_to_db(author="Sistema Sincronizador"):
    issues = fetch_pending_github_issues()
    if not issues:
        print("[INFO] No hay tickets pendientes en la cola de GitHub.")
        return {"synced": 0, "tickets": []}

    print(f"[*] Encontrados {len(issues)} requerimientos en la cola de GitHub. Sincronizando...")
    synced_tickets = []

    for issue in issues:
        issue_num = issue["number"]
        body = issue.get("body", "")
        title = issue.get("title", "").replace("[COLA]", "").replace("[TICKET-COLA]", "").strip()
        
        ticket_data = parse_ticket_from_issue_body(body)
        if not ticket_data.get("title"):
            ticket_data["title"] = title

        # Campos por defecto si no vienen
        req_name = ticket_data.get("requester_name", "Usuario AquaChile")
        req_email = ticket_data.get("requester_email", "usuario@aquachile.com")
        mod_name = ticket_data.get("module_name", "AQUASHIELD HUB")
        t_type = ticket_data.get("type", "problema")
        t_prio = ticket_data.get("priority", "media")
        t_desc = ticket_data.get("description", "Requerimiento sincronizado desde GitHub Issues")
        t_phone = ticket_data.get("phone", "")

        # Crear el ticket en la base de datos local
        try:
            payload = {
                "module_name": mod_name,
                "type": t_type,
                "priority": t_prio,
                "title": ticket_data["title"],
                "description": t_desc,
                "requester_name": req_name,
                "requester_email": req_email,
                "requester_phone": t_phone
            }
            created_ticket = database.create_ticket(payload)
            
            tkt_code = created_ticket["code"]
            print(f"  [+] Ticket #{issue_num} sincronizado exitosamente con codigo {tkt_code}")

            # Notificar en la campanita
            database.add_bell_notification(
                target_role="admin",
                ticket_id=created_ticket["id"],
                ticket_code=tkt_code,
                ticket_title=created_ticket["title"],
                type="ticket_created",
                title="Nuevo Ticket desde Bandeja de Espera",
                message=f"Ticket {tkt_code} recibido desde la cola de GitHub. Solicitante: {req_name}",
                author_name="Cola GitHub"
            )

            # Cerrar el issue en GitHub con comentario
            close_cmd = [
                "gh", "issue", "close", str(issue_num),
                "--repo", REPO,
                "--comment", f"✅ Requerimiento sincronizado en Mesa de Ayuda con código **{tkt_code}**."
            ]
            subprocess.run(close_cmd, capture_output=True, text=True)

            synced_tickets.append(created_ticket)
        except Exception as e:
            print(f"  [!] Error procesando issue #{issue_num}: {e}")

    return {"synced": len(synced_tickets), "tickets": synced_tickets}

if __name__ == "__main__":
    res = sync_github_queue_to_db()
    print("Resultado de sincronizacion:", res)
