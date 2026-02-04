(() => {
  const SUPABASE_URL = "YOUR_SUPABASE_URL";
  const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY";

  const isPlaceholder = (value) => !value || value.startsWith("YOUR_");

  if (isPlaceholder(SUPABASE_URL) || isPlaceholder(SUPABASE_ANON_KEY)) {
    console.warn("Supabase keys not set. Please update SUPABASE_URL and SUPABASE_ANON_KEY.");
    window.sb = {
      auth: {
        signInWithPassword: async () => ({
          data: {},
          error: { message: "Supabase keys not set." },
        }),
        getSession: async () => ({
          data: { session: null },
          error: { message: "Supabase keys not set." },
        }),
        signOut: async () => ({ error: null }),
      },
    };
    return;
  }

  window.sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
})();
