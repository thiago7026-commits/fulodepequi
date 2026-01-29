(() => {
  const sb = window.supabaseClient;
  const requiredRole = "alfa";
  const loginUrl = "admin-login.html";

  if (!sb) {
    console.error("Supabase client não carregou. Verifique js/supabaseClient.js e a ordem dos scripts.");
    window.location.href = loginUrl;
    return;
  }

  const body = document.body;
  if (body) body.classList.add("auth-checking");

  const logoutBtn = document.getElementById("adminLogoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      await sb.auth.signOut();
      window.location.href = loginUrl;
    });
  }

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

  const redirectToLogin = (reason) => {
    const target = reason ? `${loginUrl}?reason=${reason}` : loginUrl;
    window.location.href = target;
  };

  const signOutAndRedirect = async (reason) => {
    await sb.auth.signOut();
    redirectToLogin(reason);
  };

  const enforceAdminAccess = async () => {
    const { data, error } = await sb.auth.getSession();
    if (error) {
      redirectToLogin("session");
      return null;
    }

    const session = data.session;
    if (!session) {
      redirectToLogin("session");
      return null;
    }

    const role = await resolveUserRole(session.user);
    if (role !== requiredRole) {
      await signOutAndRedirect("denied");
      return null;
    }

    if (body) {
      body.classList.remove("auth-checking");
      body.classList.add("auth-ok");
    }

    return session;
  };

  window.adminAccessReady = enforceAdminAccess();

  sb.auth.onAuthStateChange((_event, session) => {
    if (!session) {
      redirectToLogin("session");
    }
  });
})();
