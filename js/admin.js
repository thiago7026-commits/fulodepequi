const ADMIN_USER = "admin";
const ADMIN_PASS = "1234";

const SESSION_KEY = "fulo-admin-auth";
const CALENDAR_STORAGE_KEY = "fulo-calendar-blocks";
const SETTINGS_STORAGE_KEY = "fulo-calendar-settings";

const loginForm = document.getElementById("loginForm");
const loginCard = document.getElementById("loginCard");
const calendarPanel = document.getElementById("calendarPanel");
const loginFeedback = document.getElementById("loginFeedback");
const logoutButton = document.getElementById("logoutButton");

const calendarRangeInput = document.getElementById("calendarRange");
const calendarNoteInput = document.getElementById("calendarNote");
const calendarAddButton = document.getElementById("calendarAdd");
const calendarFeedback = document.getElementById("calendarFeedback");
const calendarList = document.getElementById("calendarList");
const calendarCopyButton = document.getElementById("calendarCopy");
const calendarClearButton = document.getElementById("calendarClear");
const calendarDownloadButton = document.getElementById("calendarDownload");
const airbnbLinkInput = document.getElementById("airbnbLink");
const floatLinkInput = document.getElementById("floatLink");
const siteLinkInput = document.getElementById("siteLink");
const calendarLinkCopyButton = document.getElementById("calendarLinkCopy");

let calendarBlocks = loadCalendarBlocks_();
let calendarPicker = null;

