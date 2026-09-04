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

## 🚀 Centro de Control y Lanzador Único (`AQUASHIELD.bat`)

Todo el control operativo del sistema está consolidado en un único archivo ejecutable:

📁 **`AQUASHIELD.bat`** *(ubicado en la raíz de este proyecto)*

### ¿Qué hace automáticamente al abrirlo?
1. **Inicia el servidor en segundo plano**: Si el servidor no está corriendo, lo levanta en silencio vía `pythonw.exe app.py` en el puerto `5050`.
2. **Abre Google Chrome**: Carga de inmediato el **Panel de Administración** en `http://localhost:5050/admin`.
3. **Monitor en Tiempo Real (Watchdog cada 3s)**: Monitorea el estado del servidor, red corporativa, canal de colegas y base de datos, con opciones rápidas de control por teclado (`1` Reiniciar, `2` Detener, `3` Reabrir Chrome, `0` Salir).

---

## 🌐 Enlaces del Ecosistema

* **Portal Web para Colegas (Usuarios)**: [https://aquashield-team.github.io/Modulo-Mesa-Ayuda/](https://aquashield-team.github.io/Modulo-Mesa-Ayuda/)
* **Panel de Gestión Local**: [http://localhost:5050/admin](http://localhost:5050/admin)
* **Documentación y Arquitectura Completa**: Ver archivo [CONTEXTO_PROYECTO.md](CONTEXTO_PROYECTO.md)

## 📁 Estructura del Proyecto

```
Modulo-Mesa-Ayuda/
├── app.py                             # Servidor Flask / API REST
├── database.py                        # Capa SQLite con persistencia y lógica de usuarios/tickets
├── requirements.txt                   # Dependencias de Python
├── AQUASHIELD.bat                     # Lanzador centralizado del sistema
├── INSTALAR.bat                       # Instalador de librerías
├── static/                            # CSS, JS corporativo y logos oficiales
├── templates/                         # Vistas HTML (Portal y Admin)
├── data/                              # Base de datos SQLite
└── uploads/                           # Almacenamiento organizado por ticket
```
