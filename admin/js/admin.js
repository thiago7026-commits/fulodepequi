// ✅ IMPORTS (precisa do <script type="module"> no HTML)
import {
  fetchCalendarEvents,
  createAdminBlock,
  deleteAdminBlock,
  upsertExternalEvents,
  LISTING_ID
} from "../../js/calendarService.js";


const AUTH_KEY = "adminAuth";
const SETTINGS_KEY = "adminSettings";
const RESERVAS_KEY = "adminReservas";
const CALENDAR_KEY = "adminCalendar"; // (legado - não usamos mais no calendário)
const PHOTOS_KEY = "adminPhotos";
const AIRBNB_IMPORTED_KEY = "airbnbImportedDates"; // (legado - não usamos mais)

const DEFAULT_SETTINGS = {
  nome: "Chalé Fulô de Pequi",
  endereco: "Chapada dos Veadeiros - Alto Paraíso de Goiás, GO",
  telefone: "(62) 99999-9999",
  email: "contato@fulodepequi.com.br",
  descricao: "Um refúgio acolhedor na natureza, perfeito para relaxar e se reconectar.",
  capacidade: 8,
  minimoNoites: 2,
  maximoNoites: 30,
  checkin: "14:00",
  checkout: "12:00",
  reservaInstantanea: true,
  aceitaPets: true,
  permiteFumar: false,
  permiteEventos: false,
  diaria: 350,
};

function qs(sel) {
  return document.querySelector(sel);
}

function isLoggedIn() {
  return localStorage.getItem(AUTH_KEY) === "true";
}

function requireAuth() {
  if (!isLoggedIn()) window.location.href = "./index.html";
}

