# 🛡️ AquaShield · Mesa de Ayuda y Gestión de Requerimientos
## Documento Maestro de Contexto Técnico y Arquitectura del Proyecto

> **Nota para Agentes de IA y Desarrolladores**: Este documento consolida todo el contexto del sistema, las decisiones de diseño tomadas, las limitaciones de infraestructura corporativa y la guía operativa. Consúltalo antes de realizar modificaciones.

---

## 📌 1. Ficha Técnica y Enlaces Oficiales

* **Empresa**: AquaChile S.A.
* **Plataforma**: AQUASHIELD (Módulos de Comercio Exterior: Congelado, Fresco, Proformas, Seguros, ExportDesk, Agente SAP, etc.)
* **Responsable / Administrador**: Marcelo Ramírez (Comercio Exterior)
* **Repositorio Oficial**: [`https://github.com/AquaShield-Team/Modulo-Mesa-Ayuda`](https://github.com/AquaShield-Team/Modulo-Mesa-Ayuda)
* **Portal Cloud para Colegas (Usuarios)**:  
  👉 **`https://aquashield-team.github.io/Modulo-Mesa-Ayuda/`** *(100% HTTPS, operativo 24/7 sin dependencias locales)*
* **Panel de Gestión Local (Marcelo)**:  
  👉 **`http://localhost:5050/admin`**
* **Lanzador Único del Sistema**:  
  👉 **`C:\dev\Modulo-Mesa-Ayuda\AQUASHIELD.bat`**

---

## 🏢 2. Restricciones Críticas del Entorno Corporativo (¡IMPORTANTE!)

1. **Notebook Corporativo sin Permisos de Administrador**:
   - El equipo anfitrión de Marcelo es una laptop corporativa administrada por TI con Windows restringido.
   - **No se cuenta con privilegios de Administrador local (UAC)**: comandos como `netsh advfirewall` fallan por falta de elevación.
   
2. **Bloqueo Inbound de Firewall Corporativo**:
   - Por política estricta de ciberseguridad, Windows Defender Firewall bloquea conexiones entrantes directas de otros equipos hacia el puerto `5050` o cualquier puerto no estándar.
   - **Consecuencia**: Los computadores de otros colegas **NO pueden conectarse directamente a la IP o nombre de host de Marcelo (`PM-COME-N255:5050`)**.

3. **Regla de Oro de Conectividad**:
   - **NUNCA** configurar redirecciones forzadas desde GitHub Pages hacia la IP o FQDN del notebook local. Si se hace, los colegas experimentarán pantallas en blanco (`ERR_CONNECTION_TIMED_OUT`).
   - El portal público para colegas debe operar **siempre de forma autónoma en GitHub Pages**.

---

## 🌐 3. Arquitectura de Doble Canal

Para garantizar que el sistema nunca falle y no dependa de permisos de administrador ni de la disponibilidad del notebook, se diseñó la siguiente arquitectura:

```
                  ┌─────────────────────────────────────────────────────────┐
                  │                   COLEGAS (USUARIOS)                   │
                  └───────────────────────────┬─────────────────────────────┘
                                              │
                                              ▼
                  ┌─────────────────────────────────────────────────────────┐
                  │    PORTAL CLOUD GITHUB PAGES (100% HTTPS / Seguro)      │
                  │   https://aquashield-team.github.io/Modulo-Mesa-Ayuda/   │
                  │  - Carga instantánea en cualquier red / VPN / móvil    │
                  │  - Formulario de requerimientos, módulos y criticidad   │
                  │  - Directorio sincronizado de usuarios (users.json)    │
                  └─────────────┬─────────────────────────────┬─────────────┘
                                │                             │
             [Despacho Microsoft Teams]              [Despacho Correo Outlook]
                                │                             │
                                └─────────────┬───────────────┘
                                              ▼
                  ┌─────────────────────────────────────────────────────────┐
                  │          MARCELO RAMÍREZ (ADMINISTRADOR)                │
                  ├─────────────────────────────────────────────────────────┤
                  │ 1. Recibe el requerimiento en Teams / Correo            │
                  │ 2. Ejecuta AQUASHIELD.bat en su equipo local           │
                  │ 3. Servidor Flask en segundo plano (http://localhost:5050)│
                  │ 4. Base de datos SQLite persistente (data/helpdesk.db)  │
                  │ 5. Panel de Control y Auditoría (/admin)                │
                  └─────────────────────────────────────────────────────────┘
```

---

## 🎛️ 4. El Lanzador Único (`AQUASHIELD.bat` y `dashboard.py`)

Existe **un único ejecutable** en la raíz del proyecto (`AQUASHIELD.bat`). Toda la lógica dispersa de scripts antiguos se consolidó aquí.

### Comportamiento Automático de `AQUASHIELD.bat`:
1. **Auto-arranque en segundo plano**: Comprueba si el puerto `5050` está escuchando. Si está inactivo, lanza el servidor de forma invisible usando `pythonw.exe app.py`.
2. **Apertura de navegador**: Abre automáticamente **Google Chrome** en `http://localhost:5050/admin`.
3. **Monitor en Tiempo Real (Watchdog cada 3 segundos)**:
   - Se refresca automáticamente cada 3 segundos mostrando el timestamp exacto del chequeo.
   - Detecta si el servidor está `[ ACTIVO 🟢 ]` con su PID y memoria RAM.
   - Si el proceso se detiene o se cae, alerta en rojo `[ DETENIDO / CAÍDO 🔴 ]`.
   - Permite controlar el servidor mediante teclas rápidas sin presionar Enter (`msvcrt`):
     - `[1]`: Reiniciar servidor en segundo plano
     - `[2]`: Detener servidor
     - `[3]`: Volver a abrir Panel Admin en Chrome
     - `[0]`: Salir del monitor (el servidor continúa corriendo en silencio)

---

## 📁 5. Inventario de Archivos Clave

```
Modulo-Mesa-Ayuda/
├── AQUASHIELD.bat              # Lanzador único del sistema
├── dashboard.py                # Motor Python del monitor en tiempo real y watchdog
├── app.py                      # API REST Flask (puerto 5050)
├── database.py                 # Capa de datos SQLite (data/helpdesk.db)
├── index.html                  # Frontend del Portal de Usuarios (GitHub Pages)
├── admin.html                  # Frontend del Panel de Administración
├── static/
│   ├── js/
│   │   ├── app.js              # Lógica del formulario de tickets y despacho
│   │   └── admin.js            # Lógica del dashboard de gestión y auditoría
│   ├── css/
│   │   └── style.css           # Estilos oficiales AquaChile / AquaShield
│   └── data/
│       └── users.json          # Directorio sincronizado de usuarios activos
├── data/
│   └── helpdesk.db             # Base de datos SQLite local
├── uploads/                    # Almacenamiento local de archivos adjuntos
└── scripts/
    └── legacy_archive/         # Histórico de scripts batch antiguos archivados
```

---

## 🔄 6. Sincronización en Vivo de Usuarios y Cargos

* Los cargos y perfiles de usuarios se actualizan desde `/admin`.
* Al editar un usuario en `admin.js`, se envía `PATCH /api/admin/users/<id>`.
* El backend en `app.py` actualiza la base de datos y automáticamente ejecuta `_export_users_json()`, regenerando `static/data/users.json`.
* En el frontend de usuarios (`app.js`), la función `fetchLiveUsersDirectory()` consulta este directorio y la sesión en vivo vía `/api/auth/me`, manteniendo los cargos siempre sincronizados.

---

## 🛡️ 7. Guía de Buenas Prácticas para Futuras Mantenciones

1. **Archivos `.bat` en Windows**:
   - Guardar siempre con saltos de línea **CRLF (`\r\n`)** y codificación ASCII limpia. Los saltos LF (`\n`) rompen el intérprete `cmd.exe` desfasando bytes.
2. **Navegador**:
   - Invocar siempre Google Chrome explícitamente (`start chrome ...`) con fallbacks a Edge para evitar que Windows derive la URL al editor de código (VS Code).
3. **Escritorio**:
   - Mantener el Escritorio limpio. El lanzador oficial reside exclusivamente en `C:\dev\Modulo-Mesa-Ayuda\AQUASHIELD.bat`.
4. **Despliegues en GitHub**:
   - Cada cambio en `index.html`, `admin.html`, `static/js/app.js` o `static/data/users.json` debe subirse con `git push origin main` para que GitHub Pages lo actualice a los colegas en ~20 segundos.
