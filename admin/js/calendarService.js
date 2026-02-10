// /js/calendarService.js
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabaseUrl = "https://SEU_PROJECT_ID.supabase.co";
const supabaseKey = "SUA_PUBLIC_ANON_KEY";

export const supabase = createClient(supabaseUrl, supabaseKey);

const LISTING_ID = "635415619801096957";

// 🔹 Buscar eventos (Airbnb + bloqueios)
export async function fetchCalendarEvents(start, end) {
  const [external, blocks] = await Promise.all([
    supabase
      .from("calendar_external_events")
      .select("*")
      .eq("listing_id", LISTING_ID)
      .lte("start_date", end)
      .gte("end_date", start),

    supabase
      .from("calendar_admin_blocks")
      .select("*")
      .eq("listing_id", LISTING_ID)
      .lte("start_date", end)
      .gte("end_date", start),
  ]);

  return {
    reserved: external.data || [],
    blocked: blocks.data || [],
  };
}

// 🔹 Criar bloqueio (ADMIN)
export async function createBlock(start, end, reason = "") {
  return supabase.from("calendar_admin_blocks").insert({
    listing_id: LISTING_ID,
    start_date: start,
    end_date: end,
    reason,
  });
}

// 🔹 Remover bloqueio (ADMIN)
export async function removeBlock(id) {
  return supabase.from("calendar_admin_blocks").delete().eq("id", id);
}
