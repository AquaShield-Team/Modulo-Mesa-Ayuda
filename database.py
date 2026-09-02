import sqlite3
import os
import re
from datetime import datetime, timezone
from werkzeug.security import generate_password_hash, check_password_hash

DB_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")
DB_PATH = os.path.join(DB_DIR, "helpdesk.db")

os.makedirs(DB_DIR, exist_ok=True)

DEFAULT_MODULES = [
    ("Módulo Congelado", "Gestión, empaque y trazabilidad de producto congelado"),
    ("Módulo Fresco", "Procesamiento y exportación de salmón fresco"),
    ("Módulo Proformas", "Generación, validación y control de facturas proforma"),
    ("Módulo Seguros", "Emisión automática de pólizas y certificados de seguros marítimos/aéreos"),
    ("Módulo ExportDesk", "Monitoreo y gestión de despachos de exportación"),
    ("Agente SAP", "Automatización e integración de pedidos y facturas en SAP"),
    ("Agente Correos", "Clasificación inteligente y extracción de correos operacionales"),
    ("Módulo Termógrafo", "Lectura y análisis de registros térmicos y temperaturas de transporte"),
    ("Módulo Validador HC", "Validación y verificación de certificados sanitarios (HC)"),
    ("Módulo Invoice Converter", "Conversión y estandarización de invoices y packing lists"),
    ("Módulo ISF", "Presentación y seguimiento de declaraciones ISF ante aduanas"),
    ("Módulo IVV", "Inspecciones y validaciones visuales"),
    ("Módulo Carga Neppex", "Integración y subida de planillas al sistema Neppex"),
    ("Módulo LabelInspect", "Inspección y auditoría de etiquetas y rotulaciones de cajas"),
    ("Módulo Cowork Revisión", "Plataforma de revisión colaborativa y control de calidad"),
    ("AQUASHIELD HUB", "Plataforma central y portal unificado AquaShield"),
    ("Infraestructura / Conectividad", "Redes, accesos, servidores y servicios generales"),
    ("Otro / General", "Otras solicitudes o requerimientos no catalogados")
]

def get_local_now_str():
    """Retorna la fecha y hora local actual de Chile/servidor en formato YYYY-MM-DD HH:MM:SS."""
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")

from contextlib import contextmanager

@contextmanager
def get_db():
    conn = sqlite3.connect(DB_PATH, timeout=30.0)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    conn.execute("PRAGMA journal_mode = WAL")
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

