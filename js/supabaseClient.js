// /js/supabaseClient.js
(function () {
  const SUPABASE_URL = "https://edncpydsaovtdoztnjsa.supabase.co";
  const SUPABASE_ANON_KEY = "sb_publishable_xdd1tjsLj54U7n9r6yAVIg_6LN-Uu_m";

  if (!window.supabase) {
    console.error("[Supabase] Biblioteca supabase-js não carregou. Verifique o CDN no HTML.");
    return;
  }

  window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  console.log("[Supabase] Client OK:", window.supabaseClient);
})();
