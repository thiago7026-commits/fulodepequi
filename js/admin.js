const ADMIN_USER = "admin";
const ADMIN_PASS = "1234";

/**
 * Web App (Apps Script) — seu endpoint
 */
const API_URL = "https://script.google.com/macros/s/AKfycbzZCgaa35xExbHyGGvlOobsM2ARy9jwYYmYgBWVB3ZimueqxESZPtLeOljzbNweZ9iU/exec";

const STORAGE_KEY = "fulo-galeria-cache";      // cache local opcional (fallback)
const CALENDAR_KEY = "fulo-calendario-cache";  // cache local opcional (fallback)
const SESSION_KEY = "fulo-admin-auth";

const LIMITS = {
  bloco1: 12,
  bloco2: 12,
  bloco3: 12,
};

const loginForm = document.getElementById("loginForm");
const loginCard = document.getElementById("loginCard");
const adminPanel = document.getElementById("adminPanel");
const calendarPanel = document.getElementById("calendarPanel");
const loginFeedback = document.getElementById("loginFeedback");
const logoutButton = document.getElementById("logoutButton");

const dropAreas = document.querySelectorAll("[data-drop]");
const fileInputs = document.querySelectorAll("[data-input]");
const clearButtons = document.querySelectorAll("[data-clear]");
const copyJsonButton = document.getElementById("copyJson");
const downloadJsonButton = document.getElementById("downloadJson");

const calendarRangeInput = document.getElementById("calendarRange");
const calendarNoteInput = document.getElementById("calendarNote");
const calendarAddButton = document.getElementById("calendarAdd");
const calendarList = document.getElementById("calendarList");
const calendarCopyButton = document.getElementById("calendarCopy");
const calendarClearButton = document.getElementById("calendarClear");
const calendarFeedback = document.getElementById("calendarFeedback");

let state = loadStateCache_();
let calendarState = loadCalendarCache_();

// ======= API (POST simples sem headers custom) =======
async function api_(action, payload = {}) {
  const body = new URLSearchParams();
  body.set("action", action);
  body.set("payload", JSON.stringify(payload));

  let res;
  try {
    res = await fetch(API_URL, {
      method: "POST",
      body,
    });
  } catch (error) {
    throw new Error(
      "Falha ao conectar ao servidor de imagens. Verifique se o Apps Script está publicado como “Qualquer pessoa” e se o link está correto."
    );
  }

  // Se o navegador bloquear leitura por CORS, isso vai falhar.
  // Porém em muitos cenários com Apps Script funciona normalmente.
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch (e) {}

  if (!json) {
    throw new Error("Resposta inválida do servidor. Conteúdo: " + text.slice(0, 120));
  }
  if (!json.ok) {
    throw new Error(json.error || "Erro no servidor");
  }
  return json;
}

// ======= CACHE LOCAL (FALLBACK) =======
function loadStateCache_() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return { bloco1: [], bloco2: [], bloco3: [] };
  try {
    const data = JSON.parse(stored);
    return {
      bloco1: Array.isArray(data.bloco1) ? data.bloco1 : [],
      bloco2: Array.isArray(data.bloco2) ? data.bloco2 : [],
      bloco3: Array.isArray(data.bloco3) ? data.bloco3 : [],
    };
  } catch (e) {
    return { bloco1: [], bloco2: [], bloco3: [] };
  }
}

function loadCalendarCache_() {
  const stored = localStorage.getItem(CALENDAR_KEY);
  if (!stored) return { bloqueios: [] };
  try {
    const data = JSON.parse(stored);
    return { bloqueios: Array.isArray(data.bloqueios) ? data.bloqueios : [] };
  } catch (e) {
    return { bloqueios: [] };
  }
}

function saveStateCache_() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function saveCalendarCache_() {
  localStorage.setItem(CALENDAR_KEY, JSON.stringify(calendarState));
}

