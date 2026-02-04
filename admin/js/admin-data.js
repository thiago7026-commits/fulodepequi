const waitForAdminSession = async () => {
  if (!window.adminSessionReady) {
    console.warn("Admin session guard not initialized. Ensure admin-guard.js is loaded first.");
    return null;
  }

  return window.adminSessionReady;
};

const getConfiguracoes = async () => {
  await waitForAdminSession();
  return window.sb
    .from("configuracoes")
    .select("*")
    .single();
};

const updateDiaria = async (valor) => {
  await waitForAdminSession();
  return window.sb
    .from("configuracoes")
    .update({ valor_diaria: valor })
    .eq("id", 1);
};

const getBloqueios = async () => {
  await waitForAdminSession();
  return window.sb
    .from("bloqueios_calendario")
    .select("*")
    .order("data", { ascending: true });
};

const addBloqueio = async (data) => {
  await waitForAdminSession();
  return window.sb
    .from("bloqueios_calendario")
    .insert({ data });
};

const removeBloqueio = async (id) => {
  await waitForAdminSession();
  return window.sb
    .from("bloqueios_calendario")
    .delete()
    .eq("id", id);
};

const getGaleria = async () => {
  await waitForAdminSession();
  return window.sb
    .from("galeria")
    .select("*")
    .order("created_at", { ascending: false });
};

window.adminData = {
  getConfiguracoes,
  updateDiaria,
  getBloqueios,
  addBloqueio,
  removeBloqueio,
  getGaleria,
};
