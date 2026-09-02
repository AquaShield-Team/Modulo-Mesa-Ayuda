import html
import re
import smtplib
import threading
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.utils import formataddr, formatdate, make_msgid
import logging
import database

logger = logging.getLogger("helpdesk_notifier")

def _html_to_plain_text(html_str):
    # Convierte HTML a texto plano limpio para cumplir estandares anti-spam
    text = re.sub(r'<br\s*/?>', '\n', html_str, flags=re.IGNORECASE)
    text = re.sub(r'</p>', '\n\n', text, flags=re.IGNORECASE)
    text = re.sub(r'</tr>', '\n', text, flags=re.IGNORECASE)
    text = re.sub(r'<td[^>]*>', '  · ', text, flags=re.IGNORECASE)
    text = re.sub(r'<[^>]+>', '', text)
    text = re.sub(r'\n{3,}', '\n\n', text)
    return html.unescape(text).strip()

def get_notifier_config():
    try:
        settings = database.get_all_settings()
    except Exception:
        settings = {}
        
    return {
        "email_mode": settings.get("email_mode", "smtp"),
        "sender_name": settings.get("email_sender_name", "Mesa de Ayuda AquaShield"),
        "sender_address": settings.get("email_sender_address", "MyAquashield@gmail.com"),
        "smtp_server": settings.get("smtp_server", "smtp.gmail.com"),
        "smtp_port": int(settings.get("smtp_port", 587)),
        "smtp_user": os.environ.get("SMTP_USER") or settings.get("smtp_user", "MyAquashield@gmail.com"),
        "smtp_password": os.environ.get("SMTP_PASSWORD") or settings.get("smtp_password", ""),
        "smtp_tls": settings.get("smtp_tls", "1") == "1",
        "admin_alert_email": os.environ.get("ADMIN_ALERT_EMAIL") or settings.get("admin_alert_email", "marcelo.ramirez@aquachile.com, MyAquashield@gmail.com")
    }

def _send_email_via_smtp(to_email, subject, html_body, config=None):
    cfg = config or get_notifier_config()
    server_host = cfg["smtp_server"]
    server_port = cfg["smtp_port"]
    user = cfg["smtp_user"]
    pwd = cfg["smtp_password"]
    sender_name = cfg["sender_name"]
    sender_addr = cfg["sender_address"] or user

    if not server_host:
        return False, "Servidor SMTP no configurado"

    try:
        msg = MIMEMultipart("alternative")
        msg["Message-ID"] = make_msgid(domain="gmail.com")
        msg["Date"] = formatdate(localtime=True)
        msg["Subject"] = subject
        msg["From"] = formataddr((sender_name, sender_addr))
        msg["To"] = to_email
        msg["Reply-To"] = sender_addr
        msg["Auto-Submitted"] = "auto-generated"
        msg["X-Mailer"] = "AquaShield-Helpdesk/1.0"
        
        # 1. Versión Texto Plano (Crítica para filtros corporativos Exchange)
        plain_content = _html_to_plain_text(html_body)
        msg.attach(MIMEText(plain_content, "plain", "utf-8"))
        
        # 2. Versión HTML con diseño
        msg.attach(MIMEText(html_body, "html", "utf-8"))

        with smtplib.SMTP(server_host, server_port, timeout=12) as server:
            if cfg["smtp_tls"]:
                server.starttls()
            if user and pwd:
                server.login(user, pwd)
            server.sendmail(sender_addr, [to_email], msg.as_string())
            
        logger.info(f"Correo enviado exitosamente por SMTP a {to_email}")
        return True, "Correo enviado correctamente vía SMTP"
    except Exception as e:
        err_msg = str(e)
        logger.warning(f"Error al enviar por SMTP ({err_msg})")
        return False, err_msg

