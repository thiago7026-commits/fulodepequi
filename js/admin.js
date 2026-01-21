const STORAGE_KEYS = {
  blocks: "fulo-chale-blocks",
  settings: "fulo-chale-settings",
};

const elements = {
  calendarInline: document.getElementById("calendarInline"),
  selectedRange: document.getElementById("selectedRange"),
  addBlockButton: document.getElementById("addBlockButton"),
  blocksList: document.getElementById("blocksList"),
  calendarFeedback: document.getElementById("calendarFeedback"),
  dailyRate: document.getElementById("dailyRate"),
  externalIcal: document.getElementById("externalIcal"),
  saveSettings: document.getElementById("saveSettings"),
  exportIcal: document.getElementById("exportIcal"),
  settingsFeedback: document.getElementById("settingsFeedback"),
};

let blocks = loadBlocks_();
let selectedRange = null;
let calendarInstance = null;

function loadBlocks_() {
  const stored = localStorage.getItem(STORAGE_KEYS.blocks);
  if (!stored) return [];
  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function saveBlocks_() {
  localStorage.setItem(STORAGE_KEYS.blocks, JSON.stringify(blocks));
}

function loadSettings_() {
  const stored = localStorage.getItem(STORAGE_KEYS.settings);
  if (!stored) {
    return { dailyRate: "", externalIcal: "" };
  }
  try {
    const parsed = JSON.parse(stored);
    return {
      dailyRate: typeof parsed.dailyRate === "string" ? parsed.dailyRate : "",
      externalIcal: typeof parsed.externalIcal === "string" ? parsed.externalIcal : "",
    };
  } catch (error) {
    return { dailyRate: "", externalIcal: "" };
  }
}

function saveSettings_(settings) {
  localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings));
}

function formatDate_(date) {
  return date.toLocaleDateString("pt-BR");
}

function formatRangeLabel_(range) {
  if (!range) return "Selecione as datas no calendário";
  const start = new Date(range.start);
  const end = new Date(range.end);
  return `${formatDate_(start)} → ${formatDate_(end)}`;
}

function setFeedback_(element, message, color = "") {
  if (!element) return;
  element.textContent = message;
  element.style.color = color;
}

function renderBlocksList_() {
  if (!elements.blocksList) return;
  if (!blocks.length) {
    elements.blocksList.innerHTML = "<p class=\"feedback\">Nenhum bloqueio cadastrado.</p>";
    return;
  }

  elements.blocksList.innerHTML = "";
  blocks.forEach((block, index) => {
    const item = document.createElement("div");
    item.className = "block-item";
    item.innerHTML = `
      <div>
        <strong>${formatRangeLabel_(block)}</strong>
        <span>Bloqueado</span>
      </div>
      <button type="button" data-index="${index}">Remover</button>
    `;

    item.querySelector("button").addEventListener("click", () => {
      blocks.splice(index, 1);
      saveBlocks_();
      updateCalendarDisable_();
      renderBlocksList_();
      setFeedback_(elements.calendarFeedback, "Bloqueio removido.", "#2e7d32");
    });

    elements.blocksList.appendChild(item);
  });
}

function updateCalendarDisable_() {
  if (!calendarInstance) return;
  const disabledRanges = blocks.map((block) => ({
    from: block.start,
    to: block.end,
  }));
  calendarInstance.set("disable", disabledRanges);
}

function onCalendarChange_(selectedDates) {
  if (selectedDates.length === 2) {
    const [startDate, endDate] = selectedDates;
    selectedRange = {
      start: startDate.toISOString().slice(0, 10),
      end: endDate.toISOString().slice(0, 10),
    };
    elements.selectedRange.textContent = formatRangeLabel_(selectedRange);
  } else {
    selectedRange = null;
    elements.selectedRange.textContent = "Selecione as datas no calendário";
  }
}

function addBlock_() {
  if (!selectedRange) {
    setFeedback_(elements.calendarFeedback, "Selecione um intervalo para bloquear.", "#d32f2f");
    return;
  }
  const alreadyExists = blocks.some(
    (block) => block.start === selectedRange.start && block.end === selectedRange.end,
  );
  if (alreadyExists) {
    setFeedback_(elements.calendarFeedback, "Esse bloqueio já existe.", "#d32f2f");
    return;
  }

  blocks.push({ ...selectedRange });
  saveBlocks_();
  updateCalendarDisable_();
  renderBlocksList_();
  calendarInstance.clear();
  selectedRange = null;
  elements.selectedRange.textContent = "Selecione as datas no calendário";
  setFeedback_(elements.calendarFeedback, "Bloqueio adicionado com sucesso.", "#2e7d32");
}

function buildIcs_() {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Fulo de Pequi//Admin//PT-BR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:Bloqueios - Chalé Fulô de Pequi",
  ];

  const stamp = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

  blocks.forEach((block, index) => {
    const endDate = new Date(block.end);
    endDate.setDate(endDate.getDate() + 1);
    const endValue = endDate.toISOString().slice(0, 10).replace(/-/g, "");
    const startValue = block.start.replace(/-/g, "");

    lines.push("BEGIN:VEVENT");
    lines.push(`UID:bloqueio-${block.start}-${index}@fulodepequi`);
    lines.push(`DTSTAMP:${stamp}`);
    lines.push(`DTSTART;VALUE=DATE:${startValue}`);
    lines.push(`DTEND;VALUE=DATE:${endValue}`);
    lines.push("SUMMARY:Bloqueio de reserva");
    lines.push("END:VEVENT");
  });

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

function downloadIcs_() {
  const ics = buildIcs_();
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "calendario.ics";
  link.click();
  URL.revokeObjectURL(url);
  setFeedback_(elements.settingsFeedback, "Arquivo iCal exportado.", "#2e7d32");
}

function initCalendar_() {
  if (!elements.calendarInline || typeof flatpickr === "undefined") return;
  calendarInstance = flatpickr(elements.calendarInline, {
    locale: "pt",
    inline: true,
    mode: "range",
    dateFormat: "Y-m-d",
    minDate: "today",
    disable: blocks.map((block) => ({ from: block.start, to: block.end })),
    onChange: onCalendarChange_,
  });
}

function initSettings_() {
  const settings = loadSettings_();
  if (elements.dailyRate) {
    elements.dailyRate.value = settings.dailyRate;
  }
  if (elements.externalIcal) {
    elements.externalIcal.value = settings.externalIcal;
  }
}

function handleSaveSettings_() {
  const settings = {
    dailyRate: String(elements.dailyRate.value || "").trim(),
    externalIcal: String(elements.externalIcal.value || "").trim(),
  };
  saveSettings_(settings);
  setFeedback_(elements.settingsFeedback, "Configurações salvas.", "#2e7d32");
}

if (elements.addBlockButton) {
  elements.addBlockButton.addEventListener("click", addBlock_);
}

if (elements.saveSettings) {
  elements.saveSettings.addEventListener("click", handleSaveSettings_);
}

if (elements.exportIcal) {
  elements.exportIcal.addEventListener("click", downloadIcs_);
}

initCalendar_();
initSettings_();
renderBlocksList_();
