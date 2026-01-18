const ADMIN_USER = "admin";
const ADMIN_PASS = "1234";

const STORAGE_KEY = "fulo-galeria";
const SESSION_KEY = "fulo-admin-auth";
const LIMITS = {
  bloco1: 12,
  bloco2: 12,
};

const loginForm = document.getElementById("loginForm");
const loginCard = document.getElementById("loginCard");
const adminPanel = document.getElementById("adminPanel");
const loginFeedback = document.getElementById("loginFeedback");
const logoutButton = document.getElementById("logoutButton");

const dropAreas = document.querySelectorAll("[data-drop]");
const fileInputs = document.querySelectorAll("[data-input]");
const clearButtons = document.querySelectorAll("[data-clear]");
const copyJsonButton = document.getElementById("copyJson");
const downloadJsonButton = document.getElementById("downloadJson");

const state = loadState();

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

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
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
    logoutButton.classList.remove("hidden");
  } else {
    loginCard.classList.remove("hidden");
    adminPanel.classList.add("hidden");
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

renderAll();
updateAuthView(sessionStorage.getItem(SESSION_KEY) === "true");