def _send_email_via_outlook(to_email, subject, html_body, config=None):
    try:
        import pythoncom
        import win32com.client
        pythoncom.CoInitialize()
        outlook = win32com.client.Dispatch("Outlook.Application")
        mail = outlook.CreateItem(0)
        mail.To = to_email
        mail.Subject = subject
        mail.HTMLBody = html_body
        
        cfg = config or get_notifier_config()
        # Si se especificó un remitente para enviar en nombre de:
        if cfg.get("sender_address") and "@" in cfg["sender_address"] and "gmail" not in cfg["sender_address"].lower():
            try:
                mail.SentOnBehalfOfName = cfg["sender_address"]
            except Exception:
                pass
                
        mail.Send()
        pythoncom.CoUninitialize()
        logger.info(f"Correo enviado exitosamente por Outlook a {to_email}")
        return True, "Correo enviado correctamente vía Outlook de Windows"
    except Exception as e:
        err_msg = str(e)
        logger.warning(f"Error al enviar por Outlook COM ({err_msg})")
        return False, err_msg

def _dispatch_email(to_email, subject, html_body):
    """Intenta enviar según el modo configurado (SMTP o Outlook) con fallback automático"""
    if not to_email or "@" not in to_email:
        return False, "Correo destinatario inválido"

    cfg = get_notifier_config()
    mode = cfg.get("email_mode", "smtp").lower()

    if mode == "smtp":
        success, msg = _send_email_via_smtp(to_email, subject, html_body, cfg)
        if success:
            return True, msg
        # Fallback a Outlook si SMTP falla
        logger.info("Intentando fallback a Outlook...")
        return _send_email_via_outlook(to_email, subject, html_body, cfg)
    else:
        success, msg = _send_email_via_outlook(to_email, subject, html_body, cfg)
        if success:
            return True, msg
        # Fallback a SMTP si Outlook falla
        logger.info("Intentando fallback a SMTP...")
        return _send_email_via_smtp(to_email, subject, html_body, cfg)

def test_email_connection(to_email=None):
    cfg = get_notifier_config()
    target_email = to_email or cfg["admin_alert_email"] or cfg["sender_address"]
    
    subject = f"🧪 Prueba de Conexión de Correo · AquaShield ({cfg['sender_name']})"
    body = _generate_email_html(
        title_header="¡Prueba de Configuración Exitosa!",
        main_message="Este es un correo de prueba generado desde el Panel de Gestión de AquaShield para verificar la conectividad del servidor de correos.",
        details_dict={
            "Modo de Envío": cfg["email_mode"].upper(),
            "Nombre de Remitente": cfg["sender_name"],
            "Dirección Remitente": cfg["sender_address"],
            "Servidor SMTP": f"{cfg['smtp_server']}:{cfg['smtp_port']}" if cfg["email_mode"] == "smtp" else "Outlook Local de Windows",
            "Destinatario": target_email
        },
        action_button_text="Abrir Panel de Gestión",
        action_button_url="http://localhost:5050/admin"
    )

    if cfg["email_mode"] == "smtp":
        return _send_email_via_smtp(target_email, subject, body, cfg)
    else:
        return _send_email_via_outlook(target_email, subject, body, cfg)

# ── PLANTILLAS DE CORREO CORPORATIVAS AQUACHILE ─────────────────────────────

