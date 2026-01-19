const ADMIN_USER = "admin";
const ADMIN_PASS = "1234";

const STORAGE_KEY = "fulo-galeria";
const SESSION_KEY = "fulo-admin-auth";
const CALENDAR_KEY = "fulo-calendario";
const LIMITS = {
  bloco1: 12,
  bloco2: 12,
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

const state = loadState();
const calendarState = loadCalendarState();

function loadState() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return { bloco1: [], bloco2: [] };
  }
  try {
    const data = JSON.parse(stored);
    return {
      bloco1: Array.isArray(data.bloco1) ? data.bloco1 : [],
      bloco2: Array.isArray(data.bloco2) ? data.bloco2 : [],
    };
  } catch (error) {
    return { bloco1: [], bloco2: [] };
  }
}

function loadCalendarState() {
  const stored = localStorage.getItem(CALENDAR_KEY);
  if (!stored) {
    return { bloqueios: [] };
  }
  try {
    const data = JSON.parse(stored);
    return {
      bloqueios: Array.isArray(data.bloqueios) ? data.bloqueios : [],
    };
  } catch (error) {
    return { bloqueios: [] };
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function saveCalendarState() {
  localStorage.setItem(CALENDAR_KEY, JSON.stringify(calendarState));
}

function updateCounts() {
  document.getElementById("countBloco1").textContent = `${state.bloco1.length} imagens`;
  document.getElementById("countBloco2").textContent = `${state.bloco2.length} imagens`;
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
    wrapper.querySelector("button").addEventListener("click", () => {
      state[block].splice(index, 1);
      saveState();
      renderAll();
    });
    grid.appendChild(wrapper);
  });
}

function renderAll() {
  renderBlock("bloco1");
  renderBlock("bloco2");
  updateCounts();
}

function handleFiles(block, files) {
  const available = LIMITS[block] - state[block].length;
  const selected = Array.from(files).slice(0, Math.max(0, available));

  if (!selected.length) {
    alert(`Limite do ${block} atingido.`);
    return;
  }

  Promise.all(selected.map(fileToDataUrl)).then((images) => {
    state[block].push(...images);
    saveState();
    renderAll();
  });
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
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

loginForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(loginForm);
  const usuario = data.get("usuario");
  const senha = data.get("senha");

  if (usuario === ADMIN_USER && senha === ADMIN_PASS) {
    sessionStorage.setItem(SESSION_KEY, "true");
    loginFeedback.textContent = "Login autorizado. Você já pode adicionar fotos.";
    loginFeedback.style.color = "#2f3b2a";
    updateAuthView(true);
  } else {
    loginFeedback.textContent = "Usuário ou senha incorretos.";
    loginFeedback.style.color = "#b34b39";
  }
});

logoutButton.addEventListener("click", () => {
  sessionStorage.removeItem(SESSION_KEY);
  updateAuthView(false);
});

fileInputs.forEach((input) => {
  input.addEventListener("change", (event) => {
    const block = event.target.dataset.input;
    handleFiles(block, event.target.files);
    event.target.value = "";
  });
});

clearButtons.forEach((button) => {
  button.addEventListener("click", (event) => {
    const block = event.target.dataset.clear;
    state[block] = [];
    saveState();
    renderAll();
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
  area.addEventListener("drop", (event) => {
    event.preventDefault();
    area.classList.remove("dragover");
    const block = area.dataset.drop;
    handleFiles(block, event.dataTransfer.files);
  });
});

copyJsonButton.addEventListener("click", () => {
  const payload = buildExport();
  const text = JSON.stringify(payload, null, 2);
  navigator.clipboard.writeText(text).then(() => {
    alert("JSON copiado! Cole no seu Apps Script ou envie para o responsável.");
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

function buildExport() {
  return {
    atualizadoEm: new Date().toISOString(),
    bloco1: state.bloco1,
    bloco2: state.bloco2,
  };
}

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
    item.querySelector("button").addEventListener("click", () => {
      calendarState.bloqueios.splice(index, 1);
      saveCalendarState();
      renderCalendarList();
    });
    calendarList.appendChild(item);
  });
}

function buildCalendarExport() {
  return {
    atualizadoEm: new Date().toISOString(),
    bloqueios: calendarState.bloqueios,
  };
}

function setCalendarFeedback(message, color) {
  calendarFeedback.textContent = message;
  calendarFeedback.style.color = color;
}

renderAll();
renderCalendarList();
updateAuthView(sessionStorage.getItem(SESSION_KEY) === "true");

if (calendarRangeInput && window.flatpickr) {
  const calendarPicker = flatpickr(calendarRangeInput, {
    mode: "range",
    inline: true,
    showMonths: 2,
    minDate: "today",
    dateFormat: "d/m/Y",
    locale: "pt",
  });

  calendarAddButton.addEventListener("click", () => {
    const selected = calendarPicker.selectedDates;
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
    });
    saveCalendarState();
    renderCalendarList();
    calendarPicker.clear();
    calendarNoteInput.value = "";
    setCalendarFeedback("Bloqueio adicionado com sucesso.", "#2f3b2a");
  });
}

calendarCopyButton.addEventListener("click", () => {
  const payload = buildCalendarExport();
  const text = JSON.stringify(payload, null, 2);
  navigator.clipboard.writeText(text).then(() => {
    setCalendarFeedback("JSON do calendário copiado!", "#2f3b2a");
  });
});

calendarClearButton.addEventListener("click", () => {
  calendarState.bloqueios = [];
  saveCalendarState();
  renderCalendarList();
  setCalendarFeedback("Todos os bloqueios foram removidos.", "#2f3b2a");
});