// ======= UI =======
function updateCounts() {
  document.getElementById("countBloco1").textContent = `${state.bloco1.length} imagens`;
  document.getElementById("countBloco2").textContent = `${state.bloco2.length} imagens`;
  document.getElementById("countBloco3").textContent = `${state.bloco3.length} imagens`;
}

function renderBlock(block) {
  const grid = document.querySelector(`[data-grid="${block}"]`);
  grid.innerHTML = "";

  state[block].forEach((src, index) => {
    const wrapper = document.createElement("div");
    wrapper.className = "thumb";
    wrapper.innerHTML = `
      <img src="${src}" alt="Foto ${index + 1} do ${block}">
      <button type="button" aria-label="Remover foto">×</button>
    `;
    wrapper.querySelector("button").addEventListener("click", async () => {
      state[block].splice(index, 1);
      saveStateCache_();
      renderAll();

      // salva no servidor
      await persistGaleria_();
    });
    grid.appendChild(wrapper);
  });
}

function renderAll() {
  renderBlock("bloco1");
  renderBlock("bloco2");
  renderBlock("bloco3");
  updateCounts();
}

function setLoginFeedback_(msg, color) {
  loginFeedback.textContent = msg;
  loginFeedback.style.color = color;
}

function setCalendarFeedback(message, color) {
  calendarFeedback.textContent = message;
  calendarFeedback.style.color = color;
}

function updateAuthView(isAuthenticated) {
  if (isAuthenticated) {
    loginCard.classList.add("hidden");
    adminPanel.classList.remove("hidden");
    calendarPanel.classList.remove("hidden");
    logoutButton.classList.remove("hidden");
  } else {
    loginCard.classList.remove("hidden");
    adminPanel.classList.add("hidden");
    calendarPanel.classList.add("hidden");
    logoutButton.classList.add("hidden");
  }
}

// ======= SINCRONIZAÇÃO SERVIDOR =======
async function syncFromServer_() {
  // Galeria
  try {
    const gal = await api_("getGaleria", {});
    if (gal && gal.data) {
      state = {
        bloco1: Array.isArray(gal.data.bloco1) ? gal.data.bloco1 : [],
        bloco2: Array.isArray(gal.data.bloco2) ? gal.data.bloco2 : [],
        bloco3: Array.isArray(gal.data.bloco3) ? gal.data.bloco3 : [],
      };
      saveStateCache_();
      renderAll();
    }
  } catch (e) {
    // mantém cache
  }

  // Calendário
  try {
    const cal = await api_("getCalendar", {});
    if (cal && cal.data) {
      calendarState = {
        bloqueios: Array.isArray(cal.data.bloqueios) ? cal.data.bloqueios : [],
      };
      saveCalendarCache_();
      renderCalendarList();
      paintBlocksOnCalendar_();
    }
  } catch (e) {
    // mantém cache
  }

  // Diária
  try {
    const d = await api_("getDiaria", {});
    if (d && d.diaria != null) {
      ensureDiariaUI_();
      diariaInput_.value = String(d.diaria);
    }
  } catch (e) {}
}

async function persistGaleria_() {
  await api_("saveGaleria", {
    bloco1: state.bloco1,
    bloco2: state.bloco2,
    bloco3: state.bloco3,
  });
}

async function persistCalendar_() {
  await api_("saveCalendar", {
    bloqueios: calendarState.bloqueios,
  });
}

// ======= UPLOAD IMAGEM (DRIVE via Apps Script) =======
async function uploadImage_(file) {
  // converte para dataURL (base64)
  const dataUrl = await fileToDataUrl_(file);

  // envia para Apps Script, que salva no Drive e devolve URL pública
  const res = await api_("uploadImage", {
    dataUrl,
    filename: file.name || "foto.jpg",
  });

  return res.url; // URL pública
}

