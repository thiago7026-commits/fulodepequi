// /admin/js/admin-login.js
(async function () {
  const emailEl = document.getElementById("email");
  const passEl = document.getElementById("password");
  const btn = document.getElementById("btnLogin");
  const btnReset = document.getElementById("btnReset");
  const msg = document.getElementById("msg");

  function setMsg(text, type) {
    msg.textContent = text || "";
    msg.classList.toggle("success", type === "success");
  }

  // Se já estiver logado, manda direto pro painel
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      window.location.href = "/admin/index.html";
      return;
    }
  } catch (e) {
    // se der erro aqui, segue e deixa tentar login
  }

  btn.addEventListener("click", async () => {
    setMsg("");
    btn.disabled = true;

    const email = (emailEl.value || "").trim();
    const password = passEl.value || "";

    if (!email || !password) {
      setMsg("Preencha email e senha.");
      btn.disabled = false;
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        setMsg(error.message);
        btn.disabled = false;
        return;
      }

      // ✅ Login OK
      window.location.href = "/admin/index.html";
    } catch (err) {
      setMsg("Erro no login: Failed to fetch (verifique SUPABASE_URL/ANON e internet).");
      btn.disabled = false;
    }
  });

  btnReset.addEventListener("click", async () => {
    setMsg("");
    btnReset.disabled = true;

    const email = (emailEl.value || "").trim();
    if (!email) {
      setMsg("Informe seu email para receber o link de redefinição.");
      btnReset.disabled = false;
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: "https://fulodepequi.com.br/admin/redefinir-senha.html",
      });

      if (error) {
        setMsg(error.message);
        btnReset.disabled = false;
        return;
      }

      setMsg("Enviamos um email com o link de redefinição.", "success");
    } catch (err) {
      setMsg("Não foi possível enviar o email. Verifique sua conexão.");
    } finally {
      btnReset.disabled = false;
    }
  });

  // Enter no teclado
  [emailEl, passEl].forEach(el => {
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter") btn.click();
    });
  });
})();
