console.log("main.js carregou: ok");

const API_URL =
  "https://script.google.com/macros/s/AKfycbzxVqe7L7jW4gizF1YUChx-Ya4qh6CJ-7YwF3Q-gryAmDxiLQZZY7Y_zVNfrqcXkrgf6Q/exec";

/**
 * IDs dos containers na HOME (ajuste para bater com o seu HTML)
 * Exemplo esperado na Home:
 * <div id="galeriaTopo"></div>
 * <div id="galeriaCachoeiras"></div>
 * <div id="galeriaFinal"></div>
 */
const CONTAINERS = {
  bloco1: "galeriaTopo",
  bloco2: "galeriaCachoeiras",
  bloco3: "galeriaFinal",
};

async function getGallery() {
  const res = await fetch(`${API_URL}?action=GET_GALLERY`, { method: "GET" });
  if (!res.ok) throw new Error("Falha ao carregar galeria (GET_GALLERY).");
  return res.json();
}

function renderImages(containerId, urls) {
  const el = document.getElementById(containerId);
  if (!el) return;

  el.innerHTML = "";

  (urls || []).forEach((url, i) => {
    const img = document.createElement("img");
    img.src = url;
    img.alt = `Foto ${i + 1}`;
    img.loading = "lazy";
    el.appendChild(img);
  });
}

(async function initGalleryOnHome() {
  try {
    const data = await getGallery();

    // Estrutura esperada do Apps Script: { blocks: { bloco1:[], bloco2:[], bloco3:[] } }
    const blocks = data?.blocks || data?.gallery?.blocks || {};
    renderImages(CONTAINERS.bloco1, blocks.bloco1 || []);
    renderImages(CONTAINERS.bloco2, blocks.bloco2 || []);
    renderImages(CONTAINERS.bloco3, blocks.bloco3 || []);

    console.log("Galeria carregada:", {
      b1: (blocks.bloco1 || []).length,
      b2: (blocks.bloco2 || []).length,
      b3: (blocks.bloco3 || []).length,
    });
  } catch (err) {
    console.warn("Não foi possível carregar a galeria:", err);
  }
})();