function fileToDataUrl_(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

async function handleFiles(block, files) {
  const available = LIMITS[block] - state[block].length;
  const selected = Array.from(files).slice(0, Math.max(0, available));

  if (!selected.length) {
    alert(`Limite do ${block} atingido.`);
    return;
  }

  // Upload sequencial (mais seguro)
  try {
    for (const file of selected) {
      const url = await uploadImage_(file);
      state[block].push(url);
      saveStateCache_();
      renderAll();
    }

    // salva lista final no servidor (planilha)
    await persistGaleria_();
  } catch (e) {
    alert("Falha ao subir imagens. Detalhe: " + e.message);
  }
}

// ======= EXPORTS (ainda úteis) =======
function buildExport() {
  return {
    atualizadoEm: new Date().toISOString(),
    bloco1: state.bloco1,
    bloco2: state.bloco2,
    bloco3: state.bloco3,
  };
}

function buildCalendarExport() {
  return {
    atualizadoEm: new Date().toISOString(),
    bloqueios: calendarState.bloqueios,
  };
}

// ======= CALENDÁRIO =======
function formatDate(date) {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

function formatRange(range) {
  return `${formatDate(new Date(range.inicio))} → ${formatDate(new Date(range.fim))}`;
}

function renderCalendarList() {
  calendarList.innerHTML = "";
  if (!calendarState.bloqueios.length) {
    calendarList.innerHTML = `<p class="calendar-empty">Nenhum bloqueio cadastrado ainda.</p>`;
    return;
  }

  calendarState.bloqueios.forEach((range, index) => {
    const item = document.createElement("div");
    item.className = "calendar-item";
    item.innerHTML = `
      <div>
        <strong>${formatRange(range)}</strong>
        <span>${range.nota ? range.nota : "Sem observação"}</span>
      </div>
      <button type="button" aria-label="Remover bloqueio">Remover</button>
    `;
    item.querySelector("button").addEventListener("click", async () => {
      calendarState.bloqueios.splice(index, 1);
      saveCalendarCache_();
      renderCalendarList();
      paintBlocksOnCalendar_();

      try {
        await persistCalendar_();
        setCalendarFeedback("Bloqueio removido e sincronizado.", "#2f3b2a");
      } catch (e) {
        setCalendarFeedback("Removido localmente, mas falhou ao sincronizar: " + e.message, "#b34b39");
      }
    });
    calendarList.appendChild(item);
  });
}

// Marca visualmente os dias bloqueados no flatpickr (estilo Airbnb)
function paintBlocksOnCalendar_() {
  if (!calendarPicker_) return;

  // flatpickr: usamos onDayCreate para decorar, então só força redraw
  calendarPicker_.redraw();
}

let calendarPicker_ = null;

function intersects_(dayDate, start, end) {
  const d = new Date(dayDate.getFullYear(), dayDate.getMonth(), dayDate.getDate()).getTime();
  const s = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
  const e = new Date(end.getFullYear(), end.getMonth(), end.getDate()).getTime();
  return d >= s && d <= e;
}

// ======= DIÁRIA (UI criada dinamicamente) =======
let diariaWrap_ = null;
let diariaInput_ = null;
let diariaSaveBtn_ = null;

function ensureDiariaUI_() {
  if (diariaWrap_) return;

  const summary = document.querySelector(".calendar-summary");
  if (!summary) return;

  diariaWrap_ = document.createElement("div");
  diariaWrap_.style.marginTop = "14px";
  diariaWrap_.style.paddingTop = "14px";
  diariaWrap_.style.borderTop = "1px solid rgba(0,0,0,0.08)";

  diariaWrap_.innerHTML = `
    <h3 style="margin:0 0 6px;font-size:16px;">Valor da diária</h3>
    <p style="margin:0 0 10px;color:#6b6b6b;font-size:13px;line-height:1.5;">
      Ajuste rápido do preço. Isso alimenta o site e pode ser usado na página de reservas.
    </p>
    <div style="display:flex;gap:10px;align-items:center;">
      <input id="diariaInput" type="number" min="0" step="1" style="flex:1;padding:12px 14px;border-radius:14px;border:1px solid rgba(0,0,0,0.14);font-size:14px;" placeholder="Ex: 340">
      <button id="diariaSave" class="btn btn-primary" type="button" style="white-space:nowrap;">Salvar</button>
    </div>
    <p id="diariaFeedback" style="margin:10px 0 0;min-height:18px;font-size:13px;color:#6b6b6b;"></p>
    <p style="margin:10px 0 0;font-size:13px;">
      iCal para o Airbnb (Etapa 2):<br>
      <a href="${API_URL}?action=ics" target="_blank" rel="noopener noreferrer" style="color:#2f3b2a;font-weight:600;text-decoration:none;">
        Abrir link .ics do site
      </a>
    </p>
  `;

  summary.appendChild(diariaWrap_);

  diariaInput_ = document.getElementById("diariaInput");
  diariaSaveBtn_ = document.getElementById("diariaSave");
  const diariaFeedback = document.getElementById("diariaFeedback");

  diariaSaveBtn_.addEventListener("click", async () => {
    const v = String(diariaInput_.value || "").trim();
    if (!v) {
      diariaFeedback.textContent = "Informe um valor.";
      diariaFeedback.style.color = "#b34b39";
      return;
    }

    try {
      await api_("setDiaria", { diaria: v });
      diariaFeedback.textContent = "Diária atualizada e salva.";
      diariaFeedback.style.color = "#2f3b2a";
    } catch (e) {
      diariaFeedback.textContent = "Falha ao salvar: " + e.message;
      diariaFeedback.style.color = "#b34b39";
    }
  });
}

// ======= EVENTOS =======
loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const data = new FormData(loginForm);
  const usuario = data.get("usuario");
  const senha = data.get("senha");

  if (usuario === ADMIN_USER && senha === ADMIN_PASS) {
    sessionStorage.setItem(SESSION_KEY, "true");
    setLoginFeedback_("Login autorizado. Sincronizando dados…", "#2f3b2a");
    updateAuthView(true);

    // sincroniza tudo que está na planilha/drive
    try {
      await syncFromServer_();
      setLoginFeedback_("Login autorizado. Dados sincronizados.", "#2f3b2a");
    } catch (e) {
      setLoginFeedback_("Login autorizado. Porém falhou ao sincronizar: " + e.message, "#b34b39");
    }
  } else {
    setLoginFeedback_("Usuário ou senha incorretos.", "#b34b39");
  }
});

