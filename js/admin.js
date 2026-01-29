/* =========================
   Admin — Supabase + Fallback
   ========================= */

const sb = window.supabaseClient;
if (!sb) {
  alert("Supabase client não carregou. Verifique js/supabaseClient.js e a ordem dos scripts.");
  throw new Error("supabaseClient undefined");
}

const STORAGE_KEYS = {
  dailyRate: "adminDailyRate",
  adminBlocks: "fp_bloqueios",
  reservedDates: "fp_reservas",
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

// Cache de registros para remover do Supabase (mapeia yyyy-mm-dd -> row id)
let blockedRowIdByDate = new Map();

function readJSON(key, fallback) {
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  try { return JSON.parse(raw); } catch { return fallback; }
}

function writeJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function setHint(msg) {
  if (calendarHint) calendarHint.textContent = msg || "";
}

function setRateStatus(msg) {
  if (rateStatus) rateStatus.textContent = msg || "";
}

function formatDateKey(date) {
  return date.toISOString().slice(0, 10);
}

function formatDateBr(value) {
  if (!value || value.length !== 10) return value;
  const [y, m, d] = value.split("-");
  return `${d}/${m}/${y}`;
}

function normalizeDate(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function expandRange(start, end) {
  const dates = [];
  if (!start) return dates;
  const s = normalizeDate(start);
  const e = normalizeDate(end || start);
  const from = s <= e ? s : e;
  const to = s <= e ? e : s;
  const cur = new Date(from);
  while (cur <= to) {
    dates.push(formatDateKey(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

function parseLines(value) {
  return (value || "")
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
      button.addEventListener("click", () => removeBlockedDate(date, { confirmRemoval: true }));
      item.appendChild(button);
    }
    listEl.appendChild(item);
  });
}

function syncSets() {
  blockedDatesSet = new Set(blockedDates);
  reservedDatesSet = new Set(reservedDates);
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
      if (!selectedDates.length) setHint("");
    },
    onDayCreate: function (_dObj, _dStr, _fp, dayElem) {
      const key = formatDateKey(dayElem.dateObj);
      if (reservedDatesSet.has(key)) dayElem.classList.add("reserved-day");
      if (blockedDatesSet.has(key)) dayElem.classList.add("admin-blocked");
    },
  });

  // Clique em dia bloqueado remove
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

/* =========================
   SUPABASE — Auth
   ========================= */

async function getSession() {
  const { data, error } = await sb.auth.getSession();
  if (error) return null;
  return data.session || null;
}

async function requireAdminSession() {
  const session = await getSession();
  if (!session) {
    window.location.href = "admin-login.html?reason=session";
    return null;
  }
  return session;
}

/* =========================
   SUPABASE — Reservas
   ========================= */

function normalizeReservaRow(row) {
  // Tenta pegar campos comuns
  const startRaw =
    row.start_date || row.inicio || row.from || row.checkin || row.check_in || row.data_inicio;
  const endRaw =
    row.end_date || row.fim || row.to || row.checkout || row.check_out || row.data_fim;

  const status = (row.status || row.situacao || row.state || "").toString().toLowerCase();

  // Se tiver status, tenta filtrar confirmadas
  const isConfirmed =
    !status || status.includes("confirm") || status.includes("paid") || status.includes("aprov");

  return { startRaw, endRaw, isConfirmed };
}

function parseDateSafe(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  const s = String(value).slice(0, 10); // yyyy-mm-dd
  if (s.includes("-")) {
    const [y, m, d] = s.split("-");
    const dt = new Date(Number(y), Number(m) - 1, Number(d));
    return Number.isNaN(dt.getTime()) ? null : dt;
  }
  return null;
}

async function loadReservedDatesFromSupabase() {
  try {
    const { data, error } = await sb.from("reservas").select("*").limit(1000);
    if (error) throw error;

    const dates = [];
    for (const row of data || []) {
      const { startRaw, endRaw, isConfirmed } = normalizeReservaRow(row);
      if (!isConfirmed) continue;

      const start = parseDateSafe(startRaw);
      const end = parseDateSafe(endRaw || startRaw);
      if (start) dates.push(...expandRange(start, end || start));
    }

    return Array.from(new Set(dates)).sort();
  } catch (e) {
    console.warn("Falha ao carregar reservas do Supabase:", e);
    return null; // sinaliza fallback
  }
}

/* =========================
   SUPABASE — Bloqueios
   ========================= */

async function loadBlockedDatesFromSupabase() {
  blockedRowIdByDate = new Map();

  try {
    const { data, error } = await sb.from("bloqueios").select("id,start_date,end_date,motivo,created_by").limit(2000);
    if (error) throw error;

    const dates = [];
    for (const row of data || []) {
      const s = parseDateSafe(row.start_date);
      const e = parseDateSafe(row.end_date || row.start_date);
      if (!s) continue;

      // Para remoção simples: gravamos por dia -> id (preferência para linhas dia-a-dia)
      const expanded = expandRange(s, e || s);
      expanded.forEach((d) => {
        dates.push(d);
        // Se existir linha de 1 dia, mapeia; se for range, o id não serve para remover 1 dia.
        const isSingleDay = row.start_date && row.end_date && String(row.start_date).slice(0,10) === String(row.end_date).slice(0,10);
        if (isSingleDay) blockedRowIdByDate.set(d, row.id);
      });
    }

    return Array.from(new Set(dates)).sort();
  } catch (e) {
    console.warn("Falha ao carregar bloqueios do Supabase:", e);
    return null;
  }
}

async function insertBlockedDaysSupabase(days) {
  const session = await requireAdminSession();
  if (!session) throw new Error("Sem sessão admin");

  // Gravando 1 linha por dia (start_date=end_date) para remoção simples
  const rows = days.map((d) => ({
    start_date: d,
    end_date: d,
    motivo: "bloqueio_admin",
    created_by: session.user.id,
  }));

  const { data, error } = await sb.from("bloqueios").insert(rows).select("id,start_date,end_date");
  if (error) throw error;

  // Atualiza map id por date
  (data || []).forEach((r) => {
    const dk = String(r.start_date).slice(0, 10);
    blockedRowIdByDate.set(dk, r.id);
  });
}

async function deleteBlockedDaySupabase(dateKey) {
  const session = await requireAdminSession();
  if (!session) throw new Error("Sem sessão admin");

  // Se temos um id de linha "1 dia", removemos por id
  const rowId = blockedRowIdByDate.get(dateKey);
  if (rowId) {
    const { error } = await sb.from("bloqueios").delete().eq("id", rowId);
    if (error) throw error;
    blockedRowIdByDate.delete(dateKey);
    return;
  }

  // Fallback: tenta deletar por start_date/end_date iguais (se existir)
  const { error } = await sb.from("bloqueios").delete().eq("start_date", dateKey).eq("end_date", dateKey);
  if (error) throw error;
}

/* =========================
   SUPABASE — Config (Diária)
   ========================= */

async function loadDailyRateSupabase() {
  // 1) Tenta config.daily_rate
  try {
    const { data, error } = await sb.from("config").select("*").limit(1);
    if (error) throw error;

    const row = (data || [])[0];
    if (!row) return null;

    if (row.daily_rate != null) return Number(row.daily_rate);
    if (row.diaria != null) return Number(row.diaria);

    // 2) Tenta formato key/value
    if (row.key && row.value && String(row.key).toLowerCase().includes("daily")) {
      const n = Number(String(row.value).replace(",", "."));
      return Number.isFinite(n) ? n : null;
    }
    return null;
  } catch (e) {
    console.warn("Falha ao carregar diária do Supabase:", e);
    return null;
  }
}

async function saveDailyRateSupabase(value) {
  const session = await requireAdminSession();
  if (!session) throw new Error("Sem sessão admin");

  // Tentativa 1: update em config (1 linha) com coluna daily_rate
  try {
    const { data: existing, error: e1 } = await sb.from("config").select("id").limit(1);
    if (e1) throw e1;
    const row = (existing || [])[0];

    if (row?.id) {
      // tenta daily_rate
      let r = await sb.from("config").update({ daily_rate: value }).eq("id", row.id);
      if (r.error) {
        // tenta diaria
        r = await sb.from("config").update({ diaria: value }).eq("id", row.id);
        if (r.error) throw r.error;
      }
      return true;
    }
  } catch (e) {
    // cai pro próximo modo
    console.warn("saveDailyRateSupabase (modo 1) falhou:", e);
  }

  // Tentativa 2: upsert key/value
  try {
    const up = await sb.from("config").upsert({ key: "daily_rate", value: String(value) }, { onConflict: "key" });
    if (up.error) throw up.error;
    return true;
  } catch (e) {
    console.warn("saveDailyRateSupabase (modo 2) falhou:", e);
    return false;
  }
}

/* =========================
   SUPABASE — Fotos (opcional)
   ========================= */

async function loadFotosSupabase(groupName) {
  try {
    // Espera: fotos_home { group, position, url }
    const { data, error } = await sb
      .from("fotos_home")
      .select("group,position,url")
      .eq("group", groupName)
      .order("position", { ascending: true });

    if (error) throw error;
    return (data || []).map((r) => r.url).filter(Boolean);
  } catch (e) {
    console.warn(`Falha ao carregar fotos_home (${groupName}):`, e);
    return null;
  }
}

async function saveFotosSupabase(groupName, urls) {
  const session = await requireAdminSession();
  if (!session) throw new Error("Sem sessão admin");

  try {
    // Remove antigas
    const del = await sb.from("fotos_home").delete().eq("group", groupName);
    if (del.error) throw del.error;

    // Insere novas
    const rows = urls.map((url, i) => ({ group: groupName, position: i + 1, url }));
    const ins = await sb.from("fotos_home").insert(rows);
    if (ins.error) throw ins.error;

    return true;
  } catch (e) {
    console.warn("saveFotosSupabase falhou:", e);
    return false;
  }
}

/* =========================
   Fluxo principal
   ========================= */

async function refreshCalendarData() {
  // 1) Tenta Supabase
  const [supBlocked, supReserved] = await Promise.all([
    loadBlockedDatesFromSupabase(),
    loadReservedDatesFromSupabase(),
  ]);

  // 2) Se falhar, fallback local
  blockedDates = supBlocked ?? readJSON(STORAGE_KEYS.adminBlocks, []);
  reservedDates = supReserved ?? readJSON(STORAGE_KEYS.reservedDates, []);

  // guarda fallback
  if (supBlocked) writeJSON(STORAGE_KEYS.adminBlocks, blockedDates);
  if (supReserved) writeJSON(STORAGE_KEYS.reservedDates, reservedDates);

  blockedDates = Array.from(new Set(blockedDates)).sort();
  reservedDates = Array.from(new Set(reservedDates)).sort();

  syncSets();
  renderList(reservedDatesList, reservedDates, { removable: false });
  renderList(blockedDatesList, blockedDates, { removable: true });

  if (calendarInstance) {
    calendarInstance.set("disable", reservedDates);
    calendarInstance.redraw();
    updateSelectionSummary(calendarInstance.selectedDates);
  }
}

async function removeBlockedDate(dateKey, { confirmRemoval = false } = {}) {
  if (confirmRemoval && !confirm("Deseja remover este bloqueio?")) return;

  try {
    // tenta Supabase
    await deleteBlockedDaySupabase(dateKey);
  } catch (e) {
    console.warn("Remoção no Supabase falhou, fallback local:", e);
  }

  blockedDates = blockedDates.filter((d) => d !== dateKey);
  writeJSON(STORAGE_KEYS.adminBlocks, blockedDates);
  syncSets();
  renderList(blockedDatesList, blockedDates, { removable: true });

  if (calendarInstance) {
    calendarInstance.redraw();
    calendarInstance.clear();
    updateSelectionSummary([]);
  }
}

async function addBlockedRange() {
  if (!calendarInstance) return;

  const selected = calendarInstance.selectedDates;
  if (!selected.length) {
    setHint("Selecione uma data ou intervalo no calendário.");
    return;
  }

  const start = selected[0];
  const end = selected[1] || selected[0];

  const s = normalizeDate(start);
  const e = normalizeDate(end);

  const daysToBlock = [];
  const cur = new Date(s);
  while (cur <= e) {
    const key = formatDateKey(cur);
    if (reservedDatesSet.has(key)) {
      setHint("Não é possível bloquear uma data já reservada.");
      alert("Não é possível bloquear uma data já reservada.");
      return;
    }
    daysToBlock.push(key);
    cur.setDate(cur.getDate() + 1);
  }

  // Dedup local
  const merged = Array.from(new Set([...blockedDates, ...daysToBlock])).sort();

  try {
    await insertBlockedDaysSupabase(daysToBlock);
  } catch (e) {
    // Aqui é onde antes quebrava “auth” — agora vai dar mensagem clara se não estiver logado
    console.error("Erro ao adicionar bloqueio no Supabase:", e);
    alert(`Erro ao adicionar bloqueio: ${e?.message || e}`);
    return;
  }

  blockedDates = merged;
  writeJSON(STORAGE_KEYS.adminBlocks, blockedDates);
  syncSets();

  renderList(blockedDatesList, blockedDates, { removable: true });
  calendarInstance.clear();
  calendarInstance.redraw();
  updateSelectionSummary([]);
  setHint("");
}

async function clearBlockedDates() {
  if (!confirm("Remover todos os bloqueios do admin?")) return;

  // Remove um por um no Supabase (seguro com seu schema atual)
  for (const d of blockedDates) {
    try { await deleteBlockedDaySupabase(d); } catch {}
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

async function loadStoredValues() {
  // Diária — tenta Supabase, fallback local
  const supRate = await loadDailyRateSupabase();
  if (Number.isFinite(supRate) && supRate > 0) {
    dailyRateInput.value = supRate.toFixed(2);
    localStorage.setItem(STORAGE_KEYS.dailyRate, supRate.toFixed(2));
    setRateStatus("Diária carregada do Supabase.");
  } else {
    const rate = localStorage.getItem(STORAGE_KEYS.dailyRate);
    if (rate) {
      dailyRateInput.value = rate;
      setRateStatus("Diária carregada do navegador (fallback).");
    }
  }

  // Fotos — tenta Supabase, fallback local
  const [heroSup, thumbSup] = await Promise.all([
    loadFotosSupabase("hero"),
    loadFotosSupabase("thumb"),
  ]);

  const hero = heroSup ?? readJSON(STORAGE_KEYS.heroImages, []);
  const thumb = thumbSup ?? readJSON(STORAGE_KEYS.thumbImages, []);

  heroImagesInput.value = hero.join("\n");
  thumbImagesInput.value = thumb.join("\n");
  renderPreview(heroPreview, hero);
  renderPreview(thumbPreview, thumb);

  if (heroSup) writeJSON(STORAGE_KEYS.heroImages, hero);
  if (thumbSup) writeJSON(STORAGE_KEYS.thumbImages, thumb);

  await refreshCalendarData();
}

/* =========================
   Event listeners
   ========================= */

addBlockedRangeBtn.addEventListener("click", async (event) => {
  event.preventDefault();
  await addBlockedRange();
});

clearSelectionBtn.addEventListener("click", (event) => {
  event.preventDefault();
  if (calendarInstance) {
    calendarInstance.clear();
    updateSelectionSummary([]);
  }
});

clearBlockedDatesBtn.addEventListener("click", async (event) => {
  event.preventDefault();
  await clearBlockedDates();
});

rateForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const value = Number.parseFloat(String(dailyRateInput.value).replace(",", "."));
  if (!Number.isFinite(value) || value <= 0) {
    setRateStatus("Informe um valor válido para a diária.");
    return;
  }

  const ok = await saveDailyRateSupabase(Number(value.toFixed(2)));
  if (ok) {
    localStorage.setItem(STORAGE_KEYS.dailyRate, value.toFixed(2));
    setRateStatus("Diária atualizada com sucesso (Supabase).");
  } else {
    localStorage.setItem(STORAGE_KEYS.dailyRate, value.toFixed(2));
    setRateStatus("Supabase falhou — salva no navegador (fallback).");
  }
});

saveHeroImagesBtn.addEventListener("click", async (event) => {
  event.preventDefault();
  const urls = parseLines(heroImagesInput.value);

  const ok = await saveFotosSupabase("hero", urls);
  if (ok) {
    writeJSON(STORAGE_KEYS.heroImages, urls);
    renderPreview(heroPreview, urls);
    setHint("Fotos do hero salvas no Supabase.");
  } else {
    writeJSON(STORAGE_KEYS.heroImages, urls);
    renderPreview(heroPreview, urls);
    setHint("Supabase falhou — fotos salvas no navegador (fallback).");
  }
});

saveThumbImagesBtn.addEventListener("click", async (event) => {
  event.preventDefault();
  const urls = parseLines(thumbImagesInput.value);

  const ok = await saveFotosSupabase("thumb", urls);
  if (ok) {
    writeJSON(STORAGE_KEYS.thumbImages, urls);
    renderPreview(thumbPreview, urls);
    setHint("Fotos do carrossel salvas no Supabase.");
  } else {
    writeJSON(STORAGE_KEYS.thumbImages, urls);
    renderPreview(thumbPreview, urls);
    setHint("Supabase falhou — fotos salvas no navegador (fallback).");
  }
});

/* =========================
   Boot
   ========================= */

(async function boot() {
  if (window.adminAccessReady) {
    await window.adminAccessReady;
  }
  initCalendar();
  await loadStoredValues();
})();