def init_db():
    with get_db() as conn:
        cursor = conn.cursor()
        
        # 1. Tabla de Usuarios
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                phone TEXT DEFAULT '',
                department TEXT DEFAULT '',
                role TEXT NOT NULL DEFAULT 'usuario' CHECK(role IN ('usuario', 'admin')),
                created_at TIMESTAMP DEFAULT (datetime('now', 'localtime')),
                last_login TIMESTAMP
            )
        """)

        # 2. Tabla de Módulos
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS modules (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE NOT NULL,
                description TEXT DEFAULT '',
                is_active INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT (datetime('now', 'localtime'))
            )
        """)
        
        # 3. Tabla de Tickets
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS tickets (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                code TEXT UNIQUE NOT NULL,
                user_id INTEGER,
                requester_name TEXT NOT NULL,
                requester_email TEXT NOT NULL,
                requester_phone TEXT DEFAULT '',
                module_id INTEGER,
                module_name TEXT NOT NULL,
                type TEXT NOT NULL CHECK(type IN ('problema', 'mejora', 'consulta', 'otro')),
                priority TEXT NOT NULL CHECK(priority IN ('baja', 'media', 'alta', 'critica')),
                title TEXT NOT NULL,
                description TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'abierto' CHECK(status IN ('abierto', 'en_analisis', 'en_desarrollo', 'resuelto', 'descartado')),
                resolution_notes TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT (datetime('now', 'localtime')),
                updated_at TIMESTAMP DEFAULT (datetime('now', 'localtime')),
                closed_at TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
                FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE SET NULL
            )
        """)
        
        # 4. Tabla de Archivos Adjuntos
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS attachments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                ticket_id INTEGER NOT NULL,
                original_name TEXT NOT NULL,
                stored_name TEXT NOT NULL,
                file_size INTEGER NOT NULL,
                mime_type TEXT DEFAULT '',
                file_path TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT (datetime('now', 'localtime')),
                FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
            )
        """)
        
        # 5. Tabla de Logs / Historial
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS ticket_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                ticket_id INTEGER NOT NULL,
                action TEXT NOT NULL,
                details TEXT DEFAULT '',
                author TEXT DEFAULT 'Sistema',
                created_at TIMESTAMP DEFAULT (datetime('now', 'localtime')),
                FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
            )
        """)

        # 6. Tabla de Comentarios / Chat Bidireccional
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS ticket_comments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                ticket_id INTEGER NOT NULL,
                author_name TEXT NOT NULL,
                author_email TEXT NOT NULL,
                author_role TEXT NOT NULL DEFAULT 'usuario',
                message TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT (datetime('now', 'localtime')),
                FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
            )
        """)

        # 7. Tabla de Configuraciones del Sistema (Settings)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL,
                updated_at TIMESTAMP DEFAULT (datetime('now', 'localtime'))
            )
        """)

        # 8. Tabla de Notificaciones de la Campanita (Historial Persistente por Ticket)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS bell_notifications (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                target_role TEXT NOT NULL DEFAULT 'all',
                target_user_id INTEGER,
                target_email TEXT DEFAULT '',
                ticket_id INTEGER NOT NULL,
                ticket_code TEXT NOT NULL,
                ticket_title TEXT NOT NULL,
                type TEXT NOT NULL DEFAULT 'status_change',
                title TEXT NOT NULL,
                message TEXT NOT NULL,
                author_name TEXT DEFAULT '',
                is_read INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT (datetime('now', 'localtime')),
                FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
            )
        """)

        # 9. Tabla de Registro de Tiempos y Esfuerzo (Time Tracking)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS ticket_time_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                ticket_id INTEGER NOT NULL,
                author TEXT NOT NULL,
                minutes INTEGER NOT NULL,
                description TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT (datetime('now', 'localtime')),
                FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
            )
        """)

        # ── Índices para Acelerar Búsquedas y Consultas Frecuentes ─────────
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON tickets(user_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets(created_at)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_tickets_code ON tickets(code)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_comments_ticket_id ON ticket_comments(ticket_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_logs_ticket_id ON ticket_logs(ticket_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_attachments_ticket_id ON attachments(ticket_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_bell_notif_target ON bell_notifications(target_role, target_user_id, is_read)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_time_logs_ticket_id ON ticket_time_logs(ticket_id)")

        # Auto-corrección de zona horaria local para registros previos almacenados en UTC
        now_local = datetime.now()
        now_utc = datetime.now(timezone.utc).replace(tzinfo=None)
        diff_hours = int(round((now_utc - now_local).total_seconds() / 3600))
        if diff_hours > 0:
            tables_cols = [
                ("bell_notifications", ["created_at"]),
                ("ticket_comments", ["created_at"]),
                ("tickets", ["created_at", "updated_at", "closed_at", "first_response_at"]),
                ("ticket_logs", ["created_at"]),
                ("ticket_time_logs", ["created_at"]),
                ("users", ["created_at", "last_login"]),
                ("settings", ["updated_at"])
            ]
            for table, cols in tables_cols:
                for col in cols:
                    cursor.execute(f"""
                        UPDATE {table} 
                        SET {col} = datetime({col}, '-{diff_hours} hours') 
                        WHERE {col} IS NOT NULL AND {col} > datetime('now', 'localtime', '+1 minute')
                    """)

        # Auto-migraciones de columnas en tickets
        cursor.execute("PRAGMA table_info(tickets)")
        columns = [row[1] for row in cursor.fetchall()]
        if "user_id" not in columns:
            cursor.execute("ALTER TABLE tickets ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE SET NULL")
        if "first_response_at" not in columns:
            cursor.execute("ALTER TABLE tickets ADD COLUMN first_response_at TIMESTAMP")
        if "closed_at" not in columns:
            cursor.execute("ALTER TABLE tickets ADD COLUMN closed_at TIMESTAMP")
        if "rating" not in columns:
            cursor.execute("ALTER TABLE tickets ADD COLUMN rating INTEGER")
        if "feedback_comment" not in columns:
            cursor.execute("ALTER TABLE tickets ADD COLUMN feedback_comment TEXT DEFAULT ''")
        if "is_pinned" not in columns:
            cursor.execute("ALTER TABLE tickets ADD COLUMN is_pinned INTEGER DEFAULT 0")
        if "tags" not in columns:
            cursor.execute("ALTER TABLE tickets ADD COLUMN tags TEXT DEFAULT ''")
        if "assigned_to" not in columns:
            cursor.execute("ALTER TABLE tickets ADD COLUMN assigned_to TEXT DEFAULT ''")
        if "time_spent_minutes" not in columns:
            cursor.execute("ALTER TABLE tickets ADD COLUMN time_spent_minutes INTEGER DEFAULT 0")

        # Auto-migraciones de columnas en ticket_comments
        cursor.execute("PRAGMA table_info(ticket_comments)")
        comm_columns = [row[1] for row in cursor.fetchall()]
        if "is_read_admin" not in comm_columns:
            cursor.execute("ALTER TABLE ticket_comments ADD COLUMN is_read_admin INTEGER DEFAULT 1")
        if "is_read_user" not in comm_columns:
            cursor.execute("ALTER TABLE ticket_comments ADD COLUMN is_read_user INTEGER DEFAULT 1")
        if "image_url" not in comm_columns:
            cursor.execute("ALTER TABLE ticket_comments ADD COLUMN image_url TEXT DEFAULT ''")

        # Crear usuario Administrador por defecto si no existe
        cursor.execute("SELECT id FROM users WHERE email = 'admin@aquachile.com'")
        if not cursor.fetchone():
            default_pwd = generate_password_hash("admin123")
            cursor.execute("""
                INSERT INTO users (name, email, password_hash, department, role)
                VALUES ('Administrador AquaShield', 'admin@aquachile.com', ?, 'Tecnología & Soporte', 'admin')
            """, (default_pwd,))

        # Garantizar que marcelo.ramirez tenga rol de admin
        cursor.execute("UPDATE users SET role = 'admin' WHERE email = 'marcelo.ramirez@aquachile.com'")

        # Precargar módulos si está vacía
        cursor.execute("SELECT COUNT(*) FROM modules")
        count = cursor.fetchone()[0]
        if count == 0:
            for name, desc in DEFAULT_MODULES:
                cursor.execute("INSERT OR IGNORE INTO modules (name, description) VALUES (?, ?)", (name, desc))

        # Precargar configuraciones de correo por defecto si no existen
        default_settings = [
            ("email_mode", "smtp"),
            ("email_sender_name", "Mesa de Ayuda AquaShield"),
            ("email_sender_address", "MyAquashield@gmail.com"),
            ("smtp_server", "smtp.gmail.com"),
            ("smtp_port", "587"),
            ("smtp_user", "MyAquashield@gmail.com"),
            ("smtp_password", "utqd fltv ybtk wbfi"),
            ("smtp_tls", "1"),
            ("admin_alert_email", "marcelo.ramirez@aquachile.com, MyAquashield@gmail.com")
        ]
        for key, val in default_settings:
            cursor.execute("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)", (key, val))
                
        conn.commit()

# ── CONFIGURACIONES GLOBALES (SETTINGS) ────────────────────────────────────

def get_all_settings():
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT key, value FROM settings")
        res = {}
        for row in cursor.fetchall():
            res[row["key"]] = row["value"]
        return res

def get_setting(key, default=None):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT value FROM settings WHERE key = ?", (key,))
        row = cursor.fetchone()
        return row["value"] if row else default

def set_setting(key, value):
    now_str = get_local_now_str()
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?)
            ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
        """, (key, str(value), now_str))
        conn.commit()