logoutButton.addEventListener("click", () => {
  sessionStorage.removeItem(SESSION_KEY);
  updateAuthView(false);
});

fileInputs.forEach((input) => {
  input.addEventListener("change", async (event) => {
    const block = event.target.dataset.input;
    await handleFiles(block, event.target.files);
    event.target.value = "";
  });
});

clearButtons.forEach((button) => {
  button.addEventListener("click", async (event) => {
    const block = event.target.dataset.clear;
    state[block] = [];
    saveStateCache_();
    renderAll();

    try {
      await persistGaleria_();
    } catch (e) {
      alert("Limpou localmente, mas falhou ao salvar no servidor: " + e.message);
    }
  });
});

dropAreas.forEach((area) => {
  area.addEventListener("dragover", (event) => {
    event.preventDefault();
    area.classList.add("dragover");
  });
  area.addEventListener("dragleave", () => {
    area.classList.remove("dragover");
  });
  area.addEventListener("drop", async (event) => {
    event.preventDefault();
    area.classList.remove("dragover");
    const block = area.dataset.drop;
    await handleFiles(block, event.dataTransfer.files);
  });
});

copyJsonButton.addEventListener("click", () => {
  const payload = buildExport();
  const text = JSON.stringify(payload, null, 2);
  navigator.clipboard.writeText(text).then(() => {
    alert("JSON copiado!");
  });
});

