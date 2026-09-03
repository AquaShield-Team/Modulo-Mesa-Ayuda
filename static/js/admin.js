/**
 * AQUASHIELD · Mesa de Ayuda
 * Lógica del Panel Administrativo de Gestión (Auto-Refresco, Widescreen y Gestión de Módulos)
 */

document.addEventListener("DOMContentLoaded", () => {
  // Configuracion de endpoint API para GitHub Pages vs Local/Cloud
  const IS_GH_PAGES = window.location.hostname.includes("github.io") || window.location.protocol === "file:";
  const API_BASE = IS_GH_PAGES 
    ? (localStorage.getItem("aquashield_api_url") || "https://argue-january-clicking-solved.trycloudflare.com")
    : "";

  // ── 1. Modo Oscuro / Claro ──────────────────────────────────────────────
  const themeToggleBtn = document.getElementById("themeToggleBtn");
  const html = document.documentElement;
  
  const savedTheme = localStorage.getItem("aquashield_theme") || 
    (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    
  html.setAttribute("data-theme", savedTheme);
  updateThemeIcon(savedTheme);

  themeToggleBtn.addEventListener("click", () => {
    const currentTheme = html.getAttribute("data-theme");
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    html.setAttribute("data-theme", newTheme);
    localStorage.setItem("aquashield_theme", newTheme);
    updateThemeIcon(newTheme);
  });

  function updateThemeIcon(theme) {
    themeToggleBtn.textContent = theme === "dark" ? "☀️" : "🌙";
  }

  // ── 2. Elementos del DOM ────────────────────────────────────────────────
  const kpiTotal = document.getElementById("kpiTotal");
  const kpiAbiertos = document.getElementById("kpiAbiertos");
  const kpiProceso = document.getElementById("kpiProceso");
  const kpiResueltos = document.getElementById("kpiResueltos");

  const adminSearchInput = document.getElementById("adminSearchInput");
  const filterStatus = document.getElementById("filterStatus");
  const filterModule = document.getElementById("filterModule");
  const filterAssignee = document.getElementById("filterAssignee");
  const btnRefresh = document.getElementById("btnRefresh");
  const ticketsTableBody = document.getElementById("ticketsTableBody");

  // Vistas (Tabla vs Kanban)
  const btnViewTable = document.getElementById("btnViewTable");
  const btnViewKanban = document.getElementById("btnViewKanban");
  const tableViewContainer = document.getElementById("tableViewContainer");
  const kanbanBoardContainer = document.getElementById("kanbanBoardContainer");
  let currentViewMode = "table";
  let cachedTicketsList = [];

  // Auto-refresco
  const liveRefreshPill = document.getElementById("liveRefreshPill");
  const livePulseDot = document.getElementById("livePulseDot");
  const liveRefreshText = document.getElementById("liveRefreshText");
  const refreshIntervalSelect = document.getElementById("refreshIntervalSelect");
  let autoRefreshTimer = null;

  // Modal Detalle
  const modalTicketDetail = document.getElementById("modalTicketDetail");
  const btnCloseDetailModal = document.getElementById("btnCloseDetailModal");
  const btnCloseDetailModalFooter = document.getElementById("btnCloseDetailModalFooter");
  const modalTicketCode = document.getElementById("modalTicketCode");
  const modalTicketDate = document.getElementById("modalTicketDate");
  const modalRequesterName = document.getElementById("modalRequesterName");
  const modalRequesterEmail = document.getElementById("modalRequesterEmail");
  const modalRequesterPhone = document.getElementById("modalRequesterPhone");
  const modalModuleName = document.getElementById("modalModuleName");
  const modalTicketType = document.getElementById("modalTicketType");
  const modalTicketPriority = document.getElementById("modalTicketPriority");
  const modalTicketStatus = document.getElementById("modalTicketStatus");
  const modalTicketTitle = document.getElementById("modalTicketTitle");
  const modalTicketDesc = document.getElementById("modalTicketDesc");
  const modalAttachmentCount = document.getElementById("modalAttachmentCount");
  const modalAttachmentsList = document.getElementById("modalAttachmentsList");
  const btnDownloadZip = document.getElementById("btnDownloadZip");
  const editStatusSelect = document.getElementById("editStatusSelect");
  const editPrioritySelect = document.getElementById("editPrioritySelect");
  const editAssigneeSelect = document.getElementById("editAssigneeSelect");
  const editResolutionNotes = document.getElementById("editResolutionNotes");
  const modalLogsList = document.getElementById("modalLogsList");
  const btnSaveTicketChanges = document.getElementById("btnSaveTicketChanges");

  // Time Tracking
  const modalTotalTimeBadge = document.getElementById("modalTotalTimeBadge");
  const inputTimeMinutes = document.getElementById("inputTimeMinutes");
  const inputTimeDesc = document.getElementById("inputTimeDesc");
  const btnAddTimeLog = document.getElementById("btnAddTimeLog");
  const modalTimeLogList = document.getElementById("modalTimeLogList");

  // Lightbox
  const lightboxModal = document.getElementById("lightboxModal");
  const lightboxTitle = document.getElementById("lightboxTitle");
  const lightboxDownloadBtn = document.getElementById("lightboxDownloadBtn");
  const btnCloseLightbox = document.getElementById("btnCloseLightbox");
  const lightboxBody = document.getElementById("lightboxBody");

  // Modal Gestión de Módulos
  const modalManageModules = document.getElementById("modalManageModules");
  const btnOpenManageModules = document.getElementById("btnOpenManageModules");
  const btnCloseManageModules = document.getElementById("btnCloseManageModules");
  const btnCloseManageModulesFooter = document.getElementById("btnCloseManageModulesFooter");
  const adminNewModName = document.getElementById("adminNewModName");
  const adminNewModDesc = document.getElementById("adminNewModDesc");
  const btnAdminCreateModule = document.getElementById("btnAdminCreateModule");
  const adminModulesList = document.getElementById("adminModulesList");
  const adminModulesCount = document.getElementById("adminModulesCount");

  // Modal Gestión de Usuarios
  const modalManageUsers = document.getElementById("modalManageUsers");
  const btnOpenManageUsers = document.getElementById("btnOpenManageUsers");
  const btnCloseManageUsers = document.getElementById("btnCloseManageUsers");
  const btnCloseManageUsersFooter = document.getElementById("btnCloseManageUsersFooter");
  const adminUsersCountBadge = document.getElementById("adminUsersCountBadge");
  const adminUserSearchInput = document.getElementById("adminUserSearchInput");
  const adminUsersTableBody = document.getElementById("adminUsersTableBody");

  const btnOpenCreateUserForm = document.getElementById("btnOpenCreateUserForm");
  const adminCreateUserCard = document.getElementById("adminCreateUserCard");
  const btnCancelCreateUser = document.getElementById("btnCancelCreateUser");
  const btnSubmitCreateUser = document.getElementById("btnSubmitCreateUser");
  const newUserName = document.getElementById("newUserName");
  const newUserEmail = document.getElementById("newUserEmail");
  const newUserPhone = document.getElementById("newUserPhone");
  const newUserDept = document.getElementById("newUserDept");
  const newUserRole = document.getElementById("newUserRole");
  const newUserPassword = document.getElementById("newUserPassword");

  // Modal Reset Password
  const modalResetPassword = document.getElementById("modalResetPassword");
  const btnCloseResetPasswordModal = document.getElementById("btnCloseResetPasswordModal");
  const btnCancelResetPassword = document.getElementById("btnCancelResetPassword");
  const btnSaveResetPassword = document.getElementById("btnSaveResetPassword");
  const resetPwdUserName = document.getElementById("resetPwdUserName");
  const resetPwdUserEmail = document.getElementById("resetPwdUserEmail");
  const inputNewPassword = document.getElementById("inputNewPassword");
  const btnGenerateRandomPwd = document.getElementById("btnGenerateRandomPwd");

  // Modal Edit User
  const modalEditUser = document.getElementById("modalEditUser");
  const btnCloseEditUserModal = document.getElementById("btnCloseEditUserModal");
  const btnCancelEditUser = document.getElementById("btnCancelEditUser");
  const btnSaveEditUser = document.getElementById("btnSaveEditUser");
  const editUserName = document.getElementById("editUserName");
  const editUserEmail = document.getElementById("editUserEmail");
  const editUserPhone = document.getElementById("editUserPhone");
  const editUserDept = document.getElementById("editUserDept");
  const editUserRole = document.getElementById("editUserRole");

  // Modal Email Settings
  const modalEmailSettings = document.getElementById("modalEmailSettings");
  const btnOpenEmailSettings = document.getElementById("btnOpenEmailSettings");
  const btnCloseEmailSettings = document.getElementById("btnCloseEmailSettings");
  const btnCloseEmailSettingsFooter = document.getElementById("btnCloseEmailSettingsFooter");
  const settingEmailMode = document.getElementById("settingEmailMode");
  const settingSenderName = document.getElementById("settingSenderName");
  const settingSenderAddress = document.getElementById("settingSenderAddress");
  const settingAdminAlertEmail = document.getElementById("settingAdminAlertEmail");
  const smtpFieldsContainer = document.getElementById("smtpFieldsContainer");
  const settingSmtpServer = document.getElementById("settingSmtpServer");
  const settingSmtpPort = document.getElementById("settingSmtpPort");
  const settingSmtpUser = document.getElementById("settingSmtpUser");
  const settingSmtpPassword = document.getElementById("settingSmtpPassword");
  const emailTestStatusArea = document.getElementById("emailTestStatusArea");
  const btnTestEmailConnection = document.getElementById("btnTestEmailConnection");
  const btnSaveEmailSettings = document.getElementById("btnSaveEmailSettings");

  // Botón Backup y Modal Analytics
  const btnDownloadBackup = document.getElementById("btnDownloadBackup");
  const btnOpenAnalytics = document.getElementById("btnOpenAnalytics");
  const modalAnalyticsDashboard = document.getElementById("modalAnalyticsDashboard");
  const btnCloseAnalytics = document.getElementById("btnCloseAnalytics");
  const btnCloseAnalyticsFooter = document.getElementById("btnCloseAnalyticsFooter");
  const kpiSla = document.getElementById("kpiSla");
  const kpiCsat = document.getElementById("kpiCsat");

  // Elementos Analytics Modal
  const analyticsAvgResolution = document.getElementById("analyticsAvgResolution");
  const analyticsAvgResponse = document.getElementById("analyticsAvgResponse");
  const analyticsCsatScore = document.getElementById("analyticsCsatScore");
  const analyticsCsatCount = document.getElementById("analyticsCsatCount");
  const analyticsResolutionRate = document.getElementById("analyticsResolutionRate");
  const analyticsTotalResolved = document.getElementById("analyticsTotalResolved");
  const analyticsModulesBars = document.getElementById("analyticsModulesBars");
  const analyticsTypesBars = document.getElementById("analyticsTypesBars");
  const analyticsMonthlyTable = document.getElementById("analyticsMonthlyTable");

  // Elementos CSAT y Chat en Modal Ticket
  const adminModalCsatDisplay = document.getElementById("adminModalCsatDisplay");
  const adminModalCsatStars = document.getElementById("adminModalCsatStars");
  const adminModalCsatScore = document.getElementById("adminModalCsatScore");
  const adminModalCsatComment = document.getElementById("adminModalCsatComment");
  const adminChatFeed = document.getElementById("adminChatFeed");
  const adminChatMessageInput = document.getElementById("adminChatMessageInput");
  const btnAdminSendComment = document.getElementById("btnAdminSendComment");
  const adminChatCountBadge = document.getElementById("adminChatCountBadge");
  const adminChatPastedPreview = document.getElementById("adminChatPastedPreview");
  const adminChatPastedThumb = document.getElementById("adminChatPastedThumb");
  const btnAdminDiscardPasted = document.getElementById("btnAdminDiscardPasted");
  const btnAdminStickerTrigger = document.getElementById("btnAdminStickerTrigger");
  const adminStickerPopover = document.getElementById("adminStickerPopover");

  // ── Catálogo Corporativo de Paquetes de Stickers estilo WhatsApp ──────────
  const STICKER_PACKS = [
    {
      id: 'aquashield',
      name: 'AquaShield & Soporte',
      icon: '🛡️',
      stickers: [
        { emoji: '🛡️', title: 'AquaShield Guard', desc: '¡AquaShield al Rescate!' },
        { emoji: '🐟', title: 'AquaChile', desc: 'Calidad AquaChile' },
        { emoji: '🚀', title: 'Desplegado', desc: '¡Cambio listo en producción!' },
        { emoji: '🔍', title: 'En Revisión', desc: 'Analizando causa raíz...' },
        { emoji: '⚠️', title: 'Falla Crítica', desc: 'Atención prioritaria' },
        { emoji: '📊', title: 'SAP / Excel', desc: 'Verificando cuadratura' },
        { emoji: '✅', title: 'Resuelto', desc: '¡Problema solucionado!' },
        { emoji: '☕', title: 'En Proceso', desc: 'Trabajando en el caso...' },
        { emoji: '🔒', title: 'Accesos OK', desc: 'Permisos asignados' },
        { emoji: '📦', title: 'Logística', desc: 'En gestión de embarque' },
        { emoji: '🔄', title: 'Actualizando', desc: 'Aplicando parches de sistema' },
        { emoji: '🎯', title: 'En la Mira', desc: 'Monitoreando comportamiento' }
      ]
    },
    {
      id: 'oficina',
      name: 'Oficina & Trabajo',
      icon: '💼',
      stickers: [
        { emoji: '💻', title: 'Modo Código', desc: 'Desarrollando solución...' },
        { emoji: '📋', title: 'Visto Bueno', desc: 'Revisado y aprobado' },
        { emoji: '⏳', title: 'A la Espera', desc: 'Esperando respuesta' },
        { emoji: '📞', title: 'Reunión / Call', desc: 'Coordinemos por Teams' },
        { emoji: '🛑', title: 'Bloqueante', desc: 'Detenido por insumos' },
        { emoji: '📈', title: '100% Cuadrado', desc: 'Métricas conformes' },
        { emoji: '💡', title: 'Buena Idea', desc: 'Sugerencia anotada' },
        { emoji: '⚡', title: 'Al Tiro', desc: 'En ejecución inmediata' },
        { emoji: '🤝', title: 'Trato Hecho', desc: 'Compromiso acordado' },
        { emoji: '📑', title: 'Documentando', desc: 'Dejando registro' }
      ]
    },
    {
      id: 'reacciones',
      name: 'Memes & Reacciones',
      icon: '😂',
      stickers: [
        { emoji: '🫡', title: 'A la Orden', desc: 'Entendido y acatado' },
        { emoji: '🤯', title: '¡No te creo!', desc: 'Falla insólita detectada' },
        { emoji: '🧐', title: 'Sospechoso', desc: 'Revisando inconsistencia' },
        { emoji: '🚒', title: 'Apagando Fuegos', desc: 'Emergencia en curso' },
        { emoji: '🤹', title: 'Haciendo Magia', desc: 'Arreglando la base de datos' },
        { emoji: '🍕', title: 'Colación', desc: 'En horario de almuerzo' },
        { emoji: '🥳', title: '¡Golazo!', desc: 'Funcionó a la primera' },
        { emoji: '🧘', title: 'Modo Zen', desc: 'Manteniendo la calma' },
        { emoji: '👀', title: 'Ojo al Charqui', desc: 'Atento a los detalles' },
        { emoji: '🦾', title: 'Todo Poderoso', desc: 'Servidor restaurado' }
      ]
    },
    {
      id: 'mascotas',
      name: 'AquaMascotas',
      icon: '🐾',
      stickers: [
        { emoji: '🐱', title: 'Michi SysAdmin', desc: 'Escribiendo comandos rápidos' },
        { emoji: '🐶', title: 'Perrito Fino', desc: 'Todo bajo control' },
        { emoji: '🐧', title: 'Pingüino Linux', desc: 'Servidor 100% estable' },
        { emoji: '🦉', title: 'Búho de Turno', desc: 'Soporte fuera de horario' },
        { emoji: '🦆', title: 'Patito Debug', desc: 'Explicando el error paso a paso' },
        { emoji: '🦦', title: 'Nutria Feliz', desc: 'Deploy sin errores' }
      ]
    },
    {
      id: 'celebracion',
      name: 'Agradecimientos & Éxito',
      icon: '🎉',
      stickers: [
        { emoji: '🎉', title: '¡Muchas Gracias!', desc: 'Agradecido por la gestión' },
        { emoji: '🏆', title: 'Servicio 5 Estrellas', desc: 'Atención impecable' },
        { emoji: '👏', title: '¡Seco / Seca!', desc: 'Excelente resolución' },
        { emoji: '✨', title: 'De Lujo', desc: '10 de 10 el requerimiento' },
        { emoji: '🙌', title: 'Salvó el Día', desc: 'Problema crítico resuelto' },
        { emoji: '💯', title: 'Conformidad Total', desc: 'Ticket cerrado con éxito' }
      ]
    }
  ];

  // ── Catálogo Completo de Emojis WhatsApp Categorizados ─────────────────────
  const EMOJI_CATEGORIES = [
    {
      id: 'faces',
      name: 'Caritas',
      icon: '😀',
      emojis: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '😉', '😌', '😍', '🥰', '😘', '😋', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕']
    },
    {
      id: 'hands',
      name: 'Gestos',
      icon: '👍',
      emojis: ['👍', '👎', '👌', '🤌', '🤏', '✌️', '🤞', '🫰', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👋', '🤚', '🖐️', '✋', '🖖', '🫱', '🫲', '🫸', '🫷', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💅', '🤳', '💪', '🦾', '🦿', '🦵', '🦶', '👂', '👃', '🧠', '🫀', '🫁', '👀', '👁️', '👅', '👄']
    },
    {
      id: 'work',
      name: 'Oficina & Tech',
      icon: '💻',
      emojis: ['💻', '🖥️', '🖨️', '⌨️', '🖱️', '📱', '📲', '☎️', '📞', '📟', '📠', '🔋', '🔌', '💾', '💿', '📀', '💡', '🔦', '🕯️', '🧯', '🛢️', '💸', '💵', '💶', '💰', '💳', '💎', '⚖️', '🧰', '🔧', '🔨', '⚒️', '🛠️', '⛏️', '🔩', '⚙️', '🧱', '⛓️', '🧲', '💣', '🛡️', '📦', '🏷️', '📫', '📬', '📭', '📜', '📃', '📄', '📑', '📊', '📈', '📉', '🗒️', '🗓️', '📅', '📆', '📁', '📂', '🗂️', '🗞️', '📰', '📓', '📕', '📗', '📘', '📙', '📚', '📖', '🔖', '🔗', '📎', '🖇️', '📐', '📏', '📌', '📍', '✂️', '🖊️', '🖋️', '📝', '✏️', '🔍', '🔎', '🔒', '🔓']
    },
    {
      id: 'symbols',
      name: 'AquaChile & Símbolos',
      icon: '🐟',
      emojis: ['🐟', '🐠', '🐡', '🦈', '🐙', '🦑', '🦐', '🦞', '🦀', '🐳', '🐋', '🐬', '🦭', '⚓', '🚢', '⛴️', '🌊', '💧', '💦', '❄️', '🧊', '⭐', '🌟', '✨', '⚡', '🔥', '💥', '✅', '❌', '⚠️', '⛔', '🚫', '🔴', '🟢', '🔵', '🟡', '🟠', '🟣', '⚫', '⚪', '🟩', '🟦', '🟨', '🟧', '🟪', '⬛', '⬜', '💯', '🚀', '🎯', '🚩', '🏁', '🥇', '🥈', '🥉', '🏆', '🎉', '🎊', '🎈', '🎁', '☕', '🍵', '🧃', '🥤', '🍺', '🍻', '🥂', '🍷', '🍕', '🍔', '🍟', '🥪']
    }
  ];

  function escapeHtml(text) {
    if (!text) return "";
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  function insertTextAtCaret(inputEl, text) {
    if (!inputEl) return;
    const start = inputEl.selectionStart !== undefined ? inputEl.selectionStart : inputEl.value.length;
    const end = inputEl.selectionEnd !== undefined ? inputEl.selectionEnd : inputEl.value.length;
    const val = inputEl.value;
    inputEl.value = val.substring(0, start) + text + val.substring(end, val.length);
    const newPos = start + text.length;
    if (inputEl.setSelectionRange) {
      inputEl.setSelectionRange(newPos, newPos);
    }
    inputEl.focus();
  }

  function formatChatMessageContent(message, imageUrl) {
    let contentHtml = "";
    
    // Detectar sticker [STICKER: emoji | title | desc]
    const stickerMatch = message && message.match(/^\[STICKER:\s*([^\s|]+)\s*\|\s*([^|]+)\|\s*([^\]]+)\]$/);
    if (stickerMatch) {
      const [_, emoji, title, desc] = stickerMatch;
      contentHtml = `
        <div class="chat-sticker-bubble-card">
          <div class="chat-sticker-bubble-emoji">${emoji}</div>
          <div class="chat-sticker-bubble-title">${escapeHtml(title.trim())}</div>
          <div class="chat-sticker-bubble-desc">${escapeHtml(desc.trim())}</div>
        </div>
      `;
    } else if (message) {
      contentHtml = `<div style="line-height: 1.35; white-space: pre-wrap;">${escapeHtml(message)}</div>`;
    }

    if (imageUrl) {
      contentHtml += `
        <div class="chat-bubble-image-wrap" data-img-url="${imageUrl}">
          <img src="${imageUrl}" alt="Captura adjunta" loading="lazy">
          <div class="chat-bubble-image-overlay">🔍 Ver Pantallazo</div>
        </div>
      `;
    }

    return contentHtml;
  }

  function setupStickerPopover(popoverEl, triggerBtn, targetInputEl, onSelectSticker) {
    if (!popoverEl || !triggerBtn) return;

    let currentMainTab = 'stickers';
    let currentPackId = STICKER_PACKS[0].id;
    let currentEmojiCatId = EMOJI_CATEGORIES[0].id;

    function renderPopover() {
      if (currentMainTab === 'stickers') {
        const activePack = STICKER_PACKS.find(p => p.id === currentPackId) || STICKER_PACKS[0];
        popoverEl.innerHTML = `
          <div class="sticker-popover-header">
            <div class="sticker-popover-tabs">
              <button type="button" class="sticker-tab-btn active" data-main-tab="stickers">🏷️ Paquetes Stickers</button>
              <button type="button" class="sticker-tab-btn" data-main-tab="emojis">😊 Emojis WhatsApp</button>
            </div>
            <button type="button" class="chat-pasted-remove-btn btn-close-popover" title="Cerrar">&times;</button>
          </div>

          <!-- Selector de Paquetes estilo WhatsApp -->
          <div class="sticker-packs-nav">
            ${STICKER_PACKS.map(p => `
              <button type="button" class="sticker-pack-pill ${p.id === activePack.id ? 'active' : ''}" data-pack-id="${p.id}">
                <span>${p.icon}</span>
                <span>${p.name.split(' ')[0]}</span>
              </button>
            `).join('')}
          </div>

          <div class="sticker-popover-body">
            <div class="sticker-pack-title-header">
              <span>${activePack.icon} ${activePack.name}</span>
              <span style="font-size: 0.65rem; color: var(--text-secondary); font-weight: normal;">${activePack.stickers.length} stickers</span>
            </div>
            <div class="sticker-grid">
              ${activePack.stickers.map(s => `
                <div class="sticker-card" data-emoji="${s.emoji}" data-title="${s.title}" data-desc="${s.desc}">
                  <div class="sticker-card-emoji">${s.emoji}</div>
                  <div class="sticker-card-title">${s.title}</div>
                  <div class="sticker-card-desc">${s.desc}</div>
                </div>
              `).join('')}
            </div>
          </div>
        `;
      } else {
        const activeCat = EMOJI_CATEGORIES.find(c => c.id === currentEmojiCatId) || EMOJI_CATEGORIES[0];
        popoverEl.innerHTML = `
          <div class="sticker-popover-header">
            <div class="sticker-popover-tabs">
              <button type="button" class="sticker-tab-btn" data-main-tab="stickers">🏷️ Paquetes Stickers</button>
              <button type="button" class="sticker-tab-btn active" data-main-tab="emojis">😊 Emojis WhatsApp</button>
            </div>
            <button type="button" class="chat-pasted-remove-btn btn-close-popover" title="Cerrar">&times;</button>
          </div>

          <!-- Selector de Categorías de Emojis -->
          <div class="sticker-packs-nav">
            ${EMOJI_CATEGORIES.map(c => `
              <button type="button" class="sticker-pack-pill ${c.id === activeCat.id ? 'active' : ''}" data-emoji-cat-id="${c.id}">
                <span>${c.icon}</span>
                <span>${c.name.split(' ')[0]}</span>
              </button>
            `).join('')}
          </div>

          <div class="sticker-popover-body">
            <div class="sticker-pack-title-header">
              <span>${activeCat.icon} ${activeCat.name}</span>
              <span style="font-size: 0.65rem; color: var(--text-secondary); font-weight: normal;">Haz clic para insertar</span>
            </div>
            <div class="emoji-grid">
              ${activeCat.emojis.map(em => `
                <button type="button" class="emoji-quick-btn" data-emoji="${em}">${em}</button>
              `).join('')}
            </div>
          </div>
        `;
      }

      // Eventos de Pestaña Principal (Stickers vs Emojis)
      popoverEl.querySelectorAll('.sticker-tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          currentMainTab = btn.getAttribute('data-main-tab');
          renderPopover();
        });
      });

      // Botón Cerrar
      popoverEl.querySelector('.btn-close-popover').addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        popoverEl.classList.remove('active');
      });

      // Eventos de Paquetes de Stickers
      popoverEl.querySelectorAll('.sticker-pack-pill[data-pack-id]').forEach(pill => {
        pill.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          currentPackId = pill.getAttribute('data-pack-id');
          renderPopover();
        });
      });

      // Eventos de Categorías de Emojis
      popoverEl.querySelectorAll('.sticker-pack-pill[data-emoji-cat-id]').forEach(pill => {
        pill.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          currentEmojiCatId = pill.getAttribute('data-emoji-cat-id');
          renderPopover();
        });
      });

      // Click en Sticker -> Enviar inmediatamente
      popoverEl.querySelectorAll('.sticker-card').forEach(card => {
        card.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          const emoji = card.getAttribute('data-emoji');
          const title = card.getAttribute('data-title');
          const desc = card.getAttribute('data-desc');
          popoverEl.classList.remove('active');
          if (onSelectSticker) {
            onSelectSticker(`[STICKER: ${emoji} | ${title} | ${desc}]`);
          }
        });
      });

      // Click en Emoji -> Insertar en el input sin cerrar el popover
      popoverEl.querySelectorAll('.emoji-quick-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          const em = btn.getAttribute('data-emoji');
          if (targetInputEl && em) {
            insertTextAtCaret(targetInputEl, em);
          }
        });
      });
    }

    triggerBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const isAct = popoverEl.classList.contains('active');
      document.querySelectorAll('.chat-sticker-popover').forEach(p => p.classList.remove('active'));
      if (!isAct) {
        renderPopover();
        popoverEl.classList.add('active');
      }
    });

    document.addEventListener('click', (e) => {
      if (!popoverEl.contains(e.target) && e.target !== triggerBtn) {
        popoverEl.classList.remove('active');
      }
    });
  }

  function setupClipboardPaste(inputEl, previewBarEl, thumbImgEl, discardBtn, onPasteCallback) {
    let currentPastedBase64 = null;

    function clearPasted() {
      currentPastedBase64 = null;
      if (previewBarEl) previewBarEl.style.display = 'none';
      if (thumbImgEl) thumbImgEl.src = '';
    }

    if (discardBtn) {
      discardBtn.addEventListener('click', clearPasted);
    }

    if (inputEl) {
      inputEl.addEventListener('paste', (e) => {
        const items = (e.clipboardData || window.clipboardData).items;
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf('image') !== -1) {
            e.preventDefault();
            const file = items[i].getAsFile();
            const reader = new FileReader();
            reader.onload = function(evt) {
              currentPastedBase64 = evt.target.result;
              if (thumbImgEl) thumbImgEl.src = currentPastedBase64;
              if (previewBarEl) previewBarEl.style.display = 'flex';
              if (onPasteCallback) onPasteCallback(currentPastedBase64);
            };
            reader.readAsDataURL(file);
            break;
          }
        }
      });
    }

    return {
      getPastedImage: () => currentPastedBase64,
      clear: clearPasted
    };
  }

  // Filtros Avanzados (Fechas, Tags, Pin, Excel Filtrado)
  const filterDateFrom = document.getElementById("filterDateFrom");
  const filterDateTo = document.getElementById("filterDateTo");
  const filterTagInput = document.getElementById("filterTagInput");
  const btnExportExcelFiltered = document.getElementById("btnExportExcelFiltered");
  const adminTicketTagsInput = document.getElementById("adminTicketTagsInput");
  const btnSaveTicketTags = document.getElementById("btnSaveTicketTags");
  const btnTogglePinTicket = document.getElementById("btnTogglePinTicket");
  const pinTicketIcon = document.getElementById("pinTicketIcon");
  const pinTicketText = document.getElementById("pinTicketText");

  let currentActiveTicketId = null;
  let currentTargetUserId = null;
  let currentAdminTicketObj = null;
  let previousOpenCount = null;

  // ── 3. Cargar KPIs y Módulos de Filtro ────────────────────────────────────
  async function loadKPIs() {
    try {
      let kpisLoaded = false;
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        const response = await fetch(API_BASE + "/api/stats", { signal: controller.signal });
        clearTimeout(timeoutId);
        const data = await response.json();
        if (data.success) {
          kpiTotal.textContent = data.stats.total || 0;
          kpiAbiertos.textContent = data.stats.abierto || 0;
          kpiProceso.textContent = data.stats.en_proceso || 0;
          kpiResueltos.textContent = data.stats.resuelto || 0;
          kpisLoaded = true;
        }
      } catch (e) {}

      if (!kpisLoaded && cachedTicketsList.length > 0) {
        const total = cachedTicketsList.length;
        const abiertos = cachedTicketsList.filter(t => t.status === "abierto").length;
        const proceso = cachedTicketsList.filter(t => ["en_analisis", "en_desarrollo"].includes(t.status)).length;
        const resueltos = cachedTicketsList.filter(t => t.status === "resuelto").length;
        kpiTotal.textContent = total;
        kpiAbiertos.textContent = abiertos;
        kpiProceso.textContent = proceso;
        kpiResueltos.textContent = resueltos;
      }

      // Cargar SLA y CSAT desde analíticas
      const r2 = await fetch(API_BASE + "/api/admin/analytics");
      const d2 = await r2.json();
      if (d2.success && d2.analytics) {
        const a = d2.analytics;
        if (kpiSla) kpiSla.textContent = `~${a.sla.avg_resolution_hours}h`;
        if (kpiCsat) kpiCsat.textContent = `⭐ ${a.csat.avg_rating}`;
      }
    } catch (err) {
      console.error("Error al cargar KPIs:", err);
    }
  }

  // ── Sistema de Sonido y Notificación de Escritorio ───────────────────────
  function playChimeSound() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.12);
        gain.gain.setValueAtTime(0.12, ctx.currentTime + idx * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.12 + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.12);
        osc.stop(ctx.currentTime + idx * 0.12 + 0.36);
      });
    } catch (e) {
      console.warn("AudioContext no disponible:", e);
    }
  }

  function showDesktopNotification() {
    if ("Notification" in window) {
      if (Notification.permission === "granted") {
        new Notification("🛡️ AquaShield · Mesa de Ayuda", {
          body: "Se ha recibido un nuevo requerimiento en la plataforma.",
          icon: "/static/img/favicon.ico"
        });
      } else if (Notification.permission !== "denied") {
        Notification.requestPermission();
      }
    }
  }

  // Solicitar permiso de notificaciones con la primera interacción del usuario
  document.addEventListener("click", () => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, { once: true });

  async function loadFilterModules() {
    try {
      const currentSelected = filterModule.value;
      const DEFAULT_MODULES = [
        { id: 1, name: "Módulo Congelado" }, { id: 2, name: "Módulo Fresco" },
        { id: 3, name: "Módulo Proformas" }, { id: 4, name: "Módulo Seguros" },
        { id: 5, name: "Módulo ExportDesk" }, { id: 7, name: "Agente Correos" },
        { id: 8, name: "Módulo Termógrafo" }, { id: 9, name: "Módulo Validador HC" },
        { id: 10, name: "Módulo Invoice Converter" }, { id: 11, name: "Módulo ISF" },
        { id: 13, name: "Módulo Carga Neppex" }, { id: 14, name: "Módulo LabelInspect" },
        { id: 18, name: "Otro / General" }
      ];
      let mods = DEFAULT_MODULES;
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        const response = await fetch(API_BASE + "/api/modules", { signal: controller.signal });
        clearTimeout(timeoutId);
        const data = await response.json();
        if (data.success && data.modules && data.modules.length > 0) mods = data.modules;
      } catch (e) {}

      filterModule.innerHTML = '<option value="todos">Todos los Módulos</option>';
      mods.forEach(m => {
        const opt = document.createElement("option");
        opt.value = m.id;
        opt.textContent = m.name;
        if (currentSelected && currentSelected == m.id) {
          opt.selected = true;
        }
        filterModule.appendChild(opt);
      });
    } catch (err) {
      console.error("Error al cargar módulos de filtro:", err);
    }
  }

  // ── 4. Cargar y Renderizar Tickets ───────────────────────────────────────
  async function loadTickets(isSilent = false) {
    try {
      // Si el usuario está arrastrando una tarjeta en Kanban, no interrumpir con auto-recarga
      if (isSilent && document.querySelector(".kanban-card.dragging")) return;

      const params = new URLSearchParams();
      
      const status = filterStatus.value;
      if (status !== "todos") params.append("status", status);

      const moduleId = filterModule.value;
      if (moduleId !== "todos") params.append("module_id", moduleId);

      const assignee = filterAssignee ? filterAssignee.value : "todos";
      if (assignee && assignee !== "todos") params.append("assigned_to", assignee);

      const search = adminSearchInput.value.trim();
      if (search) params.append("search", search);

      const dateFrom = filterDateFrom ? filterDateFrom.value : "";
      if (dateFrom) params.append("date_from", dateFrom);

      const dateTo = filterDateTo ? filterDateTo.value : "";
      if (dateTo) params.append("date_to", dateTo);

      if (!isSilent && currentViewMode === "table") {
        ticketsTableBody.innerHTML = `
          <tr>
            <td colspan="11" style="text-align: center; padding: 40px; color: var(--text-secondary);">
              ⏳ Cargando tickets...
            </td>
          </tr>
        `;
      }

      let tickets = [];
      let loaded = false;
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2500);
        const response = await fetch(API_BASE + `/api/tickets?${params.toString()}`, { signal: controller.signal });
        clearTimeout(timeoutId);
        const data = await response.json();
        if (data.success && Array.isArray(data.tickets)) {
          tickets = data.tickets;
          loaded = true;
        }
      } catch (e) {}

      if (!loaded) {
        try {
          const ghRes = await fetch("static/data/tickets.json?v=" + Date.now());
          if (ghRes.ok) {
            tickets = await ghRes.json();
            loaded = true;
          }
        } catch (ghErr) {}
      }

      if (loaded) {
        cachedTicketsList = tickets;
        if (currentViewMode === "kanban") {
          renderKanban(cachedTicketsList);
        } else {
          renderTicketsTable(cachedTicketsList);
        }
        loadKPIs();
      } else if (!isSilent) {
        ticketsTableBody.innerHTML = `
          <tr>
            <td colspan="11" style="text-align: center; padding: 30px; color: #D32F2F;">
              No se pudieron obtener tickets del servidor ni de GitHub.
            </td>
          </tr>
        `;
      }
    } catch (err) {
      console.error("Error al cargar tickets:", err);
    }
  }

  function formatBytes(bytes) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  function getFileIcon(filename) {
    const ext = filename.split(".").pop().toLowerCase();
    if (["pdf"].includes(ext)) return "📄";
    if (["xlsx", "xls", "csv"].includes(ext)) return "📊";
    if (["docx", "doc"].includes(ext)) return "📝";
    if (["png", "jpg", "jpeg", "gif", "webp"].includes(ext)) return "🖼️";
    if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) return "📦";
    return "📎";
  }

  const statusConfig = {
    abierto: { label: "Abierto", class: "abierto", icon: "📬" },
    en_analisis: { label: "En Análisis", class: "en_analisis", icon: "🔍" },
    en_desarrollo: { label: "En Desarrollo", class: "en_desarrollo", icon: "⚡" },
    resuelto: { label: "Resuelto", class: "resuelto", icon: "✅" },
    descartado: { label: "Descartado", class: "descartado", icon: "❌" }
  };

  const priorityColors = {
    baja: "#546E7A",
    media: "#0288D1",
    alta: "#ED6C02",
    critica: "#D32F2F"
  };

  function renderTicketsTable(tickets) {
    if (!tickets || tickets.length === 0) {
      ticketsTableBody.innerHTML = `
        <tr>
          <td colspan="11" style="text-align: center; padding: 40px; color: var(--text-secondary);">
            <div style="font-size: 2rem; margin-bottom: 8px;">📭</div>
            No se encontraron tickets con los filtros seleccionados
          </td>
        </tr>
      `;
      return;
    }

    ticketsTableBody.innerHTML = "";

    tickets.forEach(t => {
      const tr = document.createElement("tr");
      const st = statusConfig[t.status] || { label: t.status, class: "abierto", icon: "📌" };
      const prColor = priorityColors[t.priority] || "#445563";
      
      const attCount = t.attachments_count || 0;
      const attBadge = attCount > 0 
        ? `<span style="display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; background-color: var(--color-accent-soft); color: var(--color-accent); border-radius: 10px; font-weight: 700; font-size: 0.8rem;">📎 ${attCount}</span>`
        : `<span style="color: var(--text-secondary); font-size: 0.8rem;">-</span>`;

      // Tags HTML
      let tagsHtml = "";
      if (t.tags && t.tags.trim()) {
        tagsHtml = `
          <div style="display: flex; gap: 4px; margin-top: 3px; flex-wrap: wrap;">
            ${t.tags.split(",").map(tag => `<span style="font-size: 0.68rem; background: var(--bg-card-secondary); color: var(--color-accent); padding: 1px 6px; border-radius: 6px; border: 1px solid var(--border-color); font-weight: 700;">${escapeHtml(tag.trim())}</span>`).join("")}
          </div>
        `;
      }

      if (t.is_pinned) {
        tr.style.backgroundColor = "rgba(235, 95, 10, 0.05)";
        tr.style.borderLeft = "3px solid var(--color-accent)";
      }

      const assigneeBadge = t.assigned_to 
        ? `<span style="display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; background-color: var(--bg-card-secondary); border: 1px solid var(--border-color); border-radius: 10px; font-size: 0.76rem; font-weight: 600;">🧑‍💻 ${escapeHtml(t.assigned_to.split(' ')[0])}</span>`
        : `<span style="color: var(--text-secondary); font-size: 0.76rem;">Sin asignar</span>`;

      tr.innerHTML = `
        <td>
          <div style="display: flex; align-items: center; gap: 4px;">
            ${t.is_pinned ? '<span title="Ticket fijado al inicio" style="font-size: 0.85rem;">📌</span>' : ''}
            <strong style="color: var(--color-accent); font-family: 'Quicksand', sans-serif; font-size: 0.95rem;">${escapeHtml(t.code)}</strong>
          </div>
        </td>
        <td style="font-size: 0.82rem; color: var(--text-secondary); white-space: nowrap;">${escapeHtml(t.created_at ? t.created_at.split(" ")[0] : '')}</td>
        <td>
          <div style="font-weight: 700;">${escapeHtml(t.requester_name)}</div>
          <div style="font-size: 0.76rem; color: var(--text-secondary);">${escapeHtml(t.requester_email)}</div>
        </td>
        <td><span style="font-weight: 700; color: var(--text-primary);">${escapeHtml(t.module_name)}</span></td>
        <td><span style="font-size: 0.8rem; text-transform: uppercase;">${escapeHtml(t.type)}</span></td>
        <td>
          <span style="font-weight: 700; color: ${prColor}; font-size: 0.82rem; text-transform: uppercase;">
            ● ${escapeHtml(t.priority)}
          </span>
        </td>
        <td>${assigneeBadge}</td>
        <td style="max-width: 260px;">
          <div style="font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${escapeHtml(t.title)}">${escapeHtml(t.title)}</div>
          ${tagsHtml}
        </td>
        <td style="text-align: center;">${attBadge}</td>
        <td><span class="status-badge ${st.class}">${st.icon} ${escapeHtml(st.label)}</span></td>
        <td style="text-align: center; white-space: nowrap;">
          <button type="button" class="btn-secondary btn-table-chat" data-id="${t.id}" style="padding: 4px 8px; font-size: 0.76rem; margin-right: 3px;" title="Abrir chat flotante">
            💬 Chat
          </button>
          <button type="button" class="btn-secondary btn-table-view" data-id="${t.id}" style="padding: 4px 8px; font-size: 0.76rem;" title="Ver y gestionar ticket">
            👁️ Ver
          </button>
        </td>
      `;

      const btnChat = tr.querySelector(".btn-table-chat");
      if (btnChat) {
        btnChat.addEventListener("click", (e) => {
          e.stopPropagation();
          openFloatingChat(t.id, t.code, t.requester_name);
        });
      }

      const btnView = tr.querySelector(".btn-table-view");
      if (btnView) {
        btnView.addEventListener("click", (e) => {
          e.stopPropagation();
          openTicketDetail(t.id);
        });
      }

      tr.addEventListener("click", () => openTicketDetail(t.id));
      ticketsTableBody.appendChild(tr);
    });
  }

  // ── 5. Modal de Detalle de Ticket ────────────────────────────────────────
  async function openTicketDetail(ticketId) {
    try {
      currentActiveTicketId = ticketId;

      const response = await fetch(API_BASE + `/api/tickets/${ticketId}`);
      const data = await response.json();

      if (!data.success) {
        alert("Error al cargar el detalle del ticket");
        return;
      }

      const t = data.ticket;
      const st = statusConfig[t.status] || { label: t.status, class: "abierto", icon: "📌" };

      modalTicketCode.textContent = t.code;
      modalTicketDate.textContent = `Registrado el ${t.created_at}`;
      modalRequesterName.textContent = t.requester_name;
      modalRequesterEmail.textContent = t.requester_email;
      modalRequesterPhone.textContent = t.requester_phone || "No especificado";

      modalModuleName.textContent = t.module_name;
      modalTicketType.innerHTML = `Tipo: <strong>${t.type.toUpperCase()}</strong>`;
      modalTicketPriority.innerHTML = `Prioridad: <strong style="color: ${priorityColors[t.priority] || 'inherit'}">${t.priority.toUpperCase()}</strong>`;
      modalTicketStatus.innerHTML = `<span class="status-badge ${st.class}">${st.icon} ${st.label}</span>`;

      modalTicketTitle.textContent = t.title;
      modalTicketDesc.textContent = t.description;

      editStatusSelect.value = t.status;
      editPrioritySelect.value = t.priority;
      if (editAssigneeSelect) editAssigneeSelect.value = t.assigned_to || "";
      editResolutionNotes.value = t.resolution_notes || "";

      // Time Tracking
      const timeLogs = t.time_logs || [];
      const totalMins = t.time_spent_minutes || 0;
      if (modalTotalTimeBadge) {
        modalTotalTimeBadge.textContent = `Total: ${totalMins} min (${(totalMins/60).toFixed(1)}h)`;
      }
      if (modalTimeLogList) {
        if (timeLogs.length === 0) {
          modalTimeLogList.innerHTML = `<div style="text-align: center; color: var(--text-secondary); font-size: 0.78rem; padding: 6px;">No hay registros de tiempo aún.</div>`;
        } else {
          modalTimeLogList.innerHTML = timeLogs.map(tl => `
            <div class="time-log-item">
              <div>
                <strong style="color: var(--color-accent);">${tl.minutes} min</strong> — <span>${tl.description || 'Labor de soporte'}</span>
                <div style="font-size: 0.7rem; color: var(--text-secondary);">${tl.author} · ${tl.created_at}</div>
              </div>
            </div>
          `).join("");
        }
      }

      const atts = t.attachments || [];
      modalAttachmentCount.textContent = atts.length;

      if (atts.length > 0) {
        btnDownloadZip.style.display = "inline-flex";
        btnDownloadZip.href = `/api/tickets/${t.id}/download-zip`;
        
        modalAttachmentsList.innerHTML = atts.map(att => `
          <div class="attachment-item" style="background-color: var(--bg-card);">
            <div class="attachment-info">
              <span class="attachment-icon">${getFileIcon(att.original_name)}</span>
              <div>
                <span class="attachment-name" title="${escapeHtml(att.original_name)}">${escapeHtml(att.original_name)}</span>
                <span class="attachment-size">(${formatBytes(att.file_size)})</span>
              </div>
            </div>
            <div style="display: flex; gap: 6px;">
              <button type="button" class="btn-secondary btn-preview-att" data-url="/api/tickets/${t.id}/attachments/${att.id}/download" data-name="${escapeHtml(att.original_name)}" data-mime="${escapeHtml(att.mime_type || '')}" style="padding: 4px 10px; font-size: 0.8rem;" title="Previsualizar en pantalla">
                👁️ Ver
              </button>
              <a href="/api/tickets/${t.id}/attachments/${att.id}/download" class="btn-secondary" style="padding: 4px 10px; font-size: 0.8rem; text-decoration: none;" title="Descargar este archivo">
                ⬇️ Descargar
              </a>
            </div>
          </div>
        `).join("");

        modalAttachmentsList.querySelectorAll(".btn-preview-att").forEach(btn => {
          btn.addEventListener("click", () => {
            const url = btn.getAttribute("data-url");
            const name = btn.getAttribute("data-name");
            const mime = btn.getAttribute("data-mime");
            openLightbox(url, name, mime);
          });
        });
      } else {
        btnDownloadZip.style.display = "none";
        modalAttachmentsList.innerHTML = `
          <div style="font-size: 0.85rem; color: var(--text-secondary); text-align: center; padding: 12px;">
            Este ticket no incluye archivos adjuntos.
          </div>
        `;
      }

      const logs = t.logs || [];
      if (logs.length > 0) {
        modalLogsList.innerHTML = logs.map(l => `
          <div style="margin-bottom: 6px; padding-bottom: 6px; border-bottom: 1px dashed var(--border-color);">
            <div style="display: flex; justify-content: space-between; font-weight: 700; color: var(--text-primary);">
              <span>${l.action} (${l.author})</span>
              <span style="font-size: 0.75rem; color: var(--text-secondary);">${l.created_at}</span>
            </div>
            <div style="color: var(--text-secondary); font-size: 0.82rem; margin-top: 2px;">${l.details}</div>
          </div>
        `).join("");
      } else {
        modalLogsList.innerHTML = `<span style="color: var(--text-secondary);">Sin registros de auditoría adicionales.</span>`;
      }

      currentAdminTicketObj = t;

      // Poblar Tags y Estado de Fijado
      if (adminTicketTagsInput) adminTicketTagsInput.value = t.tags || "";
      if (pinTicketIcon && pinTicketText) {
        pinTicketIcon.textContent = t.is_pinned ? "📍" : "📌";
        pinTicketText.textContent = t.is_pinned ? "Desfijar" : "Fijar Arriba";
      }

      // Renderizar CSAT si existe
      if (t.rating && t.rating > 0) {
        adminModalCsatDisplay.style.display = "block";
        adminModalCsatStars.textContent = "★".repeat(t.rating) + "☆".repeat(5 - t.rating);
        adminModalCsatScore.textContent = `(${t.rating}.0 / 5.0)`;
        adminModalCsatComment.textContent = t.feedback_comment ? `"${t.feedback_comment}"` : "Sin comentarios adicionales del usuario.";
      } else {
        adminModalCsatDisplay.style.display = "none";
      }

      // Renderizar Chat Feed
      renderAdminChatFeed(t.comments || []);
      adminChatMessageInput.value = "";

      // Polling en vivo para el modal mientras esté abierto
      if (modalChatPoller) clearInterval(modalChatPoller);
      modalChatPoller = setInterval(async () => {
        if (modalTicketDetail.classList.contains("active") && currentActiveTicketId) {
          try {
            const response = await fetch(API_BASE + `/api/tickets/${currentActiveTicketId}/comments?mark_read_for=admin`);
            const data = await response.json();
            if (data.success && data.comments) {
              const prevCount = currentAdminTicketObj && currentAdminTicketObj.comments ? currentAdminTicketObj.comments.length : 0;
              if (data.comments.length > prevCount) {
                currentAdminTicketObj.comments = data.comments;
                renderAdminChatFeed(data.comments);
                playChimeSound();
              }
            }
          } catch (e) {}
        } else {
          clearInterval(modalChatPoller);
          modalChatPoller = null;
        }
      }, 3000);

      modalTicketDetail.classList.add("active");
    } catch (err) {
      console.error("Error al abrir detalle:", err);
      alert("Error de conexión");
    }
  }

  let modalChatPoller = null;

  const adminPasteHandler = setupClipboardPaste(
    adminChatMessageInput,
    adminChatPastedPreview,
    adminChatPastedThumb,
    btnAdminDiscardPasted
  );

  setupStickerPopover(
    adminStickerPopover,
    btnAdminStickerTrigger,
    adminChatMessageInput,
    (stickerText) => {
      adminChatMessageInput.value = stickerText;
      sendAdminChatMessage();
    }
  );

  function renderAdminChatFeed(comments) {
    adminChatCountBadge.textContent = `${comments.length} mensajes`;
    adminChatFeed.innerHTML = "";

    if (comments.length === 0) {
      adminChatFeed.innerHTML = `<div style="text-align: center; color: var(--text-secondary); font-size: 0.82rem; padding: 8px 0;">No hay mensajes registrados aún en este ticket.</div>`;
      return;
    }

    comments.forEach(c => {
      const isAdmin = c.author_role === "admin";
      const bubble = document.createElement("div");
      bubble.style.cssText = `
        display: flex;
        flex-direction: column;
        align-self: ${isAdmin ? 'flex-end' : 'flex-start'};
        max-width: 85%;
        background-color: ${isAdmin ? 'var(--color-accent-soft)' : 'var(--bg-card)'};
        border: 1px solid ${isAdmin ? 'var(--color-accent)' : 'var(--border-color)'};
        border-radius: ${isAdmin ? '10px 0 10px 10px' : '0 10px 10px 10px'};
        padding: 8px 12px;
        font-size: 0.86rem;
      `;

      bubble.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px; margin-bottom: 3px; font-size: 0.72rem;">
          <strong style="color: ${isAdmin ? 'var(--color-accent)' : 'var(--text-primary)'};">${isAdmin ? '🛡️ Tú (Soporte)' : '👤 ' + c.author_name}</strong>
          <span style="color: var(--text-secondary);">${c.created_at}</span>
        </div>
        ${formatChatMessageContent(c.message, c.image_url)}
      `;

      bubble.querySelectorAll(".chat-bubble-image-wrap").forEach(wrap => {
        wrap.addEventListener("click", () => {
          const imgUrl = wrap.getAttribute("data-img-url");
          openLightbox(imgUrl, "Captura de Pantalla", "image/png");
        });
      });

      adminChatFeed.appendChild(bubble);
    });

    adminChatFeed.scrollTop = adminChatFeed.scrollHeight;
  }

  async function sendAdminChatMessage() {
    if (!currentActiveTicketId || !currentAdminTicketObj) return;
    const msg = adminChatMessageInput.value.trim();
    const pastedImg = adminPasteHandler.getPastedImage();
    if (!msg && !pastedImg) return;

    try {
      btnAdminSendComment.disabled = true;

      const response = await fetch(API_BASE + `/api/tickets/${currentActiveTicketId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          author_name: "Marcelo Ramírez",
          author_email: "marcelo.ramirez@aquachile.com",
          author_role: "admin",
          message: msg,
          image_base64: pastedImg
        })
      });

      const data = await response.json();
      if (data.success && data.comment) {
        adminChatMessageInput.value = "";
        adminPasteHandler.clear();
        if (!currentAdminTicketObj.comments) currentAdminTicketObj.comments = [];
        currentAdminTicketObj.comments.push(data.comment);
        renderAdminChatFeed(currentAdminTicketObj.comments);
      } else {
        alert("Error al enviar mensaje: " + (data.error || ""));
      }
    } catch (err) {
      alert("Error de conexión al enviar mensaje");
    } finally {
      btnAdminSendComment.disabled = false;
    }
  }

  btnAdminSendComment.addEventListener("click", sendAdminChatMessage);
  adminChatMessageInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendAdminChatMessage();
    }
  });

  function closeDetailModal() {
    if (modalChatPoller) {
      clearInterval(modalChatPoller);
      modalChatPoller = null;
    }
    modalTicketDetail.classList.remove("active");
    currentActiveTicketId = null;
    currentAdminTicketObj = null;
    adminPasteHandler.clear();
  }

  btnCloseDetailModal.addEventListener("click", closeDetailModal);
  btnCloseDetailModalFooter.addEventListener("click", closeDetailModal);

  btnSaveTicketChanges.addEventListener("click", async () => {
    if (!currentActiveTicketId) return;

    const status = editStatusSelect.value;
    const priority = editPrioritySelect.value;
    const assigned_to = editAssigneeSelect ? editAssigneeSelect.value : "";
    const resolution_notes = editResolutionNotes.value.trim();

    try {
      btnSaveTicketChanges.disabled = true;
      btnSaveTicketChanges.textContent = "Guardando...";

      const response = await fetch(API_BASE + `/api/tickets/${currentActiveTicketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          priority,
          assigned_to,
          resolution_notes,
          author: "Equipo Soporte"
        })
      });

      const data = await response.json();

      if (data.success) {
        closeDetailModal();
        await loadKPIs();
        await loadTickets(true);
      } else {
        alert("Error al actualizar el ticket: " + (data.error || ""));
      }
    } catch (err) {
      alert("Error al guardar cambios");
    } finally {
      btnSaveTicketChanges.disabled = false;
      btnSaveTicketChanges.textContent = "Guardar Cambios";
    }
  });

  // Time Tracking: Registrar Horas
  if (btnAddTimeLog) {
    btnAddTimeLog.addEventListener("click", async () => {
      if (!currentActiveTicketId) return;
      const mins = parseInt(inputTimeMinutes.value);
      const desc = inputTimeDesc.value.trim();
      if (!mins || mins <= 0) {
        alert("Por favor ingresa una cantidad válida de minutos (ej: 45)");
        return;
      }

      try {
        btnAddTimeLog.disabled = true;
        const response = await fetch(API_BASE + `/api/tickets/${currentActiveTicketId}/time-logs`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ minutes: mins, description: desc, author: "Marcelo Ramírez" })
        });
        const data = await response.json();
        if (data.success && data.ticket) {
          inputTimeMinutes.value = "";
          inputTimeDesc.value = "";
          const t = data.ticket;
          currentAdminTicketObj = t;
          const timeLogs = t.time_logs || [];
          const totalMins = t.time_spent_minutes || 0;
          if (modalTotalTimeBadge) {
            modalTotalTimeBadge.textContent = `Total: ${totalMins} min (${(totalMins/60).toFixed(1)}h)`;
          }
          if (modalTimeLogList) {
            modalTimeLogList.innerHTML = timeLogs.map(tl => `
              <div class="time-log-item">
                <div>
                  <strong style="color: var(--color-accent);">${tl.minutes} min</strong> — <span>${tl.description || 'Labor de soporte'}</span>
                  <div style="font-size: 0.7rem; color: var(--text-secondary);">${tl.author} · ${tl.created_at}</div>
                </div>
              </div>
            `).join("");
          }
          await loadTickets(true);
        } else {
          alert("Error al registrar tiempo: " + (data.error || ""));
        }
      } catch (err) {
        alert("Error al registrar tiempo de soporte");
      } finally {
        btnAddTimeLog.disabled = false;
      }
    });
  }

  // ── 6. Renderizado de Tablero Kanban Drag & Drop ──────────────────────────
  function renderKanban(tickets) {
    const columns = {
      abierto: document.getElementById("kanbanBody_abierto"),
      en_analisis: document.getElementById("kanbanBody_en_analisis"),
      en_desarrollo: document.getElementById("kanbanBody_en_desarrollo"),
      resuelto: document.getElementById("kanbanBody_resuelto")
    };
    const counts = {
      abierto: document.getElementById("kanbanCount_abierto"),
      en_analisis: document.getElementById("kanbanCount_en_analisis"),
      en_desarrollo: document.getElementById("kanbanCount_en_desarrollo"),
      resuelto: document.getElementById("kanbanCount_resuelto")
    };

    Object.values(columns).forEach(col => { if (col) col.innerHTML = ""; });
    const colCounts = { abierto: 0, en_analisis: 0, en_desarrollo: 0, resuelto: 0 };

    tickets.forEach(t => {
      let stKey = t.status;
      if (stKey === "descartado") return;
      if (!columns[stKey]) stKey = "abierto";
      colCounts[stKey]++;

      const card = document.createElement("div");
      card.className = "kanban-card";
      card.draggable = true;
      card.setAttribute("data-id", t.id);
      card.setAttribute("data-code", t.code);

      const prColor = priorityColors[t.priority] || "#445563";
      const totalTime = t.time_spent_minutes ? `⏱️ ${escapeHtml(t.time_spent_minutes.toString())}m` : '';

      card.innerHTML = `
        <div class="kanban-card-top">
          <span class="kanban-card-code">${escapeHtml(t.code)}</span>
          <span style="font-weight: 700; color: ${prColor}; font-size: 0.72rem; text-transform: uppercase;">● ${escapeHtml(t.priority)}</span>
        </div>
        <div class="kanban-card-title">${escapeHtml(t.title)}</div>
        <div style="font-size: 0.76rem; color: var(--text-secondary); display: flex; align-items: center; justify-content: space-between;">
          <span>👤 ${escapeHtml(t.requester_name.split(' ')[0])}</span>
          <span style="color: var(--color-accent); font-weight: 600;">${escapeHtml(t.module_name)}</span>
        </div>
        <div class="kanban-card-meta">
          <span class="kanban-card-assignee">${t.assigned_to ? '🧑‍💻 ' + escapeHtml(t.assigned_to.split(' ')[0]) : '⚪ Sin asignar'}</span>
          <span>${totalTime}</span>
        </div>
      `;

      card.addEventListener("dragstart", (e) => {
        card.classList.add("dragging");
        e.dataTransfer.setData("text/plain", t.id.toString());
        e.dataTransfer.effectAllowed = "move";
      });

      card.addEventListener("dragend", () => {
        card.classList.remove("dragging");
      });

      card.addEventListener("click", () => {
        openTicketDetail(t.id);
      });

      if (columns[stKey]) columns[stKey].appendChild(card);
    });

    Object.keys(counts).forEach(k => {
      if (counts[k]) counts[k].textContent = colCounts[k];
    });
  }

  // Eventos de Drag & Drop para columnas Kanban
  document.querySelectorAll(".kanban-column").forEach(col => {
    col.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      col.classList.add("drag-over");
    });

    col.addEventListener("dragleave", () => {
      col.classList.remove("drag-over");
    });

    col.addEventListener("drop", async (e) => {
      e.preventDefault();
      col.classList.remove("drag-over");
      const ticketId = parseInt(e.dataTransfer.getData("text/plain"));
      const newStatus = col.getAttribute("data-status");
      if (!ticketId || !newStatus) return;

      try {
        playChimeSound();
        await fetch(API_BASE + `/api/tickets/${ticketId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus, author: "Tablero Kanban" })
        });
        await loadKPIs();
        await loadTickets(true);
      } catch (err) {
        console.error("Error al mover ticket en kanban:", err);
      }
    });
  });

  // Conmutador de Vistas Tabla vs Kanban
  if (btnViewTable && btnViewKanban) {
    btnViewTable.addEventListener("click", () => {
      currentViewMode = "table";
      btnViewTable.classList.add("active");
      btnViewKanban.classList.remove("active");
      tableViewContainer.style.display = "block";
      kanbanBoardContainer.style.display = "none";
      renderTicketsTable(cachedTicketsList);
    });

    btnViewKanban.addEventListener("click", () => {
      currentViewMode = "kanban";
      btnViewKanban.classList.add("active");
      btnViewTable.classList.remove("active");
      tableViewContainer.style.display = "none";
      kanbanBoardContainer.style.display = "grid";
      renderKanban(cachedTicketsList);
    });
  }

  // ── 7. Visor Lightbox de Adjuntos ─────────────────────────────────────────
  function openLightbox(url, title, mimeType) {
    if (!lightboxModal || !lightboxBody) return;
    lightboxTitle.textContent = title || "Vista Previa de Archivo";
    lightboxDownloadBtn.href = url;
    lightboxDownloadBtn.download = title || "archivo";

    const isImg = (mimeType && mimeType.startsWith("image/")) || /\.(png|jpe?g|gif|webp|svg)$/i.test(title);
    const isPdf = (mimeType && mimeType.includes("pdf")) || /\.pdf$/i.test(title);

    if (isImg) {
      lightboxBody.innerHTML = `<img src="${url}" class="lightbox-img" alt="${title}">`;
    } else if (isPdf) {
      lightboxBody.innerHTML = `<iframe src="${url}" class="lightbox-iframe"></iframe>`;
    } else {
      lightboxBody.innerHTML = `
        <div style="text-align: center; color: #fff; padding: 40px;">
          <div style="font-size: 3.5rem; margin-bottom: 12px;">📄</div>
          <div style="font-size: 1.1rem; font-weight: 700; margin-bottom: 8px;">${title}</div>
          <p style="color: var(--text-secondary); margin-bottom: 16px;">Este tipo de archivo no admite vista previa directa.</p>
          <a href="${url}" download class="btn-primary" style="text-decoration: none;">⬇️ Descargar Archivo</a>
        </div>
      `;
    }
    lightboxModal.classList.add("active");
  }

  if (btnCloseLightbox) {
    btnCloseLightbox.addEventListener("click", () => {
      lightboxModal.classList.remove("active");
      lightboxBody.innerHTML = "";
    });
  }
  if (lightboxModal) {
    lightboxModal.addEventListener("click", (e) => {
      if (e.target === lightboxModal) {
        lightboxModal.classList.remove("active");
        lightboxBody.innerHTML = "";
      }
    });
  }
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && lightboxModal && lightboxModal.classList.contains("active")) {
      lightboxModal.classList.remove("active");
      lightboxBody.innerHTML = "";
    }
  });

  // Toggle Pin / Fijar Ticket
  if (btnTogglePinTicket) {
    btnTogglePinTicket.addEventListener("click", async () => {
      if (!currentActiveTicketId) return;
      try {
        const response = await fetch(API_BASE + `/api/tickets/${currentActiveTicketId}/pin`, { method: "POST" });
        const data = await response.json();
        if (data.success) {
          if (currentAdminTicketObj) currentAdminTicketObj.is_pinned = data.is_pinned;
          if (pinTicketIcon && pinTicketText) {
            pinTicketIcon.textContent = data.is_pinned ? "📍" : "📌";
            pinTicketText.textContent = data.is_pinned ? "Desfijar" : "Fijar Arriba";
          }
          await loadTickets(true);
        }
      } catch (err) {
        alert("Error al cambiar estado de fijado");
      }
    });
  }

  // Guardar Tags del Ticket
  if (btnSaveTicketTags) {
    btnSaveTicketTags.addEventListener("click", async () => {
      if (!currentActiveTicketId) return;
      const tags = adminTicketTagsInput.value.trim();
      try {
        btnSaveTicketTags.disabled = true;
        btnSaveTicketTags.textContent = "Guardando...";
        const response = await fetch(API_BASE + `/api/tickets/${currentActiveTicketId}/tags`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tags })
        });
        const data = await response.json();
        if (data.success) {
          if (currentAdminTicketObj) currentAdminTicketObj.tags = tags;
          await loadTickets(true);
          btnSaveTicketTags.textContent = "✓ Guardado";
          setTimeout(() => { btnSaveTicketTags.textContent = "Guardar"; }, 1500);
        } else {
          alert("Error al guardar tags: " + (data.error || ""));
        }
      } catch (err) {
        alert("Error al guardar etiquetas");
      } finally {
        btnSaveTicketTags.disabled = false;
      }
    });
  }

  // Plantillas de Respuestas Rápidas (Canned Responses)
  document.querySelectorAll(".btn-canned-resp").forEach(btn => {
    btn.addEventListener("click", () => {
      const canned = btn.getAttribute("data-text");
      adminChatMessageInput.value = canned;
      adminChatMessageInput.focus();
    });
  });

  // ── 6. Gestión de Catálogo de Módulos (Modal Admin) ───────────────────────
  function openManageModulesModal() {
    modalManageModules.classList.add("active");
    loadAdminModulesList();
  }

  function closeManageModulesModal() {
    modalManageModules.classList.remove("active");
  }

  btnOpenManageModules.addEventListener("click", openManageModulesModal);
  btnCloseManageModules.addEventListener("click", closeManageModulesModal);
  btnCloseManageModulesFooter.addEventListener("click", closeManageModulesModal);

  async function loadAdminModulesList() {
    try {
      adminModulesList.innerHTML = `
        <div style="text-align: center; padding: 20px; color: var(--text-secondary);">
          ⏳ Cargando catálogo de módulos...
        </div>
      `;

      const response = await fetch(API_BASE + "/api/modules?all=1");
      const data = await response.json();

      if (data.success) {
        const modules = data.modules || [];
        adminModulesCount.textContent = modules.length;
        renderAdminModulesList(modules);
      } else {
        adminModulesList.innerHTML = `
          <div style="text-align: center; padding: 20px; color: #D32F2F;">
            Error al obtener módulos: ${data.error}
          </div>
        `;
      }
    } catch (err) {
      console.error("Error al cargar módulos admin:", err);
    }
  }

  function renderAdminModulesList(modules) {
    if (!modules || modules.length === 0) {
      adminModulesList.innerHTML = `
        <div style="text-align: center; padding: 20px; color: var(--text-secondary);">
          No hay módulos registrados en el catálogo.
        </div>
      `;
      return;
    }

    adminModulesList.innerHTML = "";

    modules.forEach(m => {
      const item = document.createElement("div");
      item.className = "module-manage-card";
      item.innerHTML = `
        <div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <strong style="color: var(--text-primary); font-size: 0.95rem;">${m.name}</strong>
            <span style="font-size: 0.72rem; padding: 2px 6px; border-radius: 8px; background-color: var(--status-resuelto-bg); color: var(--status-resuelto); font-weight: 700;">ACTIVO</span>
          </div>
          <div style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 2px;">
            ${m.description || "Sin descripción"}
          </div>
        </div>
        <button type="button" class="btn-delete-module" title="Eliminar o descartar este módulo">
          🗑️ Descartar
        </button>
      `;

      item.querySelector(".btn-delete-module").addEventListener("click", () => handleDeleteModule(m.id, m.name));
      adminModulesList.appendChild(item);
    });
  }

  async function handleDeleteModule(moduleId, moduleName) {
    const confirmDelete = confirm(`¿Estás seguro de que deseas descartar/eliminar el módulo "${moduleName}"?\n\nLos usuarios ya no podrán seleccionarlo en el formulario.`);
    if (!confirmDelete) return;

    try {
      const response = await fetch(API_BASE + `/api/modules/${moduleId}`, {
        method: "DELETE"
      });
      const data = await response.json();

      if (data.success) {
        alert(data.message || "Módulo descartado correctamente.");
        await loadAdminModulesList();
        await loadFilterModules();
      } else {
        alert("Error: " + (data.error || "No se pudo eliminar el módulo"));
      }
    } catch (err) {
      alert("Error de conexión al eliminar el módulo");
    }
  }

  btnAdminCreateModule.addEventListener("click", async () => {
    const name = adminNewModName.value.trim();
    const description = adminNewModDesc.value.trim();

    if (!name) {
      alert("Por favor ingresa el nombre del nuevo módulo");
      return;
    }

    try {
      btnAdminCreateModule.disabled = true;
      btnAdminCreateModule.textContent = "Guardando...";

      const response = await fetch(API_BASE + "/api/modules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description })
      });

      const data = await response.json();

      if (data.success) {
        adminNewModName.value = "";
        adminNewModDesc.value = "";
        await loadAdminModulesList();
        await loadFilterModules();
      } else {
        alert("Error: " + (data.error || "No se pudo guardar el módulo"));
      }
    } catch (err) {
      alert("Error de conexión al guardar el módulo");
    } finally {
      btnAdminCreateModule.disabled = false;
      btnAdminCreateModule.textContent = "Guardar";
    }
  });

  // ── 7. Gestión de Cuentas de Usuario (Admin) ──────────────────────────────
  function openManageUsersModal() {
    modalManageUsers.classList.add("active");
    adminCreateUserCard.style.display = "none";
    loadAdminUsersList();
  }

  function closeManageUsersModal() {
    modalManageUsers.classList.remove("active");
  }

  btnOpenManageUsers.addEventListener("click", openManageUsersModal);
  btnCloseManageUsers.addEventListener("click", closeManageUsersModal);
  btnCloseManageUsersFooter.addEventListener("click", closeManageUsersModal);

  btnOpenCreateUserForm.addEventListener("click", () => {
    adminCreateUserCard.style.display = adminCreateUserCard.style.display === "none" ? "block" : "none";
    if (adminCreateUserCard.style.display === "block") {
      newUserName.focus();
    }
  });

  btnCancelCreateUser.addEventListener("click", () => {
    adminCreateUserCard.style.display = "none";
  });

  btnSubmitCreateUser.addEventListener("click", async () => {
    const name = newUserName.value.trim();
    const email = newUserEmail.value.trim();
    const phone = newUserPhone.value.trim();
    const department = newUserDept.value.trim();
    const role = newUserRole.value;
    const password = newUserPassword.value.trim();

    if (!name || !email || !password) {
      alert("Por favor completa los campos obligatorios: Nombre, Correo y Contraseña");
      return;
    }

    try {
      btnSubmitCreateUser.disabled = true;
      btnSubmitCreateUser.textContent = "Guardando...";

      const response = await fetch(API_BASE + "/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, department, role, password })
      });

      const data = await response.json();
      if (data.success) {
        alert("Usuario creado exitosamente.");
        newUserName.value = "";
        newUserEmail.value = "";
        newUserPhone.value = "";
        newUserDept.value = "";
        newUserPassword.value = "";
        adminCreateUserCard.style.display = "none";
        loadAdminUsersList();
      } else {
        alert("Error: " + (data.error || "No se pudo crear el usuario"));
      }
    } catch (err) {
      alert("Error de conexión al crear usuario");
    } finally {
      btnSubmitCreateUser.disabled = false;
      btnSubmitCreateUser.textContent = "Guardar Usuario";
    }
  });

  async function loadAdminUsersList() {
    try {
      const search = adminUserSearchInput.value.trim();
      const response = await fetch(API_BASE + `/api/admin/users?search=${encodeURIComponent(search)}`);
      const data = await response.json();

      if (data.success) {
        const users = data.users || [];
        adminUsersCountBadge.textContent = `${users.length} usuarios`;
        renderAdminUsersTable(users);
      } else {
        adminUsersTableBody.innerHTML = `
          <tr>
            <td colspan="8" style="text-align: center; padding: 20px; color: #D32F2F;">
              Error al obtener usuarios: ${data.error}
            </td>
          </tr>
        `;
      }
    } catch (err) {
      console.error("Error al cargar usuarios admin:", err);
    }
  }

  let userSearchTimeout;
  adminUserSearchInput.addEventListener("input", () => {
    clearTimeout(userSearchTimeout);
    userSearchTimeout = setTimeout(() => {
      loadAdminUsersList();
    }, 300);
  });

  function renderAdminUsersTable(users) {
    if (!users || users.length === 0) {
      adminUsersTableBody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align: center; padding: 30px; color: var(--text-secondary);">
            No se encontraron usuarios registrados.
          </td>
        </tr>
      `;
      return;
    }

    adminUsersTableBody.innerHTML = "";

    users.forEach(u => {
      const tr = document.createElement("tr");
      const roleBadge = u.role === "admin"
        ? `<span style="padding: 2px 8px; border-radius: 12px; font-weight: 700; font-size: 0.76rem; background-color: var(--color-accent-soft); color: var(--color-accent);">ADMINISTRADOR</span>`
        : `<span style="padding: 2px 8px; border-radius: 12px; font-weight: 700; font-size: 0.76rem; background-color: var(--bg-card-secondary); color: var(--text-secondary);">USUARIO</span>`;

      tr.innerHTML = `
        <td>
          <div style="display: flex; align-items: center; gap: 8px;">
            <div class="user-chip-avatar" style="width: 28px; height: 28px; font-size: 0.8rem;">
              ${(u.name || 'U').charAt(0).toUpperCase()}
            </div>
            <strong style="color: var(--text-primary);">${u.name}</strong>
          </div>
        </td>
        <td style="font-size: 0.86rem; color: var(--text-primary);">${u.email}</td>
        <td style="font-size: 0.82rem; color: var(--text-secondary);">${u.phone || '-'}</td>
        <td style="font-size: 0.82rem;">${u.department || '-'}</td>
        <td>${roleBadge}</td>
        <td style="text-align: center;">
          <span style="font-weight: 700; color: var(--color-accent);">${u.tickets_count || 0}</span>
        </td>
        <td style="font-size: 0.78rem; color: var(--text-secondary); white-space: nowrap;">
          ${u.last_login ? u.last_login.split(" ")[0] : (u.created_at ? u.created_at.split(" ")[0] : '-')}
        </td>
        <td style="text-align: center; white-space: nowrap;">
          <div style="display: inline-flex; gap: 6px;">
            <button type="button" class="btn-secondary btn-action-pwd" style="padding: 4px 8px; font-size: 0.78rem;" title="Modificar o resetear contraseña">
              🔑 Clave
            </button>
            <button type="button" class="btn-secondary btn-action-edit" style="padding: 4px 8px; font-size: 0.78rem;" title="Editar datos o rol">
              ✏️
            </button>
            <button type="button" class="btn-delete-module btn-action-del" style="padding: 4px 8px; font-size: 0.78rem;" title="Eliminar cuenta">
              🗑️
            </button>
          </div>
        </td>
      `;

      tr.querySelector(".btn-action-pwd").addEventListener("click", () => openResetPasswordModal(u));
      tr.querySelector(".btn-action-edit").addEventListener("click", () => openEditUserModal(u));
      tr.querySelector(".btn-action-del").addEventListener("click", () => handleDeleteUser(u));

      adminUsersTableBody.appendChild(tr);
    });
  }

  // Reset Password Modal
  function openResetPasswordModal(user) {
    currentTargetUserId = user.id;
    resetPwdUserName.textContent = user.name;
    resetPwdUserEmail.textContent = user.email;
    inputNewPassword.value = "";
    modalResetPassword.classList.add("active");
    inputNewPassword.focus();
  }

  function closeResetPasswordModal() {
    modalResetPassword.classList.remove("active");
    currentTargetUserId = null;
  }

  btnCloseResetPasswordModal.addEventListener("click", closeResetPasswordModal);
  btnCancelResetPassword.addEventListener("click", closeResetPasswordModal);

  btnGenerateRandomPwd.addEventListener("click", () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#";
    let pwd = "Aqua";
    for (let i = 0; i < 4; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    pwd += "2026!";
    inputNewPassword.value = pwd;
  });

  btnSaveResetPassword.addEventListener("click", async () => {
    if (!currentTargetUserId) return;
    const new_password = inputNewPassword.value.trim();
    if (!new_password) {
      alert("Por favor ingresa la nueva contraseña");
      return;
    }

    try {
      btnSaveResetPassword.disabled = true;
      btnSaveResetPassword.textContent = "Actualizando...";

      const response = await fetch(API_BASE + `/api/admin/users/${currentTargetUserId}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ new_password })
      });

      const data = await response.json();
      if (data.success) {
        alert(`¡Contraseña actualizada con éxito!\n\nNueva contraseña: ${new_password}\n\nPor favor compártela con el usuario.`);
        closeResetPasswordModal();
      } else {
        alert("Error: " + (data.error || "No se pudo actualizar la contraseña"));
      }
    } catch (err) {
      alert("Error de conexión al actualizar contraseña");
    } finally {
      btnSaveResetPassword.disabled = false;
      btnSaveResetPassword.textContent = "Actualizar Clave";
    }
  });

  // Edit User Modal
  function openEditUserModal(user) {
    currentTargetUserId = user.id;
    editUserName.value = user.name || "";
    editUserEmail.value = user.email || "";
    editUserPhone.value = user.phone || "";
    editUserDept.value = user.department || "";
    editUserRole.value = user.role || "usuario";
    modalEditUser.classList.add("active");
  }

  function closeEditUserModal() {
    modalEditUser.classList.remove("active");
    currentTargetUserId = null;
  }

  btnCloseEditUserModal.addEventListener("click", closeEditUserModal);
  btnCancelEditUser.addEventListener("click", closeEditUserModal);

  btnSaveEditUser.addEventListener("click", async () => {
    if (!currentTargetUserId) return;

    const name = editUserName.value.trim();
    const email = editUserEmail.value.trim();
    const phone = editUserPhone.value.trim();
    const department = editUserDept.value.trim();
    const role = editUserRole.value;

    if (!name || !email) {
      alert("Nombre y Correo son obligatorios");
      return;
    }

    try {
      btnSaveEditUser.disabled = true;
      btnSaveEditUser.textContent = "Guardando...";

      const response = await fetch(API_BASE + `/api/admin/users/${currentTargetUserId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, department, role })
      });

      const data = await response.json();
      if (data.success) {
        alert("Datos de usuario actualizados.");
        closeEditUserModal();
        loadAdminUsersList();
      } else {
        alert("Error: " + (data.error || "No se pudo actualizar"));
      }
    } catch (err) {
      alert("Error de conexión");
    } finally {
      btnSaveEditUser.disabled = false;
      btnSaveEditUser.textContent = "Guardar Cambios";
    }
  });

  // Delete User
  async function handleDeleteUser(user) {
    const confirmDelete = confirm(`¿Estás seguro de que deseas eliminar la cuenta de "${user.name}" (${user.email})?\n\nLos tickets creados anteriormente por este usuario se mantendrán intactos para trazabilidad.`);
    if (!confirmDelete) return;

    try {
      const response = await fetch(API_BASE + `/api/admin/users/${user.id}`, {
        method: "DELETE"
      });
      const data = await response.json();

      if (data.success) {
        alert(data.message || "Usuario eliminado exitosamente.");
        loadAdminUsersList();
      } else {
        alert("Error: " + (data.error || "No se pudo eliminar el usuario"));
      }
    } catch (err) {
      alert("Error de conexión al eliminar usuario");
    }
  }

  // ── 8. Configuración de Servidor de Correo (Admin) ────────────────────────
  function openEmailSettingsModal() {
    modalEmailSettings.classList.add("active");
    emailTestStatusArea.style.display = "none";
    loadEmailSettings();
  }

  function closeEmailSettingsModal() {
    modalEmailSettings.classList.remove("active");
  }

  btnOpenEmailSettings.addEventListener("click", openEmailSettingsModal);
  btnCloseEmailSettings.addEventListener("click", closeEmailSettingsModal);
  btnCloseEmailSettingsFooter.addEventListener("click", closeEmailSettingsModal);

  function toggleEmailModeFields() {
    const isSmtp = settingEmailMode.value === "smtp";
    smtpFieldsContainer.style.display = isSmtp ? "block" : "none";
  }

  settingEmailMode.addEventListener("change", toggleEmailModeFields);

  async function loadEmailSettings() {
    try {
      const response = await fetch(API_BASE + "/api/admin/settings");
      const data = await response.json();
      if (data.success) {
        const s = data.settings || {};
        settingEmailMode.value = s.email_mode || "smtp";
        settingSenderName.value = s.email_sender_name || "Mesa de Ayuda AquaShield";
        settingSenderAddress.value = s.email_sender_address || "MyAquashield@gmail.com";
        settingAdminAlertEmail.value = s.admin_alert_email || "marcelo.ramirez@aquachile.com";
        settingSmtpServer.value = s.smtp_server || "smtp.gmail.com";
        settingSmtpPort.value = s.smtp_port || "587";
        settingSmtpUser.value = s.smtp_user || "MyAquashield@gmail.com";
        settingSmtpPassword.value = s.smtp_password || "";
        toggleEmailModeFields();
      }
    } catch (err) {
      console.error("Error al cargar configuraciones de correo:", err);
    }
  }

  function getEmailSettingsPayload() {
    return {
      email_mode: settingEmailMode.value,
      email_sender_name: settingSenderName.value.trim(),
      email_sender_address: settingSenderAddress.value.trim(),
      admin_alert_email: settingAdminAlertEmail.value.trim(),
      smtp_server: settingSmtpServer.value.trim(),
      smtp_port: settingSmtpPort.value.trim(),
      smtp_user: settingSmtpUser.value.trim(),
      smtp_password: settingSmtpPassword.value.trim()
    };
  }

  btnSaveEmailSettings.addEventListener("click", async () => {
    const payload = getEmailSettingsPayload();
    if (!payload.email_sender_name || !payload.email_sender_address) {
      alert("Por favor completa el Nombre de Remitente y el Correo Remitente");
      return;
    }

    try {
      btnSaveEmailSettings.disabled = true;
      btnSaveEmailSettings.textContent = "Guardando...";

      const response = await fetch(API_BASE + "/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (data.success) {
        alert("Configuración de correo guardada exitosamente.");
        closeEmailSettingsModal();
      } else {
        alert("Error al guardar: " + (data.error || ""));
      }
    } catch (err) {
      alert("Error de conexión al guardar");
    } finally {
      btnSaveEmailSettings.disabled = false;
      btnSaveEmailSettings.textContent = "Guardar Configuración";
    }
  });

  btnTestEmailConnection.addEventListener("click", async () => {
    const payload = getEmailSettingsPayload();
    
    emailTestStatusArea.style.display = "block";
    emailTestStatusArea.style.backgroundColor = "var(--bg-input)";
    emailTestStatusArea.style.border = "1px solid var(--border-color)";
    emailTestStatusArea.style.color = "var(--text-primary)";
    emailTestStatusArea.innerHTML = "⏳ Probando conexión y enviando correo de prueba a <strong>" + (payload.admin_alert_email || payload.email_sender_address) + "</strong>...";

    try {
      btnTestEmailConnection.disabled = true;

      const response = await fetch(API_BASE + "/api/admin/settings/test-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          settings: payload,
          target_email: payload.admin_alert_email || payload.email_sender_address
        })
      });

      const data = await response.json();
      if (data.success) {
        emailTestStatusArea.style.backgroundColor = "var(--status-resuelto-bg)";
        emailTestStatusArea.style.border = "1px solid var(--status-resuelto)";
        emailTestStatusArea.style.color = "var(--status-resuelto)";
        emailTestStatusArea.innerHTML = "✅ <strong>¡Prueba Exitosa!</strong> " + (data.message || "El correo de prueba fue enviado correctamente.");
      } else {
        emailTestStatusArea.style.backgroundColor = "var(--status-descartado-bg)";
        emailTestStatusArea.style.border = "1px solid var(--status-descartado)";
        emailTestStatusArea.style.color = "var(--status-descartado)";
        emailTestStatusArea.innerHTML = "❌ <strong>Error en la prueba:</strong> " + (data.message || data.error || "No se pudo conectar al servidor.");
      }
    } catch (err) {
      emailTestStatusArea.style.backgroundColor = "var(--status-descartado-bg)";
      emailTestStatusArea.style.border = "1px solid var(--status-descartado)";
      emailTestStatusArea.style.color = "var(--status-descartado)";
      emailTestStatusArea.innerHTML = "❌ <strong>Error de conexión</strong> al ejecutar la prueba.";
    } finally {
      btnTestEmailConnection.disabled = false;
    }
  });

  // ── 9. Dashboard de Analíticas & Cumplimiento SLA ─────────────────────────
  function openAnalyticsModal() {
    modalAnalyticsDashboard.classList.add("active");
    loadAnalyticsData();
  }

  function closeAnalyticsModal() {
    modalAnalyticsDashboard.classList.remove("active");
  }

  btnOpenAnalytics.addEventListener("click", openAnalyticsModal);
  btnCloseAnalytics.addEventListener("click", closeAnalyticsModal);
  btnCloseAnalyticsFooter.addEventListener("click", closeAnalyticsModal);

  async function loadAnalyticsData() {
    try {
      const response = await fetch(API_BASE + "/api/admin/analytics");
      const data = await response.json();
      if (!data.success || !data.analytics) return;

      const a = data.analytics;

      // KPIs
      analyticsAvgResolution.textContent = `${a.sla.avg_resolution_hours} hrs`;
      analyticsAvgResponse.textContent = `${a.sla.avg_response_hours} hrs`;
      analyticsCsatScore.textContent = `⭐ ${a.csat.avg_rating}`;
      analyticsCsatCount.textContent = `${a.csat.total_ratings} calificaciones recibidas`;

      const resolvedCount = a.monthly_trends.reduce((acc, m) => acc + (m.resueltos || 0), 0);
      analyticsTotalResolved.textContent = `${resolvedCount} tickets resueltos`;
      const resRate = a.total_tickets > 0 ? Math.round((resolvedCount / a.total_tickets) * 100) : 100;
      analyticsResolutionRate.textContent = `${resRate}%`;

      // Barras por Módulo
      analyticsModulesBars.innerHTML = (a.by_module || []).map(m => `
        <div>
          <div style="display: flex; justify-content: space-between; font-size: 0.82rem; margin-bottom: 4px;">
            <strong style="color: var(--text-primary);">${m.module_name}</strong>
            <span style="color: var(--text-secondary);">${m.count} tickets (${m.percent}%)</span>
          </div>
          <div style="background-color: var(--border-color); border-radius: 6px; height: 10px; overflow: hidden;">
            <div style="background-color: var(--color-accent); height: 100%; width: ${m.percent}%; border-radius: 6px; transition: width 0.6s ease;"></div>
          </div>
        </div>
      `).join("");

      // Barras por Tipo
      const typeColors = {
        problema: "#E53935",
        mejora: "#0288D1",
        consulta: "#43A047",
        otro: "#757575"
      };

      analyticsTypesBars.innerHTML = (a.by_type || []).map(t => `
        <div>
          <div style="display: flex; justify-content: space-between; font-size: 0.82rem; margin-bottom: 4px;">
            <strong style="color: var(--text-primary);">${t.label}</strong>
            <span style="color: var(--text-secondary);">${t.count} tickets (${t.percent}%)</span>
          </div>
          <div style="background-color: var(--border-color); border-radius: 6px; height: 10px; overflow: hidden;">
            <div style="background-color: ${typeColors[t.type] || '#EB5F0A'}; height: 100%; width: ${t.percent}%; border-radius: 6px; transition: width 0.6s ease;"></div>
          </div>
        </div>
      `).join("");

      // Tabla de evolución mensual
      if (a.monthly_trends && a.monthly_trends.length > 0) {
        analyticsMonthlyTable.innerHTML = `
          <table class="aq-table" style="font-size: 0.85rem;">
            <thead>
              <tr>
                <th>Mes</th>
                <th>Requerimientos Totales</th>
                <th>Resueltos</th>
                <th>Tasa de Efectividad</th>
              </tr>
            </thead>
            <tbody>
              ${a.monthly_trends.map(row => {
                const eff = row.total > 0 ? Math.round((row.resueltos / row.total) * 100) : 100;
                return `
                  <tr>
                    <td><strong>${row.mes}</strong></td>
                    <td>${row.total}</td>
                    <td><span style="color: var(--status-resuelto); font-weight: 700;">✅ ${row.resueltos}</span></td>
                    <td><strong>${eff}%</strong></td>
                  </tr>
                `;
              }).join("")}
            </tbody>
          </table>
        `;
      } else {
        analyticsMonthlyTable.innerHTML = `<div style="text-align: center; color: var(--text-secondary); font-size: 0.85rem; padding: 12px;">Sin datos históricos suficientes aún.</div>`;
      }

    } catch (err) {
      console.error("Error al cargar analíticas:", err);
    }
  }

  // ── 10. Backup en 1 Clic ──────────────────────────────────────────────────
  if (btnDownloadBackup) {
    btnDownloadBackup.addEventListener("click", () => {
      window.location.href = "/api/admin/backup";
    });
  }

  // ── 11. Sistema de Auto-Refresco En Vivo ───────────────────────────────────
  function setupAutoRefresh() {
    if (autoRefreshTimer) {
      clearInterval(autoRefreshTimer);
      autoRefreshTimer = null;
    }

    const intervalMs = parseInt(refreshIntervalSelect.value);

    if (intervalMs > 0) {
      liveRefreshPill.style.display = "inline-flex";
      livePulseDot.style.display = "inline-block";
      const seconds = intervalMs / 1000;
      liveRefreshText.textContent = `En vivo (${seconds}s)`;

      autoRefreshTimer = setInterval(async () => {
        if (!modalTicketDetail.classList.contains("active") && 
            !modalManageModules.classList.contains("active") &&
            !modalManageUsers.classList.contains("active") &&
            !modalResetPassword.classList.contains("active") &&
            !modalEditUser.classList.contains("active") &&
            !modalEmailSettings.classList.contains("active") &&
            !modalAnalyticsDashboard.classList.contains("active")) {
          await loadKPIs();
          await loadTickets(true);
        }
      }, intervalMs);
    } else {
      liveRefreshPill.style.display = "none";
      livePulseDot.style.display = "none";
    }
  }

  refreshIntervalSelect.addEventListener("change", setupAutoRefresh);

  // ── 9. Filtros, Búsqueda y Refresco ──────────────────────────────────────
  let searchTimeout;
  adminSearchInput.addEventListener("input", () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      loadTickets();
    }, 300);
  });

  filterStatus.addEventListener("change", () => loadTickets());
  filterModule.addEventListener("change", () => loadTickets());
  if (filterAssignee) filterAssignee.addEventListener("change", () => loadTickets());
  if (filterDateFrom) filterDateFrom.addEventListener("change", () => loadTickets());
  if (filterDateTo) filterDateTo.addEventListener("change", () => loadTickets());

  if (btnRefresh) {
    btnRefresh.addEventListener("click", async () => {
      btnRefresh.disabled = true;
      try {
        await Promise.all([loadKPIs(), loadTickets()]);
      } catch (err) {
        console.warn("Error al refrescar:", err);
      } finally {
        btnRefresh.disabled = false;
      }
    });
  }

  // Exportar Excel con los filtros aplicados
  if (btnExportExcelFiltered) {
    btnExportExcelFiltered.addEventListener("click", () => {
      const params = new URLSearchParams();
      const status = filterStatus.value;
      if (status !== "todos") params.append("status", status);
      const moduleId = filterModule.value;
      if (moduleId !== "todos") params.append("module_id", moduleId);
      const assignee = filterAssignee ? filterAssignee.value : "todos";
      if (assignee && assignee !== "todos") params.append("assigned_to", assignee);
      const search = adminSearchInput.value.trim();
      if (search) params.append("search", search);
      if (filterDateFrom && filterDateFrom.value) params.append("date_from", filterDateFrom.value);
      if (filterDateTo && filterDateTo.value) params.append("date_to", filterDateTo.value);

      window.location.href = `/api/export/excel?${params.toString()}`;
    });
  }

  // ── 12. Gestor de Multi-Chats Flotantes Simultáneos (Admin) ────────────────
  const floatingChatDock = document.getElementById("floatingChatDock");
  const openFloatingChats = new Map();

  window.openFloatingChat = function(ticketId, ticketCode, participantName) {
    if (openFloatingChats.has(ticketId)) {
      const chat = openFloatingChats.get(ticketId);
      chat.dom.classList.remove("minimized");
      const input = chat.dom.querySelector("input");
      if (input) input.focus();
      return;
    }

    if (openFloatingChats.size >= 3) {
      const firstKey = openFloatingChats.keys().next().value;
      closeFloatingChat(firstKey);
    }

    const chatWin = document.createElement("div");
    chatWin.className = "floating-chat-window";
    chatWin.id = `floatingChat_${ticketId}`;

    chatWin.innerHTML = `
      <div class="floating-chat-header">
        <div class="floating-chat-header-title">
          <span style="color: #4CAF50;">●</span>
          <span>${ticketCode} · ${participantName}</span>
        </div>
        <div class="floating-chat-header-actions">
          <button type="button" class="floating-chat-btn-action btn-min-chat" title="Minimizar / Restaurar">_</button>
          <button type="button" class="floating-chat-btn-action btn-close-chat" title="Cerrar ventana">&times;</button>
        </div>
      </div>
      <div class="floating-chat-body" id="floatChatBody_${ticketId}">
        <div style="text-align: center; color: var(--text-secondary); font-size: 0.78rem; padding: 20px 0;">Cargando mensajes...</div>
      </div>
      
      <!-- Preview Imagen Pegada Flotante -->
      <div id="floatPastedPreview_${ticketId}" class="chat-pasted-preview-bar" style="display: none; margin: 4px 8px 0;">
        <div class="chat-pasted-preview-info">
          <img id="floatPastedThumb_${ticketId}" class="chat-pasted-preview-thumb" src="" alt="Captura pegada">
          <span style="font-size: 0.72rem; font-weight: 700; color: var(--color-accent);">📷 Captura lista</span>
        </div>
        <button type="button" id="floatDiscardPasted_${ticketId}" class="chat-pasted-remove-btn" title="Quitar imagen">&times;</button>
      </div>

      <div class="floating-chat-footer" style="position: relative; gap: 4px;">
        <button type="button" class="btn-chat-sticker-trigger" id="floatBtnSticker_${ticketId}" style="padding: 4px 6px; font-size: 1rem;" title="Insertar Sticker">😊</button>
        <input type="text" placeholder="Escribe o pega captura con Ctrl+V..." id="floatChatInput_${ticketId}" style="flex: 1; font-size: 0.8rem;" autocomplete="off">
        <button type="button" class="btn-primary btn-float-send" style="padding: 6px 10px; font-size: 0.8rem;">💬</button>

        <!-- Popover de Stickers / Emojis para Chat Flotante -->
        <div id="floatStickerPopover_${ticketId}" class="chat-sticker-popover" style="bottom: 45px; right: 5px;"></div>
      </div>
    `;

    const header = chatWin.querySelector(".floating-chat-header");
    const btnMin = chatWin.querySelector(".btn-min-chat");
    const btnClose = chatWin.querySelector(".btn-close-chat");
    const input = chatWin.querySelector(`#floatChatInput_${ticketId}`);
    const btnSend = chatWin.querySelector(".btn-float-send");
    const previewBar = chatWin.querySelector(`#floatPastedPreview_${ticketId}`);
    const thumbImg = chatWin.querySelector(`#floatPastedThumb_${ticketId}`);
    const btnDiscard = chatWin.querySelector(`#floatDiscardPasted_${ticketId}`);
    const btnSticker = chatWin.querySelector(`#floatBtnSticker_${ticketId}`);
    const popover = chatWin.querySelector(`#floatStickerPopover_${ticketId}`);

    const floatPasteHandler = setupClipboardPaste(input, previewBar, thumbImg, btnDiscard);

    setupStickerPopover(
      popover,
      btnSticker,
      input,
      (stickerText) => {
        input.value = stickerText;
        sendFloatMsg();
      }
    );

    header.addEventListener("click", (e) => {
      if (e.target === btnClose || e.target === btnMin) return;
      chatWin.classList.toggle("minimized");
    });

    btnMin.addEventListener("click", (e) => {
      e.stopPropagation();
      chatWin.classList.toggle("minimized");
    });

    btnClose.addEventListener("click", (e) => {
      e.stopPropagation();
      closeFloatingChat(ticketId);
    });

    const sendFloatMsg = async () => {
      const msg = input.value.trim();
      const pastedImg = floatPasteHandler.getPastedImage();
      if (!msg && !pastedImg) return;

      try {
        btnSend.disabled = true;
        const resp = await fetch(API_BASE + `/api/tickets/${ticketId}/comments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            author_name: "Marcelo Ramírez",
            author_email: "marcelo.ramirez@aquachile.com",
            author_role: "admin",
            message: msg,
            image_base64: pastedImg
          })
        });
        const d = await resp.json();
        if (d.success && d.comment) {
          input.value = "";
          floatPasteHandler.clear();
          fetchFloatingChatComments(ticketId, true);
        }
      } catch (err) {
        alert("Error al enviar mensaje");
      } finally {
        btnSend.disabled = false;
      }
    };

    btnSend.addEventListener("click", sendFloatMsg);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendFloatMsg();
      }
    });

    floatingChatDock.appendChild(chatWin);

    const poller = setInterval(() => {
      fetchFloatingChatComments(ticketId, false);
    }, 3000);

    openFloatingChats.set(ticketId, { dom: chatWin, poller, lastCommentCount: 0, pasteHandler: floatPasteHandler });
    fetchFloatingChatComments(ticketId, true);
    setTimeout(() => input.focus(), 100);
  };

  function closeFloatingChat(ticketId) {
    if (openFloatingChats.has(ticketId)) {
      const chat = openFloatingChats.get(ticketId);
      clearInterval(chat.poller);
      if (chat.pasteHandler) chat.pasteHandler.clear();
      if (chat.dom && chat.dom.parentNode) {
        chat.dom.parentNode.removeChild(chat.dom);
      }
      openFloatingChats.delete(ticketId);
    }
  }

  async function fetchFloatingChatComments(ticketId, forceScroll = false) {
    if (!openFloatingChats.has(ticketId)) return;
    const chat = openFloatingChats.get(ticketId);
    const body = chat.dom.querySelector(`#floatChatBody_${ticketId}`);
    if (!body) return;

    try {
      const resp = await fetch(API_BASE + `/api/tickets/${ticketId}/comments?mark_read_for=admin`);
      const data = await resp.json();
      if (!data.success) return;

      const comments = data.comments || [];
      if (comments.length !== chat.lastCommentCount || forceScroll) {
        const hadNewOtherMsg = comments.length > chat.lastCommentCount && comments[comments.length - 1].author_role !== "admin";
        chat.lastCommentCount = comments.length;

        body.innerHTML = "";
        if (comments.length === 0) {
          body.innerHTML = `<div style="text-align: center; color: var(--text-secondary); font-size: 0.78rem; padding: 20px 0;">No hay mensajes registrados aún</div>`;
        } else {
          comments.forEach(c => {
            const isAdmin = c.author_role === "admin";
            const b = document.createElement("div");
            b.style.cssText = `
              display: flex;
              flex-direction: column;
              align-self: ${isAdmin ? 'flex-end' : 'flex-start'};
              max-width: 88%;
              background-color: ${isAdmin ? 'var(--color-accent-soft)' : 'var(--bg-card)'};
              border: 1px solid ${isAdmin ? 'var(--color-accent)' : 'var(--border-color)'};
              border-radius: ${isAdmin ? '8px 0 8px 8px' : '0 8px 8px 8px'};
              padding: 6px 10px;
              font-size: 0.82rem;
            `;
            b.innerHTML = `
              <div style="display: flex; justify-content: space-between; gap: 6px; font-size: 0.68rem; margin-bottom: 2px;">
                <strong style="color: ${isAdmin ? 'var(--color-accent)' : 'var(--text-primary)'};">${isAdmin ? 'Tú (Soporte)' : c.author_name}</strong>
                <span style="color: var(--text-secondary);">${c.created_at.split(' ')[1] || ''}</span>
              </div>
              ${formatChatMessageContent(c.message, c.image_url)}
            `;

            b.querySelectorAll(".chat-bubble-image-wrap").forEach(wrap => {
              wrap.addEventListener("click", () => {
                const imgUrl = wrap.getAttribute("data-img-url");
                openLightbox(imgUrl, "Captura de Pantalla", "image/png");
              });
            });

            body.appendChild(b);
          });
        }
        body.scrollTop = body.scrollHeight;

        if (hadNewOtherMsg && !forceScroll) {
          playChimeSound();
          chat.dom.classList.remove("minimized");
        }
      }
    } catch (e) {}
  }

  // ── 13. Gestor de Campanita de Notificaciones (Admin) ─────────────────────
  const notifBellContainer = document.getElementById("notifBellContainer");
  const btnToggleNotifMenu = document.getElementById("btnToggleNotifMenu");
  const notifBadgeCount = document.getElementById("notifBadgeCount");
  const notifDropdownMenu = document.getElementById("notifDropdownMenu");
  const notifUnreadLabel = document.getElementById("notifUnreadLabel");
  const notifItemsList = document.getElementById("notifItemsList");
  const btnNotifClearAll = document.getElementById("btnNotifClearAll");

  let previousNotifCount = 0;

  function getNotifIcon(type) {
    if (type === "status_change") return "🔄";
    if (type === "new_comment") return "💬";
    if (type === "ticket_created") return "🆕";
    if (type === "rating_received") return "⭐";
    return "🔔";
  }

  async function pollNotifications() {
    try {
      const response = await fetch(API_BASE + "/api/notifications?role=admin");
      const data = await response.json();
      if (!data.success) return;

      const groups = data.ticket_groups || [];
      const unreadCount = data.unread_count || 0;
      const totalCount = data.total_count || 0;

      if (unreadCount > 0) {
        notifBadgeCount.textContent = unreadCount;
        notifBadgeCount.style.display = "inline-block";
        notifUnreadLabel.textContent = `${unreadCount} nuevos`;
        if (unreadCount > previousNotifCount && previousNotifCount > 0) {
          playChimeSound();
          showDesktopNotification();
        }
      } else {
        notifBadgeCount.style.display = "none";
        notifUnreadLabel.textContent = `${totalCount} alertas`;
      }
      previousNotifCount = unreadCount;

      if (groups.length === 0) {
        notifItemsList.innerHTML = `<div style="padding: 24px; text-align: center; color: var(--text-secondary); font-size: 0.82rem;">🔕 No tienes alertas en la campanita</div>`;
      } else {
        notifItemsList.innerHTML = groups.map(g => {
          const eventsHtml = g.notifications.map(n => `
            <div class="notif-event-item ${n.is_read ? '' : 'unread'}" data-notif-id="${n.id}" data-ticket-id="${g.ticket_id}" data-code="${escapeHtml(g.ticket_code)}" data-title="${escapeHtml(g.ticket_title)}">
              <span style="font-size: 1rem; line-height: 1;">${getNotifIcon(n.type)}</span>
              <div class="notif-event-content">
                <div class="notif-event-header">
                  <span class="notif-event-title">${escapeHtml(n.title)}</span>
                  <span>${escapeHtml(n.created_at ? (n.created_at.split(' ')[1] || n.created_at) : '')}</span>
                </div>
                <div class="notif-event-msg">${escapeHtml(n.message)}</div>
              </div>
              <button type="button" class="btn-notif-delete-item" data-notif-id="${n.id}" title="Quitar alerta de la campana">&times;</button>
            </div>
          `).join("");

          return `
            <div class="notif-ticket-group ${g.unread_count > 0 ? 'has-unread' : ''}" id="notifGroup_${g.ticket_id}">
              <div class="notif-ticket-header" data-ticket-id="${g.ticket_id}" data-code="${escapeHtml(g.ticket_code)}" data-title="${escapeHtml(g.ticket_title)}">
                <div class="notif-ticket-title-area">
                  <span class="notif-ticket-code">${escapeHtml(g.ticket_code)}</span>
                  <span class="notif-ticket-subject" title="${escapeHtml(g.ticket_title)}">${escapeHtml(g.ticket_title)}</span>
                  ${g.unread_count > 0 ? `<span style="background: var(--color-accent); color: #fff; font-size: 0.68rem; font-weight: 700; padding: 1px 6px; border-radius: 8px;">${g.unread_count} nuevos</span>` : ''}
                </div>
                <button type="button" class="btn-notif-delete-group" data-ticket-id="${g.ticket_id}" title="Limpiar todas las alertas de este ticket de la campana">🗑️</button>
              </div>
              <div class="notif-events-container">
                ${eventsHtml}
              </div>
            </div>
          `;
        }).join("");

        // Eventos: Click en header de ticket para abrir chat y marcar como leído
        notifItemsList.querySelectorAll(".notif-ticket-header").forEach(header => {
          header.addEventListener("click", async (e) => {
            if (e.target.closest(".btn-notif-delete-group")) return;
            const ticketId = parseInt(header.getAttribute("data-ticket-id"));
            const code = header.getAttribute("data-code");
            const title = header.getAttribute("data-title");
            notifDropdownMenu.classList.remove("active");
            openFloatingChat(ticketId, code, title);
            await fetch(API_BASE + "/api/notifications/mark-read", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ticket_id: ticketId, role: "admin" })
            });
            pollNotifications();
          });
        });

        // Eventos: Click en evento individual para abrir chat y marcar como leído
        notifItemsList.querySelectorAll(".notif-event-item").forEach(item => {
          item.addEventListener("click", async (e) => {
            if (e.target.closest(".btn-notif-delete-item")) return;
            const ticketId = parseInt(item.getAttribute("data-ticket-id"));
            const code = item.getAttribute("data-code");
            const title = item.getAttribute("data-title");
            const notifId = parseInt(item.getAttribute("data-notif-id"));
            notifDropdownMenu.classList.remove("active");
            openFloatingChat(ticketId, code, title);
            await fetch(API_BASE + "/api/notifications/mark-read", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ notification_id: notifId, role: "admin" })
            });
            pollNotifications();
          });
        });

        // Eventos: Borrar alerta individual de la campana
        notifItemsList.querySelectorAll(".btn-notif-delete-item").forEach(btn => {
          btn.addEventListener("click", async (e) => {
            e.stopPropagation();
            const notifId = parseInt(btn.getAttribute("data-notif-id"));
            await fetch(API_BASE + "/api/notifications/delete", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ notification_id: notifId, role: "admin" })
            });
            pollNotifications();
          });
        });

        // Eventos: Borrar grupo de alertas de un ticket de la campana
        notifItemsList.querySelectorAll(".btn-notif-delete-group").forEach(btn => {
          btn.addEventListener("click", async (e) => {
            e.stopPropagation();
            const ticketId = parseInt(btn.getAttribute("data-ticket-id"));
            await fetch(API_BASE + "/api/notifications/delete", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ticket_id: ticketId, role: "admin" })
            });
            pollNotifications();
          });
        });
      }
    } catch (err) {}
  }

  if (btnNotifClearAll) {
    btnNotifClearAll.addEventListener("click", async (e) => {
      e.stopPropagation();
      if (confirm("¿Deseas limpiar las alertas de la campanita? (Esto no borra el ticket ni el historial interno)")) {
        await fetch(API_BASE + "/api/notifications/clear-all", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: "admin" })
        });
        pollNotifications();
      }
    });
  }

  if (btnToggleNotifMenu) {
    btnToggleNotifMenu.addEventListener("click", (e) => {
      e.stopPropagation();
      notifDropdownMenu.classList.toggle("active");
    });
  }

  document.addEventListener("click", (e) => {
    if (notifBellContainer && !notifBellContainer.contains(e.target)) {
      notifDropdownMenu.classList.remove("active");
    }
  });

  setInterval(pollNotifications, 4000);
  // ── Gestión de Bandeja de Espera (GitHub Queue) ─────────────────────────
  const btnSyncQueue = document.getElementById("btnSyncQueue");
  const queueBadgeCount = document.getElementById("queueBadgeCount");

  async function checkQueueStatus() {
    try {
      const res = await fetch(API_BASE + "/api/queue/status");
      const data = await res.json();
      if (queueBadgeCount) {
        queueBadgeCount.textContent = data.count || 0;
        if (btnSyncQueue) {
          if (data.count > 0) {
            btnSyncQueue.style.fontWeight = "bold";
            btnSyncQueue.style.boxShadow = "0 0 8px rgba(235, 95, 10, 0.4)";
          } else {
            btnSyncQueue.style.fontWeight = "normal";
            btnSyncQueue.style.boxShadow = "none";
          }
        }
      }
    } catch (e) {}
  }

  if (btnSyncQueue) {
    btnSyncQueue.addEventListener("click", async () => {
      btnSyncQueue.disabled = true;
      btnSyncQueue.innerHTML = "<span>⏳ Sincronizando...</span>";
      try {
        const res = await fetch(API_BASE + "/api/queue/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ author: "Admin" })
        });
        const data = await res.json();
        if (data.success) {
          alert(`✅ Sincronización completa: Se procesaron ${data.synced} requerimientos desde la bandeja de espera.`);
          checkQueueStatus();
          loadTickets(true);
          loadKPIs();
        } else {
          alert("Aviso al sincronizar: " + (data.error || "No se pudo sincronizar"));
        }
      } catch (err) {
        alert("Error de conexión al sincronizar la cola");
      } finally {
        btnSyncQueue.disabled = false;
        btnSyncQueue.innerHTML = `<span>🔄 Sincronizar Cola (<span id="queueBadgeCount">0</span>)</span>`;
        checkQueueStatus();
      }
    });
  }

  setInterval(checkQueueStatus, 30000);
  checkQueueStatus();

  // ── Inicialización ───────────────────────────────────────────────────────
  if (adminSearchInput) {
    adminSearchInput.value = "";
    setTimeout(() => {
      if (document.activeElement !== adminSearchInput && adminSearchInput.value.includes("@")) {
        adminSearchInput.value = "";
        loadTickets(true);
      }
    }, 150);
  }
  loadKPIs();
  loadFilterModules();
  loadTickets();
  setupAutoRefresh();
});