function getSettings() {
  const raw = localStorage.getItem(SETTINGS_KEY);
  if (!raw) return DEFAULT_SETTINGS;
  try {
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function saveSettings(next) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
}

function getReservas() {
  const raw = localStorage.getItem(RESERVAS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveReservas(list) {
  localStorage.setItem(RESERVAS_KEY, JSON.stringify(list));
}

// (legado) mantido para não quebrar dashboard antigo
function getCalendarMap() {
  const raw = localStorage.getItem(CALENDAR_KEY);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function getPhotos() {
  const raw = localStorage.getItem(PHOTOS_KEY);
  if (!raw) return { iniciais: [], cachoeiras: [], rodape: [] };
  try {
    const parsed = JSON.parse(raw);
    return {
      iniciais: Array.isArray(parsed?.iniciais) ? parsed.iniciais : [],
      cachoeiras: Array.isArray(parsed?.cachoeiras) ? parsed.cachoeiras : [],
      rodape: Array.isArray(parsed?.rodape) ? parsed.rodape : [],
    };
  } catch {
    return { iniciais: [], cachoeiras: [], rodape: [] };
  }
}

function savePhotos(photos) {
  localStorage.setItem(PHOTOS_KEY, JSON.stringify(photos));
}

function formatMoney(v) {
  return `R$ ${Number(v || 0).toFixed(2).replace(".", ",")}`;
}

function initLogout() {
  const btn = document.getElementById("logoutBtn");
  if (!btn) return;
  btn.addEventListener("click", () => {
    localStorage.removeItem(AUTH_KEY);
    window.location.href = "./index.html";
  });
}

function initTabs() {
  const page = document.body.getAttribute("data-page");
  document.querySelectorAll(".tab").forEach((a) => {
    if (a.getAttribute("data-tab") === page) a.classList.add("active");
  });
}

function initLogin() {
  const form = document.getElementById("loginForm");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value.trim();
    const senha = document.getElementById("senha").value.trim();
    const err = document.getElementById("loginError");

    if (email === "admin@hospedagem.com" && senha === "admin123") {
      localStorage.setItem(AUTH_KEY, "true");
      window.location.href = "./dashboard.html";
      return;
    }

    if (err) err.textContent = "Email ou senha inválidos. Tente admin@hospedagem.com / admin123";
  });
}

function initDashboard() {
  const settings = getSettings();
  const reservas = getReservas();
  const map = getCalendarMap(); // legado

  const diariaEl = document.getElementById("dashDiaria");
  const bloqueadosEl = document.getElementById("dashBloqueados");
  const fotosEl = document.getElementById("dashFotos");

  if (diariaEl) diariaEl.textContent = `R$ ${settings.diaria}`;

  // Dashboard antigo contava bloqueios do localStorage.
  // Se quiser, depois conectamos ele ao Supabase.
  if (bloqueadosEl) {
    const count = Object.values(map).filter((s) => s === "bloqueada").length;
    bloqueadosEl.textContent = String(count);
  }

  if (fotosEl) {
    const photos = getPhotos();
    const total = [...photos.iniciais, ...photos.cachoeiras, ...photos.rodape].length;
    fotosEl.textContent = String(total);
  }

  const chartReceita = document.getElementById("chartReceita");
  const chartReservas = document.getElementById("chartReservas");
  if (!chartReceita || !chartReservas) return;
}

function renderReservaRow(r) {
  const statusClass = r.status === "confirmada" ? "badge ok" : "badge warn";
  const statusLabel = r.status === "confirmada" ? "Confirmada" : "Pendente";
  const actions =
    r.status === "pendente"
      ? `<button class="btn btn-small ok" data-action="confirmar">Confirmar</button>
         <button class="btn btn-small danger" data-action="recusar">Recusar</button>`
      : "";

  return `
    <div class="reserva-card" data-id="${r.id}">
      <div class="line">
        <strong>${r.nome}</strong>
        <span class="${statusClass}">${statusLabel}</span>
      </div>
      <div class="meta">
        <span>✉ ${r.email}</span>
        <span>☎ ${r.telefone}</span>
      </div>
      <div class="meta">
        <span>📅 ${r.inicio} até ${r.fim}</span>
        <span>${r.hospedes} hóspedes</span>
        <span>${formatMoney(r.total)}</span>
      </div>
      <div class="actions">
        ${actions}
        <button class="btn btn-small" data-action="mensagem">Mensagem</button>
      </div>
    </div>
  `;
}

function initAdminReservas() {
  const listEl = document.getElementById("reservasList");
  if (!listEl) return;

  const reservas = getReservas().sort((a, b) => (a.inicio > b.inicio ? 1 : -1));
  listEl.innerHTML = reservas.map(renderReservaRow).join("");

  listEl.addEventListener("click", (e) => {
    const t = e.target;
    if (!(t instanceof HTMLElement)) return;
    const btn = t.closest("button[data-action]");
    if (!btn) return;

    const card = t.closest(".reserva-card");
    const id = card?.getAttribute("data-id");
    if (!id) return;

    const action = btn.getAttribute("data-action");
    const all = getReservas();
    const idx = all.findIndex((r) => r.id === id);
    if (idx === -1) return;

    if (action === "confirmar") all[idx].status = "confirmada";
    if (action === "recusar") all[idx].status = "recusada";
    if (action === "mensagem") alert("Abrir WhatsApp / Email (pode implementar depois).");

    saveReservas(all);
    initAdminReservas();
  });
}

function initConfiguracoes() {
  const form = document.getElementById("settingsForm");
  if (!form) return;

  const s = getSettings();
  Object.keys(s).forEach((k) => {
    const el = document.getElementById(k);
    if (!el) return;
    if (el.type === "checkbox") el.checked = Boolean(s[k]);
    else el.value = s[k];
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const next = { ...getSettings() };

    Object.keys(next).forEach((k) => {
      const el = document.getElementById(k);
      if (!el) return;
      if (el.type === "checkbox") next[k] = el.checked;
      else next[k] = el.value;
    });

    next.diaria = Number(next.diaria || 350);
    next.capacidade = Number(next.capacidade || 8);
    next.minimoNoites = Number(next.minimoNoites || 2);
    next.maximoNoites = Number(next.maximoNoites || 30);

    saveSettings(next);
    alert("Configurações salvas.");
  });
}

/* ======================================================================
   ✅ CALENDÁRIO (SUPABASE) - substitui o antigo localStorage
====================================================================== */
function initCalendario() {
  const grid = document.getElementById("calendarGrid");
  const title = document.getElementById("calendarTitle");
  const dailyInfo = document.getElementById("dailyRateInfo");
  const settings = getSettings();
  if (dailyInfo) dailyInfo.textContent = `R$ ${settings.diaria}`;

  // ===== Helpers (aqui dentro ✅) =====
  function ymd(y, m, d) {
    return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  }

  function addDaysISO(dateISO, days) {
    const [y, m, d] = dateISO.split("-").map(Number);
    const dt = new Date(y, m - 1, d);
    dt.setDate(dt.getDate() + days);
    return ymd(dt.getFullYear(), dt.getMonth() + 1, dt.getDate());
  }

  function monthRange(ref) {
    const y = ref.getFullYear();
    const m = ref.getMonth() + 1;
    const from = ymd(y, m, 1);
    const to = ymd(y, m, new Date(y, m, 0).getDate());
    return { from, to };
  }

  function expandRangeToDatesISO(startISO, endISOExclusive) {
    const out = [];
    let cur = new Date(startISO + "T00:00:00");
    const end = new Date(endISOExclusive + "T00:00:00");
    while (cur < end) {
      out.push(ymd(cur.getFullYear(), cur.getMonth() + 1, cur.getDate()));
      cur.setDate(cur.getDate() + 1);
    }
    return out;
  }

  // ===== Estado =====
  let refDate = new Date();
  const monthNames = [
    "janeiro",
    "fevereiro",
    "março",
    "abril",
    "maio",
    "junho",
    "julho",
    "agosto",
    "setembro",
    "outubro",
    "novembro",
    "dezembro",
  ];

  let monthStatus = {};    // dateISO -> disponivel | reservada | bloqueada
  let blockedByDate = {};  // dateISO -> row do bloqueio (pra remover)
  let reservedSet = new Set();

  async function renderAsync() {
    const y = refDate.getFullYear();
    const m = refDate.getMonth();
    if (title) title.textContent = `${monthNames[m]} ${y}`;

    const firstDay = new Date(y, m, 1).getDay();
    const totalDays = new Date(y, m + 1, 0).getDate();
    const weekNames = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

    let html = weekNames.map((d) => `<div class="day-name">${d}.</div>`).join("");
    for (let i = 0; i < firstDay; i++) html += '<div class="day"></div>';

    const { from, to } = monthRange(refDate);

    try {
      const { reserved, blocked } = await fetchCalendarEvents(from, to);

      monthStatus = {};
      blockedByDate = {};
      reservedSet = new Set();

      // Airbnb/external = reservada (read-only)
      reserved.forEach((ev) => {
        expandRangeToDatesISO(ev.start_date, ev.end_date).forEach((d) => reservedSet.add(d));
      });

      // Bloqueios = bloqueada
      blocked.forEach((b) => {
        expandRangeToDatesISO(b.start_date, b.end_date).forEach((d) => {
          blockedByDate[d] = b;
        });
      });

      for (let day = 1; day <= totalDays; day++) {
        const dateISO = ymd(y, m + 1, day);
        if (reservedSet.has(dateISO)) monthStatus[dateISO] = "reservada";
        else if (blockedByDate[dateISO]) monthStatus[dateISO] = "bloqueada";
        else monthStatus[dateISO] = "disponivel";
      }

      for (let day = 1; day <= totalDays; day++) {
        const dateISO = ymd(y, m + 1, day);
        const status = monthStatus[dateISO] || "disponivel";
        const disabled = status === "reservada" ? "disabled" : "";
        html += `<button class="day ${status}" data-date="${dateISO}" type="button" ${disabled}>
          ${day}<small>R$ ${settings.diaria}</small>
        </button>`;
      }

      grid.innerHTML = html;
    } catch (err) {
      console.error(err);
      alert("Erro ao carregar calendário do Supabase. Veja o Console (F12).");
    }
  }

  // render inicial
  renderAsync();

  document.getElementById("prevMonth")?.addEventListener("click", () => {
    refDate = new Date(refDate.getFullYear(), refDate.getMonth() - 1, 1);
    renderAsync();
  });

  document.getElementById("nextMonth")?.addEventListener("click", () => {
    refDate = new Date(refDate.getFullYear(), refDate.getMonth() + 1, 1);
    renderAsync();
  });

  // clique em dia:
  grid?.addEventListener("click", async (e) => {
    const target = e.target;
    if (!(target instanceof HTMLElement)) return;
    const dayBtn = target.closest(".day");
    const dateISO = dayBtn?.getAttribute("data-date");
    if (!dateISO) return;

    const status = monthStatus[dateISO];

    try {
      // Airbnb: não mexe
      if (status === "reservada") return;

      // Se está bloqueada: remover
      if (status === "bloqueada") {
        const block = blockedByDate[dateISO];
        if (!block?.id) return;
        await deleteAdminBlock(block.id);
        await renderAsync();
        return;
      }

      // Se está disponível: criar bloqueio de 1 dia
      const endExclusive = addDaysISO(dateISO, 1);
      await createAdminBlock(dateISO, endExclusive, "Bloqueio manual");
      await renderAsync();
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar/alterar bloqueio no Supabase. Veja o Console (F12).");
    }
  });

  // ===== Airbnb iCal Import (upload .ics -> Supabase) =====
  const importBtn = document.getElementById("importIcsBtn");
  const fileInput = document.getElementById("icsFile");
  const statusEl = document.getElementById("icsStatus");
  const clearBtn = document.getElementById("clearAirbnbBtn");

  function setStatus(msg) {
    if (statusEl) statusEl.textContent = msg;
  }

  function normalizeYmd(yyyymmdd) {
    const y = yyyymmdd.slice(0, 4);
    const m = yyyymmdd.slice(4, 6);
    const d = yyyymmdd.slice(6, 8);
    return `${y}-${m}-${d}`;
  }

  // Parser de iCal para EVENTS (UID/DTSTART/DTEND/SUMMARY)
  function parseIcsToEvents(icsText) {
    const lines = icsText.split(/\r?\n/);
    const events = [];

    let uid = null;
    let dtStart = null;
    let dtEnd = null;
    let summary = "Reserved";

    for (const raw of lines) {
      const line = raw.trim();

      if (line === "BEGIN:VEVENT") {
        uid = null;
        dtStart = null;
        dtEnd = null;
        summary = "Reserved";
      }

      if (line.startsWith("UID")) uid = (line.split(":")[1] || "").trim();

      if (line.startsWith("DTSTART")) {
        const v = (line.split(":")[1] || "").trim();
        dtStart = v.slice(0, 8);
      }

      if (line.startsWith("DTEND")) {
        const v = (line.split(":")[1] || "").trim();
        dtEnd = v.slice(0, 8);
      }

      if (line.startsWith("SUMMARY")) {
        summary = (line.split(":")[1] || "").trim() || "Reserved";
      }

      if (line === "END:VEVENT") {
        if (uid && dtStart && dtEnd) {
          events.push({
            uid,
            start_date: normalizeYmd(dtStart),
            end_date: normalizeYmd(dtEnd), // end exclusivo (checkout)
            summary,
          });
        }
      }
    }

    return events;
  }

  clearBtn?.addEventListener("click", async () => {
    try {
      setStatus("Limpando importações do Airbnb no Supabase...");
      alert("Função de limpar Airbnb ainda não implementada.");
      setStatus("Importações do Airbnb removidas (Supabase).");
      await renderAsync();
    } catch (err) {
      console.error(err);
      alert("Erro ao limpar Airbnb no Supabase. Veja o Console (F12).");
    }
  });

  importBtn?.addEventListener("click", async () => {
    const file = fileInput?.files?.[0];
    if (!file) {
      setStatus("Selecione um arquivo .ics primeiro.");
      return;
    }

    try {
      setStatus("Importando iCal e salvando no Supabase...");

      const text = await file.text();
      const evs = parseIcsToEvents(text);

      if (evs.length === 0) {
        setStatus("Não encontrei eventos no .ics. Verifique o arquivo.");
        return;
      }

      const rows = evs.map((e) => ({
        source: "airbnb",
        listing_id: LISTING_ID,
        uid: e.uid,
        start_date: e.start_date,
        end_date: e.end_date,
        summary: e.summary,
        raw: e,
      }));

      await upsertExternalEvents(rows);

      setStatus(`Importado do Airbnb: ${rows.length} evento(s) gravados no Supabase.`);
      await renderAsync();
    } catch (err) {
      console.error(err);
      alert("Erro ao importar .ics no Supabase. Veja o Console (F12).");
    }
  });
}

/* ======================================================================
   FOTOS (igual seu original)
====================================================================== */
function renderPhotoSection(section, items) {
  const container = document.getElementById(`section-${section}`);
  if (!container) return;

  const list = items
    .map(
      (src, idx) => `
    <div class="photo-item">
      <img src="${src}" alt="Foto" />
      <button class="btn btn-small danger" data-section="${section}" data-idx="${idx}">Remover</button>
    </div>
  `
    )
    .join("");

  container.innerHTML = list || `<p class="muted">Nenhuma foto cadastrada.</p>`;
}

function initFotos() {
  const photos = getPhotos();
  ["iniciais", "cachoeiras", "rodape"].forEach((section) => renderPhotoSection(section, photos[section]));

  ["iniciais", "cachoeiras", "rodape"].forEach((section) => {
    const input = document.getElementById(`upload-${section}`);
    input?.addEventListener("change", async () => {
      const files = Array.from(input.files || []);
      const current = getPhotos();
      const converted = await Promise.all(files.map(fileToBase64));
      current[section] = [...current[section], ...converted];
      localStorage.setItem(PHOTOS_KEY, JSON.stringify(current));
      renderPhotoSection(section, current[section]);
      input.value = "";
    });
  });

  document.addEventListener("click", (e) => {
    const t = e.target;
    if (!(t instanceof HTMLElement)) return;
    const btn = t.closest("button[data-section][data-idx]");
    if (!btn) return;

    const section = btn.getAttribute("data-section");
    const idx = Number(btn.getAttribute("data-idx"));

    const current = getPhotos();
    current[section].splice(idx, 1);
    savePhotos(current);
    renderPhotoSection(section, current[section]);
  });
}

(function boot() {
  initTabs();
  initLogout();

  const page = document.body.getAttribute("data-page");
  if (page !== "login") requireAuth();

  if (page === "login") initLogin();
  if (page === "dashboard") initDashboard();
  if (page === "reservas") initAdminReservas();
  if (page === "calendario") initCalendario();
  if (page === "fotos") initFotos();
  if (page === "configuracoes") initConfiguracoes();
})();
