const STORAGE_KEYS = {
  dailyRate: "adminDailyRate",
  adminBlocks: "adminManualBlocks",
  reservedDates: "adminReservedDates",
  legacyBlocks: "adminBlockedDates",
  heroImages: "adminHeroImages",
  thumbImages: "adminThumbImages",
};

const blockedDatesList = document.getElementById("blockedDatesList");
const reservedDatesList = document.getElementById("reservedDatesList");
const addBlockedRangeBtn = document.getElementById("addBlockedRange");
const clearBlockedDatesBtn = document.getElementById("clearBlockedDates");
const clearSelectionBtn = document.getElementById("clearSelection");
const calendarInput = document.getElementById("adminBlockRange");
const calendarContainer = document.getElementById("adminCalendar");
const calendarHint = document.getElementById("calendarHint");
const rateForm = document.getElementById("rateForm");
const dailyRateInput = document.getElementById("dailyRateInput");
const rateStatus = document.getElementById("rateStatus");
const heroImagesInput = document.getElementById("heroImagesInput");
const thumbImagesInput = document.getElementById("thumbImagesInput");
const heroPreview = document.getElementById("heroPreview");
const thumbPreview = document.getElementById("thumbPreview");
const saveHeroImagesBtn = document.getElementById("saveHeroImages");
const saveThumbImagesBtn = document.getElementById("saveThumbImages");

let blockedDates = [];
let reservedDates = [];
let blockedDatesSet = new Set();
let reservedDatesSet = new Set();
let calendarInstance = null;

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

function readDateArray(key) {
  const parsed = readJSON(key, []);
  if (!Array.isArray(parsed)) return [];
  return parsed.filter(Boolean);
}

function formatDateKey(date) {
  return date.toISOString().slice(0, 10);
}

function formatDateBr(value) {
  if (!value || value.length !== 10) return value;
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

function updateRateStatus(message) {
  rateStatus.textContent = message;
}

function setCalendarHint(message) {
  if (calendarHint) {
    calendarHint.textContent = message;
  }
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

function renderList(listEl, dates, { removable }) {
  listEl.innerHTML = "";

  if (!dates.length) {
    listEl.innerHTML = '<li class="hint">Nenhuma data cadastrada.</li>';
    return;
  }

  dates.forEach((date) => {
    const item = document.createElement("li");
    item.className = "blocked-item";
    item.innerHTML = `<span>${formatDateBr(date)}</span>`;

    if (removable) {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = "x";
      button.setAttribute("aria-label", `Remover ${formatDateBr(date)}`);
      button.addEventListener("click", () => removeBlockedDate(date));
      item.appendChild(button);
    }

    listEl.appendChild(item);
  });
}

function syncSets() {
  blockedDatesSet = new Set(blockedDates);
  reservedDatesSet = new Set(reservedDates);
}

function getBlockedDates() {
  const current = readDateArray(STORAGE_KEYS.adminBlocks);
  if (current.length) {
    return current;
  }

  const legacy = readDateArray(STORAGE_KEYS.legacyBlocks);
  if (legacy.length) {
    writeJSON(STORAGE_KEYS.adminBlocks, legacy);
  }
  return legacy;
}

function refreshCalendarData() {
  blockedDates = getBlockedDates();
  reservedDates = readDateArray(STORAGE_KEYS.reservedDates);
  syncSets();
  renderList(reservedDatesList, reservedDates, { removable: false });
  renderList(blockedDatesList, blockedDates, { removable: true });

  if (calendarInstance) {
    calendarInstance.set("disable", reservedDates);
    calendarInstance.redraw();
  }
}

function removeBlockedDate(dateKey) {
  blockedDates = blockedDates.filter((date) => date !== dateKey);
  writeJSON(STORAGE_KEYS.adminBlocks, blockedDates);
  syncSets();
  renderList(blockedDatesList, blockedDates, { removable: true });
  if (calendarInstance) {
    calendarInstance.redraw();
    calendarInstance.clear();
  }
}

function addBlockedRange() {
  if (!calendarInstance) return;
  const selected = calendarInstance.selectedDates;
  if (!selected.length) {
    setCalendarHint("Selecione uma data ou intervalo no calendário.");
    return;
  }

  const start = selected[0];
  const end = selected[1] || selected[0];
  const normalizedStart = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const normalizedEnd = new Date(end.getFullYear(), end.getMonth(), end.getDate());

  const daysToBlock = [];
  const current = new Date(normalizedStart);
  while (current <= normalizedEnd) {
    const key = formatDateKey(current);
    if (reservedDatesSet.has(key)) {
      alert("Não é possível bloquear uma data já reservada.");
      return;
    }
    daysToBlock.push(key);
    current.setDate(current.getDate() + 1);
  }

  const merged = Array.from(new Set([...blockedDates, ...daysToBlock])).sort();
  blockedDates = merged;
  writeJSON(STORAGE_KEYS.adminBlocks, blockedDates);
  syncSets();
  renderList(blockedDatesList, blockedDates, { removable: true });
  if (calendarInstance) {
    calendarInstance.clear();
    calendarInstance.redraw();
  }
  setCalendarHint("");
}

function clearBlockedDates() {
  blockedDates = [];
  writeJSON(STORAGE_KEYS.adminBlocks, blockedDates);
  syncSets();
  renderList(blockedDatesList, blockedDates, { removable: true });
  if (calendarInstance) {
    calendarInstance.clear();
    calendarInstance.redraw();
  }
}

function initCalendar() {
  if (!calendarInput) return;

  calendarInstance = flatpickr(calendarInput, {
    mode: "range",
    minDate: "today",
    dateFormat: "d/m/Y",
    locale: "pt",
    inline: true,
    appendTo: calendarContainer,
    disable: reservedDates,
    onDayCreate: function (_dObj, _dStr, _fp, dayElem) {
      const key = formatDateKey(dayElem.dateObj);
      if (reservedDatesSet.has(key)) {
        dayElem.classList.add("reserved-day");
      }
      if (blockedDatesSet.has(key)) {
        dayElem.classList.add("admin-blocked");
      }
    },
  });

  calendarContainer.addEventListener("click", (event) => {
    const day = event.target.closest(".flatpickr-day");
    if (!day || !day.dateObj) return;

    const key = formatDateKey(day.dateObj);
    if (blockedDatesSet.has(key)) {
      event.preventDefault();
      removeBlockedDate(key);
    }
  });
}

function loadStoredValues() {
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

  refreshCalendarData();
}

addBlockedRangeBtn.addEventListener("click", (event) => {
  event.preventDefault();
  addBlockedRange();
});

clearSelectionBtn.addEventListener("click", (event) => {
  event.preventDefault();
  if (calendarInstance) {
    calendarInstance.clear();
  }
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
initCalendar();