def update_settings(data):
    now_str = get_local_now_str()
    with get_db() as conn:
        cursor = conn.cursor()
        for key, val in data.items():
            if val is not None:
                cursor.execute("""
                    INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?)
                    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
                """, (key, str(val).strip(), now_str))
        conn.commit()
    return get_all_settings()

# ── AUTENTICACIÓN Y GESTIÓN DE USUARIOS ─────────────────────────────────────

def register_user(name, email, password, phone="", department="", role="usuario"):
    name = name.strip()
    email = email.strip().lower()
    phone = phone.strip()
    department = department.strip()
    now_str = get_local_now_str()
    
    if not name or not email or not password:
        raise ValueError("Nombre, correo y contraseña son obligatorios")
        
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM users WHERE LOWER(email) = LOWER(?)", (email,))
        if cursor.fetchone():
            raise ValueError("Ya existe una cuenta registrada con este correo electrónico")
            
        pwd_hash = generate_password_hash(password)
        cursor.execute("""
            INSERT INTO users (name, email, password_hash, phone, department, role, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (name, email, pwd_hash, phone, department, role, now_str))
        conn.commit()
        
        user_id = cursor.lastrowid
        return get_user_by_id(user_id)

def authenticate_user(email, password):
    email = email.strip().lower()
    now_str = get_local_now_str()
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE LOWER(email) = LOWER(?)", (email,))
        row = cursor.fetchone()
        if not row:
            return None
            
        user = dict(row)
        if not check_password_hash(user["password_hash"], password):
            return None
            
        # Actualizar último login con hora local
        cursor.execute("UPDATE users SET last_login = ? WHERE id = ?", (now_str, user["id"]))
        conn.commit()
        
        user.pop("password_hash", None)
        return user

def get_user_by_id(user_id):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
        row = cursor.fetchone()
        if not row:
            return None
        user = dict(row)
        user.pop("password_hash", None)
        return user

def get_user_by_email(email):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE LOWER(email) = LOWER(?)", (email.strip().lower(),))
        row = cursor.fetchone()
        if not row:
            return None
        user = dict(row)
        user.pop("password_hash", None)
        return user

def update_user_profile(user_id, data):
    with get_db() as conn:
        cursor = conn.cursor()
        fields = []
        params = []
        for key in ["name", "phone", "department"]:
            if key in data and data[key] is not None:
                fields.append(f"{key} = ?")
                params.append(data[key].strip())
        
        if "password" in data and data["password"].strip():
            fields.append("password_hash = ?")
            params.append(generate_password_hash(data["password"].strip()))
            
        if fields:
            params.append(user_id)
            cursor.execute(f"UPDATE users SET {', '.join(fields)} WHERE id = ?", params)
            conn.commit()
            
        return get_user_by_id(user_id)

def get_all_users(search=None):
    with get_db() as conn:
        cursor = conn.cursor()
        query = """
            SELECT u.id, u.name, u.email, u.phone, u.department, u.role, u.created_at, u.last_login,
                   (SELECT COUNT(*) FROM tickets WHERE user_id = u.id OR LOWER(requester_email) = LOWER(u.email)) as tickets_count
            FROM users u
            WHERE 1=1
        """
        params = []
        if search and search.strip():
            s = f"%{search.strip().lower()}%"
            query += " AND (LOWER(u.name) LIKE ? OR LOWER(u.email) LIKE ? OR LOWER(u.department) LIKE ?)"
            params.extend([s, s, s])
            
        query += " ORDER BY u.id ASC"
        cursor.execute(query, params)
        return [dict(row) for row in cursor.fetchall()]

def admin_reset_user_password(user_id, new_password):
    new_password = new_password.strip()
    if not new_password:
        raise ValueError("La nueva contraseña no puede estar vacía")
    with get_db() as conn:
        cursor = conn.cursor()
        pwd_hash = generate_password_hash(new_password)
        cursor.execute("UPDATE users SET password_hash = ? WHERE id = ?", (pwd_hash, user_id))
        conn.commit()
        return get_user_by_id(user_id)

def admin_update_user(user_id, data):
    with get_db() as conn:
        cursor = conn.cursor()
        fields = []
        params = []
        for key in ["name", "email", "phone", "department", "role"]:
            if key in data and data[key] is not None:
                fields.append(f"{key} = ?")
                params.append(str(data[key]).strip())
                
        if "password" in data and data["password"] and str(data["password"]).strip():
            fields.append("password_hash = ?")
            params.append(generate_password_hash(str(data["password"]).strip()))
            
        if fields:
            params.append(user_id)
            cursor.execute(f"UPDATE users SET {', '.join(fields)} WHERE id = ?", params)
            conn.commit()
            
        return get_user_by_id(user_id)

def admin_delete_user(user_id):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
        user = cursor.fetchone()
        if not user:
            raise ValueError("Usuario no encontrado")
            
        # Desvincular tickets (poner user_id en null para preservar trazabilidad)
        cursor.execute("UPDATE tickets SET user_id = NULL WHERE user_id = ?", (user_id,))
        # Eliminar registro de usuario
        cursor.execute("DELETE FROM users WHERE id = ?", (user_id,))
        conn.commit()
        return {
            "success": True,
            "message": f"Cuenta de '{user['name']}' ({user['email']}) eliminada exitosamente."
        }

# ── TICKETS & MÓDULOS ───────────────────────────────────────────────────────

def generate_ticket_code(conn):
    year = datetime.now().strftime("%Y")
    cursor = conn.cursor()
    cursor.execute("SELECT code FROM tickets WHERE code LIKE ? ORDER BY id DESC LIMIT 1", (f"TKT-{year}-%",))
    row = cursor.fetchone()
    if row:
        last_code = row[0]
        match = re.search(r"TKT-\d{4}-(\d+)", last_code)
        if match:
            next_num = int(match.group(1)) + 1
        else:
            next_num = 1
    else:
        next_num = 1
    return f"TKT-{year}-{next_num:04d}"

def get_modules(active_only=True):
    with get_db() as conn:
        cursor = conn.cursor()
        if active_only:
            cursor.execute("SELECT * FROM modules WHERE is_active = 1 ORDER BY name ASC")
        else:
            cursor.execute("SELECT * FROM modules ORDER BY name ASC")
        return [dict(row) for row in cursor.fetchall()]

def create_module(name, description=""):
    name = name.strip()
    if not name:
        raise ValueError("El nombre del módulo no puede estar vacío")
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM modules WHERE LOWER(name) = LOWER(?)", (name,))
        existing = cursor.fetchone()
        if existing:
            if not existing["is_active"]:
                cursor.execute("UPDATE modules SET is_active = 1, description = ? WHERE id = ?", (description or existing["description"], existing["id"]))
                conn.commit()
            return dict(existing)
        
        cursor.execute("INSERT INTO modules (name, description) VALUES (?, ?)", (name, description.strip()))
        conn.commit()
        module_id = cursor.lastrowid
        cursor.execute("SELECT * FROM modules WHERE id = ?", (module_id,))
        return dict(cursor.fetchone())

def delete_module(module_id):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM modules WHERE id = ?", (module_id,))
        module = cursor.fetchone()
        if not module:
            raise ValueError("Módulo no encontrado")
            
        cursor.execute("SELECT COUNT(*) FROM tickets WHERE module_id = ?", (module_id,))
        ticket_count = cursor.fetchone()[0]
        
        if ticket_count > 0:
            cursor.execute("UPDATE modules SET is_active = 0 WHERE id = ?", (module_id,))
            conn.commit()
            return {
                "success": True,
                "deleted": False,
                "deactivated": True,
                "message": f"El módulo '{module['name']}' fue descartado/desactivado (se preservan {ticket_count} tickets históricos vinculados)."
            }
        else:
            cursor.execute("DELETE FROM modules WHERE id = ?", (module_id,))
            conn.commit()
            return {
                "success": True,
                "deleted": True,
                "deactivated": False,
                "message": f"El módulo '{module['name']}' fue eliminado exitosamente."
            }

def create_ticket(data, attachments_list=None):
    with get_db() as conn:
        cursor = conn.cursor()
        code = generate_ticket_code(conn)
        
        module_id = data.get("module_id")
        module_name = data.get("module_name", "").strip()
        user_id = data.get("user_id")
        
        if not module_id and module_name:
            cursor.execute("SELECT id FROM modules WHERE LOWER(name) = LOWER(?)", (module_name,))
            m_row = cursor.fetchone()
            if m_row:
                module_id = m_row["id"]
            else:
                cursor.execute("INSERT INTO modules (name, description) VALUES (?, 'Módulo agregado por usuario')", (module_name,))
                module_id = cursor.lastrowid
        elif module_id and not module_name:
            cursor.execute("SELECT name FROM modules WHERE id = ?", (module_id,))
            m_row = cursor.fetchone()
            if m_row:
                module_name = m_row["name"]
            else:
                module_name = "Módulo General"

        now_str = get_local_now_str()
        cursor.execute("""
            INSERT INTO tickets (
                code, user_id, requester_name, requester_email, requester_phone,
                module_id, module_name, type, priority, title, description, status,
                created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'abierto', ?, ?)
        """, (
            code,
            user_id,
            data.get("requester_name", "").strip(),
            data.get("requester_email", "").strip(),
            data.get("requester_phone", "").strip(),
            module_id,
            module_name,
            data.get("type", "problema"),
            data.get("priority", "media"),
            data.get("title", "").strip(),
            data.get("description", "").strip(),
            now_str,
            now_str
        ))
        
        ticket_id = cursor.lastrowid
        
        if attachments_list:
            for att in attachments_list:
                cursor.execute("""
                    INSERT INTO attachments (
                        ticket_id, original_name, stored_name, file_size, mime_type, file_path, created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?)
                """, (
                    ticket_id,
                    att["original_name"],
                    att["stored_name"],
                    att["file_size"],
                    att.get("mime_type", ""),
                    att["file_path"],
                    now_str
                ))
        
        cursor.execute("""
            INSERT INTO ticket_logs (ticket_id, action, details, author, created_at)
            VALUES (?, 'Creación de Ticket', 'Ticket registrado exitosamente en Mesa de Ayuda', ?, ?)
        """, (ticket_id, data.get("requester_name", "Usuario"), now_str))
        
        # Notificación en la campanita para el Administrador
        add_bell_notification(
            target_role="admin",
            ticket_id=ticket_id,
            ticket_code=code,
            ticket_title=data.get("title", "").strip(),
            type="ticket_created",
            title="Nuevo Ticket Registrado",
            message=f"{data.get('requester_name', 'Usuario')} creó solicitud en {module_name}: '{data.get('title', '')}'",
            author_name=data.get("requester_name", "Usuario"),
            conn=conn
        )

        conn.commit()
        
        return get_ticket_by_id_or_code(code)

def get_tickets(status=None, module_id=None, ticket_type=None, priority=None, search=None, user_id=None, date_from=None, date_to=None, tag=None, assigned_to=None, limit=100, offset=0):
    with get_db() as conn:
        cursor = conn.cursor()
        query = """
            SELECT t.*, 
                   (SELECT COUNT(*) FROM attachments WHERE ticket_id = t.id) as attachments_count,
                   (SELECT COUNT(*) FROM ticket_comments WHERE ticket_id = t.id) as comments_count
            FROM tickets t
            WHERE 1=1
        """
        params = []
        
        if user_id:
            query += " AND t.user_id = ?"
            params.append(int(user_id))

        if status and status != "todos":
            query += " AND t.status = ?"
            params.append(status)
            
        if module_id and module_id != "todos":
            query += " AND t.module_id = ?"
            params.append(int(module_id))
            
        if ticket_type and ticket_type != "todos":
            query += " AND t.type = ?"
            params.append(ticket_type)
            
        if priority and priority != "todos":
            query += " AND t.priority = ?"
            params.append(priority)

        if assigned_to and assigned_to != "todos":
            if assigned_to == "sin_asignar":
                query += " AND (t.assigned_to IS NULL OR t.assigned_to = '')"
            else:
                query += " AND t.assigned_to = ?"
                params.append(assigned_to)
            
        if date_from and date_from.strip():
            query += " AND date(t.created_at) >= date(?)"
            params.append(date_from.strip())

        if date_to and date_to.strip():
            query += " AND date(t.created_at) <= date(?)"
            params.append(date_to.strip())

        if tag and tag.strip():
            query += " AND t.tags LIKE ?"
            params.append(f"%{tag.strip()}%")

        if search and search.strip():
            s = f"%{search.strip()}%"
            query += " AND (t.code LIKE ? OR t.title LIKE ? OR t.requester_name LIKE ? OR t.requester_email LIKE ? OR t.description LIKE ? OR t.tags LIKE ? OR t.assigned_to LIKE ?)"
            params.extend([s, s, s, s, s, s, s])
            
        query += " ORDER BY t.is_pinned DESC, t.id DESC LIMIT ? OFFSET ?"
        params.extend([limit, offset])
        
        cursor.execute(query, params)
        return [dict(row) for row in cursor.fetchall()]

def toggle_pin_ticket(ticket_id):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT is_pinned FROM tickets WHERE id = ?", (ticket_id,))
        row = cursor.fetchone()
        if not row:
            raise ValueError("Ticket no encontrado")
        new_pinned = 0 if row["is_pinned"] else 1
        cursor.execute("UPDATE tickets SET is_pinned = ? WHERE id = ?", (new_pinned, ticket_id))
        conn.commit()
        return {"success": True, "ticket_id": ticket_id, "is_pinned": new_pinned}

def update_ticket_tags(ticket_id, tags):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("UPDATE tickets SET tags = ? WHERE id = ?", (str(tags).strip(), ticket_id))
        conn.commit()
        return get_ticket_by_id_or_code(ticket_id)

def get_ticket_by_id_or_code(identifier):
    with get_db() as conn:
        cursor = conn.cursor()
        if str(identifier).isdigit():
            cursor.execute("SELECT * FROM tickets WHERE id = ?", (int(identifier),))
        else:
            cursor.execute("SELECT * FROM tickets WHERE UPPER(code) = UPPER(?)", (str(identifier).strip(),))
            
        row = cursor.fetchone()
        if not row:
            return None
            
        ticket = dict(row)
        
        cursor.execute("SELECT * FROM attachments WHERE ticket_id = ?", (ticket["id"],))
        ticket["attachments"] = [dict(att) for att in cursor.fetchall()]
        
        cursor.execute("SELECT * FROM ticket_logs WHERE ticket_id = ? ORDER BY id ASC", (ticket["id"],))
        ticket["logs"] = [dict(log) for log in cursor.fetchall()]

        cursor.execute("SELECT * FROM ticket_comments WHERE ticket_id = ? ORDER BY id ASC", (ticket["id"],))
        ticket["comments"] = [dict(c) for c in cursor.fetchall()]

        cursor.execute("SELECT * FROM ticket_time_logs WHERE ticket_id = ? ORDER BY id DESC", (ticket["id"],))
        ticket["time_logs"] = [dict(t) for t in cursor.fetchall()]
        
        return ticket

def add_time_entry(ticket_id, author, minutes, description=""):
    try:
        minutes = int(minutes)
        if minutes <= 0:
            raise ValueError("Los minutos deben ser mayores a 0")
    except (ValueError, TypeError):
        raise ValueError("Minutos inválidos")

    now_str = get_local_now_str()
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO ticket_time_logs (ticket_id, author, minutes, description, created_at)
            VALUES (?, ?, ?, ?, ?)
        """, (int(ticket_id), author.strip(), minutes, description.strip(), now_str))

        # Actualizar total de minutos en ticket
        cursor.execute("""
            UPDATE tickets 
            SET time_spent_minutes = (SELECT COALESCE(SUM(minutes), 0) FROM ticket_time_logs WHERE ticket_id = ?)
            WHERE id = ?
        """, (int(ticket_id), int(ticket_id)))

        cursor.execute("""
            INSERT INTO ticket_logs (ticket_id, action, details, author, created_at)
            VALUES (?, 'Registro de Tiempo Dedicado', ?, ?, ?)
        """, (int(ticket_id), f"{minutes} min registrados por {author}. Detalle: '{description.strip()}'", author, now_str))

        conn.commit()
        return get_ticket_by_id_or_code(ticket_id)

