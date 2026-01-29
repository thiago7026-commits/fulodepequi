// js/supabaseClient.js
// ✅ Substitua pelos valores do seu projeto Supabase (somente URL + ANON KEY).
// ⚠️ Nunca coloque SERVICE ROLE ou chaves secretas no front-end.
const SUPABASE_URL = "https://SEU-PROJETO.supabase.co";
const SUPABASE_ANON_KEY = "SUA_SUPABASE_ANON_KEY_PUBLICA";

window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
