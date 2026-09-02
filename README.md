# 🛡️ AquaShield · Módulo Mesa de Ayuda y Gestión de Solicitudes

Sistema centralizado de Mesa de Ayuda y Recepción de Requerimientos para la plataforma **AQUASHIELD (AquaChile)**. Diseñado para canalizar, clasificar y dar seguimiento a reportes de fallas técnicas, solicitudes de mejora y nuevas funcionalidades para todos los módulos operativos, eliminando la dispersión por correos, WhatsApp y Teams.

---

## ✨ Características Principales

1. **Recepción Inteligente de Solicitudes**:
   - Formulario ágil para reportar fallas, mejoras o requerimientos nuevos.
   - Nivel de prioridad y criticidad del problema.
   - Generación de código único de seguimiento (ej: `TKT-2026-0001`).

2. **Gestión Flexible de Módulos**:
   - Catálogo precargado con todos los módulos de AquaShield (*Congelado, Fresco, Proformas, Seguros, ExportDesk, Agente SAP, Termógrafo, etc.*).
   - **Creación dinámica al vuelo**: si el módulo que el usuario necesita no está en la lista, puede crearlo inmediatamente desde el botón `+ Nuevo`.

3. **Gestión Integral de Adjuntos**:
   - Soporte para arrastrar y soltar (Drag & Drop) múltiples archivos de todo tipo (`.pdf`, `.xlsx`, `.docx`, `.png`, `.jpg`, `.zip`, etc.).
   - **Descarga individual** de archivos con un clic.
   - **Descarga masiva en archivo ZIP** generado al instante con todos los archivos del ticket más un resumen en texto plano.

4. **Panel de Gestión Administrativa (`/admin`)**:
   - KPIs en tiempo real (Tickets Totales, Abiertos, En Proceso, Resueltos).
   - Buscador rápido y filtros por estado, módulo, tipo y prioridad.
   - Detalle del ticket con historial de auditoría y notas de resolución.
   - Exportación de la base de datos a planilla Excel `.xlsx`.

5. **Identidad Visual Corporativa**:
   - Cumplimiento estricto del manual de marca de AquaChile / AquaShield (`#445563`, naranja `#EB5F0A`, isotipo oficial SVG).
   - Soporte nativo para **Modo Claro** y **Modo Oscuro**.

---

## 🚀 Modos de Ejecución

El proyecto incluye scripts preparados para cada necesidad:

1. **Modo Silencioso (Segundo Plano - Sin ventana CMD)**:
   - Haz doble clic en `INICIAR_SILENCIOSO.bat` (o `INICIAR_SEGUNDO_PLANO.vbs`).
   - El servidor correrá de forma totalmente invisible y abrirá tu navegador.
   - Para detenerlo cuando quieras: haz doble clic en `DETENER_SERVICIO.bat`.
   - Para ver si está corriendo: haz doble clic en `ESTADO_SERVICIO.bat`.

2. **Inicio Automático con Windows**:
   - Haz doble clic en `CONFIGURAR_INICIO_AUTOMATICO.bat`.
   - La Mesa de Ayuda se iniciará sola en segundo plano cada vez que prendas el computador.
   - Para desactivar el inicio automático: ejecuta `QUITAR_INICIO_AUTOMATICO.bat`.

3. **Modo Consola (Visible con logs)**:
   - Haz doble clic en `INICIAR_MESA_AYUDA.bat` si deseas ver la consola de Python en vivo.

---

## 📁 Estructura del Proyecto

```
Modulo-Mesa-Ayuda/
├── app.py                             # Servidor Flask / API REST
├── database.py                        # Capa SQLite con persistencia y lógica de usuarios/tickets
├── requirements.txt                   # Dependencias de Python
├── INICIAR_SILENCIOSO.bat             # Inicia el servidor en segundo plano (sin CMD)
├── INICIAR_SEGUNDO_PLANO.vbs          # Script VBScript para ejecución oculta
├── DETENER_SERVICIO.bat               # Detiene el servidor en segundo plano
├── ESTADO_SERVICIO.bat                # Muestra el estado y PID del servidor
├── CONFIGURAR_INICIO_AUTOMATICO.bat   # Inicia la Mesa de Ayuda al encender Windows
├── QUITAR_INICIO_AUTOMATICO.bat       # Remueve el inicio automático
├── INICIAR_MESA_AYUDA.bat             # Lanzador clásico con consola visible
├── INSTALAR.bat                       # Instalador de librerías
├── static/                            # CSS, JS corporativo y logos oficiales
├── templates/                         # Vistas HTML (Portal y Admin)
├── data/                              # Base de datos SQLite
└── uploads/                           # Almacenamiento organizado por ticket
```

