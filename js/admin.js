const STORAGE_KEYS = {
  mysql: "adminMysqlConfig",
  dailyRate: "adminDailyRate",
  blockedDates: "adminBlockedDates",
  heroImages: "adminHeroImages",
  thumbImages: "adminThumbImages",
  airbnb: "adminAirbnbIntegration",
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
const airbnbForm = document.getElementById("airbnbForm");
const airbnbStatus = document.getElementById("airbnbStatus");
const openAirbnbListingBtn = document.getElementById("openAirbnbListing");
const importAirbnbDatesBtn = document.getElementById("importAirbnbDates");

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

function updateAirbnbStatus(message) {
  airbnbStatus.textContent = message;
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

function parseIcalDate(value) {
  if (!value) return null;
  const clean = value.split("T")[0];
  if (clean.length !== 8) return null;
  const year = Number.parseInt(clean.slice(0, 4), 10);
  const month = Number.parseInt(clean.slice(4, 6), 10) - 1;
  const day = Number.parseInt(clean.slice(6, 8), 10);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return null;
  }
  return new Date(Date.UTC(year, month, day));
}

function formatDateKey(date) {
  return date.toISOString().slice(0, 10);
}

function parseIcalBlockedDates(icalText) {
  const lines = icalText.split(/\r?\n/);
  const blocked = new Set();
  let start = null;
  let end = null;

  lines.forEach((line) => {
    if (line.startsWith("DTSTART")) {
      start = parseIcalDate(line.split(":")[1]);
    }
    if (line.startsWith("DTEND")) {
      end = parseIcalDate(line.split(":")[1]);
    }
    if (line.startsWith("END:VEVENT")) {
      if (start) {
        const current = new Date(start);
        const limit = end || new Date(start);
        if (!end) {
          blocked.add(formatDateKey(current));
        } else {
          while (current < limit) {
            blocked.add(formatDateKey(current));
            current.setUTCDate(current.getUTCDate() + 1);
          }
        }
      }
      start = null;
      end = null;
    }
  });

  return Array.from(blocked).sort();
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

  const airbnb = readJSON(STORAGE_KEYS.airbnb, null);
  if (airbnbForm && airbnb) {
    airbnbForm.listing.value = airbnb.listing || "";
    airbnbForm.ical.value = airbnb.ical || "";
    updateAirbnbStatus("Integração do Airbnb carregada.");
  }

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

airbnbForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const listing = airbnbForm.listing.value.trim();
  const ical = airbnbForm.ical.value.trim();

  writeJSON(STORAGE_KEYS.airbnb, { listing, ical });
  updateAirbnbStatus("Integração do Airbnb salva localmente.");
});

openAirbnbListingBtn.addEventListener("click", () => {
  const airbnb = readJSON(STORAGE_KEYS.airbnb, null);
  if (!airbnb || !airbnb.listing) {
    updateAirbnbStatus("Informe o link do anúncio para abrir o Airbnb.");
    return;
  }
  window.open(airbnb.listing, "_blank", "noopener");
});

importAirbnbDatesBtn.addEventListener("click", async () => {
  const airbnb = readJSON(STORAGE_KEYS.airbnb, null);
  if (!airbnb || !airbnb.ical) {
    updateAirbnbStatus("Informe o link iCal do Airbnb para importar bloqueios.");
    return;
  }

  updateAirbnbStatus("Buscando calendário do Airbnb...");
  try {
    const response = await fetch(airbnb.ical);
    if (!response.ok) {
      throw new Error("Falha ao baixar iCal.");
    }
    const text = await response.text();
    const importedDates = parseIcalBlockedDates(text);
    const currentDates = readJSON(STORAGE_KEYS.blockedDates, []);
    const merged = Array.from(new Set([...currentDates, ...importedDates])).sort();
    writeJSON(STORAGE_KEYS.blockedDates, merged);
    renderBlockedDates();
    updateAirbnbStatus(`Importado ${importedDates.length} bloqueios do Airbnb.`);
  } catch (error) {
    console.warn("Falha ao importar Airbnb", error);
    updateAirbnbStatus("Não foi possível importar o calendário (verifique CORS e o link iCal).");
  }
});

loadStoredValues();