def update_ticket(ticket_id, updates, author="Administrador"):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM tickets WHERE id = ?", (ticket_id,))
        current = cursor.fetchone()
        if not current:
            return None
            
        fields = []
        params = []
        log_changes = []
        now_str = get_local_now_str()
        
        for key in ["status", "priority", "resolution_notes", "assigned_to"]:
            if key in updates and updates[key] is not None:
                new_val = str(updates[key]).strip()
                old_val = str(current[key] or "").strip()
                if new_val != old_val:
                    fields.append(f"{key} = ?")
                    params.append(new_val)
                    label = "Responsable" if key == "assigned_to" else key.capitalize()
                    log_changes.append(f"{label}: '{old_val or 'Ninguno'}' → '{new_val or 'Ninguno'}'")
                    
        if "status" in updates:
            if updates["status"] in ("resuelto", "descartado"):
                fields.append("closed_at = ?")
                params.append(now_str)
            elif updates["status"] in ("abierto", "en_analisis", "en_desarrollo"):
                fields.append("closed_at = NULL")
                
            # Si el ticket cambia por primera vez a análisis o desarrollo, marcar first_response_at si está vacío
            if updates["status"] in ("en_analisis", "en_desarrollo", "resuelto") and not current["first_response_at"]:
                fields.append("first_response_at = ?")
                params.append(now_str)
            
        fields.append("updated_at = ?")
        params.append(now_str)
        
        if fields:
            query = f"UPDATE tickets SET {', '.join(fields)} WHERE id = ?"
            params.append(ticket_id)
            cursor.execute(query, params)
            
            if log_changes:
                cursor.execute("""
                    INSERT INTO ticket_logs (ticket_id, action, details, author, created_at)
                    VALUES (?, 'Actualización de Estado / Notas', ?, ?, ?)
                """, (ticket_id, " | ".join(log_changes), author, now_str))
                
            # Notificación en la campanita para el Usuario si cambió el estado o notas
            if "status" in updates and updates["status"] != current["status"]:
                status_labels = {
                    "abierto": "Abierto / En Cola",
                    "en_analisis": "En Análisis",
                    "en_desarrollo": "En Desarrollo",
                    "resuelto": "Resuelto",
                    "descartado": "Descartado"
                }
                st_label = status_labels.get(updates["status"], updates["status"])
                notes_info = updates.get("resolution_notes") or current["resolution_notes"] or ""
                msg = f"Tu ticket {current['code']} cambió a '{st_label}'."
                if notes_info.strip():
                    msg += f" Comentario de soporte: '{notes_info.strip()}'"
                
                add_bell_notification(
                    target_role="usuario",
                    target_email=current["requester_email"],
                    target_user_id=current["user_id"],
                    ticket_id=ticket_id,
                    ticket_code=current["code"],
                    ticket_title=current["title"],
                    type="status_change",
                    title=f"Estado: {st_label}",
                    message=msg,
                    author_name=author,
                    conn=conn
                )
                
            conn.commit()
            
        return get_ticket_by_id_or_code(ticket_id)

