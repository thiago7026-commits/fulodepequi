// /admin/js/admin-guard.js
(async function () {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    window.location.href = "/admin/admin-login.html?reason=session";
    return;
  }

  // Debug opcional (mostra email logado)
  const who = document.getElementById("whoami");
  if (who) {
    who.textContent = "Logado como: " + (session.user?.email || "(sem email)");
  }

  // 🔒 (Opcional) TRAVA POR ROLE "ALFA"
  // Se você já tem RBAC (tabela user_roles / roles), me diga qual tabela/campo.
  // Aí eu coloco aqui a verificação certinha (sem adivinhar schema).
})();
