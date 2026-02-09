const AUTH_KEY = "adminAuth";
const SETTINGS_KEY = "adminSettings";
const RESERVAS_KEY = "adminReservas";
const CALENDAR_KEY = "adminCalendar";
const PHOTOS_KEY = "adminPhotos";

const DEFAULT_SETTINGS = {
  nome: "Chalé Fulô de Pequi",
  endereco: "Chapada dos Veadeiros - Alto Paraíso de Goiás, GO",
  telefone: "(62) 99999-9999",
  email: "contato@fulodepequi.com.br",
  descricao: "Um refúgio acolhedor na natureza.",
  capacidadeMax: 8,
  minNoites: 2,
  maxNoites: 30,
  checkin: "14:00",
  checkout: "12:00",
  reservaInstantanea: true,
  aceitaPets: true,
  permiteFumar: false,
  permiteEventos: false,
  diaria: 350,
};

const DEFAULT_RESERVAS = [
  { id: 1, nome: "Maria Silva", email: "maria@email.com", periodo: "15/02/2026 até 18/02/2026", hospedes: 4, valor: 1050, status: "confirmada" },
  { id: 2, nome: "João Santos", email: "joao@email.com", periodo: "20/02/2026 até 25/02/2026", hospedes: 2, valor: 1750, status: "pendente" },
  { id: 3, nome: "Ana Costa", email: "ana@email.com", periodo: "05/03/2026 até 10/03/2026", hospedes: 6, valor: 1750, status: "confirmada" },
];

const DEFAULT_PHOTOS = { iniciais: [], cachoeiras: [], rodape: [] };

document.addEventListener("DOMContentLoaded", () => {
  const page = document.body.dataset.page;
  const isLogin = page === "login";

  enforceAuth(isLogin);
  setupLogout();
  highlightActiveTab(page);

  if (isLogin) initLogin();
  if (page === "dashboard") initDashboard();
  if (page === "reservas") initReservas();
  if (page === "calendario") initCalendario();
  if (page === "fotos") initFotos();
  if (page === "configuracoes") initConfiguracoes();
});

function enforceAuth(isLogin) {
  const logged = localStorage.getItem(AUTH_KEY) === "true";
  if (isLogin && logged) window.location.href = "./dashboard.html";
  if (!isLogin && !logged) window.location.href = "./index.html";
}

function setupLogout() {
  const btn = document.getElementById("logoutBtn");
  if (!btn) return;
  btn.addEventListener("click", () => {
    localStorage.removeItem(AUTH_KEY);
    window.location.href = "./index.html";
  });
}

function highlightActiveTab(page) {
  document.querySelectorAll(".tab").forEach((tab) => {
    if (tab.dataset.tab === page) tab.classList.add("active");
  });
}

function initLogin() {
  const form = document.getElementById("loginForm");
  const error = document.getElementById("loginError");

  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const email = String(data.get("email") || "").trim();
    const senha = String(data.get("senha") || "").trim();

    if (email === "admin@hospedagem.com" && senha === "admin123") {
      localStorage.setItem(AUTH_KEY, "true");
      window.location.href = "./dashboard.html";
      return;
    }

    error.textContent = "Email ou senha inválidos. Tente admin@hospedagem.com / admin123";
  });
}

function initDashboard() {
  const settings = getSettings();
  const photos = getPhotos();
  const calendar = getCalendarMap();

  const bloqueados = Object.values(calendar).filter((status) => status === "bloqueada").length;
  const totalFotos = photos.iniciais.length + photos.cachoeiras.length + photos.rodape.length;

  document.getElementById("dashboardCards").innerHTML = [
    card("Valor da diária", `R$ ${settings.diaria}`),
    card("Dias bloqueados", bloqueados),
    card("Total de fotos", totalFotos),
  ].join("");

  document.getElementById("dashboardCharts").innerHTML = [
    chartBox("Receita mensal", lineChart([4200, 5200, 3500, 6300, 4900, 7100])),
    chartBox("Reservas por mês", barChart([12, 15, 10, 18, 14, 20])),
    chartBox("Taxa de ocupação", pieChart(65)),
    chartBox("Origem dos hóspedes", horizontalBars([35, 28, 20, 12, 15], ["Brasília", "Goiânia", "São Paulo", "Belo Horizonte", "Outros"])),
  ].join("");
}