def add_attachment(ticket_id, original_name, stored_name, file_size, mime_type, file_path):
    now_str = get_local_now_str()
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO attachments (
                ticket_id, original_name, stored_name, file_size, mime_type, file_path, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (int(ticket_id), original_name, stored_name, int(file_size), mime_type, file_path, now_str))
        conn.commit()
        att_id = cursor.lastrowid
        cursor.execute("SELECT * FROM attachments WHERE id = ?", (att_id,))
        return dict(cursor.fetchone())

# ── COMENTARIOS Y CHAT BIDIRECCIONAL ───────────────────────────────────────

def add_ticket_comment(ticket_id, author_name, author_email, author_role, message, image_url=""):
    message = (message or "").strip()
    image_url = (image_url or "").strip()
    if not message and not image_url:
        raise ValueError("El mensaje o la imagen no pueden estar vacíos")
        
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM tickets WHERE id = ?", (ticket_id,))
        ticket = cursor.fetchone()
        if not ticket:
            raise ValueError("Ticket no encontrado")
            
        is_read_admin = 1 if author_role == "admin" else 0
        is_read_user = 0 if author_role == "admin" else 1
        now_str = get_local_now_str()

        cursor.execute("""
            INSERT INTO ticket_comments (ticket_id, author_name, author_email, author_role, message, image_url, is_read_admin, is_read_user, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (ticket_id, author_name.strip(), author_email.strip(), author_role.strip(), message, image_url, is_read_admin, is_read_user, now_str))
        comment_id = cursor.lastrowid

        # Si el admin responde por primera vez, registrar first_response_at
        if author_role == "admin" and not ticket["first_response_at"]:
            cursor.execute("UPDATE tickets SET first_response_at = ? WHERE id = ?", (now_str, ticket_id))

        log_details = f"Mensaje enviado por {author_name} ({author_role})"
        if image_url:
            log_details += " con captura/imagen adjunta"
        cursor.execute("""
            INSERT INTO ticket_logs (ticket_id, action, details, author, created_at)
            VALUES (?, 'Mensaje en Hilo de Conversación', ?, ?, ?)
        """, (ticket_id, log_details, author_name, now_str))

        # Notificación para la campanita
        bell_msg = message if message else "📷 Captura de pantalla"
        if author_role == "usuario":
            add_bell_notification(
                target_role="admin",
                ticket_id=ticket_id,
                ticket_code=ticket["code"],
                ticket_title=ticket["title"],
                type="new_comment",
                title=f"Mensaje de {author_name}",
                message=bell_msg,
                author_name=author_name,
                conn=conn
            )
        else:
            add_bell_notification(
                target_role="usuario",
                target_email=ticket["requester_email"],
                target_user_id=ticket["user_id"],
                ticket_id=ticket_id,
                ticket_code=ticket["code"],
                ticket_title=ticket["title"],
                type="new_comment",
                title="Respuesta de Soporte",
                message=f"Soporte: {bell_msg}",
                author_name=author_name,
                conn=conn
            )

        conn.commit()

        cursor.execute("SELECT * FROM ticket_comments WHERE id = ?", (comment_id,))
        return dict(cursor.fetchone())

def get_ticket_comments(ticket_id, mark_read_for=None):
    with get_db() as conn:
        cursor = conn.cursor()
        if mark_read_for == "admin":
            cursor.execute("UPDATE ticket_comments SET is_read_admin = 1 WHERE ticket_id = ?", (ticket_id,))
            conn.commit()
        elif mark_read_for == "usuario":
            cursor.execute("UPDATE ticket_comments SET is_read_user = 1 WHERE ticket_id = ?", (ticket_id,))
            conn.commit()

        cursor.execute("SELECT * FROM ticket_comments WHERE ticket_id = ? ORDER BY id ASC", (ticket_id,))
        return [dict(row) for row in cursor.fetchall()]

# ── GESTIÓN DE NOTIFICACIONES DE LA CAMPANITA (HISTORIAL POR TICKET) ────────

def add_bell_notification(target_role, ticket_id, ticket_code, ticket_title, type, title, message, author_name="", target_email="", target_user_id=None, conn=None):
    now_str = get_local_now_str()
    def _do_insert(db_conn):
        c = db_conn.cursor()
        c.execute("""
            INSERT INTO bell_notifications (
                target_role, target_user_id, target_email,
                ticket_id, ticket_code, ticket_title,
                type, title, message, author_name, is_read, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
        """, (
            target_role,
            target_user_id,
            target_email.strip() if target_email else "",
            int(ticket_id),
            str(ticket_code),
            str(ticket_title),
            type,
            title,
            message,
            author_name,
            now_str
        ))
        return c.lastrowid

    try:
        if conn is not None:
            return _do_insert(conn)
        else:
            with get_db() as local_conn:
                row_id = _do_insert(local_conn)
                local_conn.commit()
                return row_id
    except Exception as e:
        print(f"Error registrando bell notification: {e}")
        return None

def get_bell_notifications(role="admin", user_email=None, user_id=None):
    with get_db() as conn:
        cursor = conn.cursor()
        if role == "admin":
            cursor.execute("""
                SELECT * FROM bell_notifications
                WHERE target_role IN ('admin', 'all')
                ORDER BY id DESC
                LIMIT 100
            """)
        else:
            query = """
                SELECT * FROM bell_notifications
                WHERE target_role IN ('usuario', 'all')
            """
            params = []
            if user_id:
                query += " AND (target_user_id = ? OR target_email = (SELECT email FROM users WHERE id = ?))"
                params.extend([int(user_id), int(user_id)])
            elif user_email:
                email_clean = user_email.strip()
                query += " AND (target_email = ? OR target_email LIKE ?)"
                params.extend([email_clean, f"%{email_clean}%"])
            else:
                return {"ticket_groups": [], "total_count": 0, "unread_count": 0}

            query += " ORDER BY id DESC LIMIT 100"
            cursor.execute(query, params)

        rows = [dict(r) for r in cursor.fetchall()]

        # Agrupar / consolidar por Ticket
        groups_map = {}
        for r in rows:
            tid = r["ticket_id"]
            if tid not in groups_map:
                groups_map[tid] = {
                    "ticket_id": tid,
                    "ticket_code": r["ticket_code"],
                    "ticket_title": r["ticket_title"],
                    "unread_count": 0,
                    "latest_time": r["created_at"],
                    "notifications": []
                }
            if not r["is_read"]:
                groups_map[tid]["unread_count"] += 1
            groups_map[tid]["notifications"].append(r)

        ticket_groups = list(groups_map.values())
        total_unread = sum(1 for r in rows if not r["is_read"])

        return {
            "ticket_groups": ticket_groups,
            "total_count": len(rows),
            "unread_count": total_unread
        }

def mark_bell_notification_read(notification_id=None, ticket_id=None, role="admin", user_email=None, user_id=None):
    with get_db() as conn:
        cursor = conn.cursor()
        if notification_id:
            cursor.execute("UPDATE bell_notifications SET is_read = 1 WHERE id = ?", (int(notification_id),))
        elif ticket_id:
            if role == "admin":
                cursor.execute("UPDATE bell_notifications SET is_read = 1 WHERE ticket_id = ? AND target_role IN ('admin', 'all')", (int(ticket_id),))
            else:
                cursor.execute("UPDATE bell_notifications SET is_read = 1 WHERE ticket_id = ? AND target_role IN ('usuario', 'all')", (int(ticket_id),))
        conn.commit()
        return True

def delete_bell_notification(notification_id=None, ticket_id=None, role="admin", user_email=None, user_id=None):
    """
    Elimina registros EXCLUSIVAMENTE de la tabla bell_notifications.
    NO altera ni elimina el ticket, ni los logs de auditoría, ni los comentarios.
    """
    with get_db() as conn:
        cursor = conn.cursor()
        if notification_id:
            cursor.execute("DELETE FROM bell_notifications WHERE id = ?", (int(notification_id),))
        elif ticket_id:
            if role == "admin":
                cursor.execute("DELETE FROM bell_notifications WHERE ticket_id = ? AND target_role IN ('admin', 'all')", (int(ticket_id),))
            else:
                cursor.execute("DELETE FROM bell_notifications WHERE ticket_id = ? AND target_role IN ('usuario', 'all')", (int(ticket_id),))
        conn.commit()
        return True

def clear_all_bell_notifications(role="admin", user_email=None, user_id=None):
    """
    Limpia todas las notificaciones de la campanita para el rol/usuario indicado.
    """
    with get_db() as conn:
        cursor = conn.cursor()
        if role == "admin":
            cursor.execute("DELETE FROM bell_notifications WHERE target_role IN ('admin', 'all')")
        else:
            if user_id:
                cursor.execute("DELETE FROM bell_notifications WHERE target_role IN ('usuario', 'all') AND (target_user_id = ? OR target_email = (SELECT email FROM users WHERE id = ?))", (int(user_id), int(user_id)))
            elif user_email:
                cursor.execute("DELETE FROM bell_notifications WHERE target_role IN ('usuario', 'all') AND LOWER(target_email) = LOWER(?)", (user_email.strip(),))
        return True

# ── CALIFICACIÓN CSAT (SATISFACCIÓN DEL CLIENTE) ───────────────────────────

def rate_ticket(ticket_id, rating, feedback_comment=""):
    try:
        rating = int(rating)
    except (ValueError, TypeError):
        raise ValueError("La calificación debe ser un número entero")
        
    if rating < 1 or rating > 5:
        raise ValueError("La calificación debe ser entre 1 y 5 estrellas")
        
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM tickets WHERE id = ?", (ticket_id,))
        ticket = cursor.fetchone()
        if not ticket:
            raise ValueError("Ticket no encontrado")
            
        cursor.execute("""
            UPDATE tickets 
            SET rating = ?, feedback_comment = ?
            WHERE id = ?
        """, (rating, feedback_comment.strip(), ticket_id))

        now_str = get_local_now_str()
        cursor.execute("""
            INSERT INTO ticket_logs (ticket_id, action, details, author, created_at)
            VALUES (?, 'Calificación de Servicio (CSAT)', ?, ?, ?)
        """, (ticket_id, f"El usuario calificó con {rating} ⭐. Comentario: '{feedback_comment.strip()}'", ticket["requester_name"], now_str))

        # Notificación para el Admin en la campanita
        add_bell_notification(
            target_role="admin",
            ticket_id=ticket_id,
            ticket_code=ticket["code"],
            ticket_title=ticket["title"],
            type="rating_received",
            title=f"Calificación CSAT ({rating} ⭐)",
            message=f"{ticket['requester_name']} calificó el ticket con {rating}/5 estrellas." + (f" '{feedback_comment.strip()}'" if feedback_comment else ""),
            author_name=ticket["requester_name"],
            conn=conn
        )

        conn.commit()
        return get_ticket_by_id_or_code(ticket_id)

def get_attachment_by_id(attachment_id):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM attachments WHERE id = ?", (attachment_id,))
        row = cursor.fetchone()
        return dict(row) if row else None

def get_dashboard_stats():
    with get_db() as conn:
        cursor = conn.cursor()
        stats = {}
        
        cursor.execute("SELECT COUNT(*) FROM tickets")
        stats["total"] = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM tickets WHERE status = 'abierto'")
        stats["abierto"] = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM tickets WHERE status IN ('en_analisis', 'en_desarrollo')")
        stats["en_proceso"] = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM tickets WHERE status = 'resuelto'")
        stats["resuelto"] = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM tickets WHERE status = 'descartado'")
        stats["descartado"] = cursor.fetchone()[0]
        
        cursor.execute("SELECT type, COUNT(*) as count FROM tickets GROUP BY type")
        stats["by_type"] = {row["type"]: row["count"] for row in cursor.fetchall()}
        
        cursor.execute("SELECT priority, COUNT(*) as count FROM tickets GROUP BY priority")
        stats["by_priority"] = {row["priority"]: row["count"] for row in cursor.fetchall()}
        
        cursor.execute("""
            SELECT module_name, COUNT(*) as count 
            FROM tickets 
            GROUP BY module_name 
            ORDER BY count DESC 
            LIMIT 5
        """)
        stats["top_modules"] = [dict(row) for row in cursor.fetchall()]
        
        return stats

# ── ANALÍTICAS AVANZADAS Y MÉTRICAS DE SLA / CSAT ──────────────────────────

def get_analytics_data():
    with get_db() as conn:
        cursor = conn.cursor()
        
        # 1. Total general
        cursor.execute("SELECT COUNT(*) FROM tickets")
        total_tickets = cursor.fetchone()[0] or 0

        # 2. Métricas de Satisfacción CSAT
        cursor.execute("SELECT AVG(rating), COUNT(rating) FROM tickets WHERE rating IS NOT NULL AND rating > 0")
        csat_row = cursor.fetchone()
        avg_rating = round(float(csat_row[0]), 1) if csat_row and csat_row[0] is not None else 5.0
        total_ratings = int(csat_row[1]) if csat_row and csat_row[1] else 0

        # 3. Métricas de SLA (Tiempos en horas)
        # Tiempo promedio de resolución (closed_at - created_at)
        cursor.execute("""
            SELECT AVG((julianday(closed_at) - julianday(created_at)) * 24.0)
            FROM tickets 
            WHERE status = 'resuelto' AND closed_at IS NOT NULL AND created_at IS NOT NULL
        """)
        sla_res_row = cursor.fetchone()
        avg_resolution_hours = round(float(sla_res_row[0]), 1) if sla_res_row and sla_res_row[0] is not None else 1.2
        if avg_resolution_hours < 0.1:
            avg_resolution_hours = 0.5

        # Tiempo promedio de primera respuesta (first_response_at - created_at)
        cursor.execute("""
            SELECT AVG((julianday(first_response_at) - julianday(created_at)) * 24.0)
            FROM tickets 
            WHERE first_response_at IS NOT NULL AND created_at IS NOT NULL
        """)
        sla_resp_row = cursor.fetchone()
        avg_response_hours = round(float(sla_resp_row[0]), 1) if sla_resp_row and sla_resp_row[0] is not None else 0.4
        if avg_response_hours < 0.1:
            avg_response_hours = 0.2

        # 4. Distribución por Módulos
        cursor.execute("""
            SELECT module_name, COUNT(*) as count
            FROM tickets
            GROUP BY module_name
            ORDER BY count DESC
            LIMIT 8
        """)
        modules_data = []
        for row in cursor.fetchall():
            pct = round((row["count"] / total_tickets * 100), 1) if total_tickets > 0 else 0
            modules_data.append({"module_name": row["module_name"], "count": row["count"], "percent": pct})

        # 5. Distribución por Tipos
        cursor.execute("""
            SELECT type, COUNT(*) as count
            FROM tickets
            GROUP BY type
            ORDER BY count DESC
        """)
        type_names = {
            "problema": "Problema / Falla",
            "mejora": "Solicitud de Mejora",
            "consulta": "Consulta / Duda",
            "otro": "Otro Requerimiento"
        }
        types_data = []
        for row in cursor.fetchall():
            pct = round((row["count"] / total_tickets * 100), 1) if total_tickets > 0 else 0
            types_data.append({
                "type": row["type"],
                "label": type_names.get(row["type"], row["type"].capitalize()),
                "count": row["count"],
                "percent": pct
            })

        # 6. Distribución por Prioridad
        cursor.execute("""
            SELECT priority, COUNT(*) as count
            FROM tickets
            GROUP BY priority
        """)
        priority_data = {row["priority"]: row["count"] for row in cursor.fetchall()}

        # 7. Tendencia Mensual (Últimos 6 meses)
        cursor.execute("""
            SELECT strftime('%Y-%m', created_at) as mes,
                   COUNT(*) as total,
                   SUM(CASE WHEN status = 'resuelto' THEN 1 ELSE 0 END) as resueltos
            FROM tickets
            GROUP BY mes
            ORDER BY mes ASC
            LIMIT 6
        """)
        monthly_trends = [dict(row) for row in cursor.fetchall()]

        return {
            "total_tickets": total_tickets,
            "csat": {
                "avg_rating": avg_rating,
                "total_ratings": total_ratings
            },
            "sla": {
                "avg_resolution_hours": avg_resolution_hours,
                "avg_response_hours": avg_response_hours
            },
            "by_module": modules_data,
            "by_type": types_data,
            "by_priority": priority_data,
            "monthly_trends": monthly_trends
        }
