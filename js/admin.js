const ADMIN_USER = "admin";
const ADMIN_PASS = "1234";

const API_URL =
  "https://script.google.com/macros/s/AKfycbzxVqe7L7jW4gizF1YUChx-Ya4qh6CJ-7YwF3Q-gryAmDxiLQZZY7Y_zVNfrqcXkrgf6Q/exec";

const STORAGE_KEY = "fulo-galeria-cache";
const SESSION_KEY = "fulo-admin-auth";

const LIMITS = { bloco1: 12, bloco2: 12, bloco3: 12 };

const loginForm = document.getElementById("loginForm");
const loginCard = document.getElementById("loginCard");
const adminPanel = document.getElementById("adminPanel");
const calendarPanel = document.getElementById("calendarPanel"); // pode existir, não usamos aqui
const loginFeedback = document.getElementById("loginFeedback");
const logoutButton = document.getElementById("logoutButton");

const fileInputs = document.querySelectorAll("[data-input]");
const dropAreas = document.querySelectorAll("[data-drop]");
const clearButtons = document.querySelectorAll("[data-clear]");
const copyJsonButton = document.getElementById("copyJson");
const downloadJsonButton = document.getElementById("downloadJson");

let state = loadStateCache_();

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
  } catch {
    return { bloco1: [], bloco2: [], bloco3: [] };
  }
}

function saveStateCache_() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function setLoginFeedback_(msg, color) {
  loginFeedback.textContent = msg;
  loginFeedback.style.color = color;
}

function updateAuthView(isAuthenticated) {
  if (isAuthenticated) {
    loginCard.classList.add("hidden");
    adminPanel.classList.remove("hidden");
    if (calendarPanel) calendarPanel.classList.remove("hidden");
    logoutButton.classList.remove("hidden");
  } else {
    loginCard.classList.remove("hidden");
    adminPanel.classList.add("hidden");
    if (calendarPanel) calendarPanel.classList.add("hidden");
    logoutButton.classList.add("hidden");
  }
}

function updateCounts() {
  const c1 = document.getElementById("countBloco1");
  const c2 = document.getElementById("countBloco2");
  const c3 = document.getElementById("countBloco3");
  if (c1) c1.textContent = `${state.bloco1.length} imagens`;
  if (c2) c2.textContent = `${state.bloco2.length} imagens`;
  if (c3) c3.textContent = `${state.bloco3.length} imagens`;
}

function renderBlock(block) {
  const grid = document.querySelector(`[data-grid="${block}"]`);
  if (!grid) return;

  grid.innerHTML = "";

  (state[block] || []).forEach((src, index) => {
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
      await saveGalleryToServer_();
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

async function getGalleryFromServer_() {
  const res = await fetch(`${API_URL}?action=GET_GALLERY`, { method: "GET", cache: "no-store" });
  if (!res.ok) throw new Error("Falha ao carregar galeria do servidor.");
  return res.json();
}

async function saveGalleryToServer_() {
  const payload = {
    action: "SAVE_GALLERY",
    gallery: {
      blocks: {
        bloco1: state.bloco1,
        bloco2: state.bloco2,
        bloco3: state.bloco3,
      },
    },
  };

  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const json = await res.json();
  if (json.ok === false) throw new Error(json.error || "Falha ao salvar galeria.");
}

function fileToDataUrl_(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

async function uploadImages_(block, files) {
  const encoded = [];
  for (const file of files) {
    const dataUrl = await fileToDataUrl_(file);
    const base64 = dataUrl.split("base64,")[1] || "";
    encoded.push({
      name: file.name || "foto.jpg",
      type: file.type || "image/jpeg",
      dataBase64: base64,
    });
  }

  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "UPLOAD_IMAGES",
      block,
      files: encoded,
    }),
  });

  const json = await res.json();
  if (json.ok === false) throw new Error(json.error || "Falha ao enviar imagens.");

  // backend devolve gallery atualizado
  const blocks = json.gallery && json.gallery.blocks ? json.gallery.blocks : null;
  if (blocks) {
    state = {
      bloco1: Array.isArray(blocks.bloco1) ? blocks.bloco1 : [],
      bloco2: Array.isArray(blocks.bloco2) ? blocks.bloco2 : [],
      bloco3: Array.isArray(blocks.bloco3) ? blocks.bloco3 : [],
    };
    saveStateCache_();
    renderAll();
  }
}

