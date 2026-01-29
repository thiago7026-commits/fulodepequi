// js/supabaseClient.js
const SUPABASE_URL = "sb_publishable_xdd1tjsLj54U7n9r6yAVIg_6LN-Uu_m";
const SUPABASE_ANON_KEY =
  "sb_secret_VThbfigv8JszRJsmAFFPdg_oM4F5V_V";

window.supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);
