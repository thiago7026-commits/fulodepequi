(function () {
  const SUPABASE_URL = "https://edncpydsaovtdoztnjsa.supabase.co";
  const SUPABASE_ANON_KEY = "sb_publishable_xdd1tjsLj54U7n9r6yAVIg_6LN-Uu_m";

  const supabaseClient = window.supabase?.createClient
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;

  const form = document.getElementById("resetForm");
  const passwordEl = document.getElementById("password");
  const confirmEl = document.getElementById("confirmPassword");
  const btn = document.getElementById("btnSave");
  const msg = document.getElementById("msg");
  const successBox = document.getElementById("successBox");

  function setMsg(text, type) {
    msg.textContent = text || "";
    msg.classList.toggle("success", type === "success");
  }

  function parseParams(value) {
    const params = new URLSearchParams(value.startsWith("#") ? value.slice(1) : value);
    return {
      access_token: params.get("access_token"),
      refresh_token: params.get("refresh_token"),
    };
  }

  async function ensureSession() {
    if (!supabaseClient) {
      setMsg("Não foi possível iniciar o Supabase. Verifique sua conexão.");
      return;
    }

    const hashTokens = parseParams(window.location.hash || "");
    const queryTokens = parseParams(window.location.search || "");
    const accessToken = hashTokens.access_token || queryTokens.access_token;
    const refreshToken = hashTokens.refresh_token || queryTokens.refresh_token;

    if (accessToken && refreshToken) {
      const { error } = await supabaseClient.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (error) {
        setMsg("Não foi possível validar sua sessão. Solicite um novo link.");
        return;
      }
    }

    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) {
      setMsg("Sessão inválida ou expirada. Solicite uma nova redefinição.");
    }
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    setMsg("");

    const password = passwordEl.value || "";
    const confirmPassword = confirmEl.value || "";

    if (password.length < 6) {
      setMsg("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setMsg("As senhas não coincidem.");
      return;
    }

    if (!supabaseClient) {
      setMsg("Não foi possível iniciar o Supabase. Verifique sua conexão.");
      return;
    }

    btn.disabled = true;

    try {
      const { error } = await supabaseClient.auth.updateUser({
        password,
      });

      if (error) {
        setMsg(error.message);
        btn.disabled = false;
        return;
      }

      setMsg("Senha atualizada!", "success");
      successBox.style.display = "block";
      form.reset();

      setTimeout(() => {
        window.location.href = "/admin/admin-login.html";
      }, 2500);
    } catch (err) {
      setMsg("Não foi possível atualizar a senha. Tente novamente.");
      btn.disabled = false;
    }
  });

  ensureSession();
})();
