/**
 * AQUASHIELD · Mesa de Ayuda
 * Lógica del Portal de Usuario (Autenticación, Sesión Guardada, Ingreso y Seguimiento)
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

  // Helper para evitar XSS en inyecciones de HTML
  function escapeHtml(text) {
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }

  // ── 2. Variables de Estado y Usuario ─────────────────────────────────────
  let currentUser = null;

  const userHeaderArea = document.getElementById("userHeaderArea");
  const btnOpenAuthModal = document.getElementById("btnOpenAuthModal");
  const authAutofillBanner = document.getElementById("authAutofillBanner");
  const bannerUserName = document.getElementById("bannerUserName");
  const bannerUserEmail = document.getElementById("bannerUserEmail");
  const btnChangeAccount = document.getElementById("btnChangeAccount");

  const requesterNameInput = document.getElementById("requester_name");
  const requesterEmailInput = document.getElementById("requester_email");
  const requesterPhoneInput = document.getElementById("requester_phone");

  const myTicketsBadgeCount = document.getElementById("myTicketsBadgeCount");
  const myTicketsListContainer = document.getElementById("myTicketsListContainer");
  const btnRefreshMyTickets = document.getElementById("btnRefreshMyTickets");

  // Modal Auth
  const modalAuth = document.getElementById("modalAuth");
  const btnCloseAuthModal = document.getElementById("btnCloseAuthModal");
  const authTabTeam = document.getElementById("authTabTeam");
  const authTabRegister = document.getElementById("authTabRegister");
  const formTeamAuth = document.getElementById("formTeamAuth");
  const formRegister = document.getElementById("formRegister");
  const userSelectPicker = document.getElementById("userSelectPicker");
  const userNameSearchInput = document.getElementById("userNameSearchInput");
  const selectedUserCard = document.getElementById("selectedUserCard");
  const cardUserName = document.getElementById("cardUserName");
  const cardUserRole = document.getElementById("cardUserRole");
  const cardUserDept = document.getElementById("cardUserDept");
  const cardUserEmail = document.getElementById("cardUserEmail");
  const pinContainer = document.getElementById("pinContainer");
  const userPinInput = document.getElementById("userPinInput");
  const pinHintText = document.getElementById("pinHintText");
  const toggleChangePinLink = document.getElementById("toggleChangePinLink");
  const changePinSubbox = document.getElementById("changePinSubbox");
  const userNewPinInput = document.getElementById("userNewPinInput");
  const rememberMeCheckbox = document.getElementById("rememberMeCheckbox");
  const btnTeamAuthSubmit = document.getElementById("btnTeamAuthSubmit");

  // ── 3. Directorio Oficial de Comercio Exterior (Reconocimiento por Nombre + PIN) ──
  const CORPORATE_DIRECTORY = [
    { code: "AQ-15", id: 15, name: "CRISTINA VERONICA ZAMORANO COFRE", email: "cristina.zamorano@aquachile.com", phone: "+56 9 8765 4321", department: "ANALISTA COMERCIO EXTERIOR", role: "usuario", defaultPin: "2026" },
    { code: "AQ-13", id: 13, name: "DAPHNE PRICIELA PINCOL EMMOTT", email: "daphne.pincol@aquachile.com", phone: "+56 9 5353 9281", department: "ANALISTA COMERCIO EXTERIOR", role: "usuario", defaultPin: "2026" },
    { code: "AQ-16", id: 16, name: "EUGENIA MARTINEZ GONZALEZ", email: "eugenia.martinez@aquachile.com", phone: "", department: "ANALISTA COMERCIO EXTERIOR", role: "usuario", defaultPin: "2026" },
    { code: "AQ-17", id: 17, name: "EVELYN AMANDA SILVA JELVES", email: "evelyn.silva@aquachile.com", phone: "", department: "ANALISTA COMERCIO EXTERIOR PM", role: "usuario", defaultPin: "2026" },
    { code: "AQ-18", id: 18, name: "GINA MALU CHACANO CASTRO", email: "gina.chacano@aquachile.com", phone: "", department: "SUPERVISOR COMERCIO EXTERIOR", role: "usuario", defaultPin: "2026" },
    { code: "AQ-07", id: 7, name: "JONATHAN ARTURO SANCHEZ MORALES", email: "jonathan.sanchez@aquachile.com", phone: "+56998320009", department: "ANALISTA COMERCIO EXTERIOR", role: "usuario", defaultPin: "2026" },
    { code: "AQ-14", id: 14, name: "LIBNI EUNICE CONEJEROS MEDINA", email: "libni.conejeros@aquachile.com", phone: "+56961895302", department: "ANALISTA COMERCIO EXTERIOR PM", role: "usuario", defaultPin: "2026" },
    { code: "AQ-05", id: 5, name: "MARCELO ANDRES RAMIREZ SANCHEZ", email: "marcelo.ramirez@aquachile.com", phone: "+56987634637", department: "ANALISTA COMERCIO EXTERIOR PM", role: "admin", defaultPin: "2026" },
    { code: "AQ-19", id: 19, name: "MATIAS IGNACIO FIGUEROA MORENO", email: "matias.figueroa@aquachile.com", phone: "", department: "ANALISTA COMERCIO EXTERIOR PM", role: "usuario", defaultPin: "2026" },
    { code: "AQ-20", id: 20, name: "MATIAS NICOLAS SOTO MANSILLA", email: "matias.soto@aquachile.com", phone: "", department: "ANALISTA COMERCIO EXTERIOR PM", role: "usuario", defaultPin: "2026" },
    { code: "AQ-06", id: 6, name: "SCANDAR NAGUIB MOHOR TRULLA", email: "scandar.mohor@aquachile.com", phone: "+56967886167", department: "ANALISTA COMERCIO EXTERIOR PM", role: "usuario", defaultPin: "2026" },
    { code: "AQ-21", id: 21, name: "SORAYA CRISTINA NAGUIL NAGUIL", email: "soraya.naguil@aquachile.com", phone: "", department: "ANALISTA COMERCIO EXTERIOR PM", role: "usuario", defaultPin: "2026" },
    { code: "AQ-22", id: 22, name: "VICTOR ARNOLDO VENEGAS", email: "victor.venegas@aquachile.com", phone: "", department: "ANALISTA COMERCIO EXTERIOR", role: "usuario", defaultPin: "2026" },
    { code: "AQ-23", id: 23, name: "XIMENA LEICHTLE", email: "ximena.leichtle@aquachile.com", phone: "", department: "ANALISTA COMERCIO EXTERIOR", role: "usuario", defaultPin: "2026" },
    { code: "AQ-24", id: 24, name: "YULEIDY ANDREINA VALERO MUÑOZ", email: "andreina.valero@aquachile.com", phone: "", department: "ANALISTA COMERCIO EXTERIOR PM", role: "usuario", defaultPin: "2026" },
    { code: "AQ-08", id: 8, name: "CAROLINA BASTIAS PARRA", email: "carolina.bastias@aquachile.com", phone: "+56994439233", department: "TECNOLOGÍA & DESARROLLO AQUASHIELD", role: "admin", defaultPin: "2026" }
  ];

  function getFullDirectory() {
    const extra = JSON.parse(localStorage.getItem("aquashield_extra_directory") || "[]");
    const full = [...CORPORATE_DIRECTORY, ...extra];
    // Ordenar alfabéticamente por nombre
    full.sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }));
    return full;
  }

  function getUserPin(email) {
    const customPins = JSON.parse(localStorage.getItem("aquashield_user_pins") || "{}");
    if (customPins[email.toLowerCase()]) {
      return customPins[email.toLowerCase()];
    }
    const all = getFullDirectory();
    const user = all.find(u => u.email.toLowerCase() === email.toLowerCase());
    return (user && user.defaultPin) ? user.defaultPin : "2026";
  }

  function setUserPin(email, newPin) {
    const customPins = JSON.parse(localStorage.getItem("aquashield_user_pins") || "{}");
    customPins[email.toLowerCase()] = newPin;
    localStorage.setItem("aquashield_user_pins", JSON.stringify(customPins));
  }

  function populateUserSelect(preferredEmail = null) {
    if (!userSelectPicker) return;
    userSelectPicker.innerHTML = '<option value="">-- Elige tu nombre de la lista --</option>';
    const all = getFullDirectory();
    all.forEach(u => {
      const opt = document.createElement("option");
      opt.value = u.email;
      opt.textContent = `${u.name} (${u.department})`;
      userSelectPicker.appendChild(opt);
    });
    if (preferredEmail) {
      userSelectPicker.value = preferredEmail;
      const user = all.find(u => u.email.toLowerCase() === preferredEmail.toLowerCase());
      if (user) selectUser(user, false);
    } else {
      userSelectPicker.value = "";
    }
  }

  function selectUser(user, shouldFocusPin = false) {
    if (!user) {
      if (selectedUserCard) selectedUserCard.style.display = "none";
      if (pinContainer) pinContainer.style.display = "none";
      if (btnTeamAuthSubmit) btnTeamAuthSubmit.disabled = true;
      return;
    }

    if (userSelectPicker) userSelectPicker.value = user.email;
    if (selectedUserCard) {
      selectedUserCard.style.display = "block";
      cardUserName.textContent = user.name;
      cardUserDept.textContent = user.department || "Comercio Exterior";
      cardUserEmail.textContent = user.email;
      cardUserRole.textContent = user.code || "COMEX";
    }

    if (pinContainer) {
      pinContainer.style.display = "block";
      userPinInput.value = "";
      if (changePinSubbox) changePinSubbox.style.display = "none";
      if (userNewPinInput) userNewPinInput.value = "";
      if (shouldFocusPin) {
        setTimeout(() => userPinInput.focus(), 80);
      }
    }

    if (btnTeamAuthSubmit) btnTeamAuthSubmit.disabled = false;
  }

  function checkAuthSession() {
    const localUserStr = localStorage.getItem("aquashield_saved_user");
    if (localUserStr) {
      try {
        const localUser = JSON.parse(localUserStr);
        if (localUser && (localUser.email || localUser.name)) {
          setUserSession(localUser);
          return;
        }
      } catch (e) {}
    }
    clearUserSession();
  }

  function setUserSession(user) {
    currentUser = user;
    localStorage.setItem("aquashield_saved_user", JSON.stringify(user));

    const userDept = user.department ? ` (${user.department})` : '';

    // Renderizar chip de usuario en la cabecera
    userHeaderArea.innerHTML = `
      <div class="user-chip" style="cursor: pointer;" title="Hacer clic para cambiar de usuario">
        <div class="user-chip-avatar">${escapeHtml((user.name || 'U').charAt(0).toUpperCase())}</div>
        <div style="display: flex; flex-direction: column; text-align: left; line-height: 1.2;">
          <span class="user-chip-name" style="font-weight: 700;">${escapeHtml(user.name)}</span>
          <span style="font-size: 0.72rem; color: var(--color-accent); font-weight: 700;">${escapeHtml(user.department || 'Comercio Exterior')}</span>
        </div>
        <button type="button" id="btnLogoutBtn" class="btn-logout-icon" title="Cambiar de usuario o salir">✕</button>
      </div>
    `;

    userHeaderArea.querySelector(".user-chip").addEventListener("click", (e) => {
      if (e.target.id !== "btnLogoutBtn") openAuthModal();
    });

    document.getElementById("btnLogoutBtn").addEventListener("click", (e) => {
      e.stopPropagation();
      clearUserSession();
    });

    // Mostrar acceso al Panel Gestión si es localhost o Administrador
    const isLocalhost = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    const adminNavLink = document.getElementById("adminNavLink");
    if (adminNavLink) {
      adminNavLink.style.display = (isLocalhost || user.role === 'admin' || user.email.includes('marcelo.ramirez') || user.email.includes('carolina.bastias')) ? 'inline-flex' : 'none';
      if (IS_GH_PAGES) adminNavLink.href = "admin.html";
    }

    // Mostrar banner de autocompletado en el formulario
    authAutofillBanner.style.display = "flex";
    bannerUserName.textContent = user.name;
    bannerUserEmail.textContent = `${user.email}${userDept}`;

    // Autocompletar campos del formulario
    requesterNameInput.value = user.name;
    requesterEmailInput.value = user.email;
    if (user.phone) requesterPhoneInput.value = user.phone;

    // Cargar "Mis Solicitudes"
    loadMyTickets();
  }

  function clearUserSession() {
    currentUser = null;
    localStorage.removeItem("aquashield_saved_user");

    const isLocalhost = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    const adminNavLink = document.getElementById("adminNavLink");
    if (adminNavLink) {
      adminNavLink.style.display = isLocalhost ? 'inline-flex' : 'none';
      if (IS_GH_PAGES) adminNavLink.href = "admin.html";
    }

    userHeaderArea.innerHTML = `
      <button type="button" id="btnOpenAuthModal" class="btn-secondary" style="padding: 6px 12px; font-size: 0.84rem;">
        <span>👤 Identificarme / Mis Datos</span>
      </button>
    `;

    document.getElementById("btnOpenAuthModal").addEventListener("click", openAuthModal);

    authAutofillBanner.style.display = "none";
    myTicketsBadgeCount.textContent = "0";
    myTicketsListContainer.innerHTML = `
      <div style="text-align: center; padding: 40px; color: var(--text-secondary);">
        <div style="font-size: 2.2rem; margin-bottom: 8px;">🆔</div>
        <strong style="color: var(--text-primary); font-size: 1.1rem;">Identifícate para ver tus solicitudes</strong>
        <p style="margin: 8px auto 16px auto; max-width: 400px; font-size: 0.9rem;">
          Selecciona tu nombre e ingresa tu PIN para autocompletar el formulario y consultar tu historial.
        </p>
        <button type="button" class="btn-primary" id="btnOpenAuthFromTab">Identificarme</button>
      </div>
    `;

    const btnTab = document.getElementById("btnOpenAuthFromTab");
    if (btnTab) btnTab.addEventListener("click", openAuthModal);
  }

  function openAuthModal() {
    selectUser(null, false);
    populateUserSelect(null);
    if (userNameSearchInput) userNameSearchInput.value = "";
    if (userPinInput) userPinInput.value = "";
    if (userNewPinInput) userNewPinInput.value = "";
    if (changePinSubbox) changePinSubbox.style.display = "none";
    modalAuth.classList.add("active");
    if (userNameSearchInput) setTimeout(() => userNameSearchInput.focus(), 100);
  }

  function closeAuthModal() {
    modalAuth.classList.remove("active");
  }

  if (btnOpenAuthModal) btnOpenAuthModal.addEventListener("click", openAuthModal);
  if (btnCloseAuthModal) btnCloseAuthModal.addEventListener("click", closeAuthModal);
  if (btnChangeAccount) btnChangeAccount.addEventListener("click", openAuthModal);

  if (authTabTeam && authTabRegister) {
    authTabTeam.addEventListener("click", () => {
      authTabTeam.classList.add("active");
      authTabRegister.classList.remove("active");
      formTeamAuth.style.display = "block";
      formRegister.style.display = "none";
    });

    authTabRegister.addEventListener("click", () => {
      authTabRegister.classList.add("active");
      authTabTeam.classList.remove("active");
      formRegister.style.display = "block";
      formTeamAuth.style.display = "none";
    });
  }

  // Cambio en el desplegable de nombres (Mantiene sincronizado el estado del PIN y la tarjeta)
  if (userSelectPicker) {
    const handlePickerChange = () => {
      const email = userSelectPicker.value;
      if (!email) {
        selectUser(null, false);
        return;
      }
      const all = getFullDirectory();
      const matched = all.find(u => u.email.toLowerCase() === email.toLowerCase());
      selectUser(matched, true); // Sí enfoca el PIN al seleccionar con mouse
    };
    userSelectPicker.addEventListener("change", handlePickerChange);
    userSelectPicker.addEventListener("input", handlePickerChange);
  }

  // Búsqueda en tiempo real por texto (100% fluida, NUNCA roba el foco al escribir)
  if (userNameSearchInput) {
    userNameSearchInput.addEventListener("input", () => {
      const q = userNameSearchInput.value.trim().toLowerCase();
      const all = getFullDirectory();

      if (!q) {
        populateUserSelect();
        selectUser(null, false);
        return;
      }

      // Filtrar usuarios que coinciden con la búsqueda
      const filtered = all.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));

      if (userSelectPicker) {
        userSelectPicker.innerHTML = "";
        if (filtered.length === 0) {
          userSelectPicker.innerHTML = '<option value="">-- No se encontraron coincidencias --</option>';
          selectUser(null, false);
          return;
        }

        const defaultOpt = document.createElement("option");
        defaultOpt.value = "";
        defaultOpt.textContent = `-- ${filtered.length} persona(s) encontrada(s) (Elige o sigue escribiendo) --`;
        userSelectPicker.appendChild(defaultOpt);

        filtered.forEach(u => {
          const opt = document.createElement("option");
          opt.value = u.email;
          opt.textContent = `${u.name} (${u.department})`;
          userSelectPicker.appendChild(opt);
        });

        // Si la búsqueda coincide de forma muy cercana con un solo usuario
        if (filtered.length === 1) {
          userSelectPicker.value = filtered[0].email;
          selectUser(filtered[0], false); // Previsualiza sus datos SIN robar el foco del buscador
        } else {
          selectUser(null, false);
        }
      }
    });

    // Si presiona Enter en la caja de búsqueda, pasar al PIN
    userNameSearchInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        if (pinContainer && pinContainer.style.display !== "none") {
          userPinInput.focus();
        } else if (userSelectPicker && userSelectPicker.options.length > 1) {
          userSelectPicker.selectedIndex = 1;
          const email = userSelectPicker.value;
          const all = getFullDirectory();
          const matched = all.find(u => u.email.toLowerCase() === email.toLowerCase());
          if (matched) selectUser(matched, true);
        }
      }
    });
  }

  // Alternar campo para cambiar PIN
  if (toggleChangePinLink && changePinSubbox) {
    toggleChangePinLink.addEventListener("click", () => {
      const isHidden = changePinSubbox.style.display === "none";
      changePinSubbox.style.display = isHidden ? "block" : "none";
      if (isHidden && userNewPinInput) userNewPinInput.focus();
    });
  }

  // Envío de Formulario del Equipo (Nombre + PIN)
  if (formTeamAuth) {
    formTeamAuth.addEventListener("submit", (e) => {
      e.preventDefault();
      const selectedEmail = userSelectPicker.value;
      if (!selectedEmail) {
        alert("Por favor selecciona tu nombre de la lista.");
        return;
      }

      const all = getFullDirectory();
      const user = all.find(u => u.email.toLowerCase() === selectedEmail.toLowerCase());
      if (!user) {
        alert("Usuario no encontrado.");
        return;
      }

      // Si el PIN o la tarjeta estaban ocultos, activarlos y enfocar el PIN
      if (!pinContainer || pinContainer.style.display === "none") {
        selectUser(user, true);
        return;
      }

      const enteredPin = userPinInput.value.trim();
      if (!enteredPin) {
        alert("Por favor ingresa tu PIN personal de 4 dígitos (PIN inicial por defecto: 2026).");
        userPinInput.focus();
        return;
      }

      const correctPin = getUserPin(user.email);

      if (enteredPin !== correctPin) {
        alert("❌ PIN incorrecto. Tu PIN inicial por defecto es 2026. Si olvidaste tu PIN, contacta a Marcelo Ramírez (Admin).");
        userPinInput.select();
        return;
      }

      // Si definió un nuevo PIN propio
      const newPin = userNewPinInput ? userNewPinInput.value.trim() : "";
      if (newPin) {
        if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
          alert("El nuevo PIN debe tener exactamente 4 números.");
          return;
        }
        setUserPin(user.email, newPin);
      }

      // Sesión exitosa
      setUserSession(user);
      closeAuthModal();
    });
  }

  // Envío de Formulario para Otras Áreas
  if (formRegister) {
    formRegister.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = document.getElementById("regName").value.trim();
      const email = document.getElementById("regEmail").value.trim();
      const department = document.getElementById("regDept").value.trim();
      const phone = document.getElementById("regPhone").value.trim();
      const pin = document.getElementById("regPin").value.trim();

      if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
        alert("El PIN debe tener exactamente 4 números.");
        return;
      }

      const all = getFullDirectory();
      const newCode = "AQ-" + String(all.length + 10);
      const newUser = {
        code: newCode,
        name: name,
        email: email,
        department: department,
        phone: phone,
        role: "usuario",
        defaultPin: pin
      };

      const extra = JSON.parse(localStorage.getItem("aquashield_extra_directory") || "[]");
      extra.push(newUser);
      localStorage.setItem("aquashield_extra_directory", JSON.stringify(extra));
      setUserPin(email, pin);

      setUserSession(newUser);
      closeAuthModal();
      alert(`¡Bienvenido/a, ${name}! Tu perfil ha quedado configurado con tu PIN personal.`);
    });
  }

  // ── Banner Inteligente de Red y Conexión ────────────────────────────────
  const networkStatusBanner = document.getElementById("networkStatusBanner");
  function renderNetworkStatusBanner() {
    if (!networkStatusBanner) return;
    const isLocal = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.port === '5050');
    
    if (isLocal) {
      networkStatusBanner.innerHTML = `
        <div style="background: rgba(46,125,50,0.08); border: 1.5px solid #2E7D32; border-radius: var(--radius-md); padding: 10px 16px; display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 1.2rem;">🟢</span>
            <span style="font-size: 0.86rem; color: #2E7D32; font-weight: 700;">Conectado en Tiempo Real al Servidor Central (PM-COME-N255 · SQLite Activo)</span>
          </div>
          <span style="font-size: 0.76rem; color: #2E7D32; background: rgba(46,125,50,0.12); padding: 3px 10px; border-radius: 12px; font-weight: 600;">Sincronización Instantánea</span>
        </div>
      `;
    } else {
      networkStatusBanner.innerHTML = `
        <div style="background: linear-gradient(135deg, rgba(230,81,0,0.07), rgba(255,152,0,0.12)); border: 1.5px solid var(--color-accent); border-radius: var(--radius-md); padding: 12px 16px; display: flex; align-items: center; justify-content: space-between; gap: 14px; flex-wrap: wrap;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 1.5rem;">🏢</span>
            <div>
              <div style="font-weight: 700; color: var(--text-primary); font-size: 0.92rem;">
                ¿Estás en la Red AquaChile o conectado a la VPN?
              </div>
              <div style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 2px;">
                Para que tu requerimiento entre de inmediato al servidor de Marcelo Ramírez con timbre en vivo:
              </div>
            </div>
          </div>
          <a href="http://PM-COME-N255:5050" class="btn-primary" style="padding: 8px 16px; font-size: 0.84rem; text-decoration: none; white-space: nowrap; display: inline-flex; align-items: center; gap: 6px;" title="Acceder directamente al servidor interno de Comercio Exterior">
            <span>⚡ Servidor Directo AquaChile</span>
          </a>
        </div>
      `;
    }
  }
  renderNetworkStatusBanner();

  // ── 4. Cargar "Mis Solicitudes" (Resiliente 100% Offline-First) ───────────
  let cachedAllTickets = [];

  async function loadMyTickets() {
    if (!currentUser) return;

    const offlineList = JSON.parse(localStorage.getItem("aquashield_offline_tickets") || "[]");
    try {
      myTicketsListContainer.innerHTML = `
        <div style="text-align: center; padding: 40px; color: var(--text-secondary);">
          <div class="spinner" style="margin: 0 auto 12px auto; width: 28px; height: 28px; border: 3px solid var(--border-color); border-top-color: var(--color-accent); border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
          Consultando tus solicitudes...
        </div>
      `;

      let serverTickets = [];
      let fetchSuccess = false;

      // 1. Intentar conectar a la API del backend si responde
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2500);
        const response = await fetch(API_BASE + `/api/my-tickets?email=${encodeURIComponent(currentUser.email)}`, {
          credentials: "include",
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        const data = await response.json();
        if (data.success && Array.isArray(data.tickets)) {
          serverTickets = data.tickets;
          fetchSuccess = true;
        }
      } catch (e) {
        // Backend en reposo o sin túnel
      }

      // 2. Si la API no respondió (GitHub Pages / Offline), consultar tickets.json publicado en el repo
      if (!fetchSuccess) {
        try {
          const ghRes = await fetch("static/data/tickets.json?v=" + Date.now());
          if (ghRes.ok) {
            const allGhTickets = await ghRes.json();
            cachedAllTickets = allGhTickets;
            const myEmail = (currentUser.email || "").trim().toLowerCase();
            const myName = (currentUser.name || "").trim().toLowerCase();

            serverTickets = allGhTickets.filter(t => {
              const tEmail = (t.requester_email || "").trim().toLowerCase();
              const tName = (t.requester_name || "").trim().toLowerCase();
              return (myEmail && tEmail === myEmail) || (myName && tName.includes(myName));
            });
            fetchSuccess = true;
          }
        } catch (ghErr) {
          console.warn("No se pudo cargar tickets.json:", ghErr);
        }
      }

      // 3. Filtrar requerimientos guardados en este navegador para este usuario
      const myOffline = offlineList.filter(t => {
        const tEmail = (t.requester_email || "").toLowerCase();
        return tEmail === (currentUser.email || "").toLowerCase();
      });

      // Combinar y renderizar
      const allMyTickets = [...myOffline, ...serverTickets];
      myTicketsBadgeCount.textContent = allMyTickets.length;
      renderMyTicketsList(allMyTickets);

    } catch (err) {
      console.warn("Error al cargar historial:", err);
      const myOffline = offlineList.filter(t => {
        return (t.requester_email || "").toLowerCase() === (currentUser.email || "").toLowerCase();
      });
      myTicketsBadgeCount.textContent = myOffline.length;
      renderMyTicketsList(myOffline);
    }
  }

  const statusConfig = {
    en_espera: { label: "En Bandeja de Espera", class: "en_analisis", icon: "⏳" },
    abierto: { label: "Abierto / En Cola", class: "abierto", icon: "📬" },
    en_analisis: { label: "En Análisis", class: "en_analisis", icon: "🔍" },
    en_desarrollo: { label: "En Desarrollo", class: "en_desarrollo", icon: "⚡" },
    resuelto: { label: "Resuelto", class: "resuelto", icon: "✅" },
    descartado: { label: "Descartado", class: "descartado", icon: "❌" }
  };

  function renderMyTicketsList(tickets) {
    if (!tickets || tickets.length === 0) {
      myTicketsListContainer.innerHTML = `
        <div style="text-align: center; padding: 40px; color: var(--text-secondary);">
          <div style="font-size: 2.2rem; margin-bottom: 8px;">📭</div>
          <strong style="color: var(--text-primary); font-size: 1.1rem;">Aún no tienes solicitudes registradas</strong>
          <p style="margin-top: 6px; font-size: 0.9rem;">
            Crea tu primera solicitud desde la pestaña <strong>"Nueva Solicitud"</strong>.
          </p>
        </div>
      `;
      return;
    }

    myTicketsListContainer.innerHTML = "";

    const listWrapper = document.createElement("div");
    listWrapper.style.display = "flex";
    listWrapper.style.flexDirection = "column";
    listWrapper.style.gap = "12px";

    tickets.forEach(t => {
      const st = statusConfig[t.status] || { label: t.status, class: "abierto", icon: "📌" };
      const card = document.createElement("div");
      card.className = "attachment-item";
      card.style.flexDirection = "column";
      card.style.alignItems = "stretch";
      card.style.padding = "16px 20px";
      card.style.cursor = "pointer";
      card.style.gap = "10px";

      card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <strong style="font-family: 'Quicksand', sans-serif; font-size: 1.1rem; color: var(--color-accent);">${escapeHtml(t.code)}</strong>
            <span style="font-weight: 700; color: var(--text-primary);">${escapeHtml(t.module_name)}</span>
            <span style="font-size: 0.78rem; text-transform: uppercase; color: var(--text-secondary);">● ${escapeHtml(t.type)}</span>
          </div>
          <span class="status-badge ${st.class}">${st.icon} ${escapeHtml(st.label)}</span>
        </div>

        <div style="font-size: 0.95rem; font-weight: 700; color: var(--text-primary);">
          ${escapeHtml(t.title)}
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.78rem; color: var(--text-secondary); border-top: 1px dashed var(--border-color); padding-top: 8px;">
          <span>Registrado el: ${escapeHtml(t.created_at || '')}</span>
          <div style="display: flex; gap: 8px; align-items: center;">
            ${(t.is_offline || t.status === 'en_espera') ? `<button type="button" class="btn-primary btn-user-card-resend" style="padding: 3px 10px; font-size: 0.75rem; background: #2E7D32; border-color: #2E7D32;" title="Reenviar requerimiento a Marcelo">🚀 Reenviar</button>` : ''}
            <button type="button" class="btn-secondary btn-user-card-chat" style="padding: 3px 8px; font-size: 0.75rem;" title="Abrir chat en el lateral">💬 Chat Lateral</button>
            <button type="button" class="btn-primary btn-user-card-view" style="padding: 3px 8px; font-size: 0.75rem;" title="Ver detalle completo">👁️ Ver Detalle</button>
          </div>
        </div>
      `;

      const btnChat = card.querySelector(".btn-user-card-chat");
      if (btnChat) {
        btnChat.addEventListener("click", (e) => {
          e.stopPropagation();
          openUserFloatingChat(t.id, t.code, t.module_name);
        });
      }

      const btnResend = card.querySelector(".btn-user-card-resend");
      if (btnResend) {
        btnResend.addEventListener("click", (e) => {
          e.stopPropagation();
          openResendTicketModal(t);
        });
      }

      const btnView = card.querySelector(".btn-user-card-view");
      if (btnView) {
        btnView.addEventListener("click", (e) => {
          e.stopPropagation();
          openUserTicketDetail(t.id);
        });
      }

      card.addEventListener("click", () => {
        openUserTicketDetail(t.id);
      });

      listWrapper.appendChild(card);
    });

    myTicketsListContainer.appendChild(listWrapper);
  }

  if (btnRefreshMyTickets) {
    btnRefreshMyTickets.addEventListener("click", loadMyTickets);
  }


  // ── Modal para Reenviar Ticket a Marcelo ─────────────────────────────────
  const modalResendTicket = document.getElementById("modalResendTicket");
  const btnCloseResendModal = document.getElementById("btnCloseResendModal");
  const btnCancelResendModal = document.getElementById("btnCancelResendModal");
  const resendModalCode = document.getElementById("resendModalCode");
  const resendModalTitle = document.getElementById("resendModalTitle");
  const resendModalSub = document.getElementById("resendModalSub");
  const resendFormName = document.getElementById("resendFormName");
  const resendFormEmail = document.getElementById("resendFormEmail");
  const resendFormPhone = document.getElementById("resendFormPhone");
  const resendFormModule = document.getElementById("resendFormModule");
  const resendFormType = document.getElementById("resendFormType");
  const resendFormPriority = document.getElementById("resendFormPriority");
  const resendFormTitle = document.getElementById("resendFormTitle");
  const resendFormDesc = document.getElementById("resendFormDesc");
  const btnResendMailto = document.getElementById("btnResendMailto");
  const btnResendTeams = document.getElementById("btnResendTeams");

  function openResendTicketModal(t) {
    if (!modalResendTicket || !t) return;

    if (resendModalCode) resendModalCode.textContent = t.code || "TKT-WAIT";
    if (resendModalTitle) resendModalTitle.textContent = t.title || "Requerimiento";
    if (resendModalSub) resendModalSub.textContent = `Módulo: ${t.module_name || 'AquaShield'} | Solicitante: ${t.requester_name || 'Colaborador COMEX'}`;

    if (resendFormName) resendFormName.value = t.requester_name || "";
    if (resendFormEmail) resendFormEmail.value = t.requester_email || "";
    if (resendFormPhone) resendFormPhone.value = t.requester_phone || "";
    if (resendFormModule) resendFormModule.value = t.module_name || "";
    if (resendFormType) resendFormType.value = t.type || "problema";
    if (resendFormPriority) resendFormPriority.value = t.priority || "media";
    if (resendFormTitle) resendFormTitle.value = t.title || "";
    if (resendFormDesc) resendFormDesc.value = (t.code ? `[Desde ${t.code}]\n\n` : "") + (t.description || "");

    // Configurar Mailto
    const mailSubj = encodeURIComponent(`[MESA DE AYUDA AQUASHIELD] ${t.code || 'REQUERIMIENTO'}: ${t.title} (${t.module_name})`);
    const mailBody = encodeURIComponent(
`Hola Marcelo,

He registrado el siguiente requerimiento en la Mesa de Ayuda AquaShield:

══════════════════════════════════════════════════════
📌 CÓDIGO TEMPORAL: ${t.code || 'EN ESPERA'}
👤 SOLICITANTE:     ${t.requester_name} (${t.requester_email})
📞 CONTACTO:        ${t.requester_phone || 'No especificado'}
📦 MÓDULO AFECTADO: ${t.module_name}
⚡ TIPO:             ${(t.type || 'problema').toUpperCase()}
🎯 PRIORIDAD:        ${(t.priority || 'media').toUpperCase()}
📝 TÍTULO:           ${t.title}
══════════════════════════════════════════════════════

DESCRIPCIÓN DEL CASO:
${t.description}

══════════════════════════════════════════════════════
(Reenviado desde Portal AquaShield)`
    );

    if (btnResendMailto) {
      btnResendMailto.href = `mailto:marcelo.ramirez@aquachile.com?cc=${encodeURIComponent(t.requester_email || '')}&subject=${mailSubj}&body=${mailBody}`;
    }

    // Configurar Teams
    if (btnResendTeams) {
      const teamsText = `🔔 *Nuevo Requerimiento AquaShield* (${t.code || 'EN ESPERA'})\n` +
        `👤 *Solicitante:* ${t.requester_name} (${t.requester_email})\n` +
        `📦 *Módulo:* ${t.module_name} | *Tipo:* ${(t.type || 'problema').toUpperCase()}\n` +
        `📝 *Título:* ${t.title}\n` +
        `📄 *Detalle:* ${(t.description || '').substring(0, 300)}...`;

      btnResendTeams.onclick = () => {
        navigator.clipboard.writeText(teamsText).then(() => {
          btnResendTeams.innerHTML = "<span>✅ ¡Copiado! Pégalo en Teams con Ctrl+V</span>";
          setTimeout(() => {
            btnResendTeams.innerHTML = "<span>📋 3. Copiar Resumen para Microsoft Teams</span>";
          }, 3500);
        }).catch(() => {
          alert("No se pudo copiar automáticamente. Usa el botón de Outlook.");
        });
      };
    }

    modalResendTicket.classList.add("active");
  }

  const closeResendModal = () => {
    if (modalResendTicket) modalResendTicket.classList.remove("active");
  };
  if (btnCloseResendModal) btnCloseResendModal.addEventListener("click", closeResendModal);
  if (btnCancelResendModal) btnCancelResendModal.addEventListener("click", closeResendModal);

  // ── 5. Tabs de Navegación ────────────────────────────────────────────────
  const tabBtns = document.querySelectorAll(".aq-tab-btn");
  const tabContents = document.querySelectorAll(".tab-content");

  tabBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const targetId = btn.getAttribute("data-tab");
      
      tabBtns.forEach(b => b.classList.remove("active"));
      tabContents.forEach(c => c.classList.remove("active"));
      
      btn.classList.add("active");
      const targetContent = document.getElementById(targetId);
      if (targetContent) targetContent.classList.add("active");

      if (targetId === "tab-mis-solicitudes") {
        loadMyTickets();
      }
    });
  });


  // ── 6. Cargar Módulos Oficiales (Resiliente 100% Offline-First) ─────────
  const moduleSelect = document.getElementById("module_select");

  const DEFAULT_OFFICIAL_MODULES = [
    { id: 1, name: "Módulo Congelado", description: "Gestión, empaque y trazabilidad de producto congelado" },
    { id: 2, name: "Módulo Fresco", description: "Procesamiento y exportación de salmón fresco" },
    { id: 3, name: "Módulo Proformas", description: "Generación, validación y control de facturas proforma" },
    { id: 4, name: "Módulo Seguros", description: "Emisión automática de pólizas y certificados de seguros" },
    { id: 5, name: "Módulo ExportDesk", description: "Monitoreo y gestión de despachos de exportación" },
    { id: 7, name: "Agente Correos", description: "Clasificación inteligente y extracción de correos operacionales" },
    { id: 8, name: "Módulo Termógrafo", description: "Lectura y análisis de registros térmicos y temperaturas" },
    { id: 9, name: "Módulo Validador HC", description: "Validación y verificación de certificados sanitarios (HC)" },
    { id: 10, name: "Módulo Invoice Converter", description: "Conversión y estandarización de invoices y packing lists" },
    { id: 11, name: "Módulo ISF", description: "Presentación y seguimiento de declaraciones ISF ante aduanas" },
    { id: 13, name: "Módulo Carga Neppex", description: "Integración y subida de planillas al sistema Neppex" },
    { id: 14, name: "Módulo LabelInspect", description: "Inspección y auditoría de etiquetas y rotulaciones de cajas" },
    { id: 18, name: "Otro / General", description: "Otras solicitudes o requerimientos no catalogados" }
  ];

  function renderModulesList(modulesList, selectedId = null) {
    if (!moduleSelect) return;
    const currentVal = selectedId || moduleSelect.value;
    moduleSelect.innerHTML = '<option value="">-- Selecciona un módulo --</option>';
    modulesList.forEach(m => {
      const opt = document.createElement("option");
      opt.value = m.id;
      opt.textContent = m.name;
      if (currentVal && (m.id == currentVal || m.name.toLowerCase() === currentVal.toString().toLowerCase())) {
        opt.selected = true;
      }
      moduleSelect.appendChild(opt);
    });
  }

  async function loadModules(selectedId = null) {
    // 1. Mostrar de inmediato los módulos oficiales + personalizados (Cero demora)
    const custom = JSON.parse(localStorage.getItem("aquashield_custom_modules") || "[]");
    const combined = [...DEFAULT_OFFICIAL_MODULES, ...custom];
    renderModulesList(combined, selectedId);

    // 2. Si el backend está disponible, sincronizar con la base de datos
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);
      const response = await fetch(API_BASE + "/api/modules", { signal: controller.signal });
      clearTimeout(timeoutId);
      const data = await response.json();
      
      if (data.success && data.modules && data.modules.length > 0) {
        renderModulesList(data.modules, selectedId);
      }
    } catch (err) {
      // Backend offline o en reposo: los módulos oficiales ya están visibles
    }
  }

  loadModules();

  // ── 7. Modal para Crear Nuevo Módulo al Vuelo ────────────────────────────
  const modalNewModule = document.getElementById("modalNewModule");
  const btnOpenNewModule = document.getElementById("btnOpenNewModuleModal");
  const btnCloseModuleModal = document.getElementById("btnCloseModuleModal");
  const btnCancelModuleModal = document.getElementById("btnCancelModuleModal");
  const btnSaveNewModule = document.getElementById("btnSaveNewModule");
  const newModuleNameInput = document.getElementById("new_module_name");
  const newModuleDescInput = document.getElementById("new_module_desc");

  function openModuleModal() {
    newModuleNameInput.value = "";
    newModuleDescInput.value = "";
    modalNewModule.classList.add("active");
    newModuleNameInput.focus();
  }

  function closeModuleModal() {
    modalNewModule.classList.remove("active");
  }

  btnOpenNewModule.addEventListener("click", openModuleModal);
  btnCloseModuleModal.addEventListener("click", closeModuleModal);
  btnCancelModuleModal.addEventListener("click", closeModuleModal);

  btnSaveNewModule.addEventListener("click", async () => {
    const name = newModuleNameInput.value.trim();
    const description = newModuleDescInput.value.trim();

    if (!name) {
      alert("Por favor ingresa el nombre del nuevo módulo");
      return;
    }

    try {
      btnSaveNewModule.disabled = true;
      btnSaveNewModule.textContent = "Guardando...";

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);
      const response = await fetch(API_BASE + "/api/modules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      const data = await response.json();
      if (data.success) {
        await loadModules(data.module.id);
        closeModuleModal();
        return;
      }
    } catch (err) {
      // Si el backend no responde, guardar módulo en caché local del navegador
      const custom = JSON.parse(localStorage.getItem("aquashield_custom_modules") || "[]");
      const newId = "local-" + Date.now();
      custom.push({ id: newId, name: name, description: description });
      localStorage.setItem("aquashield_custom_modules", JSON.stringify(custom));
      loadModules(newId);
      closeModuleModal();
    } finally {
      btnSaveNewModule.disabled = false;
      btnSaveNewModule.textContent = "Guardar Módulo";
    }
  });

  // ── 8. Gestión de Archivos Adjuntos (Drag & Drop + Acumulación) ──────────
  const dropzone = document.getElementById("dropzone");
  const fileInput = document.getElementById("fileInput");
  const attachmentsPreview = document.getElementById("attachmentsPreview");

  let attachedFiles = [];

  dropzone.addEventListener("click", () => fileInput.click());

  dropzone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropzone.classList.add("dragover");
  });

  dropzone.addEventListener("dragleave", () => {
    dropzone.classList.remove("dragover");
  });

  dropzone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropzone.classList.remove("dragover");
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(Array.from(e.dataTransfer.files));
    }
  });

  fileInput.addEventListener("change", (e) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(Array.from(e.target.files));
      fileInput.value = "";
    }
  });

  // Atajo Ctrl + V para pegar capturas de pantalla del portapapeles (solo en formulario principal)
  window.addEventListener("paste", (e) => {
    if (e.defaultPrevented) return;

    // Ignorar si el usuario está escribiendo en cualquier input/textarea o si hay un chat abierto
    const tag = (e.target && e.target.tagName) ? e.target.tagName.toLowerCase() : "";
    if (tag === "input" || tag === "textarea" || (e.target && e.target.isContentEditable)) return;
    if (modalUserTicketDetail && modalUserTicketDetail.classList.contains("active")) return;
    if (document.querySelector(".floating-chat-window:not(.minimized)")) return;

    if (e.clipboardData && e.clipboardData.items) {
      const items = e.clipboardData.items;
      let imagePasted = false;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            const now = new Date();
            const timeStr = now.getFullYear() +
              String(now.getMonth() + 1).padStart(2, '0') +
              String(now.getDate()).padStart(2, '0') + '_' +
              String(now.getHours()).padStart(2, '0') +
              String(now.getMinutes()).padStart(2, '0') +
              String(now.getSeconds()).padStart(2, '0') + '_' +
              String(now.getMilliseconds()).padStart(3, '0');
            const file = new File([blob], `Captura_Portapapeles_${timeStr}.png`, { type: blob.type || "image/png" });
            addFiles([file]);
            imagePasted = true;
          }
        }
      }
      if (imagePasted) {
        // Efecto visual en la dropzone
        dropzone.classList.add("dragover");
        setTimeout(() => dropzone.classList.remove("dragover"), 600);
      }
    }
  });

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

  function addFiles(newFiles) {
    newFiles.forEach(file => {
      const exists = attachedFiles.some(f => f.name === file.name && f.size === file.size);
      if (!exists) {
        attachedFiles.push(file);
      }
    });
    renderAttachmentsPreview();
  }

  function removeFile(index) {
    attachedFiles.splice(index, 1);
    renderAttachmentsPreview();
  }

  function renderAttachmentsPreview() {
    attachmentsPreview.innerHTML = "";
    if (attachedFiles.length === 0) return;

    attachedFiles.forEach((file, index) => {
      const item = document.createElement("div");
      item.className = "attachment-item";
      item.innerHTML = `
        <div class="attachment-info">
          <span class="attachment-icon">${getFileIcon(file.name)}</span>
          <span class="attachment-name" title="${file.name}">${file.name}</span>
          <span class="attachment-size">(${formatBytes(file.size)})</span>
        </div>
        <button type="button" class="btn-remove-att" title="Quitar archivo">&times;</button>
      `;

      item.querySelector(".btn-remove-att").addEventListener("click", () => removeFile(index));
      attachmentsPreview.appendChild(item);
    });
  }

  // ── 9. Envío del Formulario de Ticket ────────────────────────────────────
  const ticketForm = document.getElementById("ticketForm");
  const btnSubmitTicket = document.getElementById("btnSubmitTicket");
  const btnResetForm = document.getElementById("btnResetForm");
  const modalSuccessTicket = document.getElementById("modalSuccessTicket");
  const successTicketCode = document.getElementById("successTicketCode");
  const btnSuccessOk = document.getElementById("btnSuccessOk");

  btnResetForm.addEventListener("click", () => {
    attachedFiles = [];
    renderAttachmentsPreview();
    if (currentUser) {
      setTimeout(() => {
        requesterNameInput.value = currentUser.name;
        requesterEmailInput.value = currentUser.email;
        if (currentUser.phone) requesterPhoneInput.value = currentUser.phone;
      }, 50);
    }
  });

  ticketForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData(ticketForm);
    
    // Si hay usuario logueado, asegurar ID
    if (currentUser && currentUser.id) {
      formData.set("user_id", currentUser.id);
    }

    // Concatenar detalles específicos estructurados según tipo
    let fullDescription = formData.get("description") || "";
    const extraDetails = [];
    const dfPantalla = document.getElementById("df_pantalla");
    const dfErrorMsg = document.getElementById("df_error_msg");
    const dfSapRol = document.getElementById("df_sap_rol");
    const dfPlanta = document.getElementById("df_planta");
    const dfJefatura = document.getElementById("df_jefatura");
    const dfProceso = document.getElementById("df_proceso_actual");
    const dfBeneficio = document.getElementById("df_beneficio");

    if (dfPantalla && dfPantalla.value.trim()) extraDetails.push(`• Submódulo/Pantalla: ${dfPantalla.value.trim()}`);
    if (dfErrorMsg && dfErrorMsg.value.trim()) extraDetails.push(`• Error reportado: ${dfErrorMsg.value.trim()}`);
    if (dfSapRol && dfSapRol.value.trim()) extraDetails.push(`• Rol/Transacción SAP: ${dfSapRol.value.trim()}`);
    if (dfPlanta && dfPlanta.value.trim()) extraDetails.push(`• Planta/Centro: ${dfPlanta.value.trim()}`);
    if (dfJefatura && dfJefatura.value.trim()) extraDetails.push(`• Jefatura Autoriza: ${dfJefatura.value.trim()}`);
    if (dfProceso && dfProceso.value.trim()) extraDetails.push(`• Proceso actual: ${dfProceso.value.trim()}`);
    if (dfBeneficio && dfBeneficio.value.trim()) extraDetails.push(`• Beneficio esperado: ${dfBeneficio.value.trim()}`);

    if (extraDetails.length > 0) {
      fullDescription += "\n\n--- DETALLES ESPECÍFICOS ---\n" + extraDetails.join("\n");
      formData.set("description", fullDescription);
    }

    formData.delete("files[]");
    attachedFiles.forEach(file => {
      formData.append("files[]", file);
    });

    try {
      btnSubmitTicket.disabled = true;
      btnSubmitTicket.innerHTML = "<span>⏳ Enviando solicitud...</span>";

      // Intentar enviar al backend con timeout seguro
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4500);

      const response = await fetch(API_BASE + "/api/tickets", {
        method: "POST",
        body: formData,
        credentials: "include",
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      const data = await response.json();

      if (data.success) {
        ticketForm.reset();
        attachedFiles = [];
        renderAttachmentsPreview();

        if (currentUser) {
          requesterNameInput.value = currentUser.name;
          requesterEmailInput.value = currentUser.email;
          if (currentUser.phone) requesterPhoneInput.value = currentUser.phone;
          loadMyTickets();
        }

        const successTitle = document.getElementById("successModalTitle");
        const successDesc = document.getElementById("successModalDesc");
        const successIcon = document.getElementById("successModalIcon");
        const successCode = document.getElementById("successTicketCode");
        const successActions = document.getElementById("successOfflineActions");

        if (successIcon) successIcon.textContent = "✅";
        if (successTitle) successTitle.textContent = "¡Solicitud Creada con Éxito!";
        if (successDesc) successDesc.textContent = "Tu requerimiento ha sido registrado en la base de datos central de AquaShield y notificado al equipo.";
        if (successCode) successCode.textContent = data.ticket.code;
        if (successActions) successActions.style.display = "none";

        modalSuccessTicket.classList.add("active");
      } else {
        alert("Error al enviar la solicitud: " + (data.error || "Ocurrió un error inesperado"));
      }
    } catch (err) {
      console.warn("Servidor central en reposo o fuera de red. Activando despacho multicanal...", err);

      const now = new Date();
      const waitCode = "TKT-WAIT-" + String(now.getHours()).padStart(2, '0') + String(now.getMinutes()).padStart(2, '0') + "-" + String(Math.floor(100 + Math.random() * 900));
      
      const moduleSelect = document.getElementById("module_select");
      const reqName = formData.get("requester_name") || (currentUser ? currentUser.name : "Colaborador COMEX");
      const reqEmail = formData.get("requester_email") || (currentUser ? currentUser.email : "");
      const reqPhone = formData.get("requester_phone") || "";
      const reqModule = moduleSelect && moduleSelect.options[moduleSelect.selectedIndex] ? moduleSelect.options[moduleSelect.selectedIndex].text : (formData.get("module_name") || "AquaShield");
      const reqType = formData.get("type") || "problema";
      const reqPriority = formData.get("priority") || "media";
      const reqTitle = formData.get("title") || "Requerimiento de Soporte";

      const offlineTicket = {
        code: waitCode,
        id: "offline_" + Date.now(),
        requester_name: reqName,
        requester_email: reqEmail,
        requester_phone: reqPhone,
        module_name: reqModule,
        type: reqType,
        priority: reqPriority,
        title: reqTitle,
        description: fullDescription,
        status: "en_espera",
        created_at: now.toLocaleString("es-CL"),
        is_offline: true
      };

      const offlineList = JSON.parse(localStorage.getItem("aquashield_offline_tickets") || "[]");
      offlineList.unshift(offlineTicket);
      localStorage.setItem("aquashield_offline_tickets", JSON.stringify(offlineList));

      ticketForm.reset();
      attachedFiles = [];
      renderAttachmentsPreview();
      if (currentUser) {
        requesterNameInput.value = currentUser.name;
        requesterEmailInput.value = currentUser.email;
        if (currentUser.phone) requesterPhoneInput.value = currentUser.phone;
        loadMyTickets();
      }

      // Configurar Despacho Multicanal (Outlook + Teams)
      const successTitle = document.getElementById("successModalTitle");
      const successDesc = document.getElementById("successModalDesc");
      const successIcon = document.getElementById("successModalIcon");
      const successCode = document.getElementById("successTicketCode");
      const successActions = document.getElementById("successOfflineActions");

      if (successIcon) successIcon.textContent = "⏳";
      if (successTitle) successTitle.textContent = "Solicitud Respaldada en Bandeja 24/7";
      if (successDesc) successDesc.innerHTML = `Tu requerimiento quedó seguro en tu equipo con código temporal. <strong>Para que Marcelo Ramírez lo reciba de inmediato:</strong>`;
      if (successCode) successCode.textContent = waitCode;

      // Construir mailto estructurado para Outlook
      const mailSubj = encodeURIComponent(`[MESA DE AYUDA AQUASHIELD] ${waitCode}: ${reqTitle} (${reqModule})`);
      const mailBody = encodeURIComponent(
`Hola Marcelo,

He registrado el siguiente requerimiento en la Mesa de Ayuda AquaShield:

══════════════════════════════════════════════════════
📌 CÓDIGO TEMPORAL: ${waitCode}
👤 SOLICITANTE:     ${reqName} (${reqEmail})
📞 CONTACTO:        ${reqPhone || 'No especificado'}
📦 MÓDULO AFECTADO: ${reqModule}
⚡ TIPO:             ${reqType.toUpperCase()}
🎯 PRIORIDAD:        ${reqPriority.toUpperCase()}
📝 TÍTULO:           ${reqTitle}
══════════════════════════════════════════════════════

DESCRIPCIÓN DEL CASO:
${fullDescription}

══════════════════════════════════════════════════════
(Enviado desde el Portal Web AquaShield)`
      );

      const btnMail = document.getElementById("btnSuccessMailto");
      if (btnMail) {
        btnMail.href = `mailto:marcelo.ramirez@aquachile.com?cc=${encodeURIComponent(reqEmail)}&subject=${mailSubj}&body=${mailBody}`;
      }

      // Formato para Teams
      const teamsText = `🔔 *Nuevo Requerimiento AquaShield* (${waitCode})\n` +
        `👤 *Solicitante:* ${reqName} (${reqEmail})\n` +
        `📦 *Módulo:* ${reqModule} | *Tipo:* ${reqType.toUpperCase()}\n` +
        `📝 *Título:* ${reqTitle}\n` +
        `📄 *Detalle:* ${fullDescription.substring(0, 300)}...`;

      const btnTeams = document.getElementById("btnSuccessTeams");
      if (btnTeams) {
        btnTeams.onclick = () => {
          navigator.clipboard.writeText(teamsText).then(() => {
            btnTeams.innerHTML = "<span>✅ ¡Copiado! Pégalo en Teams con Ctrl+V</span>";
            setTimeout(() => {
              btnTeams.innerHTML = "<span>📋 Copiar Resumen para Microsoft Teams</span>";
            }, 3500);
          }).catch(() => {
            alert("No se pudo copiar automáticamente. Por favor abre el correo de Outlook.");
          });
        };
      }

      if (successActions) successActions.style.display = "flex";
      modalSuccessTicket.classList.add("active");
    } finally {
      btnSubmitTicket.disabled = false;
      btnSubmitTicket.innerHTML = "<span>🚀 Enviar Solicitud</span>";
    }
  });

  btnSuccessOk.addEventListener("click", () => {
    modalSuccessTicket.classList.remove("active");
  });

  // ── 10. Consulta de Estado de Ticket ─────────────────────────────────────
  const trackCodeInput = document.getElementById("trackCodeInput");
  const btnTrackTicket = document.getElementById("btnTrackTicket");
  const trackResultContainer = document.getElementById("trackResultContainer");

  async function trackTicket() {
    const code = trackCodeInput.value.trim();
    if (!code) {
      alert("Por favor ingresa un código de ticket");
      return;
    }

    try {
      btnTrackTicket.disabled = true;
      btnTrackTicket.textContent = "Buscando...";

      let ticket = null;

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        const response = await fetch(API_BASE + `/api/tickets/${encodeURIComponent(code)}`, { signal: controller.signal });
        clearTimeout(timeoutId);
        const data = await response.json();
        if (data.success && data.ticket) ticket = data.ticket;
      } catch (e) {}

      if (!ticket) {
        const offlineList = JSON.parse(localStorage.getItem("aquashield_offline_tickets") || "[]");
        ticket = offlineList.find(x => (x.code || "").toUpperCase() === code.toUpperCase());
        if (!ticket) {
          try {
            const ghRes = await fetch("static/data/tickets.json?v=" + Date.now());
            if (ghRes.ok) {
              const allGh = await ghRes.json();
              ticket = allGh.find(x => (x.code || "").toUpperCase() === code.toUpperCase());
            }
          } catch (ghE) {}
        }
      }

      if (ticket) {
        renderTrackingResult(ticket);
      } else {
        trackResultContainer.style.display = "block";
        trackResultContainer.innerHTML = `
          <div style="background-color: var(--bg-card-secondary); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 24px; text-align: center; color: var(--text-secondary);">
            <div style="font-size: 2rem; margin-bottom: 8px;">🔍</div>
            <strong style="color: var(--text-primary); font-size: 1.1rem;">Ticket No Encontrado</strong>
            <p style="margin-top: 6px;">Verifica que el código ingresado (ej: <strong>${code}</strong>) esté escrito correctamente.</p>
          </div>
        `;
      }
    } catch (err) {
      alert("Error al consultar el ticket");
    } finally {
      btnTrackTicket.disabled = false;
      btnTrackTicket.textContent = "Buscar";
    }
  }

  btnTrackTicket.addEventListener("click", trackTicket);
  trackCodeInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      trackTicket();
    }
  });

  function renderTrackingResult(ticket) {
    trackResultContainer.style.display = "block";

    const st = statusConfig[ticket.status] || { label: ticket.status, class: "abierto", icon: "📌" };

    let attachmentsHtml = "";
    if (ticket.attachments && ticket.attachments.length > 0) {
      attachmentsHtml = `
        <div style="margin-top: 14px;">
          <strong style="font-size: 0.85rem; color: var(--text-secondary); text-transform: uppercase;">Archivos Adjuntos (${ticket.attachments.length}):</strong>
          <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 6px;">
            ${ticket.attachments.map(att => `
              <div class="attachment-item" style="gap: 8px;">
                <span class="attachment-icon">${getFileIcon(att.original_name)}</span>
                <span class="attachment-name" style="max-width: 180px;" title="${att.original_name}">${att.original_name}</span>
                <button type="button" class="btn-secondary btn-track-preview-att" data-url="/api/tickets/${ticket.id}/attachments/${att.id}/download" data-name="${att.original_name}" data-mime="${att.mime_type || ''}" style="padding: 2px 6px; font-size: 0.72rem;">👁️</button>
                <a href="/api/tickets/${ticket.id}/attachments/${att.id}/download" class="btn-secondary" style="padding: 2px 6px; font-size: 0.72rem; text-decoration: none;" title="Descargar">⬇️</a>
              </div>
            `).join("")}
          </div>
        </div>
      `;
    }

    let notesHtml = "";
    if (ticket.resolution_notes && ticket.resolution_notes.trim()) {
      notesHtml = `
        <div style="margin-top: 16px; background-color: var(--bg-card-secondary); border-left: 4px solid var(--color-accent); padding: 12px 16px; border-radius: 0 var(--radius-sm) var(--radius-sm) 0;">
          <strong style="color: var(--color-accent); font-size: 0.85rem;">Respuesta / Notas de Soporte:</strong>
          <p style="margin-top: 4px; font-size: 0.9rem; white-space: pre-wrap;">${ticket.resolution_notes}</p>
        </div>
      `;
    }

    trackResultContainer.innerHTML = `
      <div style="background-color: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 24px; box-shadow: var(--shadow-sm);">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; border-bottom: 1px solid var(--border-color); padding-bottom: 14px;">
          <div>
            <span style="font-family: 'Quicksand', sans-serif; font-size: 1.4rem; font-weight: 700; color: var(--color-accent);">${ticket.code}</span>
            <div style="font-size: 0.82rem; color: var(--text-secondary); margin-top: 2px;">Ingresado el ${ticket.created_at} por <strong>${ticket.requester_name}</strong></div>
          </div>
          <span class="status-badge ${st.class}">${st.icon} ${st.label}</span>
        </div>

        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 16px; font-size: 0.88rem; background-color: var(--bg-card-secondary); padding: 12px; border-radius: var(--radius-sm);">
          <div><strong style="color: var(--text-secondary);">Módulo:</strong> ${ticket.module_name}</div>
          <div><strong style="color: var(--text-secondary);">Tipo:</strong> ${ticket.type.toUpperCase()}</div>
          <div><strong style="color: var(--text-secondary);">Prioridad:</strong> ${ticket.priority.toUpperCase()}</div>
        </div>

        <div>
          <h4 style="font-size: 1.05rem; margin-bottom: 6px; color: var(--text-primary);">${ticket.title}</h4>
          <div style="background-color: var(--bg-input); border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 12px; font-size: 0.9rem; white-space: pre-wrap; line-height: 1.5;">${ticket.description}</div>
        </div>

        ${notesHtml}
        ${attachmentsHtml}

        <div style="margin-top: 18px; text-align: right;">
          <button type="button" class="btn-primary" onclick="openUserTicketDetail('${ticket.id}')" style="padding: 8px 16px; font-size: 0.85rem;">
            💬 Abrir Conversación y Detalle Completo
          </button>
        </div>
      </div>
    `;

    trackResultContainer.querySelectorAll(".btn-track-preview-att").forEach(btn => {
      btn.addEventListener("click", () => {
        const url = btn.getAttribute("data-url");
        const name = btn.getAttribute("data-name");
        const mime = btn.getAttribute("data-mime");
        openLightbox(url, name, mime);
      });
    });
  }

  // ── 11. Modal de Detalle de Ticket, Chat y Calificación CSAT (Usuario) ───
  const modalUserTicketDetail = document.getElementById("modalUserTicketDetail");
  const btnCloseUserTicketDetail = document.getElementById("btnCloseUserTicketDetail");
  const btnCloseUserTicketDetailFooter = document.getElementById("btnCloseUserTicketDetailFooter");

  const userModalCode = document.getElementById("userModalCode");
  const userModalModule = document.getElementById("userModalModule");
  const userModalStatus = document.getElementById("userModalStatus");
  const userModalTitle = document.getElementById("userModalTitle");
  const userModalDate = document.getElementById("userModalDate");
  const userModalType = document.getElementById("userModalType");
  const userModalPriority = document.getElementById("userModalPriority");
  const userModalDescription = document.getElementById("userModalDescription");

  const userModalAttachmentsContainer = document.getElementById("userModalAttachmentsContainer");
  const userModalAttachmentsList = document.getElementById("userModalAttachmentsList");
  const userModalResolutionArea = document.getElementById("userModalResolutionArea");
  const userModalResolutionText = document.getElementById("userModalResolutionText");

  const userModalCsatWidget = document.getElementById("userModalCsatWidget");
  const csatStarSelector = document.getElementById("csatStarSelector");
  const csatFeedbackInput = document.getElementById("csatFeedbackInput");
  const csatRatedConfirmation = document.getElementById("csatRatedConfirmation");
  const btnSubmitCsatRating = document.getElementById("btnSubmitCsatRating");

  const userChatFeed = document.getElementById("userChatFeed");
  const userChatMessageInput = document.getElementById("userChatMessageInput");
  const btnSendUserComment = document.getElementById("btnSendUserComment");
  const userChatCountBadge = document.getElementById("userChatCountBadge");

  let currentDetailTicket = null;
  function renderUserModalAttachments(t) {
    if (!userModalAttachmentsContainer || !userModalAttachmentsList) return;
    if (t.attachments && t.attachments.length > 0) {
      userModalAttachmentsContainer.style.display = "block";
      userModalAttachmentsList.innerHTML = t.attachments.map(att => `
        <div class="attachment-item" style="justify-content: space-between;">
          <div class="attachment-info">
            <span class="attachment-icon">${getFileIcon(att.original_name)}</span>
            <span class="attachment-name" style="max-width: 180px;" title="${escapeHtml(att.original_name)}">${escapeHtml(att.original_name)}</span>
          </div>
          <div style="display: flex; gap: 6px;">
            <button type="button" class="btn-secondary btn-user-preview-att" data-url="/api/tickets/${t.id}/attachments/${att.id}/download" data-name="${escapeHtml(att.original_name)}" data-mime="${att.mime_type || ''}" style="padding: 3px 8px; font-size: 0.75rem;" title="Ver archivo">👁️ Ver</button>
            <a href="/api/tickets/${t.id}/attachments/${att.id}/download" class="btn-secondary" style="padding: 3px 8px; font-size: 0.75rem; text-decoration: none;" title="Descargar archivo">⬇️</a>
          </div>
        </div>
      `).join("");

      userModalAttachmentsList.querySelectorAll(".btn-user-preview-att").forEach(btn => {
        btn.addEventListener("click", () => {
          const url = btn.getAttribute("data-url");
          const name = btn.getAttribute("data-name");
          const mime = btn.getAttribute("data-mime");
          openLightbox(url, name, mime);
        });
      });
    } else {
      userModalAttachmentsList.innerHTML = `<span style="font-size: 0.8rem; color: var(--text-secondary);">No hay archivos adjuntos en esta solicitud aún.</span>`;
    }
  }

  window.openUserTicketDetail = async function(ticketIdOrCode) {
    try {
      let t = null;
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2500);
        const response = await fetch(API_BASE + `/api/tickets/${encodeURIComponent(ticketIdOrCode)}`, { signal: controller.signal });
        clearTimeout(timeoutId);
        const data = await response.json();
        if (data.success && data.ticket) {
          t = data.ticket;
        }
      } catch (e) {}

    // Si falló la API, buscar en tickets estáticos o en la bandeja local
    if (!t) {
      const offlineList = JSON.parse(localStorage.getItem("aquashield_offline_tickets") || "[]");
      t = offlineList.find(x => String(x.id) === String(ticketIdOrCode) || x.code === ticketIdOrCode);
      if (!t && cachedAllTickets.length > 0) {
        t = cachedAllTickets.find(x => String(x.id) === String(ticketIdOrCode) || x.code === ticketIdOrCode);
      }
    }

    if (!t) {
      alert("No se pudo cargar el detalle del requerimiento.");
      return;
    }

    currentDetailTicket = t;
      const st = statusConfig[t.status] || { label: t.status, class: "abierto", icon: "📌" };

      userModalCode.textContent = t.code;
      userModalModule.textContent = t.module_name;
      userModalStatus.className = `aq-badge status-${t.status}`;
      userModalStatus.textContent = `${st.icon} ${st.label}`;

      const btnUserModalResend = document.getElementById("btnUserModalResend");
      if (btnUserModalResend) {
        if (t.is_offline || t.status === "en_espera") {
          btnUserModalResend.style.display = "inline-flex";
          btnUserModalResend.onclick = (e) => {
            e.stopPropagation();
            openResendTicketModal(t);
          };
        } else {
          btnUserModalResend.style.display = "none";
        }
      }

      userModalTitle.textContent = t.title;
      userModalDate.textContent = t.created_at;
      userModalType.textContent = (t.type || "").toUpperCase();
      userModalPriority.textContent = (t.priority || "").toUpperCase();
      userModalDescription.textContent = t.description;

      const btnOpenUserTeamsChat = document.getElementById("btnOpenUserTeamsChat");
      if (btnOpenUserTeamsChat) {
        const teamsMsg = `Hola Marcelo, te contacto respecto a mi requerimiento *${t.code}* (${t.title}). Adjunto aquí los archivos y detalles de mi caso.`;
        btnOpenUserTeamsChat.href = `https://teams.microsoft.com/l/chat/0/0?users=marcelo.ramirez@aquachile.com&message=${encodeURIComponent(teamsMsg)}`;
      }

      // Adjuntos
      renderUserModalAttachments(t);

      const btnUserAddAttachment = document.getElementById("btnUserAddAttachment");
      const userAddAttachmentInput = document.getElementById("userAddAttachmentInput");
      if (btnUserAddAttachment && userAddAttachmentInput) {
        btnUserAddAttachment.onclick = () => userAddAttachmentInput.click();
        userAddAttachmentInput.onchange = async () => {
          if (!userAddAttachmentInput.files.length) return;
          const fd = new FormData();
          for (let f of userAddAttachmentInput.files) {
            fd.append("files[]", f);
          }
          fd.append("author_name", currentUser ? currentUser.name : t.requester_name);
          btnUserAddAttachment.textContent = "⏳ Subiendo...";
          btnUserAddAttachment.disabled = true;
          try {
            const resp = await fetch(API_BASE + `/api/tickets/${t.id}/attachments`, {
              method: "POST",
              body: fd,
              credentials: "include"
            });
            const data = await resp.json();
            if (data.success && data.attachments) {
              if (!t.attachments) t.attachments = [];
              t.attachments.push(...data.attachments);
              renderUserModalAttachments(t);
              alert("¡Archivo(s) subido(s) exitosamente!");
            } else {
              alert("Error al subir archivo: " + (data.error || ""));
            }
          } catch (e) {
            const teamsMsg = `Hola Marcelo, te comparto el archivo adjunto para el ticket *${t.code}* (${t.title}).`;
            const teamsUrl = `https://teams.microsoft.com/l/chat/0/0?users=marcelo.ramirez@aquachile.com&message=${encodeURIComponent(teamsMsg)}`;
            if (confirm("El portal web de contingencia no puede almacenar archivos directamente sin servidor local.\n\n¿Deseas abrir Microsoft Teams para enviárselo directamente a Marcelo Ramírez?")) {
              window.open(teamsUrl, "_blank");
            }
          } finally {
            btnUserAddAttachment.textContent = "+ Adjuntar Archivo";
            btnUserAddAttachment.disabled = false;
            userAddAttachmentInput.value = "";
          }
        };
      }

      // Solución / Notas del Admin
      if (t.resolution_notes && t.resolution_notes.trim()) {
        userModalResolutionArea.style.display = "block";
        userModalResolutionText.textContent = t.resolution_notes;
      } else {
        userModalResolutionArea.style.display = "none";
      }

      // CSAT (Satisfacción del Cliente)
      if (t.status === "resuelto") {
        userModalCsatWidget.style.display = "block";
        if (t.rating && t.rating > 0) {
          selectedCsatRating = t.rating;
          renderStars(t.rating);
          csatFeedbackInput.value = t.feedback_comment || "";
          csatFeedbackInput.disabled = true;
          btnSubmitCsatRating.style.display = "none";
          csatRatedConfirmation.style.display = "block";
          csatRatedConfirmation.textContent = `⭐ Calificaste este servicio con ${t.rating} de 5 estrellas. ¡Muchas gracias!`;
        } else {
          selectedCsatRating = 5;
          renderStars(5);
          csatFeedbackInput.value = "";
          csatFeedbackInput.disabled = false;
          btnSubmitCsatRating.style.display = "inline-block";
          csatRatedConfirmation.style.display = "none";
        }
      } else {
        userModalCsatWidget.style.display = "none";
      }

      // Chat
      renderUserChatFeed(t.comments || []);
      userChatMessageInput.value = "";

      // Polling en vivo para el modal de usuario mientras esté abierto
      if (userModalChatPoller) clearInterval(userModalChatPoller);
      userModalChatPoller = setInterval(async () => {
        if (modalUserTicketDetail.classList.contains("active") && currentDetailTicket) {
          try {
            const resp = await fetch(API_BASE + `/api/tickets/${currentDetailTicket.id}/comments?mark_read_for=usuario`);
            const data = await resp.json();
            if (data.success && data.comments) {
              const prevLen = currentDetailTicket.comments ? currentDetailTicket.comments.length : 0;
              if (data.comments.length > prevLen) {
                currentDetailTicket.comments = data.comments;
                renderUserChatFeed(data.comments);
              }
            }
          } catch (e) {}
        } else {
          clearInterval(userModalChatPoller);
          userModalChatPoller = null;
        }
      }, 3000);

      modalUserTicketDetail.classList.add("active");
    } catch (err) {
      console.error("Error al abrir detalle de ticket:", err);
      alert("Error de conexión al cargar la información.");
    }
  };

  let userModalChatPoller = null;

  function closeUserTicketDetail() {
    if (userModalChatPoller) {
      clearInterval(userModalChatPoller);
      userModalChatPoller = null;
    }
    modalUserTicketDetail.classList.remove("active");
    currentDetailTicket = null;
    userPasteHandler.clear();
  }

  if (btnCloseUserTicketDetail) btnCloseUserTicketDetail.addEventListener("click", closeUserTicketDetail);
  if (btnCloseUserTicketDetailFooter) btnCloseUserTicketDetailFooter.addEventListener("click", closeUserTicketDetail);

  // CSAT Stars Interaction
  function renderStars(rating) {
    const stars = csatStarSelector.querySelectorAll(".star-btn");
    stars.forEach(s => {
      const val = parseInt(s.getAttribute("data-value"));
      if (val <= rating) {
        s.style.color = "#FFB300";
        s.style.transform = "scale(1.1)";
      } else {
        s.style.color = "var(--border-color)";
        s.style.transform = "scale(1.0)";
      }
    });
  }

  if (csatStarSelector) {
    csatStarSelector.addEventListener("click", (e) => {
      const star = e.target.closest(".star-btn");
      if (star && (!currentDetailTicket.rating || currentDetailTicket.rating === 0)) {
        selectedCsatRating = parseInt(star.getAttribute("data-value"));
        renderStars(selectedCsatRating);
      }
    });
  }

  if (btnSubmitCsatRating) {
    btnSubmitCsatRating.addEventListener("click", async () => {
      if (!currentDetailTicket) return;

      try {
        btnSubmitCsatRating.disabled = true;
        btnSubmitCsatRating.textContent = "Enviando...";

        const response = await fetch(API_BASE + `/api/tickets/${currentDetailTicket.id}/rate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            rating: selectedCsatRating,
            feedback_comment: csatFeedbackInput.value.trim()
          })
        });

        const data = await response.json();
        if (data.success) {
          currentDetailTicket.rating = selectedCsatRating;
          currentDetailTicket.feedback_comment = csatFeedbackInput.value.trim();
          csatFeedbackInput.disabled = true;
          btnSubmitCsatRating.style.display = "none";
          csatRatedConfirmation.style.display = "block";
          csatRatedConfirmation.textContent = `⭐ Calificaste este servicio con ${selectedCsatRating} de 5 estrellas. ¡Muchas gracias!`;
        } else {
          alert("Error: " + (data.error || "No se pudo guardar la calificación"));
          btnSubmitCsatRating.disabled = false;
          btnSubmitCsatRating.textContent = "Enviar Calificación";
        }
      } catch (err) {
        alert("Error de conexión al calificar");
        btnSubmitCsatRating.disabled = false;
        btnSubmitCsatRating.textContent = "Enviar Calificación";
      }
    });
  }

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

  // Setup Paste & Stickers para Modal Chat de Usuario
  const userChatPastedPreview = document.getElementById("userChatPastedPreview");
  const userChatPastedThumb = document.getElementById("userChatPastedThumb");
  const btnUserDiscardPasted = document.getElementById("btnUserDiscardPasted");
  const btnUserStickerTrigger = document.getElementById("btnUserStickerTrigger");
  const userStickerPopover = document.getElementById("userStickerPopover");

  const userPasteHandler = setupClipboardPaste(
    userChatMessageInput,
    userChatPastedPreview,
    userChatPastedThumb,
    btnUserDiscardPasted
  );

  setupStickerPopover(
    userStickerPopover,
    btnUserStickerTrigger,
    userChatMessageInput,
    (stickerText) => {
      userChatMessageInput.value = stickerText;
      sendUserChatMessage();
    }
  );

  // Chat Feed Render
  function renderUserChatFeed(comments) {
    userChatCountBadge.textContent = comments.length;
    userChatFeed.innerHTML = "";

    if (comments.length === 0) {
      userChatFeed.innerHTML = `<div style="text-align: center; color: var(--text-secondary); font-size: 0.85rem; padding: 12px 0;">No hay mensajes registrados aún en esta conversación.</div>`;
      return;
    }

    comments.forEach(c => {
      const isAdmin = c.author_role === "admin";
      const bubble = document.createElement("div");
      bubble.style.cssText = `
        display: flex;
        flex-direction: column;
        align-self: ${isAdmin ? 'flex-start' : 'flex-end'};
        max-width: 82%;
        background-color: ${isAdmin ? 'var(--color-accent-soft)' : 'var(--bg-input)'};
        border: 1px solid ${isAdmin ? 'var(--color-accent)' : 'var(--border-color)'};
        border-radius: ${isAdmin ? '0 12px 12px 12px' : '12px 0 12px 12px'};
        padding: 10px 14px;
        font-size: 0.88rem;
      `;

      bubble.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 10px; margin-bottom: 4px; font-size: 0.75rem;">
          <strong style="color: ${isAdmin ? 'var(--color-accent)' : 'var(--text-primary)'};">${isAdmin ? '🛡️ Soporte AquaShield' : '👤 ' + c.author_name}</strong>
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

      userChatFeed.appendChild(bubble);
    });

    userChatFeed.scrollTop = userChatFeed.scrollHeight;
  }

  // Send Chat Message
  if (btnSendUserComment) {
    btnSendUserComment.addEventListener("click", sendUserChatMessage);
  }

  if (userChatMessageInput) {
    userChatMessageInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendUserChatMessage();
      }
    });
  }

  async function sendUserChatMessage() {
    if (!currentDetailTicket) return;
    const msg = userChatMessageInput.value.trim();
    const pastedImg = userPasteHandler.getPastedImage();
    if (!msg && !pastedImg) return;

    const authorName = currentUser ? currentUser.name : currentDetailTicket.requester_name;
    const authorEmail = currentUser ? currentUser.email : currentDetailTicket.requester_email;

    try {
      btnSendUserComment.disabled = true;

      const response = await fetch(API_BASE + `/api/tickets/${currentDetailTicket.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          author_name: authorName,
          author_email: authorEmail,
          author_role: "usuario",
          message: msg,
          image_base64: pastedImg
        })
      });

      const data = await response.json();
      if (data.success && data.comment) {
        userChatMessageInput.value = "";
        userPasteHandler.clear();
        if (!currentDetailTicket.comments) currentDetailTicket.comments = [];
        currentDetailTicket.comments.push(data.comment);
        renderUserChatFeed(currentDetailTicket.comments);
      } else {
        alert("Error al enviar mensaje: " + (data.error || ""));
      }
    } catch (err) {
      alert("Error de conexión al enviar mensaje");
    } finally {
      btnSendUserComment.disabled = false;
    }
  }

  // ── 11. Visor Lightbox de Adjuntos (Usuario) ────────────────────────────
  const lightboxModal = document.getElementById("lightboxModal");
  const lightboxTitle = document.getElementById("lightboxTitle");
  const lightboxDownloadBtn = document.getElementById("lightboxDownloadBtn");
  const btnCloseLightbox = document.getElementById("btnCloseLightbox");
  const lightboxBody = document.getElementById("lightboxBody");

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

  // ── 12. Formularios Dinámicos según Tipo de Requerimiento ─────────────────
  const dynamicFieldsContainer = document.getElementById("dynamicFieldsContainer");
  const typeRadios = document.querySelectorAll('input[name="type"]');

  function renderDynamicFields(type) {
    if (!dynamicFieldsContainer) return;

    if (type === "problema") {
      dynamicFieldsContainer.style.display = "block";
      dynamicFieldsContainer.innerHTML = `
        <div class="dynamic-field-group">
          <label class="form-label" for="df_pantalla">Pantalla / Submódulo del Error</label>
          <input type="text" id="df_pantalla" class="form-control" placeholder="Ej: Pantalla de Lotes / Exportación de Excel / Reporte">
        </div>
        <div class="dynamic-field-group">
          <label class="form-label" for="df_error_msg">Código o Mensaje de Error (si apareció en pantalla)</label>
          <input type="text" id="df_error_msg" class="form-control" placeholder="Ej: Database Timeout, Error 500, 'RFC_ERROR_SYSTEM_FAILURE'...">
        </div>
      `;
    } else if (type === "solicitud_acceso") {
      dynamicFieldsContainer.style.display = "block";
      dynamicFieldsContainer.innerHTML = `
        <div class="dynamic-field-group">
          <label class="form-label" for="df_sap_rol">Rol SAP / Módulos Requeridos</label>
          <input type="text" id="df_sap_rol" class="form-control" placeholder="Ej: Rol Exportaciones ZEXPORT, visualizador SAP MM/SD">
        </div>
        <div class="dynamic-field-group">
          <label class="form-label" for="df_planta">Centro / Planta o Sucursal</label>
          <input type="text" id="df_planta" class="form-control" placeholder="Ej: Planta Puerto Montt / Casa Matriz">
        </div>
        <div class="dynamic-field-group">
          <label class="form-label" for="df_jefatura">Jefatura Directa que Autoriza</label>
          <input type="text" id="df_jefatura" class="form-control" placeholder="Ej: Nombre de tu Gerente / Subgerente">
        </div>
      `;
    } else if (type === "mejora") {
      dynamicFieldsContainer.style.display = "block";
      dynamicFieldsContainer.innerHTML = `
        <div class="dynamic-field-group">
          <label class="form-label" for="df_proceso_actual">¿Cómo se realiza el proceso actualmente?</label>
          <input type="text" id="df_proceso_actual" class="form-control" placeholder="Ej: Actualmente se hace cálculo manual en Excel...">
        </div>
        <div class="dynamic-field-group">
          <label class="form-label" for="df_beneficio">Beneficio Esperado</label>
          <input type="text" id="df_beneficio" class="form-control" placeholder="Ej: Ahorro de 45 mins diarios en cuadratura de planillas...">
        </div>
      `;
    } else {
      dynamicFieldsContainer.style.display = "none";
      dynamicFieldsContainer.innerHTML = "";
    }
  }

  typeRadios.forEach(radio => {
    radio.addEventListener("change", (e) => {
      renderDynamicFields(e.target.value);
    });
  });

  // Render inicial
  const selectedTypeRadio = document.querySelector('input[name="type"]:checked');
  if (selectedTypeRadio) renderDynamicFields(selectedTypeRadio.value);

  // ── 13. Triage & Auto-Diagnóstico Inteligente con Sugerencias ────────────
  const inputTitle = document.getElementById("title");
  const inputDesc = document.getElementById("description");
  const smartSuggestionsBox = document.getElementById("smartSuggestionsBox");
  const smartSuggestionText = document.getElementById("smartSuggestionText");
  const triageActionsArea = document.getElementById("triageActionsArea");
  const btnCloseSuggestion = document.getElementById("btnCloseSuggestion");

  const triageRules = [
    {
      keywords: ["sap", "zexport", "transaccion", "mb51", "vl01n", "bapi", "rfc", "sociedad"],
      suggestModule: "Agente SAP",
      suggestPriority: "media",
      tip: "Detectamos requerimiento vinculado a SAP. Para agilizar la atención, verifica tener activa la VPN y adjuntar el log o número de documento."
    },
    {
      keywords: ["congelado", "frigorifico", "camara", "flete congelado", "lote congelado"],
      suggestModule: "Congelado",
      suggestPriority: "media",
      tip: "Detectamos caso sobre Módulo Congelado. Si el lote aparece bloqueado en SAP, verifica que no haya otra orden abierta."
    },
    {
      keywords: ["fresco", "salmon fresco", "cosecha", "caleta", "flete fresco"],
      suggestModule: "Fresco",
      suggestPriority: "media",
      tip: "Detectamos requerimiento para Módulo Fresco. Indica la fecha de despacho y centro de origen en la descripción."
    },
    {
      keywords: ["proforma", "export desk", "booking", "embarque", "contenedor", "bl"],
      suggestModule: "Export Desk / Proformas",
      suggestPriority: "media",
      tip: "Detectamos gestión de embarques/proformas. Por favor incluye el Booking Number o Proforma en el asunto."
    },
    {
      keywords: ["seguro", "poliza", "siniestro", "reclamo seguro"],
      suggestModule: "Seguros",
      suggestPriority: "media",
      tip: "Detectamos tema de Seguros. Recuerda adjuntar la copia de la póliza o constancia si corresponde."
    },
    {
      keywords: ["urgente", "bloqueo", "bloqueante", "parado", "no abre", "se cayo", "caido", "critico", "despacho detenido"],
      suggestModule: null,
      suggestPriority: "critica",
      tip: "Se ha detectado impacto crítico. El equipo de soporte técnico recibirá alerta de alta prioridad."
    }
  ];

  let suggestionDismissed = false;

  function runSmartTriage() {
    if (suggestionDismissed || !smartSuggestionsBox) return;
    const titleText = (inputTitle ? inputTitle.value : "").toLowerCase();
    const descText = (inputDesc ? inputDesc.value : "").toLowerCase();
    const combined = `${titleText} ${descText}`;

    if (combined.trim().length < 4) {
      smartSuggestionsBox.style.display = "none";
      return;
    }

    const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const matchKeyword = (text, kw) => {
      if (kw.includes(' ')) return text.includes(kw);
      const regex = new RegExp(`(?:^|[^a-záéíóúñ0-9])${escapeRegExp(kw)}(?:$|[^a-záéíóúñ0-9])`, 'i');
      return regex.test(text);
    };

    let matchedRule = null;
    for (const rule of triageRules) {
      if (rule.keywords.some(k => matchKeyword(combined, k))) {
        matchedRule = rule;
        break;
      }
    }

    if (matchedRule) {
      smartSuggestionText.textContent = matchedRule.tip;
      triageActionsArea.innerHTML = "";

      if (matchedRule.suggestModule || matchedRule.suggestPriority) {
        const btnApply = document.createElement("button");
        btnApply.type = "button";
        btnApply.className = "btn-triage-apply";
        btnApply.innerHTML = `⚡ Aplicar Clasificación Sugerida ${matchedRule.suggestModule ? `(${matchedRule.suggestModule})` : ''}`;
        
        btnApply.addEventListener("click", () => {
          // Seleccionar módulo si coincide
          if (matchedRule.suggestModule && moduleSelect) {
            for (let i = 0; i < moduleSelect.options.length; i++) {
              if (moduleSelect.options[i].text.toLowerCase().includes(matchedRule.suggestModule.toLowerCase())) {
                moduleSelect.selectedIndex = i;
                break;
              }
            }
          }
          // Seleccionar prioridad si corresponde
          if (matchedRule.suggestPriority) {
            const prioRadio = document.getElementById(`prio_${matchedRule.suggestPriority}`);
            if (prioRadio) prioRadio.checked = true;
          }
          smartSuggestionsBox.style.display = "none";
          suggestionDismissed = true;
        });

        triageActionsArea.appendChild(btnApply);
      }

      smartSuggestionsBox.style.display = "flex";
    } else {
      smartSuggestionsBox.style.display = "none";
    }
  }

  if (inputTitle) inputTitle.addEventListener("input", runSmartTriage);
  if (inputDesc) inputDesc.addEventListener("input", runSmartTriage);

  if (btnCloseSuggestion) {
    btnCloseSuggestion.addEventListener("click", () => {
      smartSuggestionsBox.style.display = "none";
      suggestionDismissed = true;
    });
  }

  // ── 14. Gestor de Multi-Chats Flotantes Simultáneos (Usuario) ─────────────
  const floatingChatDock = document.getElementById("floatingChatDock");
  const userOpenFloatingChats = new Map();

  window.openUserFloatingChat = function(ticketId, ticketCode, moduleName) {
    if (userOpenFloatingChats.has(ticketId)) {
      const chat = userOpenFloatingChats.get(ticketId);
      chat.dom.classList.remove("minimized");
      const input = chat.dom.querySelector("input");
      if (input) input.focus();
      return;
    }

    if (userOpenFloatingChats.size >= 3) {
      const firstKey = userOpenFloatingChats.keys().next().value;
      closeUserFloatingChat(firstKey);
    }

    const chatWin = document.createElement("div");
    chatWin.className = "floating-chat-window";
    chatWin.id = `userFloatingChat_${ticketId}`;

    chatWin.innerHTML = `
      <div class="floating-chat-header">
        <div class="floating-chat-header-title" style="flex: 1; min-width: 0;">
          <span style="color: #4CAF50;">●</span>
          <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${ticketCode} · Soporte</span>
        </div>
        <div class="floating-chat-header-actions" style="display: flex; align-items: center; gap: 5px; flex-shrink: 0;">
          <a href="https://teams.microsoft.com/l/chat/0/0?users=marcelo.ramirez@aquachile.com&message=${encodeURIComponent('Hola Marcelo, te contacto sobre el ticket ' + ticketCode + ' (' + moduleName + ')')}" target="_blank" class="floating-chat-btn-action btn-teams" title="Abrir chat en Microsoft Teams">💬</a>
          <button type="button" class="floating-chat-btn-action btn-min-chat" title="Minimizar / Restaurar">_</button>
          <button type="button" class="floating-chat-btn-action btn-close-chat" title="Cerrar ventana">&times;</button>
        </div>
      </div>
      <div class="floating-chat-body" id="userFloatChatBody_${ticketId}">
        <div style="background: rgba(98, 100, 167, 0.08); border-bottom: 1px solid rgba(98, 100, 167, 0.2); padding: 6px 10px; font-size: 0.74rem; display: flex; align-items: center; justify-content: space-between;">
          <span style="color: #6264A7; font-weight: 600;">💬 Microsoft Teams</span>
          <a href="https://teams.microsoft.com/l/chat/0/0?users=marcelo.ramirez@aquachile.com&message=${encodeURIComponent('Hola Marcelo, sobre el ticket ' + ticketCode + ' (' + moduleName + ')')}" target="_blank" style="color: #6264A7; font-weight: 700; text-decoration: underline;">Abrir en Teams ↗</a>
        </div>
        <div style="text-align: center; color: var(--text-secondary); font-size: 0.78rem; padding: 20px 0;">Cargando mensajes...</div>
      </div>

      <!-- Preview Imagen Pegada Flotante -->
      <div id="userFloatPastedPreview_${ticketId}" class="chat-pasted-preview-bar" style="display: none; margin: 4px 8px 0;">
        <div class="chat-pasted-preview-info">
          <img id="userFloatPastedThumb_${ticketId}" class="chat-pasted-preview-thumb" src="" alt="Captura pegada">
          <span style="font-size: 0.72rem; font-weight: 700; color: var(--color-accent);">📷 Captura lista</span>
        </div>
        <button type="button" id="userFloatDiscardPasted_${ticketId}" class="chat-pasted-remove-btn" title="Quitar imagen">&times;</button>
      </div>

      <div class="floating-chat-footer" style="position: relative; gap: 4px;">
        <button type="button" class="btn-chat-sticker-trigger" id="userFloatBtnSticker_${ticketId}" style="padding: 4px 6px; font-size: 1rem;" title="Insertar Sticker">😊</button>
        <input type="text" placeholder="Escribe o pega captura con Ctrl+V..." id="userFloatChatInput_${ticketId}" style="flex: 1; font-size: 0.8rem;" autocomplete="off">
        <button type="button" class="btn-primary btn-float-send" style="padding: 6px 10px; font-size: 0.8rem;">💬</button>

        <!-- Popover de Stickers para Chat Flotante Usuario -->
        <div id="userFloatStickerPopover_${ticketId}" class="chat-sticker-popover" style="bottom: 45px; right: 5px;"></div>
      </div>
    `;

    const header = chatWin.querySelector(".floating-chat-header");
    const btnMin = chatWin.querySelector(".btn-min-chat");
    const btnClose = chatWin.querySelector(".btn-close-chat");
    const input = chatWin.querySelector(`#userFloatChatInput_${ticketId}`);
    const btnSend = chatWin.querySelector(".btn-float-send");
    const previewBar = chatWin.querySelector(`#userFloatPastedPreview_${ticketId}`);
    const thumbImg = chatWin.querySelector(`#userFloatPastedThumb_${ticketId}`);
    const btnDiscard = chatWin.querySelector(`#userFloatDiscardPasted_${ticketId}`);
    const btnSticker = chatWin.querySelector(`#userFloatBtnSticker_${ticketId}`);
    const popover = chatWin.querySelector(`#userFloatStickerPopover_${ticketId}`);

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
      closeUserFloatingChat(ticketId);
    });

    const sendFloatMsg = async () => {
      const msg = input.value.trim();
      const pastedImg = floatPasteHandler.getPastedImage();
      if (!msg && !pastedImg) return;

      try {
        btnSend.disabled = true;
        const authorName = currentUser ? currentUser.name : "Usuario Solicitante";
        const authorEmail = currentUser ? currentUser.email : "";

        const resp = await fetch(API_BASE + `/api/tickets/${ticketId}/comments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            author_name: authorName,
            author_email: authorEmail,
            author_role: "usuario",
            message: msg,
            image_base64: pastedImg
          })
        });
        const d = await resp.json();
        if (d.success && d.comment) {
          input.value = "";
          floatPasteHandler.clear();
          fetchUserFloatingChatComments(ticketId, true);
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
      fetchUserFloatingChatComments(ticketId, false);
    }, 3000);

    userOpenFloatingChats.set(ticketId, { dom: chatWin, poller, lastCommentCount: 0, pasteHandler: floatPasteHandler });
    fetchUserFloatingChatComments(ticketId, true);
    setTimeout(() => input.focus(), 100);
  };

  function closeUserFloatingChat(ticketId) {
    if (userOpenFloatingChats.has(ticketId)) {
      const chat = userOpenFloatingChats.get(ticketId);
      clearInterval(chat.poller);
      if (chat.pasteHandler) chat.pasteHandler.clear();
      if (chat.dom && chat.dom.parentNode) {
        chat.dom.parentNode.removeChild(chat.dom);
      }
      userOpenFloatingChats.delete(ticketId);
    }
  }

  async function fetchUserFloatingChatComments(ticketId, forceScroll = false) {
    if (!userOpenFloatingChats.has(ticketId)) return;
    const chat = userOpenFloatingChats.get(ticketId);
    const body = chat.dom.querySelector(`#userFloatChatBody_${ticketId}`);
    if (!body) return;

    try {
      const resp = await fetch(API_BASE + `/api/tickets/${ticketId}/comments?mark_read_for=usuario`);
      const data = await resp.json();
      if (!data.success) return;

      const comments = data.comments || [];
      if (comments.length !== chat.lastCommentCount || forceScroll) {
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
              align-self: ${isAdmin ? 'flex-start' : 'flex-end'};
              max-width: 88%;
              background-color: ${isAdmin ? 'var(--color-accent-soft)' : 'var(--bg-card)'};
              border: 1px solid ${isAdmin ? 'var(--color-accent)' : 'var(--border-color)'};
              border-radius: ${isAdmin ? '0 8px 8px 8px' : '8px 0 8px 8px'};
              padding: 6px 10px;
              font-size: 0.82rem;
            `;
            b.innerHTML = `
              <div style="display: flex; justify-content: space-between; gap: 6px; font-size: 0.68rem; margin-bottom: 2px;">
                <strong style="color: ${isAdmin ? 'var(--color-accent)' : 'var(--text-primary)'};">${isAdmin ? '🛡️ Soporte' : 'Tú'}</strong>
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
      }
    } catch (e) {}
  }

  // ── 15. Gestor de Campanita de Notificaciones (Usuario) ────────────────────
  const notifBellContainer = document.getElementById("notifBellContainer");
  const btnToggleNotifMenu = document.getElementById("btnToggleNotifMenu");
  const notifBadgeCount = document.getElementById("notifBadgeCount");
  const notifDropdownMenu = document.getElementById("notifDropdownMenu");
  const notifUnreadLabel = document.getElementById("notifUnreadLabel");
  const notifItemsList = document.getElementById("notifItemsList");
  const btnNotifClearAll = document.getElementById("btnNotifClearAll");

  let previousUserNotifCount = 0;

  function getUserNotifIcon(type) {
    if (type === "status_change") return "🔄";
    if (type === "new_comment") return "💬";
    if (type === "ticket_created") return "🆕";
    if (type === "rating_received") return "⭐";
    return "🔔";
  }

  async function pollUserNotifications() {
    const email = currentUser ? currentUser.email : (requesterEmailInput ? requesterEmailInput.value.trim() : "");
    if (!email) {
      if (notifBadgeCount) notifBadgeCount.style.display = "none";
      return;
    }

    try {
      const response = await fetch(API_BASE + `/api/notifications?role=usuario&email=${encodeURIComponent(email)}`);
      const data = await response.json();
      if (!data.success) return;

      const groups = data.ticket_groups || [];
      const unreadCount = data.unread_count || 0;
      const totalCount = data.total_count || 0;

      if (unreadCount > 0) {
        notifBadgeCount.textContent = unreadCount;
        notifBadgeCount.style.display = "inline-block";
        notifUnreadLabel.textContent = `${unreadCount} nuevos`;
      } else {
        notifBadgeCount.style.display = "none";
        notifUnreadLabel.textContent = `${totalCount} alertas`;
      }
      previousUserNotifCount = unreadCount;

      if (groups.length === 0) {
        notifItemsList.innerHTML = `<div style="padding: 24px; text-align: center; color: var(--text-secondary); font-size: 0.82rem;">🔕 No tienes alertas en la campanita</div>`;
      } else {
        notifItemsList.innerHTML = groups.map(g => {
          const eventsHtml = g.notifications.map(n => `
            <div class="notif-event-item ${n.is_read ? '' : 'unread'}" data-notif-id="${n.id}" data-ticket-id="${g.ticket_id}" data-code="${g.ticket_code}" data-title="${g.ticket_title}">
              <span style="font-size: 1rem; line-height: 1;">${getUserNotifIcon(n.type)}</span>
              <div class="notif-event-content">
                <div class="notif-event-header">
                  <span class="notif-event-title">${n.title}</span>
                  <span>${n.created_at.split(' ')[1] || n.created_at}</span>
                </div>
                <div class="notif-event-msg">${n.message}</div>
              </div>
              <button type="button" class="btn-notif-delete-item" data-notif-id="${n.id}" title="Quitar alerta de la campana">&times;</button>
            </div>
          `).join("");

          return `
            <div class="notif-ticket-group ${g.unread_count > 0 ? 'has-unread' : ''}" id="userNotifGroup_${g.ticket_id}">
              <div class="notif-ticket-header" data-ticket-id="${g.ticket_id}" data-code="${g.ticket_code}" data-title="${g.ticket_title}">
                <div class="notif-ticket-title-area">
                  <span class="notif-ticket-code">${g.ticket_code}</span>
                  <span class="notif-ticket-subject" title="${g.ticket_title}">${g.ticket_title}</span>
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

        // Eventos: Click en header para abrir chat y marcar leido
        notifItemsList.querySelectorAll(".notif-ticket-header").forEach(header => {
          header.addEventListener("click", async (e) => {
            if (e.target.closest(".btn-notif-delete-group")) return;
            const ticketId = parseInt(header.getAttribute("data-ticket-id"));
            const code = header.getAttribute("data-code");
            const title = header.getAttribute("data-title");
            notifDropdownMenu.classList.remove("active");
            openUserFloatingChat(ticketId, code, title);
            await fetch(API_BASE + "/api/notifications/mark-read", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ticket_id: ticketId, role: "usuario", email: email })
            });
            pollUserNotifications();
          });
        });

        // Eventos: Click en evento individual
        notifItemsList.querySelectorAll(".notif-event-item").forEach(item => {
          item.addEventListener("click", async (e) => {
            if (e.target.closest(".btn-notif-delete-item")) return;
            const ticketId = parseInt(item.getAttribute("data-ticket-id"));
            const code = item.getAttribute("data-code");
            const title = item.getAttribute("data-title");
            const notifId = parseInt(item.getAttribute("data-notif-id"));
            notifDropdownMenu.classList.remove("active");
            openUserFloatingChat(ticketId, code, title);
            await fetch(API_BASE + "/api/notifications/mark-read", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ notification_id: notifId, role: "usuario", email: email })
            });
            pollUserNotifications();
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
              body: JSON.stringify({ notification_id: notifId, role: "usuario", email: email })
            });
            pollUserNotifications();
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
              body: JSON.stringify({ ticket_id: ticketId, role: "usuario", email: email })
            });
            pollUserNotifications();
          });
        });
      }
    } catch (err) {}
  }

  if (btnNotifClearAll) {
    btnNotifClearAll.addEventListener("click", async (e) => {
      e.stopPropagation();
      const email = currentUser ? currentUser.email : (requesterEmailInput ? requesterEmailInput.value.trim() : "");
      if (confirm("¿Deseas limpiar las alertas de la campanita? (Esto no borra tus solicitudes ni su historial)")) {
        await fetch(API_BASE + "/api/notifications/clear-all", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: "usuario", email: email })
        });
        pollUserNotifications();
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

  setInterval(pollUserNotifications, 5000);

  // Inicializar verificación de usuario
  checkAuthSession();
});
