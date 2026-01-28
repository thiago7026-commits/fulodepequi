const STORAGE_KEYS = {
  mysql: "adminMysqlConfig",
  dailyRate: "adminDailyRate",
  blockedDates: "adminBlockedDates",
  heroImages: "adminHeroImages",
  thumbImages: "adminThumbImages",
};

const mysqlForm = document.getElementById("mysqlForm");
const mysqlStatus = document.getElementById("mysqlStatus");
const blockedDateInput = document.getElementById("blockedDateInput");
const addBlockedDateBtn = document.getElementById("addBlockedDate");
const clearBlockedDatesBtn = document.getElementById("clearBlockedDates");
const blockedDatesList = document.getElementById("blockedDatesList");
const rateForm = document.getElementById("rateForm");
const dailyRateInput = document.getElementById("dailyRateInput");
const rateStatus = document.getElementById("rateStatus");
const heroImagesInput = document.getElementById("heroImagesInput");
const thumbImagesInput = document.getElementById("thumbImagesInput");
const heroPreview = document.getElementById("heroPreview");
const thumbPreview = document.getElementById("thumbPreview");
const saveHeroImagesBtn = document.getElementById("saveHeroImages");
const saveThumbImagesBtn = document.getElementById("saveThumbImages");

function readJSON(key, fallback) {
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch (error) {
    console.warn("Falha ao ler storage", key, error);
    return fallback;
  }
}

function writeJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function updateMysqlStatus(message) {
  mysqlStatus.textContent = message;
}

function updateRateStatus(message) {
  rateStatus.textContent = message;
}

function renderBlockedDates() {
  const blockedDates = readJSON(STORAGE_KEYS.blockedDates, []);
  blockedDatesList.innerHTML = "";

  if (!blockedDates.length) {
    blockedDatesList.innerHTML = "<li class=\"hint\">Nenhuma data bloqueada.</li>";
    return;
  }

  blockedDates.forEach((date) => {
    const item = document.createElement("li");
    item.className = "blocked-item";
    item.innerHTML = `
      <span>${date}</span>
      <button type="button" aria-label="Remover ${date}">x</button>
    `;

    const button = item.querySelector("button");
    button.addEventListener("click", () => {
      const next = blockedDates.filter((d) => d !== date);
      writeJSON(STORAGE_KEYS.blockedDates, next);
      renderBlockedDates();
    });

    blockedDatesList.appendChild(item);
  });
}

function saveBlockedDate() {
  const value = blockedDateInput.value;
  if (!value) return;

  const blockedDates = readJSON(STORAGE_KEYS.blockedDates, []);
  if (!blockedDates.includes(value)) {
    blockedDates.push(value);
    blockedDates.sort();
    writeJSON(STORAGE_KEYS.blockedDates, blockedDates);
  }

  blockedDateInput.value = "";
  renderBlockedDates();
}

function clearBlockedDates() {
  writeJSON(STORAGE_KEYS.blockedDates, []);
  renderBlockedDates();
}

function parseLines(value) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function renderPreview(container, urls) {
  container.innerHTML = "";
  urls.forEach((url) => {
    const img = document.createElement("img");
    img.src = url;
    img.alt = "Prévia";
    container.appendChild(img);
  });
}

function loadStoredValues() {
  const mysql = readJSON(STORAGE_KEYS.mysql, null);
  if (mysql) {
    mysqlForm.host.value = mysql.host || "";
    mysqlForm.port.value = mysql.port || "";
    mysqlForm.database.value = mysql.database || "";
    mysqlForm.user.value = mysql.user || "";
    mysqlForm.password.value = mysql.password || "";
    updateMysqlStatus("Configuração carregada do navegador.");
  }

  const rate = localStorage.getItem(STORAGE_KEYS.dailyRate);
  if (rate) {
    dailyRateInput.value = rate;
    updateRateStatus("Diária atual carregada.");
  }

  const heroImages = readJSON(STORAGE_KEYS.heroImages, []);
  const thumbImages = readJSON(STORAGE_KEYS.thumbImages, []);
  heroImagesInput.value = heroImages.join("\n");
  thumbImagesInput.value = thumbImages.join("\n");
  renderPreview(heroPreview, heroImages);
  renderPreview(thumbPreview, thumbImages);

  renderBlockedDates();
}

mysqlForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = {
    host: mysqlForm.host.value.trim(),
    port: mysqlForm.port.value.trim(),
    database: mysqlForm.database.value.trim(),
    user: mysqlForm.user.value.trim(),
    password: mysqlForm.password.value,
  };

  writeJSON(STORAGE_KEYS.mysql, data);
  updateMysqlStatus("Configuração MySQL salva localmente.");
});

addBlockedDateBtn.addEventListener("click", (event) => {
  event.preventDefault();
  saveBlockedDate();
});

clearBlockedDatesBtn.addEventListener("click", (event) => {
  event.preventDefault();
  clearBlockedDates();
});

rateForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const value = Number.parseFloat(dailyRateInput.value.replace(",", "."));
  if (!Number.isFinite(value) || value <= 0) {
    updateRateStatus("Informe um valor válido para a diária.");
    return;
  }

  localStorage.setItem(STORAGE_KEYS.dailyRate, value.toFixed(2));
  updateRateStatus("Diária atualizada com sucesso.");
});

saveHeroImagesBtn.addEventListener("click", () => {
  const urls = parseLines(heroImagesInput.value);
  writeJSON(STORAGE_KEYS.heroImages, urls);
  renderPreview(heroPreview, urls);
});

saveThumbImagesBtn.addEventListener("click", () => {
  const urls = parseLines(thumbImagesInput.value);
  writeJSON(STORAGE_KEYS.thumbImages, urls);
  renderPreview(thumbPreview, urls);
});

loadStoredValues();
