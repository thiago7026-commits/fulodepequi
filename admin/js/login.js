const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("loginMessage");

const setMessage = (message) => {
  if (loginMessage) {
    loginMessage.textContent = message;
  }
};

const redirectToAdmin = () => {
  window.location.href = "./index.html";
};

const checkExistingSession = async () => {
  const { data } = await window.sb.auth.getSession();
  if (data?.session) {
    redirectToAdmin();
  }
};

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  setMessage("");

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  const { error } = await window.sb.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    setMessage("Email ou senha inválidos.");
    return;
  }

  redirectToAdmin();
});

checkExistingSession();
