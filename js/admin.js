const STORAGE_KEYS = {
  // Mantive fotos local por enquanto (URL por linha)
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

// Supabase client (precisa estar em window por causa do supabaseClient.js)
const sb = window.supabaseClient;

let blockedDates = [];        // array de YYYY-MM-DD (dias bloqueados)
let reservedDates = [];       // array de YYYY-MM-DD (dias reservados confirmados)
let blockedDatesSet = new Set();
let reservedDatesSet = new Set();

let blockedDateToRowId = new Map(); // YYYY-MM-DD -> bloqueios.id (para remover fácil)
let calendarInstance = null;

// ---------------------- Utils ----------------------
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

// ---------------------- Supabase helpers ----------------------
async function sbGetDiaria() {
  const { data, error } = await sb
    .from("config")
    .select("diaria")
    .eq("id", "main")
    .single();
  if (error) throw error;
  return Number(data?.diaria || 0);
}

async function sbSetDiaria(valor) {
  const { error } = await sb
    .from("config")
    .update({ diaria: valor, updated_at: new Date().toISOString() })
    .eq("id", "main");
  if (error) throw error;
}

async function sbListReservasConfirmadas() {
  const { data, error } = await sb
    .from("reservas")
    .select("id,start_date,end_date,status")
    .eq("status", "confirmada")
    .order("start_date", { ascending: true });
  if (error) throw error;
  return data || [];
}

async function sbListBloqueios() {
  const { data, error } = await sb
    .from("bloqueios")
    .select("id,start_date,end_date")
    .order("start_date", { ascending: true });
  if (error) throw error;
  return data || [];
}

async function sbInsertBloqueioRange(startISO, endISO) {
  const { data: u } = await sb.auth.getUser();
  const created_by = u?.user?.id || null;

  const { error } = await sb.from("bloqueios").insert([
    {
      start_date: startISO,
      end_date: endISO,
      motivo: "",
      created_by,
    },
  ]);
  if (error) throw error;
}

async function sbDeleteBloqueioById(id) {
  const { error } = await sb.from("bloqueios").delete().eq("id", id);
  if (error) throw error;
}

async function sbDeleteAllBloqueios() {
  const { error } = await sb
    .from("bloqueios")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");
  if (error) throw error;
}

// ---------------------- Data load (Supabase -> UI) ----------------------
async function loadDailyRateFromSupabase() {
  try {
    const diaria = await sbGetDiaria();
    dailyRateInput.value = diaria ? diaria.toFixed(2) : "";
    updateRateStatus("Diária carregada do Supabase.");
  } catch (e) {
    console.error(e);
    updateRateStatus("Não foi possível carregar a diária do Supabase.");
  }
}

function rangesToDaysAndMap(rows) {
  const days = [];
  const map = new Map(); // date -> rowId (prioriza o primeiro)
  for (const r of rows) {
    const start = parseDateString(r.start_date);
    const end = parseDateString(r.end_date);
    const expanded = expandRange(start, end);
    expanded.forEach((d) => {
      days.push(d);
      if (!map.has(d)) map.set(d, r.id);
    });
  }
  return { days: Array.from(new Set(days)).sort(), map };
}

async function refreshCalendarDataFromSupabase() {
  // 1) Reservas confirmadas
  const reservas = await sbListReservasConfirmadas();
  const reservasDays = reservas.flatMap((r) => {
    const s = parseDateString(r.start_date);
    const e = parseDateString(r.end_date);
    return expandRange(s, e);
  });

  reservedDates = Array.from(new Set(reservasDays)).sort();

  // 2) Bloqueios do admin
  const bloqueios = await sbListBloqueios();
  const { days: bloqueiosDays, map } = rangesToDaysAndMap(bloqueios);

  blockedDates = bloqueiosDays;
  blockedDateToRowId = map;

  // 3) Atualiza sets + listas
  syncSets();
  renderList(reservedDatesList, reservedDates, { removable: false });
  renderList(blockedDatesList, blockedDates, { removable: true });

  // 4) Atualiza calendário
  if (calendarInstance) {
    calendarInstance.set("disable", reservedDates);
    calendarInstance.redraw();
    updateSelectionSummary(calendarInstance.selectedDates);
  }
}

// ---------------------- Actions ----------------------
async function removeBlockedDate(dateKey, { confirmRemoval = false } = {}) {
  if (confirmRemoval && !confirm("Deseja remover este bloqueio?")) {
    return;
  }

  // Remove no Supabase (pela linha de bloqueio que contém esse dia)
  const rowId = blockedDateToRowId.get(dateKey);
  if (!rowId) {
    // fallback: remove só local (não deveria acontecer)
    blockedDates = blockedDates.filter((date) => date !== dateKey);
    syncSets();
    renderList(blockedDatesList, blockedDates, { removable: true });
    if (calendarInstance) {
      calendarInstance.redraw();
      calendarInstance.clear();
      updateSelectionSummary([]);
    }
    return;
  }

  try {
    await sbDeleteBloqueioById(rowId);
    await refreshCalendarDataFromSupabase();
    if (calendarInstance) {
      calendarInstance.clear();
      updateSelectionSummary([]);
    }
  } catch (e) {
    alert("Erro ao remover bloqueio: " + (e?.message || e));
  }
}

async function addBlockedRange() {
  if (!calendarInstance) return;

  const selected = calendarInstance.selectedDates;
  if (!selected.length) {
    setCalendarHint("Selecione uma data ou intervalo no calendário.");
    return;
  }

  const start = normalizeDate(selected[0]);
  const end = normalizeDate(selected[1] || selected[0]);

  // Validação: não bloquear dia reservado
  const daysToBlock = [];
  const current = new Date(start);
  while (current <= end) {
    const key = formatDateKey(current);
    if (reservedDatesSet.has(key)) {
      setCalendarHint("Não é possível bloquear uma data já reservada.");
      alert("Não é possível bloquear uma data já reservada.");
      return;
    }
    daysToBlock.push(key);
    current.setDate(current.getDate() + 1);
  }

  // Salva como range no Supabase (1 linha start/end)
  const startISO = daysToBlock[0];
  const endISO = daysToBlock[daysToBlock.length - 1];

  try {
    await sbInsertBloqueioRange(startISO, endISO);
    await refreshCalendarDataFromSupabase();
    if (calendarInstance) {
      calendarInstance.clear();
      calendarInstance.redraw();
      updateSelectionSummary([]);
    }
    setCalendarHint("");
  } catch (e) {
    alert("Erro ao adicionar bloqueio: " + (e?.message || e));
  }
}

async function clearBlockedDates() {
  if (!confirm("Remover todos os bloqueios do admin?")) {
    return;
  }

  try {
    await sbDeleteAllBloqueios();
    await refreshCalendarDataFromSupabase();
    if (calendarInstance) {
      calendarInstance.clear();
      calendarInstance.redraw();
      updateSelectionSummary([]);
    }
  } catch (e) {
    alert("Erro ao remover bloqueios: " + (e?.message || e));
  }
}

// ---------------------- Calendar UI ----------------------
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

// ---------------------- Fotos (mantém local por enquanto) ----------------------
function loadImagesLocal() {
  const heroImages = readJSON(STORAGE_KEYS.heroImages, []);
  const thumbImages = readJSON(STORAGE_KEYS.thumbImages, []);
  heroImagesInput.value = heroImages.join("\n");
  thumbImagesInput.value = thumbImages.join("\n");
  renderPreview(heroPreview, heroImages);
  renderPreview(thumbPreview, thumbImages);
}

// ---------------------- Bind events ----------------------
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

rateForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const raw = (dailyRateInput.value || "").toString().replace(",", ".");
  const value = Number.parseFloat(raw);

  if (!Number.isFinite(value) || value <= 0) {
    updateRateStatus("Informe um valor válido para a diária.");
    return;
  }

  try {
    await sbSetDiaria(Number(value.toFixed(2)));
    updateRateStatus("Diária atualizada com sucesso (Supabase).");
  } catch (e) {
    updateRateStatus("Erro ao salvar diária no Supabase.");
    alert("Erro ao salvar diária: " + (e?.message || e));
  }
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

// ---------------------- Init ----------------------
(async function initAdmin() {
  // Fotos continuam como estão
  loadImagesLocal();

  // Calendário inicia vazio; depois carregamos do banco e redesenhamos
  initCalendar();

  // Carrega do banco
  await loadDailyRateFromSupabase();
  await refreshCalendarDataFromSupabase();
})();