function loadCalendarBlocks_() {
  const stored = localStorage.getItem(CALENDAR_STORAGE_KEY);
  if (!stored) return [];
  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveCalendarBlocks_() {
  localStorage.setItem(CALENDAR_STORAGE_KEY, JSON.stringify(calendarBlocks));
}

function loadSettings_() {
  const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
  if (!stored) return { airbnbLink: "", floatLink: "" };
  try {
    const parsed = JSON.parse(stored);
    return {
      airbnbLink: typeof parsed.airbnbLink === "string" ? parsed.airbnbLink : "",
      floatLink: typeof parsed.floatLink === "string" ? parsed.floatLink : "",
    };
  } catch {
    return { airbnbLink: "", floatLink: "" };
  }
}

function saveSettings_(settings) {
  localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
}

function setLoginFeedback_(msg, color) {
  loginFeedback.textContent = msg;
  loginFeedback.style.color = color;
}

function setCalendarFeedback_(msg, color) {
  if (!calendarFeedback) return;
  calendarFeedback.textContent = msg;
  calendarFeedback.style.color = color;
}

function updateAuthView(isAuthenticated) {
  if (isAuthenticated) {
    loginCard.classList.add("hidden");
    if (calendarPanel) calendarPanel.classList.remove("hidden");
    logoutButton.classList.remove("hidden");
  } else {
    loginCard.classList.remove("hidden");
    if (calendarPanel) calendarPanel.classList.add("hidden");
    logoutButton.classList.add("hidden");
  }

  if (loginCard.classList.contains("hidden") && (!calendarPanel || calendarPanel.classList.contains("hidden"))) {
    loginCard.classList.remove("hidden");
  }
}

function toLocalISODate_(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDateLabel_(dateStr) {
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year}`;
}

function formatRangeLabel_(block) {
  if (!block) return "";
  if (block.start === block.end) {
    return formatDateLabel_(block.start);
  }
  return `${formatDateLabel_(block.start)} — ${formatDateLabel_(block.end)}`;
}

function renderCalendarList_() {
  if (!calendarList) return;

  if (!calendarBlocks.length) {
    calendarList.innerHTML = `<p class="calendar-empty">Nenhum bloqueio cadastrado ainda.</p>`;
    return;
  }

  calendarList.innerHTML = "";
  calendarBlocks.forEach((block, index) => {
    const item = document.createElement("div");
    item.className = "calendar-item";
    const note = block.note ? `<span>${block.note}</span>` : "";
    item.innerHTML = `
      <div>
        <strong>${formatRangeLabel_(block)}</strong>
        ${note}
      </div>
      <button type="button" data-index="${index}">Remover</button>
    `;
    item.querySelector("button").addEventListener("click", () => {
      calendarBlocks.splice(index, 1);
      saveCalendarBlocks_();
      renderCalendarList_();
      setCalendarFeedback_("Bloqueio removido.", "#2f3b2a");
    });
    calendarList.appendChild(item);
  });
}

function addDays_(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function formatDateForIcs_(dateStr) {
  return dateStr.replace(/-/g, "");
}

function escapeIcsText_(text) {
  return text.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,");
}

function buildIcs_() {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Fulo de Pequi//Reservas//PT-BR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:Reservas - Chalé Fulô de Pequi",
    "X-WR-TIMEZONE:America/Sao_Paulo",
  ];

  const stamp = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

  calendarBlocks.forEach((block, index) => {
    const startDate = new Date(`${block.start}T00:00:00`);
    const endDate = new Date(`${block.end}T00:00:00`);
    const endExclusive = addDays_(endDate, 1);
    const summary = block.note ? `Bloqueado - ${block.note}` : "Bloqueado";

    lines.push("BEGIN:VEVENT");
    lines.push(`UID:bloqueio-${block.start}-${index}@fulodepequi`);
    lines.push(`DTSTAMP:${stamp}`);
    lines.push(`DTSTART;VALUE=DATE:${formatDateForIcs_(block.start)}`);
    lines.push(`DTEND;VALUE=DATE:${formatDateForIcs_(toLocalISODate_(endExclusive))}`);
    lines.push(`SUMMARY:${escapeIcsText_(summary)}`);
    if (block.note) {
      lines.push(`DESCRIPTION:${escapeIcsText_(block.note)}`);
    }
    lines.push("END:VEVENT");
  });

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

function initCalendarPicker_() {
  if (!calendarRangeInput || typeof flatpickr === "undefined") return;
  calendarPicker = flatpickr(calendarRangeInput, {
    mode: "range",
    dateFormat: "Y-m-d",
    locale: "pt",
    minDate: "today",
  });
}

function addCalendarBlock_() {
  if (!calendarPicker || !calendarPicker.selectedDates.length) {
    setCalendarFeedback_("Selecione as datas para bloquear.", "#b34b39");
    return;
  }

  const [startDate, endDate] = calendarPicker.selectedDates;
  if (!startDate) {
    setCalendarFeedback_("Selecione as datas para bloquear.", "#b34b39");
    return;
  }

  const start = toLocalISODate_(startDate);
  const end = toLocalISODate_(endDate || startDate);
  const note = String(calendarNoteInput.value || "").trim();

  calendarBlocks.push({ start, end, note });
  saveCalendarBlocks_();
  renderCalendarList_();
  setCalendarFeedback_("Bloqueio adicionado.", "#2f3b2a");

  calendarNoteInput.value = "";
  calendarPicker.clear();
}

loginForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(loginForm);
  const usuario = String(data.get("usuario") || "");
  const senha = String(data.get("senha") || "");

  if (usuario === ADMIN_USER && senha === ADMIN_PASS) {
    sessionStorage.setItem(SESSION_KEY, "true");
    setLoginFeedback_("Login autorizado.", "#2f3b2a");
    updateAuthView(true);
  } else {
    setLoginFeedback_("Usuário ou senha incorretos.", "#b34b39");
  }
});

logoutButton.addEventListener("click", () => {
  sessionStorage.removeItem(SESSION_KEY);
  updateAuthView(false);
});

if (calendarAddButton) {
  calendarAddButton.addEventListener("click", addCalendarBlock_);
}

if (calendarClearButton) {
  calendarClearButton.addEventListener("click", () => {
    if (!confirm("Deseja remover todos os bloqueios?")) return;
    calendarBlocks = [];
    saveCalendarBlocks_();
    renderCalendarList_();
    setCalendarFeedback_("Bloqueios removidos.", "#2f3b2a");
  });
}

if (calendarCopyButton) {
  calendarCopyButton.addEventListener("click", async () => {
    const settings = loadSettings_();
    const payload = {
      updatedAt: new Date().toISOString(),
      airbnbLink: settings.airbnbLink,
      floatLink: settings.floatLink,
      blocks: calendarBlocks,
    };
    await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    setCalendarFeedback_("JSON copiado.", "#2f3b2a");
  });
}

if (calendarDownloadButton) {
  calendarDownloadButton.addEventListener("click", () => {
    const ics = buildIcs_();
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "calendario.ics";
    link.click();
    URL.revokeObjectURL(url);
    setCalendarFeedback_("Arquivo iCal gerado.", "#2f3b2a");
  });
}

if (airbnbLinkInput) {
  const settings = loadSettings_();
  airbnbLinkInput.value = settings.airbnbLink;
  airbnbLinkInput.addEventListener("input", () => {
    saveSettings_({
      airbnbLink: airbnbLinkInput.value.trim(),
      floatLink: floatLinkInput ? floatLinkInput.value.trim() : settings.floatLink,
    });
  });
}

if (floatLinkInput) {
  const settings = loadSettings_();
  floatLinkInput.value = settings.floatLink;
  floatLinkInput.addEventListener("input", () => {
    saveSettings_({
      airbnbLink: airbnbLinkInput ? airbnbLinkInput.value.trim() : settings.airbnbLink,
      floatLink: floatLinkInput.value.trim(),
    });
  });
}

if (calendarLinkCopyButton && siteLinkInput) {
  calendarLinkCopyButton.addEventListener("click", async () => {
    await navigator.clipboard.writeText(siteLinkInput.value);
    setCalendarFeedback_("Link do site copiado.", "#2f3b2a");
  });
}

initCalendarPicker_();
renderCalendarList_();
updateAuthView(sessionStorage.getItem(SESSION_KEY) === "true");
