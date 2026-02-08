import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";

const ADMIN_PASSWORD = "admin123";

export function LoginPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (password === ADMIN_PASSWORD) {
      localStorage.setItem("admin-authenticated", "true");
      navigate("/dashboard", { replace: true });
      return;
    }

    setError("Senha inválida.");
  }

  return (
    <main style={{ fontFamily: "Inter, system-ui, sans-serif", padding: "2rem" }}>
      <h1>Login do Admin</h1>
      <form onSubmit={handleSubmit} style={{ display: "grid", gap: "0.75rem", maxWidth: 320 }}>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Senha"
          required
        />
        <button type="submit">Entrar</button>
      </form>
      {error ? <p style={{ color: "crimson" }}>{error}</p> : null}
    </main>
  );
}