function initReservas() {
  const list = document.getElementById("reservasList");
  const reservas = getReservas();

  list.innerHTML = reservas
    .map(
      (r) => `
      <article class="reserve-item" data-id="${r.id}">
        <div class="reserve-top">
          <h3>${r.nome}</h3>
          <span class="badge badge-${r.status}">${capitalize(r.status)}</span>
        </div>
        <p>${r.email} • ${r.periodo} • ${r.hospedes} hóspedes • <strong>R$ ${r.valor.toFixed(2)}</strong></p>
        <div class="reserve-bottom">
          <small>Status atual: ${r.status}</small>
          <div class="actions">
            ${
              r.status === "pendente"
                ? '<button class="btn btn-success" data-action="confirmar">Confirmar</button><button class="btn btn-danger" data-action="recusar">Recusar</button>'
                : ""
            }
            <button class="btn btn-outline" data-action="mensagem">Mensagem</button>
          </div>
        </div>
      </article>`
    )
    .join("");

  list.addEventListener("click", (e) => {
    const target = e.target;
    if (!(target instanceof HTMLElement)) return;
    const action = target.dataset.action;
    if (!action) return;

    const item = target.closest(".reserve-item");
    const id = Number(item?.dataset.id);
    const current = getReservas();

    if (action === "mensagem") {
      alert("Mensagem simulada enviada ao hóspede.");
      return;
    }

    const updated = current.map((r) => {
      if (r.id !== id) return r;
      if (action === "confirmar") return { ...r, status: "confirmada" };
      if (action === "recusar") return { ...r, status: "recusada" };
      return r;
    });

    localStorage.setItem(RESERVAS_KEY, JSON.stringify(updated));
    initReservas();
  });
}