downloadJsonButton.addEventListener("click", () => {
  const payload = buildExport();
  const text = JSON.stringify(payload, null, 2);
  const blob = new Blob([text], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "fotos-chale.json";
  link.click();
  URL.revokeObjectURL(url);
});

calendarCopyButton.addEventListener("click", () => {
  const payload = buildCalendarExport();
  const text = JSON.stringify(payload, null, 2);
  navigator.clipboard.writeText(text).then(() => {
    setCalendarFeedback("JSON do calendário copiado!", "#2f3b2a");
  });
});

calendarClearButton.addEventListener("click", async () => {
  calendarState.bloqueios = [];
  saveCalendarCache_();
  renderCalendarList();
  paintBlocksOnCalendar_();

  try {
    await persistCalendar_();
    setCalendarFeedback("Todos os bloqueios foram removidos e sincronizados.", "#2f3b2a");
  } catch (e) {
    setCalendarFeedback("Removidos localmente, mas falhou ao sincronizar: " + e.message, "#b34b39");
  }
});

// ======= INIT =======
renderAll();
renderCalendarList();
updateAuthView(sessionStorage.getItem(SESSION_KEY) === "true");

// Flatpickr com visual de bloqueio (traço / faixa)
if (calendarRangeInput && window.flatpickr) {
  calendarPicker_ = flatpickr(calendarRangeInput, {
    mode: "range",
    inline: true,
    showMonths: 2,
    minDate: "today",
    dateFormat: "d/m/Y",
    locale: "pt",

    onDayCreate: function (dObj, dStr, fp, dayElem) {
      // Estiliza dias bloqueados (faixa discreta)
      const dayDate = dayElem.dateObj;
      const blocks = calendarState.bloqueios || [];

      for (const b of blocks) {
        const inicio = new Date(b.inicio);
        const fim = new Date(b.fim);

        if (intersects_(dayDate, inicio, fim)) {
          dayElem.style.position = "relative";
          dayElem.style.borderRadius = "12px";
          dayElem.style.outline = "2px solid rgba(47,59,42,0.20)";

          // risquinho no topo do dia (estilo “marcado”)
          const bar = document.createElement("div");
          bar.style.position = "absolute";
          bar.style.left = "8px";
          bar.style.right = "8px";
          bar.style.top = "6px";
          bar.style.height = "3px";
          bar.style.borderRadius = "999px";
          bar.style.background = "rgba(0,0,0,0.60)";
          bar.style.opacity = "0.65";
          dayElem.appendChild(bar);

          break;
        }
      }
    }
  });

  calendarAddButton.addEventListener("click", async () => {
    const selected = calendarPicker_.selectedDates;
    if (!selected || selected.length < 2) {
      setCalendarFeedback("Selecione um período completo para bloquear.", "#b34b39");
      return;
    }

    const inicio = selected[0];
    const fim = selected[1];

    if (fim < inicio) {
      setCalendarFeedback("O período informado é inválido.", "#b34b39");
      return;
    }

    calendarState.bloqueios.push({
      inicio: inicio.toISOString(),
      fim: fim.toISOString(),
      nota: calendarNoteInput.value.trim(),
      origem: "site",
    });

    saveCalendarCache_();
    renderCalendarList();
    paintBlocksOnCalendar_();
    calendarPicker_.clear();
    calendarNoteInput.value = "";

    try {
      await persistCalendar_();
      setCalendarFeedback("Bloqueio adicionado e sincronizado.", "#2f3b2a");
    } catch (e) {
      setCalendarFeedback("Adicionado localmente, mas falhou ao sincronizar: " + e.message, "#b34b39");
    }
  });
}

// Se já está logado, sincroniza automaticamente
(async () => {
  const authed = sessionStorage.getItem(SESSION_KEY) === "true";
  if (authed) {
    updateAuthView(true);
    ensureDiariaUI_();
    try {
      await syncFromServer_();
    } catch (e) {}
  }
})();
