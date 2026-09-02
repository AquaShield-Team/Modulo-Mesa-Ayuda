import io
import json
import zipfile
from datetime import datetime
import app
import database

def test_full_flow():
    print("--- 1. Inicializando Base de Datos de Prueba con Usuarios ---")
    database.init_db()
    modules = database.get_modules()
    print(f"Modulos iniciales: {len(modules)}")
    assert len(modules) >= 15, "Deben existir modulos precargados"

    client = app.app.test_client()

    print("\n--- 2. Probando Registro e Inicio de Sesión de Usuario ---")
    email_test = f"juan.perez_{int(datetime.now().timestamp())}@aquachile.com"
    reg_data = {
        "name": "Juan Perez",
        "email": email_test,
        "password": "miPasswordSegura123",
        "phone": "+56 9 8765 4321",
        "department": "Comercial / Congelado"
    }
    r = client.post("/api/auth/register", json=reg_data)
    assert r.status_code == 201, f"Error en register: {r.status_code} - {r.data.decode('utf-8')}"
    user = json.loads(r.data.decode("utf-8"))["user"]
    user_id = user["id"]
    print(f"Usuario registrado exitosamente: ID={user_id}, Nombre={user['name']}")

    # Probar endpoint /api/auth/me
    r = client.get("/api/auth/me")
    assert r.status_code == 200
    me_data = json.loads(r.data.decode("utf-8"))
    assert me_data["authenticated"] is True
    assert me_data["user"]["email"] == email_test
    print("Verificacion de sesion /api/auth/me OK")

    print("\n--- 3. Creando Ticket asociado al Usuario Logueado ---")
    dummy_pdf = io.BytesIO(b"%PDF-1.4 dummy pdf content for testing")
    dummy_xlsx = io.BytesIO(b"PK dummy excel content for testing")

    data_form = {
        "module_id": modules[0]["id"],
        "type": "mejora",
        "priority": "alta",
        "title": "Optimizar busqueda de lotes en Modulo Congelado",
        "description": "Se sugiere agregar un filtro por planta de origen para acelerar la busqueda."
    }
    data_form["files[]"] = [
        (dummy_pdf, "especificaciones.pdf"),
        (dummy_xlsx, "ejemplo_lotes.xlsx")
    ]

    r = client.post("/api/tickets", data=data_form, content_type="multipart/form-data")
    assert r.status_code == 201, f"Error al crear ticket: {r.status_code} - {r.data.decode('utf-8')}"
    resp_json = json.loads(r.data.decode("utf-8"))
    ticket = resp_json["ticket"]
    ticket_id = ticket["id"]
    ticket_code = ticket["code"]
    print(f"Ticket creado con exito: {ticket_code} (Solicitante: {ticket['requester_name']})")
    assert ticket["requester_name"] == "Juan Perez", "El nombre debe provenir de la sesion del usuario"
    assert ticket["requester_email"] == email_test

    print("\n--- 4. Probando Historial 'Mis Solicitudes' ---")
    r = client.get("/api/my-tickets")
    assert r.status_code == 200
    my_tickets = json.loads(r.data.decode("utf-8"))["tickets"]
    print(f"Total tickets del usuario: {len(my_tickets)}")
    assert len(my_tickets) >= 1
    assert my_tickets[0]["code"] == ticket_code

    print("\n--- 5. Probando Descarga ZIP ---")
    r = client.get(f"/api/tickets/{ticket_id}/download-zip")
    assert r.status_code == 200
    assert "zip" in r.headers["Content-Type"]
    
    zip_bytes = io.BytesIO(r.data)
    with zipfile.ZipFile(zip_bytes, "r") as z:
        names = z.namelist()
        print(f"Archivos en el ZIP: {names}")
        assert any("especificaciones.pdf" in n for n in names)

    print("\n--- 6. Probando Cierre de Sesión ---")
    r = client.post("/api/auth/logout")
    assert r.status_code == 200
    r = client.get("/api/auth/me")
    assert json.loads(r.data.decode("utf-8"))["authenticated"] is False
    print("Logout OK")

    print("\n=======================================================")
    print(" TODOS LOS TESTS DE AUTENTICACION Y TICKETS PASARON OK ")
    print("=======================================================")

if __name__ == "__main__":
    test_full_flow()