function initCalendario() {
  const grid = document.getElementById("calendarGrid");
  const title = document.getElementById("calendarTitle");
  const dailyInfo = document.getElementById("dailyRateInfo");
  const settings = getSettings();
  dailyInfo.textContent = `R$ ${settings.diaria}`;

  let refDate = new Date();
  const monthNames = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

  function render() {
    const y = refDate.getFullYear();
    const m = refDate.getMonth();
    title.textContent = `${monthNames[m]} ${y}`;

    const firstDay = new Date(y, m, 1).getDay();
    const totalDays = new Date(y, m + 1, 0).getDate();
    const weekNames = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

    let html = weekNames.map((d) => `<div class="day-name">${d}.</div>`).join("");

    for (let i = 0; i < firstDay; i++) html += '<div class="day"></div>';

    const map = getCalendarMap();
    for (let day = 1; day <= totalDays; day++) {
      const key = `${y}-${String(m + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const status = map[key] || "disponivel";
      html += `<button class="day ${status}" data-date="${key}" type="button">${day}<small>R$ ${settings.diaria}</small></button>`;
    }

    grid.innerHTML = html;
  }

  render();

  document.getElementById("prevMonth").addEventListener("click", () => {
    refDate = new Date(refDate.getFullYear(), refDate.getMonth() - 1, 1);
    render();
  });

  document.getElementById("nextMonth").addEventListener("click", () => {
    refDate = new Date(refDate.getFullYear(), refDate.getMonth() + 1, 1);
    render();
  });

  grid.addEventListener("click", (e) => {
    const target = e.target;
    if (!(target instanceof HTMLElement)) return;
    const dayBtn = target.closest(".day");
    const date = dayBtn?.getAttribute("data-date");
    if (!date) return;

    const map = getCalendarMap();
    const current = map[date] || "disponivel";
    const next = current === "disponivel" ? "reservada" : current === "reservada" ? "bloqueada" : "disponivel";
    map[date] = next;
    localStorage.setItem(CALENDAR_KEY, JSON.stringify(map));
    render();
  });
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
}

function initConfiguracoes() {
  const form = document.getElementById("configForm");
  const feedback = document.getElementById("configFeedback");
  const settings = getSettings();

  Object.entries(settings).forEach(([key, value]) => {
    const field = form.elements.namedItem(key);
    if (!field) return;
    if (field.type === "checkbox") field.checked = Boolean(value);
    else field.value = value;
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const payload = { ...settings };

    for (const [key, value] of formData.entries()) payload[key] = value;

    ["capacidadeMax", "minNoites", "maxNoites"].forEach((field) => {
      payload[field] = Number(payload[field] || 0);
    });

    ["reservaInstantanea", "aceitaPets", "permiteFumar", "permiteEventos"].forEach((field) => {
      payload[field] = form.elements.namedItem(field).checked;
    });

    localStorage.setItem(SETTINGS_KEY, JSON.stringify(payload));
    feedback.textContent = "Configurações salvas com sucesso.";
  });
}

function getSettings() {
  return { ...DEFAULT_SETTINGS, ...(JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}")) };
}

function getReservas() {
  const saved = JSON.parse(localStorage.getItem(RESERVAS_KEY) || "null");
  if (saved) return saved;
  localStorage.setItem(RESERVAS_KEY, JSON.stringify(DEFAULT_RESERVAS));
  return DEFAULT_RESERVAS;
}

function getCalendarMap() {
  return JSON.parse(localStorage.getItem(CALENDAR_KEY) || "{}");
}

function getPhotos() {
  return { ...DEFAULT_PHOTOS, ...(JSON.parse(localStorage.getItem(PHOTOS_KEY) || "{}")) };
}

function renderPhotoSection(section, items) {
  const grid = document.getElementById(`grid-${section}`);
  if (!grid) return;

  if (!items.length) {
    grid.innerHTML = '<div class="photo-card">Nenhuma imagem</div>';
    return;
  }

  grid.innerHTML = items.map((src) => `<div class="photo-card"><img src="${src}" alt="Foto ${section}"/></div>`).join("");
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function card(title, value) {
  return `<article class="card"><h3>${title}</h3><div class="metric">${value}</div></article>`;
}

function chartBox(title, svg) {
  return `<article class="chart"><h3>${title}</h3>${svg}</article>`;
}

function lineChart(values) {
  const max = Math.max(...values);
  const stepX = 600 / (values.length - 1);
  const points = values
    .map((v, i) => {
      const x = i * stepX;
      const y = 230 - (v / max) * 200;
      return `${x},${y}`;
    })
    .join(" ");

  return `<svg viewBox="0 0 600 250"><polyline fill="none" stroke="#d97706" stroke-width="3" points="${points}"/></svg>`;
}

function barChart(values) {
  const max = Math.max(...values);
  const barWidth = 600 / values.length - 10;
  return `<svg viewBox="0 0 600 250">${values
    .map((v, i) => {
      const h = (v / max) * 210;
      const x = i * (barWidth + 10);
      const y = 230 - h;
      return `<rect x="${x}" y="${y}" width="${barWidth}" height="${h}" fill="#f59e0b"/>`;
    })
    .join("")}</svg>`;
}

function pieChart(percent) {
  const r = 80;
  const c = 2 * Math.PI * r;
  const occ = (percent / 100) * c;
  const free = c - occ;
  return `<svg viewBox="0 0 250 250"><g transform="translate(125,125) rotate(-90)"><circle r="${r}" fill="none" stroke="#fde68a" stroke-width="40" stroke-dasharray="${free} ${c}"/><circle r="${r}" fill="none" stroke="#d97706" stroke-width="40" stroke-dasharray="${occ} ${c}"/></g><text x="125" y="130" text-anchor="middle" fill="#8d3d12" font-size="20">${percent}%</text></svg>`;
}

function horizontalBars(values, labels) {
  const max = Math.max(...values);
  const gap = 42;
  return `<svg viewBox="0 0 600 250">${values
    .map((v, i) => {
      const width = (v / max) * 400;
      const y = 30 + i * gap;
      return `<text x="0" y="${y + 17}" fill="#7c2d12">${labels[i]}</text><rect x="150" y="${y}" width="${width}" height="26" fill="#f59e0b"/>`;
    })
    .join("")}</svg>`;
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
