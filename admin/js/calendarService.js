import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const SUPABASE_URL = "https://SEU-PROJECT.supabase.co";
const SUPABASE_ANON_KEY = "SUA-ANON-KEY";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const LISTING_ID = "635415619801096957"; // seu airbnb/listing

export async function fetchCalendarEvents(fromISO, toISO) {
  const [externalRes, blocksRes] = await Promise.all([
    supabase
      .from("calendar_external_events")
      .select("id, source, start_date, end_date, summary, uid, listing_id")
      .eq("listing_id", LISTING_ID)
      .lte("start_date", toISO)
      .gte("end_date", fromISO),

    supabase
      .from("calendar_admin_blocks")
      .select("id, start_date, end_date, reason, listing_id")
      .eq("listing_id", LISTING_ID)
      .lte("start_date", toISO)
      .gte("end_date", fromISO),
  ]);

  if (externalRes.error) throw externalRes.error;
  if (blocksRes.error) throw blocksRes.error;

  return {
    reserved: externalRes.data ?? [],
    blocked: blocksRes.data ?? [],
  };
}

export async function createAdminBlock(startISO, endISO, reason = "") {
  const { data, error } = await supabase
    .from("calendar_admin_blocks")
    .insert({
      listing_id: LISTING_ID,
      start_date: startISO,
      end_date: endISO,
      reason,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteAdminBlock(blockId) {
  const { error } = await supabase
    .from("calendar_admin_blocks")
    .delete()
    .eq("id", blockId);

  if (error) throw error;
}
