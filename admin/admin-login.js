(() => {
  const sb = window.supabaseClient;
  const loginForm = document.getElementById("loginForm");
  const adminEmail = document.getElementById("adminEmail");
  const adminPassword = document.getElementById("adminPassword");
  const authStatus = document.getElementById("authStatus");
  const requiredRole = "alfa";

  if (!sb) {
    authStatus.textContent = "Supabase client não carregou. Verifique js/supabaseClient.js.";
    return;
  }

  const setStatus = (message, variant = "info") => {
    authStatus.textContent = message;
    authStatus.dataset.variant = variant;
  };

  const getRoleFromUser = (user) => {
    if (!user) return null;
    return (
      user.app_metadata?.role ||
      user.user_metadata?.role ||
      user.role ||
      null
    );
  };

  const fetchRoleFromProfiles = async (userId) => {
    try {
      const { data, error } = await sb
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .maybeSingle();

      if (error) return null;
      return data?.role || null;
    } catch (err) {
      return null;
    }
  };

  const resolveUserRole = async (user) => {
    const directRole = getRoleFromUser(user);
    if (directRole) return directRole;
    if (!user?.id) return null;
    return await fetchRoleFromProfiles(user.id);
  };

  const showReasonMessage = () => {
    const params = new URLSearchParams(window.location.search);
    const reason = params.get("reason");

    if (reason === "denied") {
      setStatus("Acesso negado. Somente usuários alfa podem entrar.", "error");
    } else if (reason === "session") {
      setStatus("Faça login para continuar.", "info");
    }
  };

  const redirectToAdmin = () => {
    window.location.href = "index.html";
  };

  const checkExistingSession = async () => {
    const { data } = await sb.auth.getSession();
    if (!data?.session) {
      showReasonMessage();
      return;
    }

    const role = await resolveUserRole(data.session.user);
    if (role === requiredRole) {
      redirectToAdmin();
    } else {
      await sb.auth.signOut();
      setStatus("Acesso negado. Somente usuários alfa podem entrar.", "error");
    }
  };

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    setStatus("Entrando...", "info");

    const email = adminEmail.value.trim();
    const password = adminPassword.value;

    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) {
      setStatus(`Erro no login: ${error.message}`, "error");
      return;
    }

    const user = data.user || (await sb.auth.getUser()).data.user;
    const role = await resolveUserRole(user);

    if (role !== requiredRole) {
      await sb.auth.signOut();
      setStatus("Acesso negado. Somente usuários alfa podem entrar.", "error");
      return;
    }

    setStatus("Login autorizado. Redirecionando...", "success");
    redirectToAdmin();
  });

  checkExistingSession();
})();
