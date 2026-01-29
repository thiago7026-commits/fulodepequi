// js/supabaseClient.js
const SUPABASE_URL = "COLE_SUA_PROJECT_URL";
const SUPABASE_ANON_KEY = "COLE_SUA_ANON_KEY";

window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