async function handleFiles(block, files) {
  const available = (LIMITS[block] ?? 999) - (state[block]?.length ?? 0);
  const selected = Array.from(files).slice(0, Math.max(0, available));

  if (!selected.length) {
    alert(`Limite do ${block} atingido.`);
    return;
  }

  try {
    document.body.classList.add("is-loading");
    await uploadImages_(block, selected);
  } catch (e) {
    alert("Falha ao subir imagens: " + (e.message || e));
  } finally {
    document.body.classList.remove("is-loading");
  }
}

// ===== Eventos =====
loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const data = new FormData(loginForm);
  const usuario = String(data.get("usuario") || "");
  const senha = String(data.get("senha") || "");

  if (usuario === ADMIN_USER && senha === ADMIN_PASS) {
    sessionStorage.setItem(SESSION_KEY, "true");
    setLoginFeedback_("Login autorizado. Sincronizando…", "#2f3b2a");
    updateAuthView(true);

    try {
      const gal = await getGalleryFromServer_();
      if (gal && gal.blocks) {
        state = {
          bloco1: Array.isArray(gal.blocks.bloco1) ? gal.blocks.bloco1 : [],
          bloco2: Array.isArray(gal.blocks.bloco2) ? gal.blocks.bloco2 : [],
          bloco3: Array.isArray(gal.blocks.bloco3) ? gal.blocks.bloco3 : [],
        };
        saveStateCache_();
      }
      renderAll();
      setLoginFeedback_("Dados sincronizados.", "#2f3b2a");
    } catch (e) {
      renderAll();
      setLoginFeedback_("Login OK, mas falhou ao sincronizar: " + (e.message || e), "#b34b39");
    }
  } else {
    setLoginFeedback_("Usuário ou senha incorretos.", "#b34b39");
  }
});

logoutButton.addEventListener("click", () => {
  sessionStorage.removeItem(SESSION_KEY);
  updateAuthView(false);
});

// input file
fileInputs.forEach((input) => {
  input.addEventListener("change", async (event) => {
    const block = event.target.dataset.input;
    await handleFiles(block, event.target.files);
    event.target.value = "";
  });
});

// drag and drop
dropAreas.forEach((area) => {
  area.addEventListener("dragover", (event) => {
    event.preventDefault();
    area.classList.add("is-drag");
  });
  area.addEventListener("dragleave", () => area.classList.remove("is-drag"));
  area.addEventListener("drop", async (event) => {
    event.preventDefault();
    area.classList.remove("is-drag");
    const block = area.dataset.drop;
    await handleFiles(block, event.dataTransfer.files);
  });

  // clique para abrir input
  area.addEventListener("click", () => {
    const block = area.dataset.drop;
    const input = document.querySelector(`[data-input="${block}"]`);
    if (input) input.click();
  });
});

// limpar bloco
clearButtons.forEach((button) => {
  button.addEventListener("click", async (event) => {
    const block = event.target.dataset.clear;
    if (!block) return;

    if (!confirm("Tem certeza que deseja limpar este bloco?")) return;

    state[block] = [];
    saveStateCache_();
    renderAll();

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "CLEAR_BLOCK", block }),
      });
      const json = await res.json();
      if (json.ok === false) throw new Error(json.error || "Falha ao limpar no servidor.");
    } catch (e) {
      alert("Limpou localmente, mas falhou no servidor: " + (e.message || e));
    }
  });
});

// export JSON
copyJsonButton.addEventListener("click", async () => {
  const payload = {
    updatedAt: new Date().toISOString(),
    blocks: { bloco1: state.bloco1, bloco2: state.bloco2, bloco3: state.bloco3 },
  };
  await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
  alert("JSON copiado!");
});

downloadJsonButton.addEventListener("click", () => {
  const payload = {
    updatedAt: new Date().toISOString(),
    blocks: { bloco1: state.bloco1, bloco2: state.bloco2, bloco3: state.bloco3 },
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "fulo-galeria.json";
  link.click();
  URL.revokeObjectURL(url);
});

// init
renderAll();
updateAuthView(sessionStorage.getItem(SESSION_KEY) === "true");
