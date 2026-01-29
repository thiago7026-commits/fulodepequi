const STORAGE_KEYS = {
  dailyRate: "adminDailyRate",
  adminBlocks: "fp_bloqueios",
  reservedDates: "fp_reservas",
  legacyBlocks: ["adminManualBlocks", "adminBlockedDates"],
  legacyReserved: ["adminReservedDates"],
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
const selectionRange = document.getElementById("selectionRange");
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

function addDays(baseDate, days) {
  const date = new Date(baseDate);
  date.setDate(date.getDate() + days);
  return date;
}

const MOCK_RESERVED_RANGES = [
  { start: addDays(new Date(), 4), end: addDays(new Date(), 7) },
  { start: addDays(new Date(), 13), end: addDays(new Date(), 14) },
  { start: addDays(new Date(), 23), end: addDays(new Date(), 26) },
];

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

function parseDateString(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value !== "string") return null;

  const cleaned = value.trim();
  if (!cleaned) return null;

  if (cleaned.includes("/")) {
    const parts = cleaned.split("/");
    if (parts.length !== 3) return null;
    const [p1, p2, p3] = parts;
    if (p1.length === 4) {
      return new Date(Number(p1), Number(p2) - 1, Number(p3));
    }
    return new Date(Number(p3), Number(p2) - 1, Number(p1));
  }

  if (cleaned.includes("-")) {
    const parts = cleaned.split("-");
    if (parts.length !== 3) return null;
    const [year, month, day] = parts;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  return null;
}

function normalizeDate(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function expandRange(start, end) {
  const dates = [];
  if (!start) return dates;
  const normalizedStart = normalizeDate(start);
  const normalizedEnd = normalizeDate(end || start);
  const from = normalizedStart <= normalizedEnd ? normalizedStart : normalizedEnd;
  const to = normalizedStart <= normalizedEnd ? normalizedEnd : normalizedStart;
  const current = new Date(from);

  while (current <= to) {
    dates.push(formatDateKey(current));
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

function normalizeDateEntries(entries) {
  if (!Array.isArray(entries)) return [];

  const dates = entries.flatMap((entry) => {
    if (typeof entry === "string") {
      const parsed = parseDateString(entry);
      return parsed ? [formatDateKey(parsed)] : [];
    }

    if (entry && typeof entry === "object") {
      const start = parseDateString(
        entry.start || entry.inicio || entry.from || entry.checkin
      );
      const end = parseDateString(entry.end || entry.fim || entry.to || entry.checkout);

      if (start) {
        return expandRange(start, end);
      }

      const single = parseDateString(entry.date);
      return single ? [formatDateKey(single)] : [];
    }

    return [];
  });

  return Array.from(new Set(dates)).sort();
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
      button.addEventListener("click", () =>
        removeBlockedDate(date, { confirmRemoval: true })
      );
      item.appendChild(button);
    }

    listEl.appendChild(item);
  });
}

function syncSets() {
  blockedDatesSet = new Set(blockedDates);
  reservedDatesSet = new Set(reservedDates);
}

function getStoredDates(primaryKey, legacyKeys = [], fallback = []) {
  const current = normalizeDateEntries(readJSON(primaryKey, []));
  if (current.length) {
    return current;
  }

  for (const legacyKey of legacyKeys) {
    const legacy = normalizeDateEntries(readJSON(legacyKey, []));
    if (legacy.length) {
      writeJSON(primaryKey, legacy);
      return legacy;
    }
  }

  return fallback;
}

function getBlockedDates() {
  return getStoredDates(STORAGE_KEYS.adminBlocks, STORAGE_KEYS.legacyBlocks, []);
}

function buildMockReserved() {
  return MOCK_RESERVED_RANGES.flatMap((range) => expandRange(range.start, range.end));
}

function getReservedDates() {
  const fallback = buildMockReserved();
  return getStoredDates(STORAGE_KEYS.reservedDates, STORAGE_KEYS.legacyReserved, fallback);
}

function refreshCalendarData() {
  blockedDates = getBlockedDates();
  reservedDates = getReservedDates();
  syncSets();
  renderList(reservedDatesList, reservedDates, { removable: false });
  renderList(blockedDatesList, blockedDates, { removable: true });

  if (calendarInstance) {
    calendarInstance.set("disable", reservedDates);
    calendarInstance.redraw();
    updateSelectionSummary(calendarInstance.selectedDates);
  }
}

function removeBlockedDate(dateKey, { confirmRemoval = false } = {}) {
  if (confirmRemoval && !confirm("Deseja remover este bloqueio?")) {
    return;
  }

  blockedDates = blockedDates.filter((date) => date !== dateKey);
  writeJSON(STORAGE_KEYS.adminBlocks, blockedDates);
  syncSets();
  renderList(blockedDatesList, blockedDates, { removable: true });
  if (calendarInstance) {
    calendarInstance.redraw();
    calendarInstance.clear();
    updateSelectionSummary([]);
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
  const normalizedStart = normalizeDate(start);
  const normalizedEnd = normalizeDate(end);

  const daysToBlock = [];
  const current = new Date(normalizedStart);
  while (current <= normalizedEnd) {
    const key = formatDateKey(current);
    if (reservedDatesSet.has(key)) {
      setCalendarHint("Não é possível bloquear uma data já reservada.");
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
    updateSelectionSummary([]);
  }
  setCalendarHint("");
}

function clearBlockedDates() {
  if (!confirm("Remover todos os bloqueios do admin?")) {
    return;
  }
  blockedDates = [];
  writeJSON(STORAGE_KEYS.adminBlocks, blockedDates);
  syncSets();
  renderList(blockedDatesList, blockedDates, { removable: true });
  if (calendarInstance) {
    calendarInstance.clear();
    calendarInstance.redraw();
    updateSelectionSummary([]);
  }
}

function updateSelectionSummary(selectedDates) {
  if (!selectionRange) return;
  if (!selectedDates || !selectedDates.length) {
    selectionRange.textContent = "Nenhuma data selecionada.";
    return;
  }

  if (selectedDates.length === 1) {
    selectionRange.textContent = formatDateBr(formatDateKey(selectedDates[0]));
    return;
  }

  const start = formatDateBr(formatDateKey(selectedDates[0]));
  const end = formatDateBr(formatDateKey(selectedDates[1]));
  selectionRange.textContent = `${start} → ${end}`;
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
    onReady: function (selectedDates) {
      updateSelectionSummary(selectedDates);
    },
    onChange: function (selectedDates) {
      updateSelectionSummary(selectedDates);
      if (!selectedDates.length) {
        setCalendarHint("");
      }
    },
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
      removeBlockedDate(key, { confirmRemoval: true });
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
    updateSelectionSummary([]);
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