def _generate_email_html(title_header, main_message, details_dict, action_button_text=None, action_button_url=None):
    rows_html = ""
    for label, val in details_dict.items():
        rows_html += f"""
        <tr>
            <td style="padding: 8px 12px; font-weight: bold; color: #445563; border-bottom: 1px solid #EFEFF0; width: 35%;">{label}</td>
            <td style="padding: 8px 12px; color: #2C3E50; border-bottom: 1px solid #EFEFF0;">{val}</td>
        </tr>
        """

    btn_html = ""
    if action_button_text and action_button_url:
        btn_html = f"""
        <div style="text-align: center; margin: 28px 0 10px 0;">
            <a href="{action_button_url}" style="background-color: #EB5F0A; color: #FFFFFF; text-decoration: none; padding: 12px 24px; font-weight: bold; border-radius: 6px; display: inline-block; font-size: 14px;">
                {action_button_text}
            </a>
        </div>
        """

    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
    </head>
    <body style="font-family: Arial, sans-serif; background-color: #EFE9E5; margin: 0; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #FFFFFF; border-radius: 8px; border: 1px solid #D5D8DB; overflow: hidden;">
            <!-- Header AquaShield -->
            <div style="background-color: #445563; padding: 18px 24px; color: #FFFFFF;">
                <div style="font-size: 11px; letter-spacing: 2px; color: #EB5F0A; font-weight: bold;">MÓDULO MESA DE AYUDA</div>
                <div style="font-size: 18px; font-weight: bold; margin-top: 4px;">AQUASHIELD <span style="font-size: 12px; font-weight: normal; color: #B4A28D;">by AquaChile</span></div>
            </div>

            <!-- Cuerpo -->
            <div style="padding: 24px;">
                <h2 style="color: #445563; margin-top: 0; font-size: 18px;">{title_header}</h2>
                <p style="color: #555555; font-size: 14px; line-height: 1.5;">{main_message}</p>

                <!-- Tabla de Datos -->
                <table style="width: 100%; border-collapse: collapse; margin-top: 18px; font-size: 13px; background-color: #F8FAFC; border-radius: 6px;">
                    {rows_html}
                </table>

                {btn_html}
            </div>

            <!-- Footer -->
            <div style="background-color: #F1F5F9; padding: 14px 24px; text-align: center; font-size: 11px; color: #8F99A1; border-top: 1px solid #D5D8DB;">
                Este es un mensaje automático de la Mesa de Ayuda AquaShield. AquaChile S.A.
            </div>
        </div>
    </body>
    </html>
    """

def notify_ticket_created(ticket, base_url="http://localhost:5050"):
    """Envía correo al solicitante y al administrador en un hilo en segundo plano"""
def _get_admin_email_list(cfg):
    admin_emails_raw = cfg.get("admin_alert_email", "marcelo.ramirez@aquachile.com, MyAquashield@gmail.com")
    return [e.strip() for e in re.split(r'[,;]+', admin_emails_raw) if e.strip() and '@' in e]

def notify_ticket_created(ticket, base_url="http://localhost:5050"):
    """Envía correo asíncrono al solicitante y al administrador"""
    def _task():
        try:
            cfg = get_notifier_config()

            # 1. Correo al Solicitante
            subject_user = f"[{ticket['code']}] Hemos recibido tu requerimiento · AquaShield"
            body_user = _generate_email_html(
                title_header="¡Solicitud Ingresada con Éxito!",
                main_message=f"Hola <strong>{ticket['requester_name']}</strong>, hemos recibido tu requerimiento para el módulo <strong>{ticket['module_name']}</strong>. Nuestro equipo lo revisará a la brevedad.",
                details_dict={
                    "Código de Ticket": f"<strong style='color:#EB5F0A;'>{ticket['code']}</strong>",
                    "Módulo": ticket["module_name"],
                    "Tipo": ticket["type"].upper(),
                    "Prioridad": ticket["priority"].upper(),
                    "Asunto": ticket["title"],
                    "Descripción": ticket["description"]
                },
                action_button_text="Ver Estado de mi Solicitud",
                action_button_url=f"{base_url}/"
            )
            _dispatch_email(ticket["requester_email"], subject_user, body_user)

            # 2. Correo de Alerta al Administrador
            admin_list = _get_admin_email_list(cfg)
            if admin_list:
                subject_admin = f"[NUEVO TICKET] {ticket['code']} · {ticket['module_name']} ({ticket['requester_name']})"
                body_admin = _generate_email_html(
                    title_header="Nuevo Requerimiento Ingresado",
                    main_message=f"El usuario <strong>{ticket['requester_name']}</strong> ({ticket['requester_email']}) ha registrado una nueva solicitud.",
                    details_dict={
                        "Código Ticket": f"<strong style='color:#EB5F0A;'>{ticket['code']}</strong>",
                        "Solicitante": f"{ticket['requester_name']} &lt;{ticket['requester_email']}&gt;",
                        "Teléfono/Anexo": ticket.get("requester_phone") or "No especificado",
                        "Módulo": ticket["module_name"],
                        "Tipo": ticket["type"].upper(),
                        "Prioridad": ticket["priority"].upper(),
                        "Asunto": ticket["title"],
                        "Descripción": ticket["description"]
                    },
                    action_button_text="Abrir en Panel de Gestión",
                    action_button_url=f"{base_url}/admin"
                )
                for adm_to in admin_list:
                    _dispatch_email(adm_to, subject_admin, body_admin)
        except Exception as e:
            logger.exception("Error en hilo notify_ticket_created: %s", e)

    thread = threading.Thread(target=_task, daemon=True)
    thread.start()

def notify_ticket_status_updated(ticket, old_status, new_status, base_url="http://localhost:5050"):
    """Envía correo al solicitante avisando del cambio de estado o resolución"""
    def _task():
        try:
            status_names = {
                "abierto": "Abierto / En Cola",
                "en_analisis": "En Análisis Técnico",
                "en_desarrollo": "En Desarrollo / Corrección",
                "resuelto": "Resuelto / Completado ✅",
                "descartado": "Descartado / Rechazado"
            }
            
            st_text = status_names.get(new_status, str(new_status or '').upper())
            subject = f"[{ticket['code']}] Actualización de Estado: {st_text} · AquaShield"
            
            notes = ticket.get("resolution_notes") or "Sin notas adicionales registradas."
            
            body = _generate_email_html(
                title_header="Estado de Solicitud Actualizado",
                main_message=f"Hola <strong>{ticket['requester_name']}</strong>, te informamos que tu requerimiento <strong>{ticket['code']}</strong> ha cambiado de estado.",
                details_dict={
                    "Código Ticket": ticket["code"],
                    "Módulo": ticket["module_name"],
                    "Nuevo Estado": f"<strong style='color:#2E7D32;'>{st_text}</strong>",
                    "Asunto Original": ticket["title"],
                    "Respuesta / Solución": f"<strong>{notes}</strong>"
                },
                action_button_text="Consultar Detalle en Línea",
                action_button_url=f"{base_url}/"
            )
            _dispatch_email(ticket["requester_email"], subject, body)
        except Exception as e:
            logger.exception("Error en hilo notify_ticket_status_updated: %s", e)

    thread = threading.Thread(target=_task, daemon=True)
    thread.start()

def notify_ticket_comment(ticket, comment, base_url="http://localhost:5050"):
    """Notifica por correo cuando alguien publica un mensaje en el hilo del ticket"""
    def _task():
        try:
            cfg = get_notifier_config()
            author_role = comment.get("author_role", "usuario")
            author_name = comment.get("author_name", "Usuario")
            
            if author_role == "admin":
                to_email = ticket["requester_email"]
                subject = f"[{ticket['code']}] Nuevo mensaje de soporte · AquaShield"
                body = _generate_email_html(
                    title_header="Nuevo Mensaje del Soporte Técnico",
                    main_message=f"El equipo de soporte ha respondido a tu requerimiento <strong>{ticket['code']}</strong> ({ticket['module_name']}):",
                    details_dict={
                        "Código Ticket": ticket["code"],
                        "Módulo": ticket["module_name"],
                        "Mensaje de Soporte": f"<strong style='color:#0288D1;'>{comment['message']}</strong>",
                        "Estado Actual": ticket["status"].upper()
                    },
                    action_button_text="Responder o Ver Detalle",
                    action_button_url=f"{base_url}/"
                )
                _dispatch_email(to_email, subject, body)
            else:
                admin_list = _get_admin_email_list(cfg)
                subject = f"[{ticket['code']}] Respuesta de {author_name} · AquaShield"
                body = _generate_email_html(
                    title_header="Respuesta del Solicitante",
                    main_message=f"El solicitante <strong>{author_name}</strong> ha respondido en el ticket <strong>{ticket['code']}</strong>:",
                    details_dict={
                        "Código Ticket": ticket["code"],
                        "Módulo": ticket["module_name"],
                        "Mensaje": f"<strong>{comment['message']}</strong>"
                    },
                    action_button_text="Abrir en Panel de Gestión",
                    action_button_url=f"{base_url}/admin"
                )
                for adm in admin_list:
                    _dispatch_email(adm, subject, body)
        except Exception as e:
            logger.exception("Error en hilo notify_ticket_comment: %s", e)

    thread = threading.Thread(target=_task, daemon=True)
    thread.start()
